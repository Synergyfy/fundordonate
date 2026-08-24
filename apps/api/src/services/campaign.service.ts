import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError, NotFoundError, ForbiddenError } from "../middleware/errorHandler";

// =============================================================================
// Types
// =============================================================================

type CampaignStatus = "draft" | "pending_review" | "published" | "ended" | "archived";
type CampaignMode = "donation" | "crowdfunding";

interface CreateCampaignInput {
  title: string;
  shortDescription?: string;
  description?: string;
  goalAmount: number;
  deadline: Date | string;
  mode?: CampaignMode;
  categoryId?: string;
  fundId?: string;
  featuredImage?: string;
  videoUrl?: string;
  platformFee?: number;
  settings?: Record<string, unknown>;
}

interface UpdateCampaignInput {
  title?: string;
  shortDescription?: string;
  description?: string;
  goalAmount?: number;
  deadline?: Date | string;
  status?: CampaignStatus;
  categoryId?: string;
  fundId?: string;
  featuredImage?: string;
  videoUrl?: string;
  platformFee?: number;
  settings?: Record<string, unknown>;
}

interface ListCampaignsOptions {
  page: number;
  limit: number;
  search?: string;
  status?: CampaignStatus;
  mode?: CampaignMode;
  authorId?: string;
  fundraiserId?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let counter = 1;

  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }

    candidate = `${slug}-${counter}`;
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
  _count: {
    select: { donations: true, pledges: true, comments: true, bookmarks: true },
  },
};

// =============================================================================
// CRUD Operations
// =============================================================================

export async function createCampaign(
  authorId: string,
  data: CreateCampaignInput
) {
  const slug = await ensureUniqueSlug(generateSlug(data.title));

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription,
      description: data.description,
      goalAmount: data.goalAmount,
      deadline: new Date(data.deadline),
      mode: data.mode || "donation",
      categoryId: data.categoryId,
      fundId: data.fundId,
      featuredImage: data.featuredImage,
      videoUrl: data.videoUrl,
      platformFee: data.platformFee,
      settings: data.settings ? JSON.stringify(data.settings) : "{}",
      authorId,
      status: "draft",
    },
    include: campaignInclude,
  });

  return campaign;
}

export async function getCampaignById(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      ...campaignInclude,
      images: { orderBy: { order: "asc" } },
      rewards: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
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
      tags: { include: { tag: true } },
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
    sortBy = "createdAt",
    sortOrder = "desc",
    includeDeleted = false,
  } = options;

  const where: Prisma.CampaignWhereInput = {};

  if (!includeDeleted) {
    where.status = { not: "archived" };
  }

  if (status) where.status = status;
  if (mode) where.mode = mode;
  if (authorId) where.authorId = authorId;
  if (fundraiserId) where.fundraiserId = fundraiserId;
  if (categoryId) where.categoryId = categoryId;

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

  // Only author or admin can update
  if (existing.authorId !== userId && userRole !== "admin") {
    throw new ForbiddenError("You can only edit your own campaigns");
  }

  // If title changed, regenerate slug
  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    slug = await ensureUniqueSlug(generateSlug(data.title), id);
  }

  const updateData: Prisma.CampaignUpdateInput = {
    ...(data.title && { title: data.title }),
    ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.goalAmount && { goalAmount: data.goalAmount }),
    ...(data.deadline && { deadline: new Date(data.deadline) }),
    ...(data.status && { status: data.status }),
    ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    ...(data.fundId !== undefined && { fundId: data.fundId }),
    ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
    ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
    ...(data.platformFee !== undefined && { platformFee: data.platformFee }),
    ...(data.settings && { settings: JSON.stringify(data.settings) }),
    slug,
  };

  const campaign = await prisma.campaign.update({
    where: { id },
    data: updateData,
    include: campaignInclude,
  });

  return campaign;
}

export async function deleteCampaign(id: string, userId: string, userRole: string) {
  const existing = await prisma.campaign.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError("Campaign");
  }

  if (existing.authorId !== userId && userRole !== "admin") {
    throw new ForbiddenError("You can only delete your own campaigns");
  }

  // Soft delete - move to trash
  await prisma.campaign.update({
    where: { id },
    data: { status: "archived" },
  });
}

// =============================================================================
// Status Management
// =============================================================================

export async function updateCampaignStatus(
  id: string,
  userId: string,
  userRole: string,
  newStatus: CampaignStatus
) {
  const existing = await prisma.campaign.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError("Campaign");
  }

  // Only admin can change status to published/ended
  if ((newStatus === "published" || newStatus === "ended") && userRole !== "admin") {
    throw new ForbiddenError("Only admins can publish or end campaigns");
  }

  // Author can submit for review
  if (newStatus === "pending_review" && existing.authorId !== userId && userRole !== "admin") {
    throw new ForbiddenError("You can only submit your own campaigns for review");
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status: newStatus },
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
  if (userRole !== "admin") {
    throw new ForbiddenError("Only admins can perform bulk actions");
  }

  let statusUpdate: CampaignStatus | undefined;

  switch (action) {
    case "publish":
      statusUpdate = "published";
      break;
    case "archive":
      statusUpdate = "archived";
      break;
    case "delete":
      statusUpdate = "archived";
      break;
    case "restore":
      statusUpdate = "draft";
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
    status: "archived",
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

  if (existing.status !== "archived") {
    throw new AppError(400, "Campaign is not in trash");
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status: "draft" },
    include: campaignInclude,
  });

  return campaign;
}

export async function emptyTrash(ids?: string[]) {
  const where: Prisma.CampaignWhereInput = ids
    ? { id: { in: ids }, status: "archived" }
    : { status: "archived" };

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
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

  if (!campaign) {
    throw new NotFoundError("Campaign");
  }

  if (campaign.authorId !== userId && userRole !== "admin") {
    throw new ForbiddenError("You can only add images to your own campaigns");
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
    include: { campaign: { select: { authorId: true } } },
  });

  if (!image) {
    throw new NotFoundError("Image");
  }

  if (image.campaign.authorId !== userId && userRole !== "admin") {
    throw new ForbiddenError("You can only remove images from your own campaigns");
  }

  await prisma.campaignImage.delete({ where: { id: imageId } });
}

// =============================================================================
// Featured Campaigns
// =============================================================================

export async function getFeaturedCampaigns(limit = 6) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "published",
    },
    include: campaignInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return campaigns;
}
