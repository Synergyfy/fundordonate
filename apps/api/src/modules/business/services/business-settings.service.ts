import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BusinessSettings } from "@prisma/client";
import { UpdateBusinessSettingsDto } from "../dto/update-business-settings.dto";

@Injectable()
export class BusinessSettingsService {
  constructor(private readonly prisma: PrismaService) {}

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
