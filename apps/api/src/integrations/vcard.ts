// =============================================================================
// VCard E-Card Integration Adapter
// Manages E-cards linked to donations and reward redemptions
// =============================================================================

import { prisma } from "../lib/prisma";
import type {
  VCardConfig,
  VCardEcardRequest,
  VCardEcardResponse,
  VCardEcardStatus,
} from "./types";
import { createExternalReference } from "./reference-store";

const getConfig = (): VCardConfig => ({
  baseUrl: process.env.MCOM_VCARD_URL || "",
  apiVersion: process.env.MCOM_VCARD_API_VERSION || "v1",
  apiKey: process.env.MCOM_VCARD_API_KEY || "",
  enabled: process.env.MCOM_VCARD_ENABLED === "true",
});

// =============================================================================
// Mock Adapter
// =============================================================================

export const vcardMockAdapter = {
  isConfigured: (): boolean => getConfig().enabled,

  async createEcard(request: VCardEcardRequest): Promise<VCardEcardResponse> {
    if (!getConfig().enabled) {
      return { success: false, error: "VCard integration is not enabled" };
    }

    // MOCK: Generate a fake ecard ID
    const ecardId = `vc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store the mapping
    await createExternalReference({
      provider: "vcard",
      entityType: "ecard",
      entityId: request.rewardId,
      externalId: ecardId,
      externalData: {
        campaignId: request.campaignId,
        donorUserId: request.donorUserId,
        statedValue: request.statedValue,
        benefitValue: request.benefitValue,
        currency: request.currency,
        idempotencyKey: request.idempotencyKey,
      },
      status: "active",
    });

    return { success: true, ecardId, status: "active" };
  },

  async getStatus(ecardId: string): Promise<VCardEcardStatus> {
    if (!getConfig().enabled) {
      return { ecardId, status: "failed" };
    }

    // MOCK: Return active status
    return {
      ecardId,
      status: "active",
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  },

  async revokeEcard(ecardId: string): Promise<{ success: boolean; error?: string }> {
    if (!getConfig().enabled) {
      return { success: false, error: "VCard integration is not enabled" };
    }

    // Update the external reference status
    const ref = await prisma.externalReference.findFirst({
      where: {
        provider: "vcard",
        entityType: "ecard",
        externalId: ecardId,
      },
    });

    if (ref) {
      await prisma.externalReference.update({
        where: { id: ref.id },
        data: { status: "revoked" },
      });
    }

    return { success: true };
  },

  async getEcardUrl(ecardId: string, message?: string): Promise<string | null> {
    if (!getConfig().enabled) {
      return null;
    }

    const config = getConfig();
    const params = new URLSearchParams({ id: ecardId });
    if (message) params.set("message", message);
    return `${config.baseUrl}/${config.apiVersion}/ecard?${params.toString()}`;
  },
};

// =============================================================================
// Production Adapter (requires real MCOM VCard API)
// =============================================================================

export const vcardProductionAdapter = {
  isConfigured: (): boolean => {
    const config = getConfig();
    return config.enabled && !!(config.baseUrl && config.apiKey);
  },

  async createEcard(request: VCardEcardRequest): Promise<VCardEcardResponse> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/ecards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        campaignId: request.campaignId,
        rewardId: request.rewardId,
        donorUserId: request.donorUserId,
        statedValue: request.statedValue,
        benefitValue: request.benefitValue,
        currency: request.currency,
        idempotencyKey: request.idempotencyKey,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json() as { ecardId: string; status: string };

    // Store the mapping
    await createExternalReference({
      provider: "vcard",
      entityType: "ecard",
      entityId: request.rewardId,
      externalId: data.ecardId,
      externalData: {
        campaignId: request.campaignId,
        donorUserId: request.donorUserId,
        statedValue: request.statedValue,
        benefitValue: request.benefitValue,
        currency: request.currency,
        idempotencyKey: request.idempotencyKey,
      },
      status: data.status as "active",
    });

    return { success: true, ecardId: data.ecardId, status: data.status };
  },

  async getStatus(ecardId: string): Promise<VCardEcardStatus> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/ecards/${ecardId}/status`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return { ecardId, status: "failed" };
    }

    return response.json() as Promise<VCardEcardStatus>;
  },

  async revokeEcard(ecardId: string): Promise<{ success: boolean; error?: string }> {
    const config = getConfig();
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/ecards/${ecardId}/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return vcardMockAdapter.revokeEcard(ecardId);
  },

  async getEcardUrl(ecardId: string, message?: string): Promise<string | null> {
    const config = getConfig();
    const params = new URLSearchParams({ id: ecardId });
    if (message) params.set("message", message);
    return `${config.baseUrl}/${config.apiVersion}/ecard?${params.toString()}`;
  },
};

// =============================================================================
// Active Adapter
// =============================================================================

export const vcardAdapter = {
  isConfigured: (): boolean => vcardProductionAdapter.isConfigured(),

  async createEcard(request: VCardEcardRequest): Promise<VCardEcardResponse> {
    if (!vcardProductionAdapter.isConfigured()) {
      return vcardMockAdapter.createEcard(request);
    }
    return vcardProductionAdapter.createEcard(request);
  },

  async getStatus(ecardId: string): Promise<VCardEcardStatus> {
    if (!vcardProductionAdapter.isConfigured()) {
      return vcardMockAdapter.getStatus(ecardId);
    }
    return vcardProductionAdapter.getStatus(ecardId);
  },

  async revokeEcard(ecardId: string): Promise<{ success: boolean; error?: string }> {
    if (!vcardProductionAdapter.isConfigured()) {
      return vcardMockAdapter.revokeEcard(ecardId);
    }
    return vcardProductionAdapter.revokeEcard(ecardId);
  },

  async getEcardUrl(ecardId: string, message?: string): Promise<string | null> {
    if (!vcardProductionAdapter.isConfigured()) {
      return vcardMockAdapter.getEcardUrl(ecardId, message);
    }
    return vcardProductionAdapter.getEcardUrl(ecardId, message);
  },
};

export default vcardAdapter;
