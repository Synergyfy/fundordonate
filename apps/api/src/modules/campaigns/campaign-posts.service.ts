import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { CreateCampaignPostDto, UpdateCampaignPostDto } from "./dto/campaign-post.dto";

@Injectable()
export class CampaignPostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(campaignId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Math.trunc(page) || 1);
    const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 20), 100);

    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const [items, total] = await Promise.all([
      this.prisma.campaignPost.findMany({
        where: { campaignId },
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, firstName: true, lastName: true, username: true },
          },
        },
      }),
      this.prisma.campaignPost.count({ where: { campaignId } }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async create(
    campaignId: string,
    userId: string,
    userRole: string | undefined,
    dto: CreateCampaignPostDto,
  ) {
    await this.assertCanManage(campaignId, userId, userRole);

    return this.prisma.campaignPost.create({
      data: {
        campaignId,
        authorId: userId,
        title: dto.title.trim(),
        content: dto.content.trim(),
      },
    });
  }

  async update(
    campaignId: string,
    postId: string,
    userId: string,
    userRole: string | undefined,
    dto: UpdateCampaignPostDto,
  ) {
    await this.assertCanManage(campaignId, userId, userRole);

    const post = await this.prisma.campaignPost.findFirst({
      where: { id: postId, campaignId },
    });
    if (!post) {
      throw new NotFoundException("Campaign update not found");
    }

    return this.prisma.campaignPost.update({
      where: { id: postId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
      },
    });
  }

  async remove(
    campaignId: string,
    postId: string,
    userId: string,
    userRole: string | undefined,
  ) {
    await this.assertCanManage(campaignId, userId, userRole);

    const post = await this.prisma.campaignPost.findFirst({
      where: { id: postId, campaignId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException("Campaign update not found");
    }

    await this.prisma.campaignPost.delete({ where: { id: postId } });
    return { success: true, deletedId: postId };
  }

  private async assertCanManage(
    campaignId: string,
    userId: string,
    userRole: string | undefined,
  ) {
    const campaign = await this.prisma.businessCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, business: { select: { ownerId: true } } },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (userRole !== "admin" && campaign.business.ownerId !== userId) {
      throw new ForbiddenException(
        "Only the campaign owner can manage campaign updates",
      );
    }
  }
}
