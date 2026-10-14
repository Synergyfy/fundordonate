import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import {
  CreateRewardDefinitionDto,
  FulfilmentQueryDto,
  UpdateFulfilmentDto,
  UpdateRewardDefinitionDto,
} from "../dto/reward-admin.dto";

@Injectable()
export class AdminRewardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all reward definitions with earned counts.
   */
  async getRewards() {
    const rewards = await this.prisma.rewardDefinition.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { earnedBy: true, fulfilments: true },
        },
      },
    });

    return rewards.map((r) => ({
      ...r,
      grantedCount: r._count.earnedBy,
      fulfilmentCount: r._count.fulfilments,
    }));
  }

  /**
   * Retrieves single reward definition detail.
   */
  async getReward(id: string) {
    const reward = await this.prisma.rewardDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { earnedBy: true, fulfilments: true },
        },
      },
    });

    if (!reward) {
      throw new NotFoundException(`Reward definition with ID ${id} not found`);
    }

    return {
      ...reward,
      grantedCount: reward._count.earnedBy,
      fulfilmentCount: reward._count.fulfilments,
    };
  }

  /**
   * Creates a new reward definition blueprint.
   */
  async createReward(dto: CreateRewardDefinitionDto) {
    const existing = await this.prisma.rewardDefinition.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Reward code '${dto.code}' already exists`);
    }

    return this.prisma.rewardDefinition.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        criteria: dto.criteria,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Updates an existing reward definition.
   */
  async updateReward(id: string, dto: UpdateRewardDefinitionDto) {
    const reward = await this.prisma.rewardDefinition.findUnique({ where: { id } });
    if (!reward) {
      throw new NotFoundException(`Reward definition with ID ${id} not found`);
    }

    const data: Prisma.RewardDefinitionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.criteria !== undefined) data.criteria = dto.criteria;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.rewardDefinition.update({
      where: { id },
      data,
    });
  }

  /**
   * Retrieves a paginated list of reward fulfilment tasks.
   */
  async getFulfilments(query: FulfilmentQueryDto) {
    const { page = 1, limit = 20, status, rewardId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RewardFulfilmentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (rewardId) {
      where.rewardId = rewardId;
    }

    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: "insensitive" } },
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.rewardFulfilment.count({ where }),
      this.prisma.rewardFulfilment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reward: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates a fulfilment order with dispatch/delivery details.
   */
  async updateFulfilment(id: string, dto: UpdateFulfilmentDto) {
    const fulfilment = await this.prisma.rewardFulfilment.findUnique({ where: { id } });
    if (!fulfilment) {
      throw new NotFoundException(`Fulfilment order with ID ${id} not found`);
    }

    const data: Prisma.RewardFulfilmentUpdateInput = {
      status: dto.status,
    };

    if (dto.trackingNumber !== undefined) data.trackingNumber = dto.trackingNumber;
    if (dto.courier !== undefined) data.courier = dto.courier;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status === "DELIVERED") data.fulfilledAt = new Date();

    return this.prisma.rewardFulfilment.update({
      where: { id },
      data,
    });
  }
}
