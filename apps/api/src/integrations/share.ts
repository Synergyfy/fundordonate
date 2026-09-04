// =============================================================================
// Campaign Share & QR Code Service
// Manages share codes, QR generation, and referral tracking
// =============================================================================

import { prisma } from "../lib/prisma";
import type { CampaignShareData, QRCodeData, ShareUrlData } from "./types";

// =============================================================================
// Share Code Generation
// =============================================================================

function generateShareCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateCampaignShareCode(): string {
  return generateShareCode(8);
}

// =============================================================================
// Share Service
// =============================================================================

export const shareService = {
  // Generate or get existing share code for a campaign
  async getOrCreateShareCode(campaignId: string): Promise<string> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { shareCode: true },
    });

    if (campaign?.shareCode) {
      return campaign.shareCode;
    }

    const shareCode = generateCampaignShareCode();
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { shareCode },
    });

    return shareCode;
  },

  // Record a share event
  async recordShare(data: CampaignShareData): Promise<{ id: string; code: string }> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      select: { slug: true, shareCode: true },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const code = campaign.shareCode || (await this.getOrCreateShareCode(data.campaignId));

    const share = await prisma.campaignShare.create({
      data: {
        code,
        shareType: data.shareType,
        source: data.source,
        metadata: JSON.stringify(data.metadata || {}),
        campaignId: data.campaignId,
      },
    });

    return { id: share.id, code };
  },

  // Generate QR code data for a campaign
  async generateQRCode(campaignId: string, baseUrl: string): Promise<QRCodeData> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { slug: true, shareCode: true },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const shareCode = campaign.shareCode || (await this.getOrCreateShareCode(campaignId));

    return {
      url: `${baseUrl}/c/${campaign.slug}?ref=${shareCode}`,
      campaignSlug: campaign.slug,
      shareCode,
    };
  },

  // Generate share URL for a campaign
  async generateShareUrl(campaignId: string, baseUrl: string): Promise<ShareUrlData> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { slug: true, shareCode: true },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const shareCode = campaign.shareCode || (await this.getOrCreateShareCode(campaignId));

    return {
      campaignSlug: campaign.slug,
      shareCode,
      baseUrl,
    };
  },

  // Get share statistics for a campaign
  async getShareStats(campaignId: string): Promise<{
    totalShares: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const shares = await prisma.campaignShare.findMany({
      where: { campaignId },
      select: { shareType: true, source: true },
    });

    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const share of shares) {
      byType[share.shareType] = (byType[share.shareType] || 0) + 1;
      if (share.source) {
        bySource[share.source] = (bySource[share.source] || 0) + 1;
      }
    }

    return {
      totalShares: shares.length,
      byType,
      bySource,
    };
  },

  // Validate a share code
  async validateShareCode(code: string): Promise<{
    valid: boolean;
    campaignId?: string;
    campaignSlug?: string;
  }> {
    const campaign = await prisma.campaign.findUnique({
      where: { shareCode: code },
      select: { id: true, slug: true },
    });

    if (!campaign) {
      return { valid: false };
    }

    return {
      valid: true,
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
    };
  },
};

export default shareService;
