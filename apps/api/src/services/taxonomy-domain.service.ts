// =============================================================================
// FundOrDonate — Taxonomy Domain Service
// Manages categories, tags, campaign types, seasons, groups, collections, events.
// All data is admin-configurable. Nothing is hardcoded.
// =============================================================================

import { prisma } from "../lib/prisma";
import { CampaignTypeStatus, SeasonStatus, slugify } from "@fundordonate/types";
import { NotFoundError } from "../middleware/errorHandler";

// =============================================================================
// Categories
// =============================================================================

export async function createCategory(data: { name: string; description?: string; image?: string; order?: number }) {
  const slug = await ensureUniqueSlug(slugify(data.name), "category");
  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      image: data.image,
      order: data.order ?? 0,
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
}

export async function getCategoryById(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new NotFoundError("Category");
  return cat;
}

export async function updateCategory(id: string, data: { name?: string; description?: string; image?: string; order?: number }) {
  await getCategoryById(id);
  const updateData: Record<string, unknown> = { ...data };
  if (data.name) {
    updateData.slug = await ensureUniqueSlug(slugify(data.name), "category");
  }
  return prisma.category.update({ where: { id }, data: updateData });
}

export async function deleteCategory(id: string) {
  await getCategoryById(id);
  return prisma.category.delete({ where: { id } });
}

// =============================================================================
// Tags
// =============================================================================

export async function createTag(data: { name: string }) {
  const slug = await ensureUniqueSlug(slugify(data.name), "tag");
  return prisma.tag.create({ data: { name: data.name, slug } });
}

export async function getTags() {
  return prisma.tag.findMany();
}

export async function getTagById(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag");
  return tag;
}

export async function updateTag(id: string, data: { name: string }) {
  await getTagById(id);
  return prisma.tag.update({
    where: { id },
    data: { name: data.name, slug: await ensureUniqueSlug(slugify(data.name), "tag") },
  });
}

export async function deleteTag(id: string) {
  await getTagById(id);
  return prisma.tag.delete({ where: { id } });
}

export async function searchTags(query: string, limit = 20) {
  return prisma.tag.findMany({
    where: { name: { contains: query } },
    take: limit,
  });
}

// =============================================================================
// Campaign Types
// =============================================================================

export async function createCampaignType(data: { name: string; description?: string; status?: CampaignTypeStatus }) {
  const slug = await ensureUniqueSlug(slugify(data.name), "campaign_type");
  return prisma.campaignType.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      status: data.status || CampaignTypeStatus.ACTIVE,
    },
  });
}

export async function getCampaignTypes(filters?: { status?: CampaignTypeStatus }) {
  const where = filters?.status ? { status: filters.status } : {};
  return prisma.campaignType.findMany({ where, orderBy: { name: "asc" } });
}

// =============================================================================
// Campaign Seasons
// =============================================================================

export async function createCampaignSeason(data: {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: SeasonStatus;
}) {
  const slug = await ensureUniqueSlug(slugify(data.name), "campaign_season");
  return prisma.campaignSeason.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || SeasonStatus.UPCOMING,
    },
  });
}

export async function getCampaignSeasons(filters?: { status?: SeasonStatus }) {
  const where = filters?.status ? { status: filters.status } : {};
  return prisma.campaignSeason.findMany({ where, orderBy: { startDate: "desc" } });
}

// =============================================================================
// Campaign Groups
// =============================================================================

export async function createCampaignGroup(data: { name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(data.name), "campaign_group");
  return prisma.campaignGroup.create({
    data: { name: data.name, slug, description: data.description },
  });
}

export async function getCampaignGroups() {
  return prisma.campaignGroup.findMany();
}

export async function addCampaignToGroup(campaignId: string, groupId: string) {
  return prisma.campaignGroupMembership.create({
    data: { campaignId, groupId },
  });
}

export async function removeCampaignFromGroup(campaignId: string, groupId: string) {
  return prisma.campaignGroupMembership.deleteMany({
    where: { campaignId, groupId },
  });
}

// =============================================================================
// Campaign Collections
// =============================================================================

export async function createCampaignCollection(data: { name: string; description?: string }) {
  const slug = await ensureUniqueSlug(slugify(data.name), "campaign_collection");
  return prisma.campaignCollection.create({
    data: { name: data.name, slug, description: data.description },
  });
}

export async function getCampaignCollections() {
  return prisma.campaignCollection.findMany();
}

// =============================================================================
// Campaign Events
// =============================================================================

export async function createCampaignEvent(data: {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const slug = await ensureUniqueSlug(slugify(data.name), "campaign_event");
  return prisma.campaignEvent.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
}

export async function getCampaignEvents() {
  return prisma.campaignEvent.findMany({ orderBy: { startDate: "desc" } });
}

// =============================================================================
// Slug Helpers
// =============================================================================

async function ensureUniqueSlug(baseSlug: string, entityType: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const modelMap: Record<string, { findUnique: (args: any) => Promise<any> }> = {
      category: prisma.category,
      tag: prisma.tag,
      campaign_type: prisma.campaignType,
      campaign_season: prisma.campaignSeason,
      campaign_group: prisma.campaignGroup,
      campaign_collection: prisma.campaignCollection,
      campaign_event: prisma.campaignEvent,
    };

    const model = modelMap[entityType];
    if (!model) break;

    const existing = await model.findUnique({ where: { slug } });
    if (!existing) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
