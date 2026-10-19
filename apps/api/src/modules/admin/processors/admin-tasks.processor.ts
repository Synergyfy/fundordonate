import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { BusinessCampaignStatus, ContributionStatus } from "@prisma/client";
import { AdminCampaignsService } from "../services/admin-campaigns.service";
import { ADMIN_TASKS_QUEUE } from "./admin-tasks.constants";

export { ADMIN_TASKS_QUEUE };

export interface BulkCampaignStatusJobData {
  action: "approve" | "reject" | "archive";
  campaignIds: string[];
  adminUserId?: string;
}

export interface SeasonTargetRollupJobData {
  seasonId: string;
}

export interface TemplateInstantiateJobData {
  templateId: string;
  businessIds: string[];
  targetAmount?: number;
  deadlineDays?: number;
  adminUserId?: string;
  force?: boolean;
}

export interface SeasonTransitionJobData {
  seasonId: string;
  action: string;
}

export interface AuditLogJobData {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Processor(ADMIN_TASKS_QUEUE)
export class AdminTasksProcessor extends WorkerHost {
  private readonly logger = new Logger(AdminTasksProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignsService: AdminCampaignsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing admin background job: ${job.name} [id=${job.id}]`);

    switch (job.name) {
      case "bulk-campaign-status":
        return this.handleBulkCampaignStatus(job.data as BulkCampaignStatusJobData);

      case "season-target-rollup":
        return this.handleSeasonTargetRollup(job.data as SeasonTargetRollupJobData);

      case "template-instantiate":
        return this.handleTemplateInstantiate(job.data as TemplateInstantiateJobData);

      case "campaign-lifecycle-sweep":
        return this.handleCampaignLifecycleSweep();

      case "season-rollup-sweep":
        return this.handleSeasonRollupSweep();

      case "season-transition":
        return this.handleSeasonTransition(job.data as SeasonTransitionJobData);

      case "audit-log":
        return this.handleAuditLog(job.data as AuditLogJobData);

      case "auth-cleanup-sweep":
        return this.handleAuthCleanupSweep();

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
  }

  /**
   * Periodic sweep that starts campaigns whose start date has arrived and
   * completes campaigns whose end date has passed.
   */
  private async handleCampaignLifecycleSweep() {
    const now = new Date();

    const activated = await this.prisma.businessCampaign.updateMany({
      where: {
        status: BusinessCampaignStatus.APPROVED,
        startDate: { not: null, lte: now },
      },
      data: { status: BusinessCampaignStatus.ACTIVE },
    });

    const completed = await this.prisma.businessCampaign.updateMany({
      where: {
        status: BusinessCampaignStatus.ACTIVE,
        endDate: { not: null, lt: now },
      },
      data: { status: BusinessCampaignStatus.COMPLETED },
    });

    this.logger.log(
      `Campaign lifecycle sweep: ${activated.count} activated, ${completed.count} completed`,
    );

    return { activated: activated.count, completed: completed.count };
  }

  /**
   * Periodic roll-up of metrics for every currently active season.
   */
  private async handleSeasonRollupSweep() {
    const activeSeasons = await this.prisma.season.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });

    const results = [];
    for (const season of activeSeasons) {
      results.push(await this.handleSeasonTargetRollup({ seasonId: season.id }));
    }

    return { seasons: activeSeasons.length, results };
  }

  /**
   * Cascades a season lifecycle action to the campaigns linked to that season.
   */
  private async handleSeasonTransition(data: SeasonTransitionJobData) {
    const season = await this.prisma.season.findUnique({ where: { id: data.seasonId } });
    if (!season) {
      this.logger.warn(`Season ${data.seasonId} not found for transition`);
      return null;
    }

    const seasonScope = { template: { seasonId: season.id } };

    if (data.action === "ACTIVATE") {
      const res = await this.prisma.businessCampaign.updateMany({
        where: { ...seasonScope, status: BusinessCampaignStatus.APPROVED },
        data: { status: BusinessCampaignStatus.ACTIVE, startDate: new Date() },
      });
      this.logger.log(`Season ${season.name} activated ${res.count} campaign(s)`);
      return { action: data.action, activated: res.count };
    }

    if (data.action === "CLOSE" || data.action === "COMPLETE") {
      const res = await this.prisma.businessCampaign.updateMany({
        where: { ...seasonScope, status: BusinessCampaignStatus.ACTIVE },
        data: { status: BusinessCampaignStatus.COMPLETED },
      });
      this.logger.log(`Season ${season.name} completed ${res.count} campaign(s)`);
      return { action: data.action, completed: res.count };
    }

    return { action: data.action, affected: 0 };
  }

  private async handleTemplateInstantiate(data: TemplateInstantiateJobData) {
    const result = await this.campaignsService.instantiateTemplateForBusinesses({
      templateId: data.templateId,
      businessIds: data.businessIds,
      targetAmount: data.targetAmount,
      deadlineDays: data.deadlineDays,
      adminUserId: data.adminUserId,
      force: data.force,
    });

    this.logger.log(
      `Template ${data.templateId} instantiated: ${result.created} created, ${result.skipped} skipped`,
    );

    return result;
  }

  private async handleBulkCampaignStatus(data: BulkCampaignStatusJobData) {
    const { action, campaignIds, adminUserId } = data;
    let targetStatus: BusinessCampaignStatus;

    if (action === "approve") {
      targetStatus = BusinessCampaignStatus.ACTIVE;
    } else if (action === "reject") {
      targetStatus = BusinessCampaignStatus.CHANGES_REQUESTED;
    } else {
      targetStatus = BusinessCampaignStatus.CANCELLED;
    }

    // Process in batches of 50 to avoid lock escalation
    const BATCH_SIZE = 50;
    let updatedCount = 0;

    for (let i = 0; i < campaignIds.length; i += BATCH_SIZE) {
      const chunk = campaignIds.slice(i, i + BATCH_SIZE);
      const res = await this.prisma.businessCampaign.updateMany({
        where: { id: { in: chunk } },
        data: { status: targetStatus },
      });
      updatedCount += res.count;
    }

    // Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `BULK_CAMPAIGN_${action.toUpperCase()}`,
        entityType: "campaign",
        details: { count: updatedCount, campaignIds },
      },
    });

    this.logger.log(`Bulk campaign status complete: updated ${updatedCount} campaigns to ${targetStatus}`);
    return { updatedCount, status: targetStatus };
  }

  private async handleSeasonTargetRollup(data: SeasonTargetRollupJobData) {
    const { seasonId } = data;
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
    });

    if (!season) {
      this.logger.warn(`Season ${seasonId} not found for target rollup`);
      return null;
    }

    // Aggregate contributions and campaigns within season's dates
    const [contributionAgg, activeCampaignCount, participantsRes] = await Promise.all([
      this.prisma.contribution.aggregate({
        where: {
          status: ContributionStatus.COMPLETED,
          createdAt: {
            gte: season.startDate,
            lte: season.endDate,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.businessCampaign.count({
        where: {
          status: BusinessCampaignStatus.ACTIVE,
          createdAt: {
            gte: season.startDate,
            lte: season.endDate,
          },
        },
      }),
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT "backerId") AS count
        FROM contributions
        WHERE status = 'COMPLETED'
          AND "backerId" IS NOT NULL
          AND "createdAt" >= ${season.startDate}
          AND "createdAt" <= ${season.endDate}
      `,
    ]);

    const totalRaised = BigInt(contributionAgg._sum.amount ?? 0);
    const totalContributions = contributionAgg._count.id ?? 0;
    const totalParticipants = Number(participantsRes[0]?.count ?? 0);

    await this.prisma.season.update({
      where: { id: seasonId },
      data: {
        totalRaised,
        totalContributions,
        activeCampaigns: activeCampaignCount,
        totalParticipants,
      },
    });

    this.logger.log(`Season ${season.name} metrics rolled up successfully.`);
    return { totalRaised: Number(totalRaised), totalContributions, activeCampaignCount, totalParticipants };
  }

  private async handleAuditLog(data: AuditLogJobData) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ?? {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  private async handleAuthCleanupSweep() {
    const now = new Date();
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { used: true },
        ],
      },
    });
    this.logger.log(`Auth cleanup sweep completed: removed ${result.count} expired or used refresh tokens.`);
    return { deletedCount: result.count };
  }
}
