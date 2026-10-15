import { Injectable, Logger } from "@nestjs/common";
import { ContributionStatus, ContributionType, type RewardIssuance } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RewardEngineService } from "./reward-engine.service";
import { effectiveConditions } from "../reward-config.util";

/**
 * Shape of a reward config entry as persisted in `CampaignTemplate.rewardsConfig`
 * (written by the admin template wizard).
 */
interface StoredCondition {
  mode?: string; // "minimum" | "range" | "exact"
  minPence?: number | null;
  maxPence?: number | null;
  exactPence?: number | null;
  // legacy/loose fallbacks
  min?: number | null;
  max?: number | null;
  exact?: number | null;
}

interface StoredRewardConfig {
  id?: string;
  name?: string;
  rule?: string;
  source?: string; // "mcom" | "fundordonate"
  mcomRewardId?: string | null;
  rewardCategory?: string;
  valueGbp?: number | null;
  audience?: string;
  delivery?: string;
  qualificationMode?: string; // "highest" | "cumulative"
  conditions?: StoredCondition[];
  trigger?: StoredCondition;
  // caps + availability (authored in the wizard; all optional)
  quantityType?: string; // "unlimited" | "limited"
  quantityLimit?: number | string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
}

/**
 * Reward trigger engine.
 *
 * Evaluates a completed contribution against the campaign's reward rules
 * (stored on the template's `rewardsConfig`) and issues the rewards the
 * contributor qualifies for:
 *   - MCOM-sourced rewards are issued via the MCOM Rewards provider API.
 *   - FundOrDonate-local rewards are recorded locally.
 *
 * Issuance is idempotent and race-safe (see `RewardEngineService` /
 * `RewardReservationService`). It is BEST-EFFORT here: reward issuance must
 * never break a payment or contribution flow, so failures are logged and
 * swallowed in the inline path; the queue path (strict) rethrows so it retries.
 */
@Injectable()
export class RewardTriggerService {
  private readonly logger = new Logger(RewardTriggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardEngine: RewardEngineService,
  ) {}

  /**
   * Evaluate one completed contribution and issue any qualifying rewards.
   * Never throws (best-effort — safe to call inline from a payment flow).
   */
  async evaluateContribution(contributionId: string): Promise<RewardIssuance[]> {
    try {
      return await this.run(contributionId, false);
    } catch (err) {
      this.logger.error(
        `Reward trigger evaluation failed for contribution ${contributionId}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Queue-friendly evaluation: identical to {@link evaluateContribution} but
   * lets provider failures propagate so a BullMQ worker can retry with
   * exponential backoff. Not for inline payment flows.
   */
  async evaluateContributionStrict(contributionId: string): Promise<RewardIssuance[]> {
    return this.run(contributionId, true);
  }

  /**
   * Re-evaluate every completed contribution in a campaign (backfill /
   * reconciliation). Never throws.
   */
  async evaluateCampaign(campaignId: string): Promise<RewardIssuance[]> {
    try {
      const contributions = await this.prisma.contribution.findMany({
        where: { campaignId, status: ContributionStatus.COMPLETED },
        include: {
          backer: true,
          campaign: {
            include: { template: true, business: { include: { owner: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      if (contributions.length === 0) return [];

      // Pre-aggregate cumulative totals per backer in one single query
      const backerTotals = await this.prisma.contribution.groupBy({
        by: ["backerId"],
        where: { campaignId, status: ContributionStatus.COMPLETED, backerId: { not: null } },
        _sum: { amount: true },
      });
      const backerTotalMap = new Map(
        backerTotals.map((b) => [b.backerId!, b._sum.amount ?? 0]),
      );

      const issued: RewardIssuance[] = [];
      for (const c of contributions) {
        const cumulative = c.backerId ? (backerTotalMap.get(c.backerId) ?? c.amount) : c.amount;
        issued.push(...(await this.evaluateLoadedContribution(c, false, cumulative)));
      }
      return issued;
    } catch (err) {
      this.logger.error(
        `Reward trigger campaign evaluation failed for ${campaignId}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private async run(
    contributionId: string,
    strict = false,
  ): Promise<RewardIssuance[]> {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        backer: true,
        campaign: {
          include: { template: true, business: { include: { owner: true } } },
        },
      },
    });

    if (!contribution || contribution.status !== ContributionStatus.COMPLETED) {
      return [];
    }

    return this.evaluateLoadedContribution(contribution, strict);
  }

  private async evaluateLoadedContribution(
    contribution: any,
    strict = false,
    precomputedCumulative?: number,
  ): Promise<RewardIssuance[]> {
    const template = contribution.campaign?.template;
    if (!template) return [];

    const configs = Array.isArray(template.rewardsConfig)
      ? (template.rewardsConfig as unknown as StoredRewardConfig[])
      : [];
    if (configs.length === 0) return [];

    const recipient = this.resolveRecipient(contribution);
    if (!recipient) {
      this.logger.warn(
        `No recipient resolved for contribution ${contribution.id} — reward not issued`,
      );
      return [];
    }

    // Build the qualifying candidates (availability-window + condition match),
    // anchored on the contribution time.
    const candidates: Array<{ cfg: StoredRewardConfig; amount: number }> = [];
    for (const cfg of configs) {
      if (!cfg || typeof cfg !== "object") continue;
      if (!this.isAvailable(cfg, contribution.createdAt)) continue;

      const amount = await this.qualifyingAmount(cfg, contribution, precomputedCumulative);
      if (!this.matches(amount, cfg)) continue;
      candidates.push({ cfg, amount });
    }

    if (candidates.length === 0) return [];

    // "highest" issues only the single best-matching reward; "cumulative"
    // (and any legacy default) keeps issuing every matching reward.
    const mode = (configs[0]?.qualificationMode ?? "").toLowerCase();
    const selected = mode === "cumulative" ? candidates : [this.highest(candidates)];

    const issued: RewardIssuance[] = [];

    for (const { cfg } of selected) {
      const limit = this.limitOf(cfg);

      if (cfg.source === "mcom" && cfg.mcomRewardId) {
        const input = {
          mcomRewardId: cfg.mcomRewardId,
          recipient,
          campaignId: contribution.campaignId,
          contributionId: contribution.id,
          userId: contribution.backerId ?? undefined,
          rewardConfigId: cfg.id,
          limit,
          metadata: { rewardName: cfg.name, rule: cfg.rule, source: "mcom" },
        };
        const record = strict
          ? await this.rewardEngine.issue(input)
          : await this.rewardEngine.issueBestEffort(input);
        if (record) issued.push(record);
      } else {
        const input = {
          rewardRefId: cfg.id ?? cfg.mcomRewardId ?? "local-reward",
          rewardTitle: cfg.name,
          recipient,
          campaignId: contribution.campaignId,
          contributionId: contribution.id,
          userId: contribution.backerId ?? undefined,
          rewardConfigId: cfg.id,
          limit,
          value: cfg.valueGbp ?? null,
          metadata: { rewardName: cfg.name, rule: cfg.rule, source: "fundordonate" },
        };
        const record = strict
          ? await this.rewardEngine.issueLocal(input)
          : await this.rewardEngine.issueLocalBestEffort(input);
        if (record) issued.push(record);
      }
    }

    if (issued.length > 0) {
      this.logger.log(
        `Issued ${issued.length} reward(s) for contribution ${contribution.id}`,
      );
    }
    return issued;
  }

  /**
   * The contributor (backer). Only a self-funding contribution (which has no
   * external backer) falls back to the business owner — an anonymous/guest
   * donation must NOT be attributed to the campaign owner.
   */
  private resolveRecipient(contribution: {
    type?: string;
    backer: { mcomUserId: string | null; email: string; firstName: string | null; lastName: string | null } | null;
    campaign: {
      business: {
        owner: { mcomUserId: string | null; email: string; firstName: string | null; lastName: string | null };
      } | null;
    } | null;
  }): { email?: string; mcomUserId?: string; name?: string } | null {
    const isSelfFunding = contribution.type === ContributionType.SELF_FUNDING;
    const owner = isSelfFunding ? contribution.campaign?.business?.owner ?? null : null;
    const user = contribution.backer ?? owner;
    if (!user) return null;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return {
      mcomUserId: user.mcomUserId ?? undefined,
      email: user.email ?? undefined,
      name: name || undefined,
    };
  }

  /** Per-contribution amount, or the cumulative total for cumulative rules. */
  private async qualifyingAmount(
    cfg: StoredRewardConfig,
    contribution: { amount: number; campaignId: string; backerId: string | null },
    precomputedCumulative?: number,
  ): Promise<number> {
    if (
      (cfg.qualificationMode ?? "").toLowerCase() === "cumulative" &&
      contribution.backerId
    ) {
      if (precomputedCumulative !== undefined) {
        return precomputedCumulative;
      }
      const agg = await this.prisma.contribution.aggregate({
        where: {
          campaignId: contribution.campaignId,
          backerId: contribution.backerId,
          status: ContributionStatus.COMPLETED,
        },
        _sum: { amount: true },
      });
      return agg._sum.amount ?? contribution.amount;
    }
    return contribution.amount;
  }

  /** Whether the reward rule accepts redemptions earned at `when`. */
  private isAvailable(cfg: StoredRewardConfig, when: Date): boolean {
    const from = cfg.availableFrom ? new Date(cfg.availableFrom) : null;
    const until = cfg.availableUntil ? new Date(cfg.availableUntil) : null;
    if (from && !Number.isNaN(from.getTime()) && when < from) return false;
    if (until && !Number.isNaN(until.getTime()) && when > until) return false;
    return true;
  }

  /** The rule's quantity cap, or null when unlimited/unset. */
  private limitOf(cfg: StoredRewardConfig): number | null {
    if ((cfg.quantityType ?? "").toLowerCase() !== "limited") return null;
    const n = Number(cfg.quantityLimit);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  /** The candidate with the highest qualifying threshold. */
  private highest(
    candidates: Array<{ cfg: StoredRewardConfig; amount: number }>,
  ): { cfg: StoredRewardConfig; amount: number } {
    let best = candidates[0]!;
    let bestScore = this.thresholdScore(best.cfg);
    for (const candidate of candidates.slice(1)) {
      const score = this.thresholdScore(candidate.cfg);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    return best;
  }

  private thresholdScore(cfg: StoredRewardConfig): number {
    const condition = effectiveConditions(cfg)[0];
    if (!condition) return 0;
    return condition.exactPence ?? condition.minPence ?? 0;
  }

  /** A reward qualifies if any of its conditions match (or it is unconditional). */
  private matches(amount: number, cfg: StoredRewardConfig): boolean {
    const conditions = effectiveConditions(cfg);
    if (conditions.length === 0) return true; // unconditional reward
    return conditions.some((c) => this.conditionMatches(amount, c));
  }

  private conditionMatches(amount: number, c: StoredCondition): boolean {
    switch ((c.mode ?? "").toLowerCase()) {
      case "minimum":
      case "min":
        return c.minPence != null && amount >= c.minPence;
      case "range":
        return (
          (c.minPence == null || amount >= c.minPence) &&
          (c.maxPence == null || amount <= c.maxPence)
        );
      case "exact":
        return c.exactPence != null && amount === c.exactPence;
      default:
        return true;
    }
  }
}
