import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, ContributionStatus, BusinessCampaignStatus } from "@prisma/client";
import {
  CreateSeasonDto,
  SeasonActionDto,
  SeasonActionTypeEnum,
  SeasonQueryDto,
  SeasonStatusEnum,
  UpdateSeasonDto,
} from "../dto/season.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ADMIN_TASKS_QUEUE } from "../processors/admin-tasks.processor";

@Injectable()
export class AdminSeasonsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ADMIN_TASKS_QUEUE) private readonly adminQueue: Queue,
  ) {}

  /**
   * Returns a paginated list of seasons with total count and metrics.
   */
  async getSeasons(query: SeasonQueryDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SeasonWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { referenceCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.season.count({ where }),
      this.prisma.season.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          _count: {
            select: { templates: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((s) => ({
        ...s,
        overallTarget: Number(s.overallTarget),
        nationalTarget: Number(s.nationalTarget),
        cityTargetDefault: Number(s.cityTargetDefault),
        localAreaTargetDefault: Number(s.localAreaTargetDefault),
        highStreetTargetDefault: Number(s.highStreetTargetDefault),
        businessCampaignTargetDefault: Number(s.businessCampaignTargetDefault),
        totalRaised: Number(s.totalRaised),
        templateCount: s._count.templates,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns the current active season, or the nearest scheduled season.
   */
  async getCurrentSeason() {
    let season = await this.prisma.season.findFirst({
      where: { status: SeasonStatusEnum.ACTIVE },
      include: {
        templates: true,
      },
    });

    if (!season) {
      season = await this.prisma.season.findFirst({
        where: { status: { in: [SeasonStatusEnum.SCHEDULED, SeasonStatusEnum.REVIEW] } },
        orderBy: { startDate: "asc" },
        include: {
          templates: true,
        },
      });
    }

    if (!season) {
      throw new NotFoundException("No active or scheduled season found");
    }

    return {
      ...season,
      overallTarget: Number(season.overallTarget),
      nationalTarget: Number(season.nationalTarget),
      cityTargetDefault: Number(season.cityTargetDefault),
      localAreaTargetDefault: Number(season.localAreaTargetDefault),
      highStreetTargetDefault: Number(season.highStreetTargetDefault),
      businessCampaignTargetDefault: Number(season.businessCampaignTargetDefault),
      totalRaised: Number(season.totalRaised),
    };
  }

  /**
   * Retrieves a single season by ID.
   */
  async getSeason(id: string) {
    const season = await this.prisma.season.findUnique({
      where: { id },
      include: {
        templates: true,
      },
    });

    if (!season) {
      throw new NotFoundException(`Season with ID ${id} not found`);
    }

    return {
      ...season,
      overallTarget: Number(season.overallTarget),
      nationalTarget: Number(season.nationalTarget),
      cityTargetDefault: Number(season.cityTargetDefault),
      localAreaTargetDefault: Number(season.localAreaTargetDefault),
      highStreetTargetDefault: Number(season.highStreetTargetDefault),
      businessCampaignTargetDefault: Number(season.businessCampaignTargetDefault),
      totalRaised: Number(season.totalRaised),
    };
  }

  /**
   * Creates a new season and checks for referenceCode uniqueness.
   */
  async createSeason(dto: CreateSeasonDto, createdById?: string) {
    if (dto.referenceCode) {
      const existing = await this.prisma.season.findUnique({
        where: { referenceCode: dto.referenceCode },
      });
      if (existing) {
        throw new ConflictException(`Season reference code '${dto.referenceCode}' already exists`);
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException("Season end date must be after start date");
    }

    const durationDays =
      dto.durationDays || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const season = await this.prisma.season.create({
      data: {
        name: dto.name,
        programmeName: dto.programmeName,
        referenceCode: dto.referenceCode,
        description: dto.description,
        publicDescription: dto.publicDescription,
        internalNotes: dto.internalNotes,
        status: SeasonStatusEnum.DRAFT,
        startDate,
        endDate,
        durationDays,
        overallTarget: BigInt(dto.overallTarget),
        nationalTarget: BigInt(dto.nationalTarget),
        cityTargetDefault: BigInt(dto.cityTargetDefault),
        localAreaTargetDefault: BigInt(dto.localAreaTargetDefault),
        highStreetTargetDefault: BigInt(dto.highStreetTargetDefault),
        businessCampaignTargetDefault: BigInt(dto.businessCampaignTargetDefault),
        activationScope: dto.activationScope ?? {},
        participationConfig: dto.participationConfig ?? {},
        engagementConfig: dto.engagementConfig ?? {},
        spilloverConfig: dto.spilloverConfig ?? {},
        communicationConfig: dto.communicationConfig ?? {},
        createdById,
      },
    });

    return {
      ...season,
      overallTarget: Number(season.overallTarget),
      nationalTarget: Number(season.nationalTarget),
      cityTargetDefault: Number(season.cityTargetDefault),
      localAreaTargetDefault: Number(season.localAreaTargetDefault),
      highStreetTargetDefault: Number(season.highStreetTargetDefault),
      businessCampaignTargetDefault: Number(season.businessCampaignTargetDefault),
      totalRaised: Number(season.totalRaised),
    };
  }

  /**
   * Updates an existing season configuration and triggers background metric roll-up.
   */
  async updateSeason(id: string, dto: UpdateSeasonDto) {
    const existing = await this.prisma.season.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Season with ID ${id} not found`);
    }

    const data: Prisma.SeasonUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.programmeName !== undefined) data.programmeName = dto.programmeName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.publicDescription !== undefined) data.publicDescription = dto.publicDescription;
    if (dto.internalNotes !== undefined) data.internalNotes = dto.internalNotes;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.overallTarget !== undefined) data.overallTarget = BigInt(dto.overallTarget);
    if (dto.nationalTarget !== undefined) data.nationalTarget = BigInt(dto.nationalTarget);
    if (dto.cityTargetDefault !== undefined) data.cityTargetDefault = BigInt(dto.cityTargetDefault);
    if (dto.localAreaTargetDefault !== undefined) data.localAreaTargetDefault = BigInt(dto.localAreaTargetDefault);
    if (dto.highStreetTargetDefault !== undefined) data.highStreetTargetDefault = BigInt(dto.highStreetTargetDefault);
    if (dto.businessCampaignTargetDefault !== undefined) {
      data.businessCampaignTargetDefault = BigInt(dto.businessCampaignTargetDefault);
    }
    if (dto.activationScope !== undefined) data.activationScope = dto.activationScope;
    if (dto.participationConfig !== undefined) data.participationConfig = dto.participationConfig;
    if (dto.engagementConfig !== undefined) data.engagementConfig = dto.engagementConfig;
    if (dto.spilloverConfig !== undefined) data.spilloverConfig = dto.spilloverConfig;
    if (dto.communicationConfig !== undefined) data.communicationConfig = dto.communicationConfig;

    const updated = await this.prisma.season.update({
      where: { id },
      data,
    });

    // Trigger target rollup job in background
    await this.adminQueue.add("season-target-rollup", { seasonId: id });

    return {
      ...updated,
      overallTarget: Number(updated.overallTarget),
      nationalTarget: Number(updated.nationalTarget),
      cityTargetDefault: Number(updated.cityTargetDefault),
      localAreaTargetDefault: Number(updated.localAreaTargetDefault),
      highStreetTargetDefault: Number(updated.highStreetTargetDefault),
      businessCampaignTargetDefault: Number(updated.businessCampaignTargetDefault),
      totalRaised: Number(updated.totalRaised),
    };
  }

  /**
   * Performs lifecycle actions on a season (activate, close, review, complete, archive).
   */
  async performAction(id: string, actionDto: SeasonActionDto) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) {
      throw new NotFoundException(`Season with ID ${id} not found`);
    }

    let newStatus: string = season.status;
    const now = new Date();
    const updateData: Prisma.SeasonUpdateInput = {};

    switch (actionDto.action) {
      case SeasonActionTypeEnum.ACTIVATE:
        newStatus = SeasonStatusEnum.ACTIVE;
        updateData.activatedAt = now;
        break;
      case SeasonActionTypeEnum.CLOSE:
        newStatus = SeasonStatusEnum.CLOSING;
        break;
      case SeasonActionTypeEnum.REVIEW:
        newStatus = SeasonStatusEnum.REVIEW;
        break;
      case SeasonActionTypeEnum.COMPLETE:
        newStatus = SeasonStatusEnum.COMPLETED;
        updateData.completedAt = now;
        break;
      case SeasonActionTypeEnum.ARCHIVE:
        newStatus = SeasonStatusEnum.ARCHIVED;
        updateData.archivedAt = now;
        break;
      default:
        throw new BadRequestException(`Unsupported action: ${actionDto.action}`);
    }

    updateData.status = newStatus;

    const updated = await this.prisma.season.update({
      where: { id },
      data: updateData,
    });

    // Recalculate season rollup
    await this.adminQueue.add("season-target-rollup", { seasonId: id });

    return {
      success: true,
      action: actionDto.action,
      previousStatus: season.status,
      currentStatus: newStatus,
      seasonId: id,
    };
  }

  /**
   * Compiles the comprehensive end-of-season review metrics.
   */
  async getSeasonReview(id: string) {
    const season = await this.prisma.season.findUnique({ where: { id } });
    if (!season) {
      throw new NotFoundException(`Season with ID ${id} not found`);
    }

    const [contributionsAgg, campaigns, participantsCount] = await Promise.all([
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
        _avg: { amount: true },
      }),
      this.prisma.businessCampaign.findMany({
        where: {
          createdAt: {
            gte: season.startDate,
            lte: season.endDate,
          },
        },
        select: {
          id: true,
          status: true,
          raisedAmount: true,
          targetAmount: true,
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

    const totalRaised = contributionsAgg._sum.amount ?? 0;
    const target = Number(season.overallTarget);
    const surplusOrDeficit = totalRaised - target;

    const completedCampaigns = campaigns.filter((c) => c.status === BusinessCampaignStatus.COMPLETED).length;
    const activeCampaigns = campaigns.filter((c) => c.status === BusinessCampaignStatus.ACTIVE).length;

    return {
      seasonId: id,
      seasonName: season.name,
      status: season.status,
      metrics: {
        overallTarget: target,
        totalRaised,
        surplusOrDeficit,
        isTargetMet: totalRaised >= target,
        totalTransactions: contributionsAgg._count.id ?? 0,
        averageContribution: Math.round(contributionsAgg._avg.amount ?? 0),
        totalParticipants: participantsCount.length,
      },
      campaignsOutcome: {
        totalCampaigns: campaigns.length,
        completed: completedCampaigns,
        active: activeCampaigns,
        successRate: campaigns.length > 0 ? Number(((completedCampaigns / campaigns.length) * 100).toFixed(1)) : 0,
      },
      reviewTimestamp: new Date().toISOString(),
    };
  }
}
