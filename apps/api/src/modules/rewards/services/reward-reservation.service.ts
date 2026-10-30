import { Injectable, Logger } from "@nestjs/common";
import type { RewardIssuance } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * Issuance statuses that consume a per-rule quantity slot. `REVOKED` and
 * `FAILED` are excluded, so revoking (e.g. on refund) or failing frees the slot.
 */
export const COUNTED_STATUSES = ["PENDING", "ISSUED", "REDEEMED", "EXPIRED"];

/** Statuses that mean the issuance is already final — never re-drive these. */
const TERMINAL_STATUSES = ["ISSUED", "REDEEMED", "EXPIRED", "REVOKED"];

export type ReserveOutcome = "proceed" | "exists" | "cap_reached";

export interface ReserveBase {
  mcomRewardId: string;
  businessRewardId?: string | null;
  externalRef?: string | null;
  contributionId?: string | null;
  userId?: string | null;
  mcomUserId?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  rewardTitle?: string | null;
  quantity?: number;
  metadata?: Record<string, unknown>;
  fulfilmentProvider?: string | null;
  fulfilmentKind?: string | null;
  businessId?: string | null;
  businessName?: string | null;
}

export interface ReserveParams {
  campaignId: string;
  rewardConfigId: string;
  idempotencyKey: string;
  /** Per-rule cap (from the reward config); null/undefined = unlimited. */
  limit?: number | null;
  base: ReserveBase;
}

export interface ReserveResult {
  outcome: ReserveOutcome;
  issuance?: RewardIssuance;
}

/**
 * Race-safe issuance reservation.
 *
 * Guarantees, even under concurrent contributions / queue retries / the
 * reconciler running at the same time:
 *  - **Idempotency**: a given `idempotencyKey` yields exactly one row (unique
 *    constraint) and exactly one provider call path — replays return the
 *    existing row.
 *  - **Cap safety**: a per-rule advisory lock serialises cap accounting so two
 *    workers can never both pass the check and over-issue.
 *
 * A `PENDING` row is created *before* the provider call; the engine later
 * settles it to `ISSUED` or `FAILED`.
 */
@Injectable()
export class RewardReservationService {
  private readonly logger = new Logger(RewardReservationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async reserve(params: ReserveParams): Promise<ReserveResult> {
    const { campaignId, rewardConfigId, idempotencyKey, limit, base } = params;

    return this.prisma.$transaction(async (tx) => {
      // Serialise all reservations for this (campaign, reward rule). Held until
      // the transaction commits, so the count-then-insert below is atomic.
      // (`::text` avoids Prisma trying to deserialize the `void` return.)
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${campaignId}:${rewardConfigId}`}))::text`;

      const existing = await tx.rewardIssuance.findUnique({
        where: { idempotencyKey },
      });

      // Already final → nothing to do.
      if (existing && TERMINAL_STATUSES.includes(existing.status)) {
        return { outcome: "exists" as const, issuance: existing };
      }

      // A reservation is already in flight (or a prior attempt is in progress);
      // proceed and re-drive — the provider is idempotent on the same key.
      if (existing && existing.status === "PENDING") {
        return { outcome: "proceed" as const, issuance: existing };
      }

      // FAILED re-attempt or brand-new issuance → must take a slot.
      if (limit != null) {
        const used = await tx.rewardIssuance.count({
          where: {
            campaignId,
            rewardConfigId,
            status: { in: COUNTED_STATUSES },
            NOT: { idempotencyKey },
          },
        });
        if (used >= limit) {
          this.logger.log(
            `Reward rule ${rewardConfigId} on campaign ${campaignId} is at its cap (${used}/${limit}); skipping`,
          );
          return { outcome: "cap_reached" as const, issuance: existing ?? undefined };
        }
      }

      const rowData = {
        rewardConfigId,
        businessRewardId: base.businessRewardId ?? existing?.businessRewardId ?? null,
        externalRef: base.externalRef ?? existing?.externalRef ?? null,
        contributionId: base.contributionId ?? existing?.contributionId ?? null,
        userId: base.userId ?? existing?.userId ?? null,
        mcomUserId: base.mcomUserId ?? existing?.mcomUserId ?? null,
        recipientEmail: base.recipientEmail ?? existing?.recipientEmail ?? null,
        recipientName: base.recipientName ?? existing?.recipientName ?? null,
        rewardTitle: base.rewardTitle ?? existing?.rewardTitle ?? null,
        metadata: (base.metadata ?? undefined) as never,
        fulfilmentProvider:
          base.fulfilmentProvider ?? existing?.fulfilmentProvider ?? null,
        fulfilmentKind:
          base.fulfilmentKind ?? existing?.fulfilmentKind ?? null,
        businessId: base.businessId ?? existing?.businessId ?? null,
        businessName: base.businessName ?? existing?.businessName ?? null,
      };

      // Re-attempt a FAILED row in place (keeps the same idempotency key).
      if (existing) {
        const updated = await tx.rewardIssuance.update({
          where: { idempotencyKey },
          data: { ...rowData, status: "PENDING" },
        });
        return { outcome: "proceed" as const, issuance: updated };
      }

      const created = await tx.rewardIssuance.create({
        data: {
          externalIssuanceId: `pending:${idempotencyKey}`,
          idempotencyKey,
          mcomRewardId: base.mcomRewardId,
          campaignId,
          status: "PENDING",
          quantity: base.quantity ?? 1,
          ...rowData,
        },
      });
      return { outcome: "proceed" as const, issuance: created };
    });
  }
}
