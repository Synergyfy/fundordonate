import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  RewardsClient,
  type McomBusinessReward,
} from "@/mcom/rewards-client.service";
import {
  businessRewardsAttachmentAllowed,
  normalizeBusinessRewardsMode,
} from "@/modules/rewards/reward-config.util";
import type { AttachCampaignRewardDto } from "../dto/attach-campaign-reward.dto";
import { businessRewardOwnershipWhere } from "../business-reward-ownership.util";

/**
 * Friendly labels for the reward types stored on an issuance. Covers both the
 * FundOrDonate-local type and the MCOM Rewards provider types ("Voucher",
 * "gift card", "coupon", "point offer", "physical product").
 */
const REWARD_TYPE_LABELS: Record<string, string> = {
  local: "FundOrDonate reward",
  voucher: "Voucher",
  "gift card": "Gift card",
  giftcard: "Gift card",
  coupon: "Coupon",
  "point offer": "Points reward",
  points: "Points reward",
  "physical product": "Physical product",
  membership: "Membership reward",
};

/** Human label for a reward type — answers "what do I get". */
function rewardTypeLabel(rewardType?: string | null): string {
  if (!rewardType) return "Reward";
  const key = rewardType.trim().toLowerCase();
  return REWARD_TYPE_LABELS[key] ?? rewardType;
}

export interface BusinessRewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;

  // ── What the reward actually is / what the owner gets ────────────────────
  /** Lifecycle status of the issuance (ISSUED / REDEEMED / EXPIRED / …). */
  status?: string;
  /** Reward type/category as stored on the issuance (e.g. "local", "Voucher"). */
  rewardType?: string | null;
  /** Monetary value of the reward in pounds GBP (null when open-ended/unknown). */
  value?: number | null;
  /** Redemption / voucher code the owner quotes to claim the reward. */
  code?: string | null;
  /** Number of units issued. */
  quantity?: number;
  /** When the reward expires (ISO string). */
  expiresAt?: string | null;
  /** When the reward was redeemed (ISO string). */
  redeemedAt?: string | null;
  /** When the reward was revoked (ISO string). */
  revokedAt?: string | null;

  // ── Provenance: what earned this reward ──────────────────────────────────
  /** The campaign the qualifying contribution was made to. */
  campaignId?: string | null;
  campaignTitle?: string | null;
  campaignImage?: string | null;
  /** The contribution (donation / funding) that qualified for the reward. */
  contributionId?: string | null;
  /** Contribution amount in pence. */
  contributionAmount?: number | null;
  /** Contribution channel: ONLINE | IN_STORE | FUNDING_SPLIT | SELF_FUNDING. */
  contributionType?: string | null;
  contributionReference?: string | null;
  contributionGateway?: string | null;
  contributionDate?: string | null;
}

export interface ListAvailableRewardsQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  rewardType?: string;
}

/**
 * Business rewards.
 *
 * - Earned rewards: read from the local `RewardIssuance` mirror (unified MCOM
 *   + FundOrDonate-local; the local path is being retired).
 * - Available rewards: the business's **own** rewards, fetched live from MCOM
 *   Rewards (`/partner/business-rewards`), which it may attach to a campaign.
 */
@Injectable()
export class BusinessRewardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsClient: RewardsClient,
  ) {}

  async getRewards(businessId: string): Promise<{
    earnedCount: number;
    totalCount: number;
    earned: BusinessRewardItem[];
    locked: BusinessRewardItem[];
  }> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        email: true,
        owner: { select: { id: true, email: true, mcomUserId: true } },
      },
    });
    if (!business) throw new NotFoundException("Business not found");

    // Rewards belong to the person who earned them, not to the campaign they
    // were earned on. Scope to the owner's identity so (a) a contributor's
    // reward on one of this business's campaigns is never attributed to the
    // owner, and (b) rewards the owner earned as a contributor elsewhere (or
    // via self-funding) are still shown.
    const issuances = await this.prisma.rewardIssuance.findMany({
      where: businessRewardOwnershipWhere({
        userId: business.owner.id,
        emails: [business.owner.email, business.email],
        mcomUserId: business.owner.mcomUserId,
      }),
      orderBy: { createdAt: "desc" },
    });

    // ── Hydrate provenance: the contribution and campaign behind each reward ──
    const contributionIds = [
      ...new Set(
        issuances
          .map((i) => i.contributionId)
          .filter((id): id is string => !!id),
      ),
    ];
    const campaignIds = [
      ...new Set(
        issuances.map((i) => i.campaignId).filter((id): id is string => !!id),
      ),
    ];
    // Business-owned rewards snapshot their catalogue description on the
    // campaign attachment; use it to describe what the reward actually is.
    const attachmentIds = [
      ...new Set(
        issuances
          .map((i) => i.rewardConfigId)
          .filter((id): id is string => !!id),
      ),
    ];

    const [contributions, campaigns, attachments] = await Promise.all([
      contributionIds.length
        ? this.prisma.contribution.findMany({
            where: { id: { in: contributionIds } },
            select: {
              id: true,
              amount: true,
              type: true,
              reference: true,
              gateway: true,
              createdAt: true,
              campaignId: true,
            },
          })
        : Promise.resolve([]),
      campaignIds.length
        ? this.prisma.businessCampaign.findMany({
            where: { id: { in: campaignIds } },
            select: {
              id: true,
              title: true,
              business: {
                select: { name: true, logoUrl: true, coverImageUrl: true },
              },
            },
          })
        : Promise.resolve([]),
      attachmentIds.length
        ? this.prisma.campaignRewardAttachment.findMany({
            where: { id: { in: attachmentIds } },
            select: { id: true, description: true },
          })
        : Promise.resolve([]),
    ]);

    const contributionMap = new Map(contributions.map((c) => [c.id, c]));
    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));
    const attachmentMap = new Map(attachments.map((a) => [a.id, a]));

    const earned: BusinessRewardItem[] = issuances.map((i) => {
      const contribution = i.contributionId
        ? contributionMap.get(i.contributionId)
        : undefined;
      const campaignId = i.campaignId ?? contribution?.campaignId ?? null;
      const campaign = campaignId ? campaignMap.get(campaignId) : undefined;
      const attachment = i.rewardConfigId
        ? attachmentMap.get(i.rewardConfigId)
        : undefined;

      return {
        id: i.id,
        name: i.rewardTitle ?? "Reward",
        // Surface what the reward actually is, not just where it came from.
        description:
          attachment?.description?.trim() || rewardTypeLabel(i.rewardType),
        icon: "🎁",
        earned: true,
        earnedAt: i.createdAt.toISOString().split("T")[0],
        status: i.status,
        rewardType: i.rewardType,
        value: i.value,
        code: i.code,
        quantity: i.quantity,
        expiresAt: i.expiresAt?.toISOString() ?? null,
        redeemedAt: i.redeemedAt?.toISOString() ?? null,
        revokedAt: i.revokedAt?.toISOString() ?? null,
        campaignId: campaignId ?? null,
        campaignTitle: campaign?.title ?? null,
        campaignImage:
          campaign?.business?.coverImageUrl ??
          campaign?.business?.logoUrl ??
          null,
        contributionId: contribution?.id ?? null,
        contributionAmount: contribution?.amount ?? null,
        contributionType: contribution?.type ?? null,
        contributionReference: contribution?.reference ?? null,
        contributionGateway: contribution?.gateway ?? null,
        contributionDate: contribution?.createdAt
          ? contribution.createdAt.toISOString()
          : null,
      };
    });

    return {
      earnedCount: earned.length,
      totalCount: earned.length,
      earned,
      locked: [],
    };
  }

  /**
   * The business's own MCOM Rewards, fetched live from the provider. Backs the
   * "attach a reward" picker.
   */
  async listAvailableRewards(
    businessId: string,
    query: ListAvailableRewardsQuery = {},
  ) {
    const identity = await this.resolveBusinessIdentity(businessId);
    return this.rewardsClient.listBusinessRewards({
      ...identity,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status as "active" | "draft" } : {}),
      ...(query.rewardType ? { rewardType: query.rewardType } : {}),
    });
  }

  /** List the business-owned rewards currently attached to a campaign. */
  async listCampaignRewardAttachments(businessId: string, campaignId: string) {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      include: {
        template: {
          select: { rewardsConfig: true, businessRewardsMode: true },
        },
        rewardAttachments: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    return {
      businessRewardsMode: normalizeBusinessRewardsMode(
        campaign.template?.businessRewardsMode,
      ),
      templateRewards: (campaign.template?.rewardsConfig as unknown[]) ?? [],
      attachments: campaign.rewardAttachments,
    };
  }

  /** Attach one of the business's own MCOM rewards to a campaign. */
  async attachCampaignReward(
    businessId: string,
    campaignId: string,
    dto: AttachCampaignRewardDto,
  ) {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      include: { template: { select: { businessRewardsMode: true } } },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    if (!businessRewardsAttachmentAllowed(campaign.template?.businessRewardsMode)) {
      throw new ForbiddenException(
        "This campaign's template does not allow attaching your own rewards",
      );
    }

    // Enforce ownership: the reward must belong to this business.
    const reward = await this.fetchOwnedBusinessReward(
      businessId,
      dto.businessRewardId,
    );

    const conditions = dto.conditions ?? [];
    const snapshot = {
      title: reward.title,
      description: reward.description ?? null,
      image: reward.image ?? null,
      rewardType: reward.rewardType ?? null,
    };
    const config = {
      conditions: conditions as never,
      qualificationMode: dto.qualificationMode ?? "independent",
      maxQuantity: dto.maxQuantity ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    };

    return this.prisma.campaignRewardAttachment.upsert({
      where: {
        campaignId_businessRewardId: {
          campaignId,
          businessRewardId: dto.businessRewardId,
        },
      },
      update: { ...snapshot, ...config, enabled: true },
      create: {
        campaignId,
        businessRewardId: dto.businessRewardId,
        ...snapshot,
        ...config,
      },
    });
  }

  /** Detach a business-owned reward from a campaign. */
  async detachCampaignReward(
    businessId: string,
    campaignId: string,
    attachmentId: string,
  ) {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      select: { id: true },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    const deleted = await this.prisma.campaignRewardAttachment.deleteMany({
      where: { id: attachmentId, campaignId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException("Reward attachment not found");
    }
    return { success: true, deletedId: attachmentId };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  /** The business's MCOM identity (owner's Central id preferred, else email). */
  private async resolveBusinessIdentity(businessId: string): Promise<{
    mcomUserId?: string;
    email?: string;
  }> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        email: true,
        owner: { select: { mcomUserId: true, email: true } },
      },
    });
    if (!business) throw new NotFoundException("Business not found");

    const mcomUserId = business.owner?.mcomUserId ?? undefined;
    const email = business.email ?? business.owner?.email ?? undefined;
    if (!mcomUserId && !email) {
      throw new BadRequestException(
        "Business has no linked MCOM identity (mcomUserId or email)",
      );
    }
    return {
      ...(mcomUserId ? { mcomUserId } : {}),
      ...(email ? { email } : {}),
    };
  }

  /** Page the provider's business rewards to confirm ownership + snapshot it. */
  private async fetchOwnedBusinessReward(
    businessId: string,
    businessRewardId: string,
  ): Promise<McomBusinessReward> {
    const identity = await this.resolveBusinessIdentity(businessId);
    const limit = 100;
    for (let page = 1; page <= 20; page += 1) {
      const res = await this.rewardsClient.listBusinessRewards({
        ...identity,
        page,
        limit,
      });
      const found = (res.data ?? []).find((r) => r.id === businessRewardId);
      if (found) return found;
      if (page >= (res.totalPages ?? 1)) break;
    }
    throw new NotFoundException(
      `Business reward ${businessRewardId} was not found for this business on MCOM Rewards`,
    );
  }
}
