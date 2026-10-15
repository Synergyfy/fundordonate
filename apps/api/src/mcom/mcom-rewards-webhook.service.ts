import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { McomRewardIssuance } from "./rewards-client.service";

export type McomRewardEvent =
  | "reward.issued"
  | "reward.redeemed"
  | "reward.expired"
  | "reward.revoked";

/**
 * Handles inbound lifecycle webhooks from MCOM Rewards.
 *
 * MCOM Rewards POSTs `{ event, timestamp, source, data }` to
 * `/api/v1/webhooks/mcom`, signing the raw body with a shared HMAC-SHA256
 * secret (`MCOM_REWARDS_FUNDORDONATE_WEBHOOK_SECRET`). We verify against the
 * raw request body (never the parsed body) and mirror the issuance locally.
 */
@Injectable()
export class McomRewardsWebhookService {
  private readonly logger = new Logger(McomRewardsWebhookService.name);
  private readonly secret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.secret = this.config.get<string>("mcom.rewardsWebhookSecret") ?? "";
  }

  /** Constant-time HMAC-SHA256 verification of the raw request body. */
  verifySignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    if (!this.secret) {
      this.logger.warn(
        "MCOM_REWARDS_FUNDORDONATE_WEBHOOK_SECRET is not configured — webhook verification aborted",
      );
      return false;
    }
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
      return false;
    }

    const expected = "sha256=" + crypto
      .createHmac("sha256", this.secret)
      .update(rawBody)
      .digest("hex");

    try {
      const a = Buffer.from(signatureHeader, "utf8");
      const b = Buffer.from(expected, "utf8");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

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
  ): Promise<void> {
    if (!data?.id) return;

    const status = statusOverride ?? data.status ?? "ISSUED";
    const expiresAt = this.parseDate(data.expiresAt);
    const redeemedAt = this.parseDate(data.redeemedAt);
    const revokedAt = this.parseDate(data.revokedAt);

    const update = {
      externalIssuanceId: data.id,
      status,
      code: data.code ?? undefined,
      rewardTitle: data.rewardTitle ?? undefined,
      expiresAt,
      redeemedAt,
      revokedAt,
      metadata: (data.metadata ?? undefined) as never,
    };
    const create = {
      externalIssuanceId: data.id,
      mcomRewardId: data.rewardId,
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
      metadata: (data.metadata ?? undefined) as never,
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
