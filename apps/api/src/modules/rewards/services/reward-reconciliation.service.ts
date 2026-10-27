import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BusinessCampaignStatus } from "@prisma/client";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { McomRewardsWebhookService } from "@/mcom/mcom-rewards-webhook.service";
import {
  RewardsClient,
  type McomRewardIssuance,
} from "@/mcom/rewards-client.service";
import { RewardTriggerService } from "./reward-trigger.service";
import {
  REWARD_RECONCILE_QUEUE,
  type ReconcileCampaignJobData,
} from "../rewards.queues";

const PAGE_SIZE = 100;

export interface ReconcileCampaignResult {
  campaignId: string;
  mirrored: number;
  backfilled: number;
  error?: string;
}

export interface ReconcileAllResult {
  campaigns: number;
  mirrored: number;
  backfilled: number;
  failures: number;
}

/**
 * Reconciliation safety net.
 *
 * Webhooks and the issue queue can both miss (a dropped delivery, a crash
 * between issue and persist, a provider-side status change with no webhook),
 * so the local mirror can silently drift from MCOM Rewards. This job, run
 * periodically per campaign, re-reads the provider's issuance list by
 * `externalRef` and upserts the mirror, then re-runs the trigger engine so any
 * qualifying reward that was never issued is backfilled. It makes the system
 * self-healing.
 */
@Injectable()
export class RewardReconciliationService implements OnModuleInit {
  private readonly logger = new Logger(RewardReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsClient: RewardsClient,
    private readonly webhookService: McomRewardsWebhookService,
    private readonly rewardTrigger: RewardTriggerService,
    private readonly config: ConfigService,
    @InjectQueue(REWARD_RECONCILE_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.get<boolean>("rewards.reconcileEnabled") ?? true;
    if (!enabled) {
      this.logger.log("Reward reconciliation scheduler disabled");
      return;
    }

    const every = this.config.get<number>("rewards.reconcileIntervalMs") ?? 900_000;
    try {
      // Repeatable BullMQ scheduler: the first run is scheduled `every` ms out.
      await this.queue.upsertJobScheduler(
        "reward-reconcile-scheduled",
        { every },
        {
          name: "reconcile-all",
          data: {},
          opts: {
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 100 },
          },
        },
      );
      this.logger.log(
        `Reward reconciliation scheduled every ${Math.round(every / 1000)}s`,
      );
    } catch (err) {
      this.logger.warn(
        `Could not register reward reconciliation scheduler: ${(err as Error).message}`,
      );
    }
  }

  /** Enqueue an immediate reconciliation pass for one campaign. */
  async enqueueCampaign(campaignId: string): Promise<void> {
    await this.queue.add(
      "reconcile-campaign",
      { campaignId } satisfies ReconcileCampaignJobData,
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
    );
  }

  /** Reconcile every campaign that is active or already has issuances. */
  async reconcileAll(): Promise<ReconcileAllResult> {
    // Recover reservations left PENDING by a crash between reserve and settle
    // before reconciling, so they can be re-driven in this pass.
    await this.reapStaleReservations();

    const campaignIds = await this.resolveCampaigns();
    const result: ReconcileAllResult = {
      campaigns: campaignIds.length,
      mirrored: 0,
      backfilled: 0,
      failures: 0,
    };

    const BATCH_SIZE = 5;
    for (let i = 0; i < campaignIds.length; i += BATCH_SIZE) {
      const batch = campaignIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((id) => this.reconcileCampaign(id)),
      );
      for (const one of batchResults) {
        if (one.error) result.failures += 1;
        result.mirrored += one.mirrored;
        result.backfilled += one.backfilled;
      }
    }

    if (result.failures > 0) {
      this.logger.warn(
        `Reward reconciliation finished with ${result.failures} campaign failure(s)`,
      );
    }
    return result;
  }

  /**
   * Reconcile a single campaign: mirror the provider's issuances locally, then
   * backfill any missing issuance by re-evaluating completed contributions.
   */
  async reconcileCampaign(campaignId: string): Promise<ReconcileCampaignResult> {
    const result: ReconcileCampaignResult = {
      campaignId,
      mirrored: 0,
      backfilled: 0,
    };

    try {
      result.mirrored = await this.mirrorIssuances(campaignId);
    } catch (err) {
      result.error = (err as Error).message;
      // Per-campaign failures are expected when the provider is offline; the
      // run summary logs the aggregate failure count at warn level.
      this.logger.debug(
        `Failed to mirror issuances for campaign ${campaignId}: ${result.error}`,
      );
      return result;
    }

    try {
      const issued = await this.rewardTrigger.evaluateCampaign(campaignId);
      result.backfilled = issued.length;
    } catch (err) {
      // evaluateCampaign already swallows internally, but be defensive.
      this.logger.warn(
        `Backfill for campaign ${campaignId} failed: ${(err as Error).message}`,
      );
    }

    if (result.mirrored > 0 || result.backfilled > 0) {
      this.logger.log(
        `Reconciled campaign ${campaignId}: mirrored=${result.mirrored} backfilled=${result.backfilled}`,
      );
    }
    return result;
  }

  /** Page through the provider's issuances for a campaign and upsert them. */
  private async mirrorIssuances(campaignId: string): Promise<number> {
    let page = 1;
    let mirrored = 0;

    // Bounded loop guards against a misbehaving provider.
    for (let guard = 0; guard < 100; guard += 1) {
      const res = await this.rewardsClient.listIssuances({
        externalRef: campaignId,
        page,
        limit: PAGE_SIZE,
      });

      const items: McomRewardIssuance[] = Array.isArray(res?.data) ? res.data : [];
      for (const issuance of items) {
        await this.webhookService.upsertMirror(issuance);
        mirrored += 1;
      }

      const totalPages = res?.totalPages ?? 1;
      if (page >= totalPages || items.length === 0) break;
      page += 1;
    }

    return mirrored;
  }

  /**
   * Fail reservations stuck in `PENDING` beyond `maxAgeMs` (a crash between
   * reserving and settling). Marking them `FAILED` frees their cap slot; the
   * backfill in this same pass re-drives them (the provider is idempotent, so
   * a slow-but-alive call is not double-issued).
   */
  async reapStaleReservations(maxAgeMs = 10 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const stale = await this.prisma.rewardIssuance.findMany({
      where: { status: "PENDING", updatedAt: { lt: cutoff } },
      select: { id: true },
    });
    if (stale.length === 0) return 0;

    await this.prisma.rewardIssuance.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { status: "FAILED" },
    });
    this.logger.warn(
      `Reaped ${stale.length} stale PENDING reward reservation(s) for re-drive`,
    );
    return stale.length;
  }

  private async resolveCampaigns(): Promise<string[]> {
    const [active, withIssuances] = await Promise.all([
      this.prisma.businessCampaign.findMany({
        where: { status: BusinessCampaignStatus.ACTIVE },
        select: { id: true },
      }),
      this.prisma.rewardIssuance.groupBy({
        by: ["campaignId"],
        where: { campaignId: { not: null } },
      }),
    ]);

    const ids = new Set<string>();
    for (const c of active) ids.add(c.id);
    for (const i of withIssuances) {
      if (i.campaignId) ids.add(i.campaignId);
    }
    return [...ids];
  }
}
