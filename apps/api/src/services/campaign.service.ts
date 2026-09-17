import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError, NotFoundError, ForbiddenError } from "../middleware/errorHandler";
import { canUserManageCampaign } from "../middleware/authorization";
import {
  CampaignStatus,
  CampaignMode,
  CampaignCreatorType,
  Role,
  VALID_STATUS_TRANSITIONS,
  STATUS_TRANSITION_ACTORS,
  ENABLED_CAMPAIGN_CREATOR_TYPES,
  slugify,
} from "@fundordonate/types";

// =============================================================================
// Types
// =============================================================================

type CampaignStatusValue = (typeof CampaignStatus)[keyof typeof CampaignStatus];
type CampaignModeValue = (typeof CampaignMode)[keyof typeof CampaignMode];
type CampaignCreatorTypeValue = (typeof CampaignCreatorType)[keyof typeof CampaignCreatorType];
type RoleValue = (typeof Role)[keyof typeof Role];

interface CreateCampaignInput {
  title: string;
  shortDescription?: string;
  description?: string;
  goalAmount: number;
  deadline: Date | string;
  mode?: CampaignModeValue;
  categoryId?: string;
  fundId?: string;
  featuredImage?: string;
  videoUrl?: string;
  platformFee?: number;
  settings?: Record<string, unknown>;
  tags?: string[];
  creatorType?: CampaignCreatorTypeValue;
  campaignTypeId?: string;
  seasonId?: string;
  // Campaign Hierarchy
  parentId?: string;
  // Campaign Hierarchy Level
  hierarchyLevel?: string;
  locationId?: string;
  // Campaign Context
  location?: string;
  isEvergreen?: boolean;
  participationTypes?: string[];
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;
  // Self-Funding
  isSelfFunding?: boolean;
  selfFundingLevel?: string;
  ownerContribution?: number;
  campaignTarget?: number;
}

interface UpdateCampaignInput {
  title?: string;
  shortDescription?: string;
  description?: string;
  goalAmount?: number;
  deadline?: Date | string;
  categoryId?: string;
  fundId?: string;
  featuredImage?: string;
  videoUrl?: string;
  platformFee?: number;
  settings?: Record<string, unknown>;
  tags?: string[];
  // Campaign Hierarchy
  parentId?: string | null;
  // Campaign Hierarchy Level
  hierarchyLevel?: string | null;
  locationId?: string | null;
  // Campaign Context
  location?: string | null;
  isEvergreen?: boolean;
  participationTypes?: string[];
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;
  // Self-Funding
  isSelfFunding?: boolean;
  selfFundingLevel?: string | null;
  ownerContribution?: number;
  campaignTarget?: number;
}

interface ListCampaignsOptions {
  page: number;
  limit: number;
  search?: string;
  status?: CampaignStatusValue | CampaignStatusValue[];
  mode?: CampaignModeValue;
  authorId?: string;
  fundraiserId?: string;
  categoryId?: string;
  tag?: string;
  campaignTypeId?: string;
  seasonId?: string;
  hierarchyLevel?: string;
  locationId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const campaignInclude = {
  author: {
    select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  fund: {
    select: { id: true, title: true },
  },
  tags: {
    include: { tag: { select: { id: true, name: true, slug: true } } },
  },
  _count: {
    select: { donations: true, pledges: true, comments: true, bookmarks: true },
  },
  // Hierarchy: include parent info (shallow)
  parent: {
    select: { id: true, slug: true, title: true },
  },
  // Hierarchy: include children summary
  children: {
    where: { status: { not: CampaignStatus.ARCHIVED } },
    select: {
      id: true, slug: true, title: true, shortDescription: true,
      goalAmount: true, raisedAmount: true, deadline: true,
      mode: true, featuredImage: true, location: true,
      isSelfFunding: true, selfFundingLevel: true,
      _count: { select: { donations: true, pledges: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  campaignType: {
    select: { id: true, name: true, slug: true, isOpportunity: true, eligibleTiers: true, eligibleLevels: true, parentInitiative: true },
  },
};

// =============================================================================
// Tag Sync
// =============================================================================

async function syncCampaignTags(campaignId: string, tagNames: string[]): Promise<void> {
  if (tagNames.length === 0) {
    // Remove all tags
    await prisma.campaignTag.deleteMany({ where: { campaignId } });
    return;
  }

  // Find or create tags by name
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

// =============================================================================
// CRUD Operations
// =============================================================================

export async function createCampaign(
  authorId: string,
  data: CreateCampaignInput
) {
  // Validate creator type is enabled
  const creatorType = data.creatorType || CampaignCreatorType.ADMIN;
  if (!ENABLED_CAMPAIGN_CREATOR_TYPES.includes(creatorType as CampaignCreatorType)) {
    throw new ForbiddenError(
      `Campaign creation for type '${creatorType}' is not currently enabled`
    );
  }

  const slug = await ensureUniqueSlug(slugify(data.title));

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription,
      description: data.description,
      goalAmount: data.goalAmount,
      deadline: new Date(data.deadline),
      mode: data.mode || CampaignMode.DONATION,
      categoryId: data.categoryId,
      fundId: data.fundId,
      featuredImage: data.featuredImage,
      videoUrl: data.videoUrl,
      platformFee: data.platformFee,
      settings: data.settings ? JSON.stringify(data.settings) : "{}",
      authorId,
      creatorType,
      campaignTypeId: data.campaignTypeId,
      seasonId: data.seasonId,
      status: CampaignStatus.DRAFT,
      // Campaign Hierarchy
      parentId: data.parentId,
      // Campaign Hierarchy Level
      hierarchyLevel: data.hierarchyLevel,
      locationId: data.locationId,
      // Campaign Context
      location: data.location,
      isEvergreen: data.isEvergreen || false,
      participationTypes: data.participationTypes ? JSON.stringify(data.participationTypes) : "[]",
      backerTiersEnabled: data.backerTiersEnabled || false,
      recurringEnabled: data.recurringEnabled || false,
      // Self-Funding
      isSelfFunding: data.isSelfFunding || false,
      selfFundingLevel: data.selfFundingLevel,
      ownerContribution: data.ownerContribution || 0,
      campaignTarget: data.campaignTarget || 0,
    },
    include: campaignInclude,
  });

  // Sync tags if provided
  if (data.tags && data.tags.length > 0) {
    await syncCampaignTags(campaign.id, data.tags);
  }

  // Re-fetch with tags included
  if (data.tags && data.tags.length > 0) {
    return prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: campaignInclude,
    });
  }

  return campaign;
}

export async function getCampaignById(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      ...campaignInclude,
      images: { orderBy: { order: "asc" } },
      rewards: { orderBy: { order: "asc" } },
      collaborators: {
        include: {
          collaborator: {
            select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    throw new NotFoundError("Campaign");
  }

  return campaign;
}

export async function getCampaignBySlug(slug: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      ...campaignInclude,
      images: { orderBy: { order: "asc" } },
      rewards: { orderBy: { order: "asc" } },
    },
  });

  if (!campaign) {
    throw new NotFoundError("Campaign");
  }

  return campaign;
}

export async function listCampaigns(options: ListCampaignsOptions) {
  const {
    page,
    limit,
    search,
    status,
    mode,
    authorId,
    fundraiserId,
    categoryId,
    tag,
    campaignTypeId,
    seasonId,
    hierarchyLevel,
    locationId,
    sortBy = "createdAt",
    sortOrder = "desc",
    includeDeleted = false,
  } = options;

  const where: Prisma.CampaignWhereInput = {};

  if (!includeDeleted) {
    where.status = { not: CampaignStatus.ARCHIVED };
  }

  if (status) {
    // Support single status or array of statuses
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }
  if (mode) where.mode = mode;
  if (authorId) where.authorId = authorId;
  if (fundraiserId) where.fundraiserId = fundraiserId;
  if (categoryId) where.categoryId = categoryId;
  if (campaignTypeId) where.campaignTypeId = campaignTypeId;
  if (seasonId) where.seasonId = seasonId;
  if (hierarchyLevel) where.hierarchyLevel = hierarchyLevel;
  if (locationId) where.locationId = locationId;

  // Tag filtering via CampaignTag relation
  if (tag) {
    where.tags = {
      some: {
        tag: { slug: tag },
      },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { shortDescription: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: campaignInclude,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateCampaign(
  id: string,
  userId: string,
  userRole: string,
  data: UpdateCampaignInput
) {
  const existing = await prisma.campaign.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError("Campaign");
  }

  const access = await canUserManageCampaign(userId, userRole, id);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to update this campaign");
  }

  // If title changed, regenerate slug
  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    slug = await ensureUniqueSlug(slugify(data.title), id);
  }

  const updateData: Prisma.CampaignUpdateInput = {
    ...(data.title && { title: data.title }),
    ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.goalAmount && { goalAmount: data.goalAmount }),
    ...(data.deadline && { deadline: new Date(data.deadline) }),
    ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    ...(data.fundId !== undefined && { fundId: data.fundId }),
    ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
    ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
    ...(data.platformFee !== undefined && { platformFee: data.platformFee }),
    ...(data.settings && { settings: JSON.stringify(data.settings) }),
    slug,
    // Campaign Hierarchy
    ...(data.parentId !== undefined && { parentId: data.parentId }),
    // Campaign Hierarchy Level
    ...(data.hierarchyLevel !== undefined && { hierarchyLevel: data.hierarchyLevel }),
    ...(data.locationId !== undefined && { locationId: data.locationId }),
    // Campaign Context
    ...(data.location !== undefined && { location: data.location }),
    ...(data.isEvergreen !== undefined && { isEvergreen: data.isEvergreen }),
    ...(data.participationTypes !== undefined && { participationTypes: JSON.stringify(data.participationTypes) }),
    ...(data.backerTiersEnabled !== undefined && { backerTiersEnabled: data.backerTiersEnabled }),
    ...(data.recurringEnabled !== undefined && { recurringEnabled: data.recurringEnabled }),
    // Self-Funding
    ...(data.isSelfFunding !== undefined && { isSelfFunding: data.isSelfFunding }),
    ...(data.selfFundingLevel !== undefined && { selfFundingLevel: data.selfFundingLevel }),
    ...(data.ownerContribution !== undefined && { ownerContribution: data.ownerContribution }),
    ...(data.campaignTarget !== undefined && { campaignTarget: data.campaignTarget }),
  };

  const campaign = await prisma.campaign.update({
    where: { id },
    data: updateData,
    include: campaignInclude,
  });

  // Sync tags if provided
  if (data.tags !== undefined) {
    await syncCampaignTags(id, data.tags);
    // Re-fetch with updated tags
    return prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
  }

  return campaign;
}

export async function deleteCampaign(id: string, userId: string, userRole: string) {
  const existing = await prisma.campaign.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError("Campaign");
  }

  const access = await canUserManageCampaign(userId, userRole, id);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to delete this campaign");
  }

  // Soft delete - move to trash
  await prisma.campaign.update({
    where: { id },
    data: { status: CampaignStatus.ARCHIVED },
  });
}

// =============================================================================
// Status Management — uses canonical VALID_STATUS_TRANSITIONS from @fundordonate/types
// =============================================================================

export async function updateCampaignStatus(
  id: string,
  userId: string,
  userRole: string,
  newStatus: CampaignStatusValue,
  rejectionReason?: string
) {
  const existing = await prisma.campaign.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError("Campaign");
  }

  const currentStatus = existing.status as CampaignStatusValue;

  // Validate transition using canonical transition map
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new AppError(
      400,
      `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedTransitions?.join(", ") || "none"}`
    );
  }

  // Validate actor using canonical actor rules
  const allowedActors = STATUS_TRANSITION_ACTORS[newStatus];
  if (allowedActors && !allowedActors.includes(userRole as RoleValue)) {
    throw new ForbiddenError(
      `Role "${userRole}" cannot transition to "${newStatus}". Required: ${allowedActors.join(" or ")}`
    );
  }

  // Enforce ownership for non-admin actors: a fundraiser/collaborator may only
  // transition status on campaigns they author or collaborate on. Admins bypass
  // this check (handled inside canUserManageCampaign).
  const access = await canUserManageCampaign(userId, userRole, id);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to change this campaign's status");
  }

  // Build update data with metadata timestamps
  const updatePayload: Prisma.CampaignUpdateInput = { status: newStatus };

  switch (newStatus) {
    case CampaignStatus.SUBMITTED:
      updatePayload.submittedAt = new Date();
      break;
    case CampaignStatus.APPROVED:
      updatePayload.approvedById = userId;
      updatePayload.approvedAt = new Date();
      break;
    case CampaignStatus.REJECTED:
      updatePayload.rejectedAt = new Date();
      if (rejectionReason) {
        updatePayload.rejectionReason = rejectionReason;
      }
      break;
    case CampaignStatus.PUBLISHED:
      updatePayload.publishedById = userId;
      updatePayload.publishedAt = new Date();
      break;
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: updatePayload,
    include: campaignInclude,
  });

  return campaign;
}

// =============================================================================
// Bulk Actions
// =============================================================================

export async function bulkAction(
  ids: string[],
  action: "publish" | "archive" | "delete" | "restore",
  userRole: string
) {
  if (userRole !== Role.ADMIN) {
    throw new ForbiddenError("Only admins can perform bulk actions");
  }

  let statusUpdate: CampaignStatusValue | undefined;

  switch (action) {
    case "publish":
      statusUpdate = CampaignStatus.PUBLISHED;
      break;
    case "archive":
      statusUpdate = CampaignStatus.ARCHIVED;
      break;
    case "delete":
      statusUpdate = CampaignStatus.ARCHIVED;
      break;
    case "restore":
      statusUpdate = CampaignStatus.DRAFT;
      break;
  }

  const result = await prisma.campaign.updateMany({
    where: { id: { in: ids } },
    data: { status: statusUpdate },
  });

  return { affected: result.count, action };
}

// =============================================================================
// Trash Management
// =============================================================================

export async function getTrashCampaigns(page: number, limit: number) {
  const where: Prisma.CampaignWhereInput = {
    status: CampaignStatus.ARCHIVED,
  };

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: campaignInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function restoreCampaign(id: string) {
  const existing = await prisma.campaign.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError("Campaign");
  }

  if (existing.status !== CampaignStatus.ARCHIVED) {
    throw new AppError(400, "Campaign is not in trash");
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status: CampaignStatus.DRAFT },
    include: campaignInclude,
  });

  return campaign;
}

export async function emptyTrash(ids?: string[]) {
  const where: Prisma.CampaignWhereInput = ids
    ? { id: { in: ids }, status: CampaignStatus.ARCHIVED }
    : { status: CampaignStatus.ARCHIVED };

  const result = await prisma.campaign.deleteMany({ where });

  return { deleted: result.count };
}

// =============================================================================
// Image Management
// =============================================================================

export async function addCampaignImage(
  campaignId: string,
  userId: string,
  userRole: string,
  imageData: { url: string; alt?: string }
) {
  const access = await canUserManageCampaign(userId, userRole, campaignId);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to add images to this campaign");
  }

  // Get the next order number
  const lastImage = await prisma.campaignImage.findFirst({
    where: { campaignId },
    orderBy: { order: "desc" },
  });

  const image = await prisma.campaignImage.create({
    data: {
      campaignId,
      url: imageData.url,
      alt: imageData.alt,
      order: (lastImage?.order ?? -1) + 1,
    },
  });

  return image;
}

export async function removeCampaignImage(
  imageId: string,
  userId: string,
  userRole: string
) {
  const image = await prisma.campaignImage.findUnique({
    where: { id: imageId },
    include: { campaign: { select: { id: true } } },
  });

  if (!image) {
    throw new NotFoundError("Image");
  }

  const access = await canUserManageCampaign(userId, userRole, image.campaign.id);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to remove images from this campaign");
  }

  await prisma.campaignImage.delete({ where: { id: imageId } });
}

// =============================================================================
// Featured Campaigns
// =============================================================================

export async function getFeaturedCampaigns(limit = 6) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: CampaignStatus.PUBLISHED,
    },
    include: campaignInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return campaigns;
}

// =============================================================================
// Campaign Hierarchy — parent/child relationships
// =============================================================================

export async function getCampaignChildren(parentId: string) {
  const children = await prisma.campaign.findMany({
    where: { parentId, status: { not: CampaignStatus.ARCHIVED } },
    include: {
      ...campaignInclude,
    },
    orderBy: { createdAt: "desc" },
  });
  return children;
}

export async function getCampaignParent(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { parentId: true },
  });

  if (!campaign?.parentId) return null;

  const parent = await prisma.campaign.findUnique({
    where: { id: campaign.parentId },
    include: campaignInclude,
  });

  return parent;
}

export async function getHierarchyTree(rootId: string) {
  const root = await prisma.campaign.findUnique({
    where: { id: rootId },
    include: {
      ...campaignInclude,
      children: {
        where: { status: { not: CampaignStatus.ARCHIVED } },
        include: {
          ...campaignInclude,
          children: {
            where: { status: { not: CampaignStatus.ARCHIVED } },
            include: campaignInclude,
          },
        },
      },
    },
  });

  return root;
}

// =============================================================================
// Opportunity Filtering — campaign types with isOpportunity
// =============================================================================

export async function listOpportunityTypes() {
  const types = await prisma.campaignType.findMany({
    where: { isOpportunity: true, status: "active" },
    orderBy: { order: "asc" },
  });
  return types;
}

export async function listCampaignsByOpportunity(
  opportunityTypeSlug: string,
  options: { page: number; limit: number; status?: CampaignStatusValue | CampaignStatusValue[] }
) {
  const { page, limit, status = CampaignStatus.PUBLISHED } = options;

  const opportunityType = await prisma.campaignType.findUnique({
    where: { slug: opportunityTypeSlug },
  });

  if (!opportunityType || !opportunityType.isOpportunity) {
    throw new NotFoundError("Opportunity type");
  }

  const where: Prisma.CampaignWhereInput = {
    campaignTypeId: opportunityType.id,
    status: Array.isArray(status) ? { in: status } : status,
  };

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    opportunityType,
  };
}

// =============================================================================
// Self-Funding — campaigns with owner contribution
// =============================================================================

export async function listSelfFundingCampaigns(
  options: { page: number; limit: number; level?: string }
) {
  const { page, limit, level } = options;

  const where: Prisma.CampaignWhereInput = {
    isSelfFunding: true,
    status: CampaignStatus.PUBLISHED,
  };

  if (level) {
    where.selfFundingLevel = level;
  }

  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// =============================================================================
// Enhanced List — supports new filter params
// =============================================================================

export async function listCampaignsEnhanced(options: ListCampaignsOptions & {
  parentId?: string;
  isEvergreen?: boolean;
  isSelfFunding?: boolean;
  selfFundingLevel?: string;
  location?: string;
}) {
  const {
    parentId,
    isEvergreen,
    isSelfFunding,
    selfFundingLevel,
    location,
    ...baseOptions
  } = options;

  // Start with base query
  const result = await listCampaigns(baseOptions);

  // Apply additional filters to the existing results
  // (SQLite doesn't support all Prisma filters cleanly, so we filter post-query for these)
  let filteredItems = result.items;

  if (parentId !== undefined) {
    filteredItems = filteredItems.filter((c: any) => parentId ? c.parentId === parentId : !c.parentId);
  }
  if (isEvergreen !== undefined) {
    filteredItems = filteredItems.filter((c: any) => c.isEvergreen === isEvergreen);
  }
  if (isSelfFunding !== undefined) {
    filteredItems = filteredItems.filter((c: any) => c.isSelfFunding === isSelfFunding);
  }
  if (selfFundingLevel) {
    filteredItems = filteredItems.filter((c: any) => c.selfFundingLevel === selfFundingLevel);
  }
  if (location) {
    filteredItems = filteredItems.filter((c: any) =>
      c.location?.toLowerCase().includes(location.toLowerCase())
    );
  }

  return {
    ...result,
    items: filteredItems,
  };
}
