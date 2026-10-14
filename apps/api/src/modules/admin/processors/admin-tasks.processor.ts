import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { BusinessCampaignStatus, ContributionStatus } from "@prisma/client";

export const ADMIN_TASKS_QUEUE = "admin-tasks";

export interface BulkCampaignStatusJobData {
  action: "approve" | "reject" | "archive";
  campaignIds: string[];
  adminUserId?: string;
}

export interface SeasonTargetRollupJobData {
  seasonId: string;
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

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing admin background job: ${job.name} [id=${job.id}]`);

    switch (job.name) {
      case "bulk-campaign-status":
        return this.handleBulkCampaignStatus(job.data as BulkCampaignStatusJobData);

      case "season-target-rollup":
        return this.handleSeasonTargetRollup(job.data as SeasonTargetRollupJobData);

      case "audit-log":
        return this.handleAuditLog(job.data as AuditLogJobData);

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
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
    const [contributionAgg, activeCampaignCount, participantsCount] = await Promise.all([
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
      this.prisma.contribution.groupBy({
        by: ["backerId"],
        where: {
          status: ContributionStatus.COMPLETED,
          createdAt: {
            gte: season.startDate,
            lte: season.endDate,
          },
          backerId: { not: null },
        },
      }),
    ]);

    const totalRaised = BigInt(contributionAgg._sum.amount ?? 0);
    const totalContributions = contributionAgg._count.id ?? 0;
    const totalParticipants = participantsCount.length;

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
}
