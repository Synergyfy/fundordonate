import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ContributionStatus, ContributionType, type RewardIssuance } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RewardEngineService } from "./reward-engine.service";
import {
  effectiveConditions,
  businessRewardsReplaceTemplate,
  isPlatformGiftReward,
} from "../reward-config.util";
import {
  INELIGIBLE_AUDIENCE,
  businessCanWin,
  consumerCanWin,
} from "../reward-fulfilment.util";

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
  /** Provider source for MCOM rewards (e.g. "mcom vault" = admin-created). */
  mcomSource?: string | null;
  rewardCategory?: string;
  valueGbp?: number | null;
  audience?: string;
  delivery?: string;
  qualificationMode?: string; // "highest" | "cumulative"
  triggerType?: string; // "contribution" | "backer" | "first_n" | ...
  conditions?: StoredCondition[];
  trigger?: StoredCondition;
  // caps + availability (authored in the wizard; all optional)
  quantityType?: string; // "unlimited" | "limited"
  quantityLimit?: number | string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  // Provider fulfilment + audience eligibility (authored by the admin wizard).
  fulfilmentProvider?: string | null;
  fulfilmentKind?: string | null;
  consumerEligible?: boolean | null;
  businessEligible?: boolean | null;
}

interface RewardRecipient {
  email?: string;
  mcomUserId?: string;
  name?: string;
  userId?: string;
  isBusiness?: boolean;
}

/** The fields of a `User` needed to identify a reward recipient/owner. */
interface RewardRecipientUser {
  id?: string;
  mcomUserId: string | null;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
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
    private readonly config: ConfigService,
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
            include: { template: true, business: { include: { owner: true } }, rewardAttachments: { where: { enabled: true } } },
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
          include: { template: true, business: { include: { owner: true } }, rewardAttachments: { where: { enabled: true } } },
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
    const recipient = await this.resolveRecipient(contribution);
    if (!recipient) {
      this.logger.log(
        `No eligible recipient for contribution ${contribution.id} — reward not issued`,
      );
      return [];
    }

    const issued: RewardIssuance[] = [];

    const template = contribution.campaign?.template;
    const templateConfigs =
      template && Array.isArray(template.rewardsConfig)
        ? (template.rewardsConfig as unknown as StoredRewardConfig[])
        : [];
    // Platform campaigns have no template; the admin wizard stores reward
    // rules on the campaign settings instead.
    const settingsConfigs = Array.isArray(
      (contribution.campaign?.settings as { rewardConfigs?: unknown } | null | undefined)
        ?.rewardConfigs,
    )
      ? ((contribution.campaign.settings as { rewardConfigs: StoredRewardConfig[] })
          .rewardConfigs ?? [])
      : [];
    const configs = templateConfigs.length > 0 ? templateConfigs : settingsConfigs;

    // "replace" mode: when the business has attached at least one of its own
    // rewards, those supersede the template rewards. If it hasn't attached any,
    // we fall back to the template rewards so contributors never get nothing.
    const enabledAttachments = contribution.campaign?.rewardAttachments ?? [];
    const skipTemplateRewards =
      businessRewardsReplaceTemplate(template?.businessRewardsMode) &&
      enabledAttachments.length > 0;

    // ── 1) Template-level rewards (existing behaviour) ───────────────────
    if (configs.length > 0 && !skipTemplateRewards) {
      // Build the qualifying candidates (availability-window + condition match),
      // anchored on the contribution time.
      const candidates: Array<{ cfg: StoredRewardConfig; amount: number }> = [];
      for (const cfg of configs) {
        if (!cfg || typeof cfg !== "object") continue;
        // Central membership/access pass/coupons are business-only.
        if (!this.isAudienceEligible(cfg, recipient, contribution.id)) continue;
        // This engine is contribution-driven. Rewards authored for other
        // trigger types are persisted/displayed but not issued here.
        const triggerType = (cfg.triggerType ?? "contribution").toLowerCase();
        if (triggerType !== "contribution" && triggerType !== "backer") continue;
        if (!this.isAvailable(cfg, contribution.createdAt)) continue;

        const amount = await this.qualifyingAmount(cfg, contribution, precomputedCumulative);
        if (!this.matches(amount, cfg)) continue;
        candidates.push({ cfg, amount });
      }

      if (candidates.length > 0) {
        // "highest" issues only the single best-matching reward; "cumulative"
        // (and any legacy default) keeps issuing every matching reward.
        const mode = (configs[0]?.qualificationMode ?? "").toLowerCase();
        const selected = mode === "cumulative" ? candidates : [this.highest(candidates)];

        for (const { cfg } of selected) {
          const limit = this.limitOf(cfg);

          if (cfg.source === "mcom" && cfg.mcomRewardId) {
            const input = {
              mcomRewardId: cfg.mcomRewardId,
              rewardTitle: cfg.name,
              recipient,
              campaignId: contribution.campaignId,
              contributionId: contribution.id,
              userId: contribution.backerId ?? undefined,
              rewardConfigId: cfg.id,
              limit,
              fulfilmentProvider: cfg.fulfilmentProvider ?? undefined,
              fulfilmentKind: cfg.fulfilmentKind ?? undefined,
              audience: cfg.audience,
              consumerEligible: cfg.consumerEligible ?? undefined,
              businessEligible: cfg.businessEligible ?? undefined,
              businessId: contribution.campaign?.business?.id ?? undefined,
              businessName: contribution.campaign?.business?.name ?? undefined,
              metadata: { rewardName: cfg.name, rule: cfg.rule, source: "mcom" },
            };
            // Admin/MCOM-created ("mcom vault") rewards are gifted on behalf of
            // the platform (app-level token, no sponsor business); other MCOM
            // catalogue rewards are issued against the campaign business's
            // entitlement.
            const record = isPlatformGiftReward(cfg)
              ? strict
                ? await this.rewardEngine.issuePlatformGift(input)
                : await this.rewardEngine.issuePlatformGiftBestEffort(input)
              : strict
                ? await this.rewardEngine.issue(input)
                : await this.rewardEngine.issueBestEffort(input);
            if (record) issued.push(record);
          } else if (this.mcomOnly) {
            // Legacy FundOrDonate-local rewards are migration-only. Never issue
            // them in the provider-driven system.
            this.logger.warn(
              `Skipping legacy local reward "${cfg.name ?? cfg.id}" for campaign ${contribution.campaignId}: MCOM-only rewards are enabled`,
            );
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
      }
    }

    // ── 2) Business-owned rewards attached to the campaign (independent) ──
    // Each attachment is evaluated on its own conditions and issued via the
    // MCOM business-reward endpoint; it does NOT join the template's
    // highest/cumulative selection.
    issued.push(
      ...(await this.evaluateAttachments(
        contribution,
        recipient,
        strict,
        precomputedCumulative,
      )),
    );

    if (issued.length > 0) {
      this.logger.log(
        `Issued ${issued.length} reward(s) for contribution ${contribution.id}`,
      );
    }
    return issued;
  }

  /** Evaluate the campaign's business-owned reward attachments. */
  private async evaluateAttachments(
    contribution: any,
    recipient: { email?: string; mcomUserId?: string; name?: string },
    strict: boolean,
    precomputedCumulative?: number,
  ): Promise<RewardIssuance[]> {
    const attachments: Array<{
      id: string;
      businessRewardId: string;
      title: string;
      conditions?: StoredCondition[];
      qualificationMode?: string;
      maxQuantity?: number | null;
      expiresAt?: Date | null;
      enabled?: boolean;
      fulfilmentProvider?: string | null;
      fulfilmentKind?: string | null;
      audience?: string | null;
      consumerEligible?: boolean | null;
      businessEligible?: boolean | null;
      businessId?: string | null;
      businessName?: string | null;
    }> = contribution.campaign?.rewardAttachments ?? [];

    if (attachments.length === 0) return [];

    const issued: RewardIssuance[] = [];

    for (const att of attachments) {
      if (att.enabled === false) continue;
      if (att.expiresAt && contribution.createdAt > att.expiresAt) continue;
      if (!this.isAudienceEligible(att, recipient, contribution.id)) continue;

      const cfg: StoredRewardConfig = {
        id: att.id,
        name: att.title,
        conditions: att.conditions,
        qualificationMode: att.qualificationMode,
      };

      const amount = await this.qualifyingAmount(
        cfg,
        contribution,
        precomputedCumulative,
      );
      if (!this.matches(amount, cfg)) continue;

      const input = {
        businessRewardId: att.businessRewardId,
        rewardConfigId: att.id,
        rewardTitle: att.title,
        recipient,
        campaignId: contribution.campaignId,
        contributionId: contribution.id,
        userId: contribution.backerId ?? undefined,
        limit: att.maxQuantity ?? null,
        expiresAt: att.expiresAt ? new Date(att.expiresAt).toISOString() : undefined,
        fulfilmentProvider: att.fulfilmentProvider ?? undefined,
        fulfilmentKind: att.fulfilmentKind ?? undefined,
        audience: att.audience ?? undefined,
        consumerEligible: att.consumerEligible ?? undefined,
        businessEligible: att.businessEligible ?? undefined,
        businessId: att.businessId ?? undefined,
        businessName: att.businessName ?? undefined,
        metadata: {
          rewardName: att.title,
          source: "mcom-business",
          attachmentId: att.id,
        },
      };

      const record = strict
        ? await this.rewardEngine.issueBusinessReward(input)
        : await this.rewardEngine.issueBusinessRewardBestEffort(input);
      if (record) issued.push(record);
    }

    return issued;
  }

  /**
   * Enforce the audience matrix server-side (final authority). Consumers must
   * never receive Central membership/access passes/coupons. Businesses may win
   * every supported kind, including Mall instruments.
   */
  private isAudienceEligible(
    cfg: Pick<
      StoredRewardConfig,
      "name" | "fulfilmentKind" | "consumerEligible" | "businessEligible"
    > & { audience?: string | null },
    recipient: RewardRecipient,
    contributionId: string,
  ): boolean {
    const audience = (cfg.audience ?? "").toLowerCase();
    const consumerEligible =
      cfg.consumerEligible ?? (audience === "business" ? false : undefined);
    const businessEligible =
      cfg.businessEligible ?? (audience === "consumer" ? false : undefined);
    const eligible = recipient.isBusiness
      ? businessCanWin({
          fulfilmentKind: cfg.fulfilmentKind,
          businessEligible,
        })
      : consumerCanWin({
          fulfilmentKind: cfg.fulfilmentKind,
          consumerEligible,
        });

    if (!eligible) {
      this.logger.warn(
        `Reward "${cfg.name ?? "reward"}" skipped for contribution ${contributionId}: ` +
          `reason=${INELIGIBLE_AUDIENCE} ` +
          `(fulfilmentKind=${cfg.fulfilmentKind ?? "unknown"}, ` +
          `recipient=${recipient.isBusiness ? "business" : "consumer"})`,
      );
    }
    return eligible;
  }

  /** Reward issuances must be provider-driven; local rewards are migration-only. */
  private get mcomOnly(): boolean {
    return this.config.get<boolean>("rewards.mcomOnly") ?? true;
  }

  /**
   * The contributor (backer) eligible for a reward.
   *
   * The person **running the campaign** (the campaign business's owner) is never
   * eligible for a reward from their own campaign — regardless of whether they
   * self-fund it or contribute online to it. A self-funding contribution has no
   * external backer, so it resolves to the owner and is then excluded here; an
   * owner's own online donation resolves to the owner as the backer and is
   * excluded the same way. An anonymous/guest donation is likewise never
   * attributed to the campaign owner.
   */
  private async resolveRecipient(contribution: {
    id?: string;
    type?: string;
    backer: RewardRecipientUser | null;
    campaign: { business: { owner: RewardRecipientUser } | null } | null;
  }): Promise<RewardRecipient | null> {
    const isSelfFunding = contribution.type === ContributionType.SELF_FUNDING;
    const owner = contribution.campaign?.business?.owner ?? null;
    const user = contribution.backer ?? (isSelfFunding ? owner : null);
    if (!user) return null;

    if (owner && this.isSameUser(user, owner)) {
      this.logger.log(
        `Campaign runner is not eligible for rewards on their own campaign — skipping rewards for contribution ${contribution.id ?? "n/a"}`,
      );
      return null;
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    // Central rewards are business-only. Determine whether this recipient acts
    // as a business owner (they may still win Mall rewards as a consumer).
    let isBusiness = false;
    if (user.id) {
      const business = await this.prisma.business.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      isBusiness = !!business;
    }

    return {
      mcomUserId: user.mcomUserId ?? undefined,
      email: user.email ?? undefined,
      name: name || undefined,
      userId: user.id,
      isBusiness,
    };
  }

  /** Whether two user identities refer to the same person. */
  private isSameUser(a: RewardRecipientUser, b: RewardRecipientUser): boolean {
    if (a.id && b.id && a.id === b.id) return true;
    if (a.mcomUserId && b.mcomUserId && a.mcomUserId === b.mcomUserId) return true;
    if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
      return true;
    }
    return false;
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
