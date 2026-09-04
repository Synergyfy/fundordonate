// =============================================================================
// FundOrDonate — Campaign Domain Service Boundary
// Centralizes campaign business rules, status transitions, and domain logic.
// =============================================================================

import { prisma } from "../lib/prisma";
import {
  CampaignStatus,
  CampaignMode,
  CampaignCreatorType,
  Role,
  ENABLED_CAMPAIGN_CREATOR_TYPES,
  VALID_STATUS_TRANSITIONS,
  STATUS_TRANSITION_ACTORS,
} from "@fundordonate/types";
import { NotFoundError, ForbiddenError, AppError } from "../middleware/errorHandler";
import { slugify } from "@fundordonate/types";
import { logger } from "../lib/logger";

// =============================================================================
// Types
// =============================================================================

export interface CreateCampaignInput {
  title: string;
  description?: string;
  shortDescription?: string;
  mode?: CampaignMode;
  goalAmount: number;
  campaignTarget?: number;
  ownerContribution?: number;
  deadline: string;
  featuredImage?: string;
  videoUrl?: string;
  categoryId?: string;
  tags?: string[];
  creatorType?: CampaignCreatorType;
  settings?: Record<string, unknown>;
  platformFee?: number;
  fundId?: string;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  shortDescription?: string;
  goalAmount?: number;
  campaignTarget?: number;
  ownerContribution?: number;
  deadline?: string;
  featuredImage?: string;
  videoUrl?: string;
  categoryId?: string;
  settings?: Record<string, unknown>;
}

export interface ListCampaignsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus | CampaignStatus[];
  mode?: CampaignMode;
  authorId?: string;
  fundraiserId?: string;
  categoryId?: string;
  seasonId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// =============================================================================
// Slug Generation
// =============================================================================

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.campaign.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// =============================================================================
// Campaign CRUD
// =============================================================================

export async function createCampaign(authorId: string, data: CreateCampaignInput) {
  // Validate creator type is enabled
  const creatorType = data.creatorType || CampaignCreatorType.ADMIN;
  if (!ENABLED_CAMPAIGN_CREATOR_TYPES.includes(creatorType)) {
    throw new ForbiddenError(`Campaign creation for type '${creatorType}' is not currently enabled`);
  }

  // Generate slug
  const baseSlug = slugify(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title,
      description: data.description || "",
      shortDescription: data.shortDescription,
      slug,
      mode: data.mode || CampaignMode.DONATION,
      goalAmount: data.goalAmount,
      campaignTarget: data.campaignTarget,
      ownerContribution: data.ownerContribution || 0,
      deadline: new Date(data.deadline),
      featuredImage: data.featuredImage,
      videoUrl: data.videoUrl,
      categoryId: data.categoryId,
      authorId,
      creatorType,
      platformFee: data.platformFee,
      fundId: data.fundId,
      settings: JSON.stringify(data.settings || {}),
      status: CampaignStatus.DRAFT,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, username: true, avatar: true } },
      category: true,
    },
  });

  // Handle tags
  if (data.tags && data.tags.length > 0) {
    await syncCampaignTags(campaign.id, data.tags);
  }

  logger.info(`Campaign created: ${campaign.id} by ${authorId}`);
  return campaign;
}

export async function updateCampaign(
  id: string,
  userId: string,
  userRole: Role,
  data: UpdateCampaignInput
) {
  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Campaign");

  // Ownership check
  if (existing.authorId !== userId && userRole !== Role.ADMIN) {
    throw new ForbiddenError("You can only edit your own campaigns");
  }

  // Status must not be mutated through update
  const { status, ...updateData } = data as any;

  // Regenerate slug if title changed
  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    slug = await ensureUniqueSlug(slugify(data.title), id);
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...updateData,
      slug,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      settings: data.settings ? JSON.stringify(data.settings) : undefined,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, username: true, avatar: true } },
      category: true,
    },
  });

  return campaign;
}

// =============================================================================
// Status Transitions
// =============================================================================

export async function transitionStatus(
  id: string,
  userId: string,
  userRole: Role,
  targetStatus: CampaignStatus
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError("Campaign");

  const currentStatus = campaign.status as CampaignStatus;

  // Validate transition
  const validTargets = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!validTargets?.includes(targetStatus)) {
    throw new AppError(400, `Cannot transition from '${currentStatus}' to '${targetStatus}'`);
  }

  // Validate actor
  const allowedActors = STATUS_TRANSITION_ACTORS[targetStatus];
  if (!allowedActors?.includes(userRole)) {
    throw new ForbiddenError(`Role '${userRole}' cannot transition to '${targetStatus}'`);
  }

  // Build update data with metadata
  const updateData: Record<string, unknown> = { status: targetStatus };

  switch (targetStatus) {
    case CampaignStatus.SUBMITTED:
      updateData.submittedAt = new Date();
      break;
    case CampaignStatus.APPROVED:
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
      break;
    case CampaignStatus.REJECTED:
      updateData.rejectedAt = new Date();
      break;
    case CampaignStatus.PUBLISHED:
      updateData.publishedById = userId;
      updateData.publishedAt = new Date();
      break;
  }

  await prisma.campaign.update({ where: { id }, data: updateData });
  logger.info(`Campaign ${id}: ${currentStatus} → ${targetStatus} by ${userId}`);
}

// =============================================================================
// Access Control
// =============================================================================

export function canAccessCampaign(
  campaign: { authorId: string; fundraiserId?: string | null },
  userId: string,
  userRole: Role
): boolean {
  if (userRole === Role.ADMIN) return true;
  if (campaign.authorId === userId) return true;
  if (campaign.fundraiserId === userId) return true;
  return false;
}

export function canEditCampaign(
  campaign: { authorId: string },
  userId: string,
  userRole: Role
): boolean {
  if (userRole === Role.ADMIN) return true;
  return campaign.authorId === userId;
}

// =============================================================================
// Tag Sync
// =============================================================================

async function syncCampaignTags(campaignId: string, tagNames: string[]): Promise<void> {
  // Find or create tags
  const tagIds = await Promise.all(
    tagNames.map(async (name) => {
      const tagSlug = slugify(name);
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        create: { name, slug: tagSlug },
        update: {},
      });
      return tag.id;
    })
  );

  // Get current tags
  const currentTags = await prisma.campaignTag.findMany({
    where: { campaignId },
    select: { tagId: true },
  });
  const currentTagIds = currentTags.map((t) => t.tagId);

  // Add new tags
  const toAdd = tagIds.filter((id) => !currentTagIds.includes(id));
  for (const tagId of toAdd) {
    await prisma.campaignTag.create({ data: { campaignId, tagId } });
  }

  // Remove old tags
  const toRemove = currentTagIds.filter((id) => !tagIds.includes(id));
  for (const tagId of toRemove) {
    await prisma.campaignTag.deleteMany({ where: { campaignId, tagId } });
  }
}
