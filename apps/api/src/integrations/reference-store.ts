// =============================================================================
// External Reference Store
// Manages the ExternalReference model for cross-system ID mapping
// =============================================================================

import { prisma } from "../lib/prisma";
import type {
  IntegrationProvider,
  IntegrationEntityType,
  IntegrationStatus,
} from "./types";

// =============================================================================
// Types
// =============================================================================

export interface CreateExternalReferenceInput {
  provider: IntegrationProvider;
  entityType: IntegrationEntityType;
  entityId: string;
  externalId: string;
  externalData?: Record<string, unknown>;
  status: IntegrationStatus;
}

export interface IntegrationResult {
  success: boolean;
  referenceId?: string;
  note?: string;
  error?: string;
}

// =============================================================================
// Core Functions
// =============================================================================

export async function createExternalReference(
  input: CreateExternalReferenceInput
): Promise<{ id: string }> {
  const ref = await prisma.externalReference.create({
    data: {
      provider: input.provider,
      entityType: input.entityType,
      entityId: input.entityId,
      externalId: input.externalId,
      externalData: JSON.stringify(input.externalData || {}),
      status: input.status,
    },
  });

  return { id: ref.id };
}

export async function getExternalReference(
  provider: IntegrationProvider,
  entityType: IntegrationEntityType,
  entityId: string
): Promise<{ id: string; externalId: string; externalData: Record<string, unknown>; status: string } | null> {
  const ref = await prisma.externalReference.findUnique({
    where: {
      provider_entityType_entityId: {
        provider,
        entityType,
        entityId,
      },
    },
  });

  if (!ref) return null;

  return {
    id: ref.id,
    externalId: ref.externalId,
    externalData: JSON.parse(ref.externalData),
    status: ref.status,
  };
}

export async function getExternalReferenceByExternalId(
  provider: IntegrationProvider,
  entityType: IntegrationEntityType,
  externalId: string
): Promise<{ id: string; entityId: string; externalData: Record<string, unknown>; status: string } | null> {
  const ref = await prisma.externalReference.findUnique({
    where: {
      provider_entityType_externalId: {
        provider,
        entityType,
        externalId,
      },
    },
  });

  if (!ref) return null;

  return {
    id: ref.id,
    entityId: ref.entityId,
    externalData: JSON.parse(ref.externalData),
    status: ref.status,
  };
}

export async function updateExternalReferenceStatus(
  provider: IntegrationProvider,
  entityType: IntegrationEntityType,
  entityId: string,
  status: IntegrationStatus
): Promise<void> {
  await prisma.externalReference.updateMany({
    where: {
      provider,
      entityType,
      entityId,
    },
    data: { status },
  });
}

export async function getAllExternalReferences(
  entityType: IntegrationEntityType,
  entityId: string
): Promise<Array<{
  id: string;
  provider: string;
  externalId: string;
  externalData: Record<string, unknown>;
  status: string;
}>> {
  const refs = await prisma.externalReference.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: "desc" },
  });

  return refs.map((ref) => ({
    id: ref.id,
    provider: ref.provider,
    externalId: ref.externalId,
    externalData: JSON.parse(ref.externalData),
    status: ref.status,
  }));
}

export async function removeExternalReference(
  provider: IntegrationProvider,
  entityType: IntegrationEntityType,
  entityId: string
): Promise<void> {
  await prisma.externalReference.updateMany({
    where: {
      provider,
      entityType,
      entityId,
    },
    data: { status: "revoked" },
  });
}
