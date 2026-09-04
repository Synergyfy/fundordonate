import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError } from "../middleware/errorHandler";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =============================================================================
// Categories
// =============================================================================

export async function createCategory(data: { name: string; description?: string; image?: string; order?: number }) {
  const slug = generateSlug(data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ForbiddenError("Category with this name already exists");

  return prisma.category.create({
    data: { ...data, slug },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { campaigns: true } } },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { campaigns: true } } },
  });
  if (!category) throw new NotFoundError("Category");
  return category;
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { campaigns: true } } },
  });
  if (!category) throw new NotFoundError("Category");
  return category;
}

export async function updateCategory(id: string, data: { name?: string; description?: string; image?: string; order?: number }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category");

  const updateData: Record<string, any> = { ...data };
  if (data.name) {
    updateData.slug = generateSlug(data.name);
    // Check uniqueness of new slug
    const existing = await prisma.category.findFirst({
      where: { slug: updateData.slug, id: { not: id } },
    });
    if (existing) throw new ForbiddenError("Category with this name already exists");
  }

  return prisma.category.update({ where: { id }, data: updateData });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { campaigns: true } } },
  });
  if (!category) throw new NotFoundError("Category");
  if (category._count.campaigns > 0) {
    throw new ForbiddenError("Cannot delete category with active campaigns. Reassign them first.");
  }

  await prisma.category.delete({ where: { id } });
}

// =============================================================================
// Tags
// =============================================================================

export async function createTag(data: { name: string }) {
  const slug = generateSlug(data.name);
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) throw new ForbiddenError("Tag already exists");

  return prisma.tag.create({ data: { name: data.name, slug } });
}

export async function getTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { campaignTags: true } } },
  });
}

export async function getTagById(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { campaignTags: true } } },
  });
  if (!tag) throw new NotFoundError("Tag");
  return tag;
}

export async function updateTag(id: string, data: { name: string }) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag");

  const slug = generateSlug(data.name);
  const existing = await prisma.tag.findFirst({
    where: { slug, id: { not: id } },
  });
  if (existing) throw new ForbiddenError("Tag already exists");

  return prisma.tag.update({ where: { id }, data: { name: data.name, slug } });
}

export async function deleteTag(id: string) {
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { campaignTags: true } } },
  });
  if (!tag) throw new NotFoundError("Tag");
  if (tag._count.campaignTags > 0) {
    throw new ForbiddenError("Cannot delete tag with active campaigns. Remove it from campaigns first.");
  }

  await prisma.tag.delete({ where: { id } });
}

export async function searchTags(query: string) {
  return prisma.tag.findMany({
    where: { name: { contains: query } },
    take: 20,
  });
}

// =============================================================================
// Campaign-Tag Assignment
// =============================================================================

export async function addTagToCampaign(campaignId: string, tagId: string) {
  const existing = await prisma.campaignTag.findUnique({
    where: { campaignId_tagId: { campaignId, tagId } },
  });
  if (existing) return existing;

  return prisma.campaignTag.create({ data: { campaignId, tagId } });
}

export async function removeTagFromCampaign(campaignId: string, tagId: string) {
  await prisma.campaignTag.delete({
    where: { campaignId_tagId: { campaignId, tagId } },
  });
}

export async function syncCampaignTags(campaignId: string, tagNames: string[]) {
  // Find or create tags by name
  const tags = await Promise.all(
    tagNames.map(async (name) => {
      const slug = generateSlug(name);
      let tag = await prisma.tag.findUnique({ where: { slug } });
      if (!tag) {
        tag = await prisma.tag.create({ data: { name, slug } });
      }
      return tag;
    })
  );

  // Sync tags
  const existingTags = await prisma.campaignTag.findMany({
    where: { campaignId },
    select: { tagId: true },
  });
  const existingTagIds = new Set(existingTags.map((t) => t.tagId));
  const newTagIds = new Set(tags.map((t) => t.id));

  // Remove tags not in new list
  for (const tagId of existingTagIds) {
    if (!newTagIds.has(tagId)) {
      await prisma.campaignTag.delete({
        where: { campaignId_tagId: { campaignId, tagId } },
      });
    }
  }

  // Add new tags
  for (const tag of tags) {
    if (!existingTagIds.has(tag.id)) {
      await prisma.campaignTag.create({ data: { campaignId, tagId: tag.id } });
    }
  }

  return tags;
}
