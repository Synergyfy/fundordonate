import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  effectiveConditions,
  type StoredRewardConfig,
} from "@/modules/rewards/reward-config.util";

export interface AdminRewardView {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, unknown>;
  isActive: boolean;
  grantedCount: number;
  fulfilmentCount: number;
  createdAt: string;
}

export interface AdminFulfilmentView {
  id: string;
  rewardId: string;
  userId: string | null;
  businessId: string | null;
  status: string;
  recipientName: string | null;
  recipientEmail: string | null;
  shippingAddress: Record<string, unknown> | null;
  trackingNumber: string | null;
  courier: string | null;
  notes: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
  reward: { id: string; code: string; name: string; icon: string };
}

interface RewardTemplateRow {
  id: string;
  slug: string;
  rewardsConfig: unknown;
  status: string;
  createdAt: Date;
}

/**
 * Admin Reward Library.
 *
 * The legacy gamification catalogue was retired; rewards are authored on
 * `CampaignTemplate.rewardsConfig` and delivered via `RewardIssuance`. This
 * service presents those two sources as the "reward library" and "fulfilment"
 * views the admin UI expects, without inventing a parallel store.
 */
@Injectable()
export class AdminRewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRewards(): Promise<AdminRewardView[]> {
    const [templates, issuances] = await Promise.all([
      this.prisma.campaignTemplate.findMany({
        select: { id: true, slug: true, rewardsConfig: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.rewardIssuance.groupBy({
        by: ["mcomRewardId"],
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map(issuances.map((i) => [i.mcomRewardId, i._count._all]));

    const rewards: AdminRewardView[] = [];
    const seen = new Set<string>();
    for (const template of templates as RewardTemplateRow[]) {
      const configs = Array.isArray(template.rewardsConfig)
        ? (template.rewardsConfig as StoredRewardConfig[])
        : [];
      for (const cfg of configs) {
        if (!cfg || typeof cfg !== "object" || !cfg.id) continue;
        const key = `${template.id}:${cfg.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rewards.push(this.toRewardView(cfg, template, countMap));
      }
    }
    return rewards;
  }

  async getReward(id: string): Promise<AdminRewardView> {
    const rewards = await this.getRewards();
    const reward = rewards.find((r) => r.id === id || r.code === id);
    if (!reward) throw new NotFoundException(`Reward ${id} not found`);
    return reward;
  }

  /** Reward issuances presented as fulfilment records. */
  async getFulfilments(params: {
    page?: number;
    limit?: number;
    status?: string;
    rewardId?: string;
    search?: string;
  } = {}) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status.toUpperCase();
    if (params.rewardId) where.mcomRewardId = params.rewardId;
    if (params.search) {
      where.OR = [
        { recipientEmail: { contains: params.search, mode: "insensitive" } },
        { recipientName: { contains: params.search, mode: "insensitive" } },
        { rewardTitle: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.rewardIssuance.count({ where }),
      this.prisma.rewardIssuance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items: rows.map((r) => this.toFulfilmentView(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateFulfilment(
    id: string,
    payload: {
      status?: string;
      trackingNumber?: string;
      courier?: string;
      notes?: string;
      shippingAddress?: Record<string, unknown>;
    },
  ): Promise<AdminFulfilmentView> {
    const existing = await this.prisma.rewardIssuance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Fulfilment ${id} not found`);

    const metadata = {
      ...((existing.metadata as Record<string, unknown>) ?? {}),
      ...(payload.trackingNumber ? { trackingNumber: payload.trackingNumber } : {}),
      ...(payload.courier ? { courier: payload.courier } : {}),
      ...(payload.notes ? { fulfilmentNotes: payload.notes } : {}),
      ...(payload.shippingAddress ? { shippingAddress: payload.shippingAddress } : {}),
      ...(payload.status ? { fulfilmentStatus: payload.status } : {}),
    };

    const updated = await this.prisma.rewardIssuance.update({
      where: { id },
      data: {
        metadata: metadata as never,
        ...(payload.status && ["ISSUED", "REDEEMED", "EXPIRED", "REVOKED", "FAILED"].includes(payload.status.toUpperCase())
          ? { status: payload.status.toUpperCase() }
          : {}),
        ...(payload.status?.toLowerCase() === "delivered" ? { redeemedAt: new Date() } : {}),
      },
    });

    return this.toFulfilmentView(updated);
  }

  private toRewardView(
    cfg: StoredRewardConfig,
    template: RewardTemplateRow,
    countMap: Map<string, number>,
  ): AdminRewardView {
    const conditions = effectiveConditions(cfg);
    const first = conditions[0];
    const rawMode = (first?.mode ?? "minimum").toLowerCase();
    const triggerMode = rawMode === "range" ? "range" : rawMode === "exact" ? "exact" : "minimum";

    return {
      id: String(cfg.id),
      code: cfg.rewardCategory ?? String(cfg.id),
      name: cfg.name ?? "Reward",
      description: cfg.rule ?? "",
      icon: "🎁",
      criteria: {
        audience: cfg.audience ?? "both",
        items: [],
        assets: [],
        triggerMode,
        minAmount: triggerMode === "exact" ? 0 : first?.minPence ?? 0,
        maxAmount: first?.maxPence ?? 0,
        exactAmount: first?.exactPence ?? 0,
        maxQuantity:
          (cfg.quantityType ?? "").toLowerCase() === "limited" && cfg.quantityLimit
            ? Number(cfg.quantityLimit)
            : 0,
        availableFrom: cfg.availableFrom ?? null,
        availableUntil: cfg.availableUntil ?? null,
        claimDeadlineDays: 30,
        fulfilmentType: cfg.delivery ?? "external_link",
        source: cfg.source ?? "fundordonate",
        mcomRewardId: cfg.mcomRewardId ?? null,
        templateId: template.id,
        templateSlug: template.slug,
      },
      isActive: template.status === "ACTIVE",
      grantedCount: countMap.get(cfg.mcomRewardId ?? String(cfg.id)) ?? 0,
      fulfilmentCount: 0,
      createdAt: template.createdAt.toISOString(),
    };
  }

  private toFulfilmentView(row: {
    id: string;
    mcomRewardId: string;
    rewardTitle: string | null;
    userId: string | null;
    campaignId: string | null;
    recipientName: string | null;
    recipientEmail: string | null;
    status: string;
    metadata: unknown;
    redeemedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminFulfilmentView {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    return {
      id: row.id,
      rewardId: row.mcomRewardId,
      userId: row.userId,
      businessId: row.campaignId,
      status: (meta.fulfilmentStatus as string) ?? row.status.toLowerCase(),
      recipientName: row.recipientName,
      recipientEmail: row.recipientEmail,
      shippingAddress: (meta.shippingAddress as Record<string, unknown>) ?? null,
      trackingNumber: (meta.trackingNumber as string) ?? null,
      courier: (meta.courier as string) ?? null,
      notes: (meta.fulfilmentNotes as string) ?? null,
      fulfilledAt: row.redeemedAt ? row.redeemedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      reward: {
        id: row.mcomRewardId,
        code: row.mcomRewardId,
        name: row.rewardTitle ?? "Reward",
        icon: "🎁",
      },
    };
  }
}
