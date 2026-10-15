import { Injectable, Logger } from "@nestjs/common";
import type { RewardIssuance } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  McomRewardsError,
  RewardsClient,
  type McomIssuingBusiness,
  type McomRewardIssuance,
} from "@/mcom/rewards-client.service";
import {
  RewardReservationService,
  type ReserveBase,
} from "./reward-reservation.service";

export interface IssueRewardInput {
  mcomRewardId: string;
  recipient: { email?: string; mcomUserId?: string; name?: string };
  /**
   * Sponsoring business whose MCOM entitlement is checked. Optional — when
   * omitted it is resolved from `campaignId` (the campaign owner's Central id
   * / email).
   */
  business?: McomIssuingBusiness;
  campaignId?: string;
  contributionId?: string;
  userId?: string;
  /** Stable config id within the campaign (part of the idempotency key + cap). */
  rewardConfigId?: string;
  /** Per-rule quantity cap (null/undefined = unlimited). */
  limit?: number | null;
  expiresAt?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface IssueLocalRewardInput {
  /** Local reward reference id (the campaign reward-config id). */
  rewardRefId: string;
  rewardTitle?: string;
  recipient: { email?: string; mcomUserId?: string; name?: string };
  campaignId?: string;
  contributionId?: string;
  userId?: string;
  rewardConfigId?: string;
  /** Per-rule quantity cap (null/undefined = unlimited). */
  limit?: number | null;
  value?: number | null;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Orchestrates issuing a reward (MCOM or FundOrDonate-local) and mirroring it.
 *
 * Concurrency-safe: every issuance is first *reserved* via
 * {@link RewardReservationService} (which takes a per-rule advisory lock and
 * enforces the quantity cap) before any provider call. The deterministic
 * idempotency key (`fd:<campaignId>:<rewardConfigId>:<who>`) makes replays from
 * a queue retry, webhook, or reconciler a no-op.
 */
@Injectable()
export class RewardEngineService {
  private readonly logger = new Logger(RewardEngineService.name);

  constructor(
    private readonly rewardsClient: RewardsClient,
    private readonly prisma: PrismaService,
    private readonly reservation: RewardReservationService,
  ) {}

  buildIdempotencyKey(input: {
    userId?: string;
    recipient: { mcomUserId?: string; email?: string };
    campaignId?: string;
    contributionId?: string;
    rewardConfigId?: string;
    mcomRewardId?: string;
  }): string {
    const who =
      input.userId ??
      input.recipient.mcomUserId ??
      input.recipient.email ??
      // Fall back to the contribution so distinct anonymous donors don't all
      // collapse onto one shared key (which would issue only the first).
      (input.contributionId ? `contrib:${input.contributionId}` : "anon");
    return `fd:${input.campaignId ?? "na"}:${input.rewardConfigId ?? input.mcomRewardId}:${who}`;
  }

  /**
   * Issue a reward via MCOM Rewards. Returns the mirror row, or `null` when the
   * rule's quantity cap has been reached (not an error).
   *
   * Throws on provider failure so a queue worker can retry (retryable errors
   * leave the row `PENDING`); fatal errors mark it `FAILED` and free the slot.
   */
  async issue(input: IssueRewardInput): Promise<RewardIssuance | null> {
    const idempotencyKey = this.buildIdempotencyKey(input);

    const reserved = await this.reservation.reserve({
      campaignId: input.campaignId ?? "na",
      rewardConfigId: input.rewardConfigId ?? input.mcomRewardId,
      idempotencyKey,
      limit: input.limit ?? null,
      base: this.reserveBase(input),
    });

    if (reserved.outcome === "cap_reached") return null;
    if (reserved.outcome === "exists") return reserved.issuance ?? null;

    try {
      // The provider requires an entitled "business" (sponsor) on issuance.
      const business =
        input.business ??
        (input.campaignId ? await this.resolveBusiness(input.campaignId) : null);
      if (!business) {
        throw new McomRewardsError({
          httpStatus: 422,
          message:
            "Cannot issue MCOM reward: no sponsoring business identity (mcomUserId/email) available for this campaign",
          retryable: false,
        });
      }

      const issuance = await this.rewardsClient.issueReward(input.mcomRewardId, {
        business,
        recipient: input.recipient,
        quantity: input.quantity ?? 1,
        idempotencyKey,
        externalRef: input.campaignId,
        expiresAt: input.expiresAt,
        metadata: {
          ...(input.metadata ?? {}),
          ...(input.contributionId ? { contributionId: input.contributionId } : {}),
          ...(input.userId ? { userId: input.userId } : {}),
        },
      });

      return await this.settle(input, idempotencyKey, issuance);
    } catch (err) {
      // Fatal provider rejections (400 validation/state, 401, 403
      // caller/scope/not-entitled, 404) → mark FAILED (frees the slot) and
      // surface the reason. Retryable errors (429/5xx/ENTITLEMENT_UNAVAILABLE/
      // transport) stay PENDING for the worker to retry.
      if (err instanceof McomRewardsError && !err.retryable) {
        await this.recordFailure(input, idempotencyKey, err);
      }
      throw err;
    }
  }

  /** Issue a reward without letting a provider outage break the caller's flow. */
  async issueBestEffort(input: IssueRewardInput): Promise<RewardIssuance | null> {
    try {
      return await this.issue(input);
    } catch (err) {
      this.logger.error(
        `Best-effort MCOM reward issue failed (campaign=${input.campaignId ?? "n/a"}, reward=${input.mcomRewardId}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Record a FundOrDonate-local reward (no external provider call), reserving a
   * slot and honouring the quantity cap exactly like an MCOM reward.
   */
  async issueLocal(input: IssueLocalRewardInput): Promise<RewardIssuance | null> {
    const idempotencyKey = this.buildIdempotencyKey({
      userId: input.userId,
      recipient: input.recipient,
      campaignId: input.campaignId,
      contributionId: input.contributionId,
      rewardConfigId: input.rewardConfigId,
      mcomRewardId: input.rewardRefId,
    });

    const reserved = await this.reservation.reserve({
      campaignId: input.campaignId ?? "na",
      rewardConfigId: input.rewardConfigId ?? input.rewardRefId,
      idempotencyKey,
      limit: input.limit ?? null,
      base: {
        mcomRewardId: input.rewardRefId,
        externalRef: input.campaignId ?? null,
        contributionId: input.contributionId ?? null,
        userId: input.userId ?? null,
        mcomUserId: input.recipient.mcomUserId ?? null,
        recipientEmail: input.recipient.email ?? null,
        recipientName: input.recipient.name ?? null,
        rewardTitle: input.rewardTitle ?? null,
        quantity: input.quantity,
        metadata: input.metadata,
      },
    });

    if (reserved.outcome === "cap_reached") return null;
    if (reserved.outcome === "exists") return reserved.issuance ?? null;

    return this.prisma.rewardIssuance.update({
      where: { idempotencyKey },
      data: {
        externalIssuanceId: `local:${idempotencyKey}`,
        status: "ISSUED",
        rewardType: "local",
        value: input.value ?? null,
        quantity: input.quantity ?? 1,
      },
    });
  }

  /** Record a local reward without letting a failure break the caller's flow. */
  async issueLocalBestEffort(
    input: IssueLocalRewardInput,
  ): Promise<RewardIssuance | null> {
    try {
      return await this.issueLocal(input);
    } catch (err) {
      this.logger.error(
        `Best-effort local reward issue failed (campaign=${input.campaignId ?? "n/a"}, reward=${input.rewardRefId}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  private reserveBase(input: IssueRewardInput): ReserveBase {
    return {
      mcomRewardId: input.mcomRewardId,
      externalRef: input.campaignId ?? null,
      contributionId: input.contributionId ?? null,
      userId: input.userId ?? null,
      mcomUserId: input.recipient.mcomUserId ?? null,
      recipientEmail: input.recipient.email ?? null,
      recipientName: input.recipient.name ?? null,
      rewardTitle:
        typeof input.metadata?.rewardName === "string"
          ? input.metadata.rewardName
          : null,
      quantity: input.quantity,
      metadata: input.metadata,
    };
  }

  /**
   * Resolve the campaign's sponsoring business identity for the provider's
   * entitlement check — the owner's Central user id (preferred) or the
   * business/owner email.
   */
  private async resolveBusiness(
    campaignId: string,
  ): Promise<McomIssuingBusiness | null> {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id: campaignId },
      select: {
        business: {
          select: {
            email: true,
            owner: { select: { mcomUserId: true, email: true } },
          },
        },
      },
    });

    const biz = campaign?.business;
    if (!biz) return null;

    const mcomUserId = biz.owner?.mcomUserId ?? undefined;
    const email = biz.email ?? biz.owner?.email ?? undefined;
    if (!mcomUserId && !email) return null;

    return {
      ...(mcomUserId ? { mcomUserId } : {}),
      ...(email ? { email } : {}),
    };
  }

  /**
   * Persist a durable FAILED record for a rejected issuance (frees the slot),
   * with the category the UI needs:
   *  - point offer with an unresolvable recipient → `needsActivation`
   *  - sponsor business without an MCOM Rewards entitlement → `businessNotEntitled`
   */
  private async recordFailure(
    input: IssueRewardInput,
    idempotencyKey: string,
    err: McomRewardsError,
  ): Promise<void> {
    const metadata = {
      ...(input.metadata ?? {}),
      needsActivation: err.isRecipientUnresolved,
      businessNotEntitled: err.isBusinessNotEntitled,
      httpStatus: err.httpStatus,
      code: err.code,
      failureReason: err.message,
    };

    this.logger.warn(
      `Reward issuance failed (campaign=${input.campaignId ?? "n/a"}, reward=${input.mcomRewardId}) — ` +
        `HTTP ${err.httpStatus}${err.code ? ` [${err.code}]` : ""}: ${err.message.replace(/\n/g, " | ")}` +
        `${err.isRecipientUnresolved ? " (recipient needs activation)" : ""}` +
        `${err.isBusinessNotEntitled ? " (business not entitled)" : ""}`,
    );

    const existing = await this.prisma.rewardIssuance.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      await this.prisma.rewardIssuance.update({
        where: { idempotencyKey },
        data: {
          status: "FAILED",
          externalIssuanceId: `failed:${idempotencyKey}`,
          metadata: metadata as never,
        },
      });
      return;
    }

    // Defensive: a failure before a reservation existed.
    await this.prisma.rewardIssuance.create({
      data: {
        externalIssuanceId: `failed:${idempotencyKey}`,
        mcomRewardId: input.mcomRewardId,
        rewardConfigId: input.rewardConfigId ?? null,
        rewardTitle:
          typeof input.metadata?.rewardName === "string"
            ? input.metadata.rewardName
            : null,
        externalRef: input.campaignId ?? null,
        idempotencyKey,
        campaignId: input.campaignId ?? null,
        contributionId: input.contributionId ?? null,
        userId: input.userId ?? null,
        mcomUserId: input.recipient.mcomUserId ?? null,
        recipientEmail: input.recipient.email ?? null,
        recipientName: input.recipient.name ?? null,
        status: "FAILED",
        quantity: input.quantity ?? 1,
        metadata: metadata as never,
      },
    });
  }

  /**
   * Revoke every reward issued for a contribution (used on refund). Revoking a
   * `PENDING`/local/placeholder reward is a local status flip; an MCOM issuance
   * is revoked provider-side first. Idempotent — already-terminal rows are
   * skipped, and `revoke` on an MCOM issuance that cannot be revoked is treated
   * as done. Returns the number of rows revoked.
   */
  async revokeContributionRewards(contributionId: string): Promise<number> {
    const rows = await this.prisma.rewardIssuance.findMany({
      where: { contributionId, status: { in: ["PENDING", "ISSUED"] } },
    });

    let revoked = 0;
    for (const row of rows) {
      const ext = row.externalIssuanceId ?? "";
      const isExternalMcom =
        !ext.startsWith("pending:") &&
        !ext.startsWith("failed:") &&
        !ext.startsWith("local:");

      if (isExternalMcom) {
        try {
          const result = await this.rewardsClient.revokeIssuance(ext, {
            reason: "Contribution refunded",
          });
          await this.prisma.rewardIssuance.update({
            where: { id: row.id },
            data: { status: result.status ?? "REVOKED", revokedAt: new Date() },
          });
        } catch (err) {
          if (err instanceof McomRewardsError && !err.retryable) {
            // Already redeemed/revoked/expired — reflect it locally.
            this.logger.warn(
              `Could not revoke MCOM issuance ${ext} (HTTP ${err.httpStatus}${err.code ? ` [${err.code}]` : ""}: ${err.message}); marking local mirror REVOKED`,
            );
            await this.prisma.rewardIssuance.update({
              where: { id: row.id },
              data: { status: "REVOKED", revokedAt: new Date() },
            });
          } else {
            // Retryable (provider down) — let the queue retry the whole job.
            throw err;
          }
        }
      } else {
        await this.prisma.rewardIssuance.update({
          where: { id: row.id },
          data: { status: "REVOKED", revokedAt: new Date() },
        });
      }
      revoked += 1;
    }

    return revoked;
  }

  /** Settle a reserved (`PENDING`) issuance to its provider result. */
  private settle(
    input: IssueRewardInput,
    idempotencyKey: string,
    issuance: McomRewardIssuance,
  ): Promise<RewardIssuance> {
    const expiresAt = issuance.expiresAt ? new Date(issuance.expiresAt) : null;
    const redeemedAt = issuance.redeemedAt ? new Date(issuance.redeemedAt) : null;
    const revokedAt = issuance.revokedAt ? new Date(issuance.revokedAt) : null;

    return this.prisma.rewardIssuance.update({
      where: { idempotencyKey },
      data: {
        externalIssuanceId: issuance.id,
        status: issuance.status,
        code: issuance.code ?? null,
        rewardTitle: issuance.rewardTitle ?? input.metadata?.rewardName as string ?? null,
        rewardType: issuance.rewardType ?? null,
        value: issuance.value ?? null,
        quantity: issuance.quantity ?? input.quantity ?? 1,
        metadata: (issuance.metadata ?? undefined) as never,
        expiresAt,
        redeemedAt,
        revokedAt,
      },
    });
  }
}
