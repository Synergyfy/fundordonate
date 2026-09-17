// =============================================================================
// Backend Stub — Campaign Template Service
// Placeholder for backend developer to implement.
// Manages campaign templates and instantiation.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get all campaign templates.
 */
export async function getTemplates(filters?: { type?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;

  return prisma.campaignTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single campaign template by ID.
 */
export async function getTemplate(templateId: string) {
  return prisma.campaignTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: { instances: true },
  });
}

/**
 * Create a new campaign template.
 */
export async function createTemplate(data: {
  type: string;
  title: string;
  description?: string;
  shortDescription?: string;
  mode: string;
  categorySlug?: string;
  goalAmount: number;
  deadlineDays: number;
  contentStructure?: Record<string, unknown>;
  benefitsConfig?: Record<string, unknown>;
  rewardConfig?: Record<string, unknown>;
  createdBy?: string;
}) {
  return prisma.campaignTemplate.create({
    data: {
      ...data,
      status: "DRAFT",
      instantiatedCount: 0,
    },
  });
}

/**
 * Update a campaign template.
 */
export async function updateTemplate(templateId: string, data: Partial<{
  title: string;
  description: string;
  shortDescription: string;
  goalAmount: number;
  deadlineDays: number;
  contentStructure: Record<string, unknown>;
  benefitsConfig: Record<string, unknown>;
  rewardConfig: Record<string, unknown>;
  status: string;
}>) {
  return prisma.campaignTemplate.update({
    where: { id: templateId },
    data,
  });
}

/**
 * Instantiate a campaign from a template.
 * Creates a new campaign based on the template configuration.
 */
export async function instantiateTemplate(
  templateId: string,
  locationId: string,
  locationName: string,
  customizations?: {
    title?: string;
    description?: string;
    goalAmount?: number;
    deadline?: string;
  }
) {
  const template = await prisma.campaignTemplate.findUniqueOrThrow({
    where: { id: templateId },
  });

  // Create the campaign from template
  const campaign = await prisma.campaign.create({
    data: {
      title: customizations?.title || `${template.title} — ${locationName}`,
      description: customizations?.description || template.description || "",
      shortDescription: template.shortDescription || "",
      mode: template.mode,
      goalAmount: customizations?.goalAmount || template.goalAmount,
      deadline: customizations?.deadline || new Date(Date.now() + template.deadlineDays * 24 * 60 * 60 * 1000).toISOString(),
      status: "DRAFT",
      locationId,
      hierarchyLevel: template.type.includes("city")
        ? "city"
        : template.type.includes("borough")
        ? "borough"
        : template.type.includes("high_street")
        ? "high_street"
        : "national",
      // Additional template fields would be spread here
    } as any,
  });

  // Create template instance record
  await prisma.campaignTemplateInstance.create({
    data: {
      templateId,
      campaignId: campaign.id,
      locationId,
      locationName,
      instantiatedAt: new Date(),
    },
  });

  // Update template instantiated count
  await prisma.campaignTemplate.update({
    where: { id: templateId },
    data: { instantiatedCount: { increment: 1 } },
  });

  return campaign;
}

/**
 * Get instances of a template.
 */
export async function getTemplateInstances(templateId: string) {
  return prisma.campaignTemplateInstance.findMany({
    where: { templateId },
    include: { campaign: true },
    orderBy: { instantiatedAt: "desc" },
  });
}

/**
 * Delete a template (soft delete - archive it).
 */
export async function archiveTemplate(templateId: string) {
  return prisma.campaignTemplate.update({
    where: { id: templateId },
    data: { status: "ARCHIVED" },
  });
}
