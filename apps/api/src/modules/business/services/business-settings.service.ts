import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BusinessSettings } from "@prisma/client";
import { UpdateBusinessSettingsDto } from "../dto/update-business-settings.dto";
import { CapabilityService } from "@/modules/plans/services/capability.service";
import { FEATURES } from "@/modules/plans/plan.constants";

@Injectable()
export class BusinessSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capabilities: CapabilityService,
  ) {}

  /**
   * Retrieves notification and account preferences for a business.
   */
  async getSettings(businessId: string): Promise<BusinessSettings> {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { businessId },
    });

    if (!settings) {
      // Upsert default settings if record does not exist
      return this.prisma.businessSettings.create({
        data: {
          businessId,
          emailAlerts: true,
          campaignUpdates: true,
          leaderboardChanges: true,
          rewardsEarned: true,
          newBackers: false,
          weeklyDigest: true,
        },
      });
    }

    return settings;
  }

  /**
   * Updates notification and account preferences.
   */
  async updateSettings(
    businessId: string,
    dto: UpdateBusinessSettingsDto,
  ): Promise<BusinessSettings> {
    const existing = await this.prisma.businessSettings.findUnique({
      where: { businessId },
    });

    if (!existing) {
      throw new NotFoundException("Business settings not found");
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (business) {
      if (dto.weeklyDigest === true) {
        await this.capabilities.assertFeature(
          business.ownerId,
          FEATURES.NOTIFICATIONS_WEEKLY_DIGEST,
        );
      }
      if (
        dto.leaderboardChanges === true ||
        dto.newBackers === true ||
        dto.rewardsEarned === true
      ) {
        await this.capabilities.assertFeature(
          business.ownerId,
          FEATURES.NOTIFICATIONS_ALERTS,
        );
      }
    }

    return this.prisma.businessSettings.update({
      where: { businessId },
      data: {
        emailAlerts: dto.emailAlerts,
        campaignUpdates: dto.campaignUpdates,
        leaderboardChanges: dto.leaderboardChanges,
        rewardsEarned: dto.rewardsEarned,
        newBackers: dto.newBackers,
        weeklyDigest: dto.weeklyDigest,
      },
    });
  }
}
