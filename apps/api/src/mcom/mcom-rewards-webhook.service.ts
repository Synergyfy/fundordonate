import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import type { McomRewardIssuance } from "./rewards-client.service";
import {
  buildRewardInstructions,
  extractIssuanceFulfilment,
  rewardWebUrls,
} from "@/modules/rewards/reward-fulfilment.util";

export type McomRewardEvent =
  | "reward.issued"
  | "reward.redeemed"
  | "reward.expired"
  | "reward.revoked";

/**
 * Handles inbound lifecycle events from MCOM Rewards.
 *
 * MCOM Rewards POSTs `{ event, timestamp, source, data }` to
 * `/api/v1/partner/events`, authenticated by an RS256 service token
 * (audience `fundordonate`) verified offline via Central's JWKS — there is no
 * HMAC / shared secret between the apps. The controller verifies the token
 * (`McomEventVerifierService`) and calls `handleEvent`; this service only
 * mirrors the issuance locally.
 */
@Injectable()
export class McomRewardsWebhookService {
  private readonly logger = new Logger(McomRewardsWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Apply an issuance lifecycle event to the local mirror. Idempotent — the
   * same issuance id / delivery is upserted rather than duplicated.
   */
  async handleEvent(
    event: McomRewardEvent | string,
    data: McomRewardIssuance,
  ): Promise<void> {
    if (!data?.id) {
      this.logger.warn(`Webhook ${event} missing issuance id — ignored`);
      return;
    }

    const status = data.status ?? this.statusForEvent(event);
    await this.upsertMirror(data, status);

    this.logger.log(`MCOM reward ${event}: issuance ${data.id} -> ${status}`);
  }

  /**
   * Upsert an issuance DTO into the local mirror. Shared by the webhook
   * receiver and the reconciliation job so both paths converge on exactly the
   * same representation. Idempotent on the provider issuance id.
   */
  async upsertMirror(
    data: McomRewardIssuance,
    statusOverride?: string,
    businessContext?: { businessId?: string | null; businessName?: string | null },
  ): Promise<void> {
    if (!data?.id) return;

    const status = statusOverride ?? data.status ?? "ISSUED";
    const expiresAt = this.parseDate(data.expiresAt);
    const redeemedAt = this.parseDate(data.redeemedAt);
    const revokedAt = this.parseDate(data.revokedAt);
    const fulfilledAt = this.parseDate(data.fulfilledAt);

    // A business-owned issuance may carry a null catalogue `rewardId`; it is
    // identified by `businessRewardId`. Keep `mcomRewardId` non-null.
    const businessRewardId = data.businessRewardId ?? null;
    const metadataValue = (data.metadata ?? undefined) as never;

    // Provider-authored fulfilment. Missing fields are left undefined on update
    // so a lifecycle webhook (e.g. redeemed) never wipes the descriptor.
    const fulfilment = extractIssuanceFulfilment(data);
    const businessId = fulfilment.businessId ?? businessContext?.businessId ?? null;
    const businessName =
      fulfilment.businessName ?? businessContext?.businessName ?? null;
    const urls = rewardWebUrls(this.config);
    // Only rebuild the persisted panel when we know the fulfilment kind. A
    // lifecycle-only event must never replace specific instructions with a
    // generic guess.
    const instructions = fulfilment.fulfilmentKind
      ? buildRewardInstructions({
          ...fulfilment,
          scope: fulfilment.scope ?? undefined,
          businessId,
          businessName,
          metadata: data.metadata,
          ...urls,
        })
      : null;

    const update = {
      externalIssuanceId: data.id,
      status,
      code: data.code ?? undefined,
      rewardTitle: data.rewardTitle ?? undefined,
      ...(businessRewardId ? { businessRewardId } : {}),
      expiresAt: data.expiresAt ? expiresAt : undefined,
      redeemedAt: data.redeemedAt ? redeemedAt : undefined,
      revokedAt: data.revokedAt ? revokedAt : undefined,
      metadata: metadataValue,
      fulfilmentProvider: fulfilment.fulfilmentProvider ?? undefined,
      fulfilmentKind: fulfilment.fulfilmentKind ?? undefined,
      fulfilmentStatus: fulfilment.fulfilmentStatus ?? undefined,
      fulfilmentRef: fulfilment.fulfilmentRef ?? undefined,
      // Copy nulls too: a recovered issuance must clear stale errors/codes.
      fulfilmentCode: fulfilment.fulfilmentCode,
      fulfilmentError: fulfilment.fulfilmentError,
      centralReference: fulfilment.centralReference,
      deepLink: fulfilment.deepLink,
      businessId: businessId ?? undefined,
      businessName: businessName ?? undefined,
      scope: (fulfilment.scope ?? undefined) as never,
      ...(instructions ? { instructions: instructions as never } : {}),
      // Always mirror the provider's delivered timestamp (null clears it).
      fulfilledAt,
      lastSyncedAt: new Date(),
    };
    const create = {
      externalIssuanceId: data.id,
      mcomRewardId: data.rewardId ?? businessRewardId ?? data.id,
      businessRewardId,
      rewardTitle: data.rewardTitle ?? null,
      rewardType: data.rewardType ?? null,
      externalRef: data.externalRef ?? null,
      idempotencyKey: data.idempotencyKey ?? data.id,
      campaignId: data.externalRef ?? null,
      mcomUserId: data.recipient?.mcomUserId ?? null,
      recipientEmail: data.recipient?.email ?? null,
      recipientName: data.recipient?.name ?? null,
      status,
      code: data.code ?? null,
      value: data.value ?? null,
      quantity: data.quantity ?? 1,
      metadata: metadataValue,
      fulfilmentProvider: fulfilment.fulfilmentProvider,
      fulfilmentKind: fulfilment.fulfilmentKind,
      fulfilmentStatus: fulfilment.fulfilmentStatus,
      fulfilmentRef: fulfilment.fulfilmentRef,
      fulfilmentCode: fulfilment.fulfilmentCode,
      fulfilmentError: fulfilment.fulfilmentError,
      centralReference: fulfilment.centralReference,
      deepLink: fulfilment.deepLink,
      businessId,
      businessName,
      scope: (fulfilment.scope ?? undefined) as never,
      instructions: instructions as never,
      fulfilledAt,
      lastSyncedAt: new Date(),
      expiresAt,
      redeemedAt,
      revokedAt,
    };

    // Prefer the idempotency key so we converge with the engine's reservation
    // row rather than racing it on the provider id. Fall back to the provider
    // issuance id (and on a unique collision, retry by id).
    if (data.idempotencyKey) {
      try {
        await this.prisma.rewardIssuance.upsert({
          where: { idempotencyKey: data.idempotencyKey },
          update,
          create,
        });
        return;
      } catch (err) {
        if ((err as { code?: string }).code !== "P2002") throw err;
      }
    }

    await this.prisma.rewardIssuance.upsert({
      where: { externalIssuanceId: data.id },
      update,
      create,
    });
  }

  private statusForEvent(event: string): string {
    switch (event) {
      case "reward.redeemed":
        return "REDEEMED";
      case "reward.expired":
        return "EXPIRED";
      case "reward.revoked":
        return "REVOKED";
      case "reward.issued":
      default:
        return "ISSUED";
    }
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
}
