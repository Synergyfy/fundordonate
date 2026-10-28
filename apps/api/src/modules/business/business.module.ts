import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { RewardsModule } from "@/modules/rewards/rewards.module";
import { AuditModule } from "@/modules/audit/audit.module";
import { EligibilityModule } from "@/modules/eligibility/eligibility.module";

// Guards
import { BusinessOwnerGuard } from "./guards/business-owner.guard";

// Services
import { BusinessDashboardService } from "./services/business-dashboard.service";
import { BusinessProfileService } from "./services/business-profile.service";
import { BusinessCampaignService } from "./services/business-campaign.service";
import { BusinessContributionService } from "./services/business-contribution.service";
import { BusinessLeaderboardService } from "./services/business-leaderboard.service";
import { BusinessRewardService } from "./services/business-reward.service";
import { BusinessSettingsService } from "./services/business-settings.service";
import { BusinessMediaService } from "./services/business-media.service";
import { MediaStorageService } from "./services/media-storage.service";

// Controllers
import { BusinessDashboardController } from "./controllers/business-dashboard.controller";
import { BusinessProfileController } from "./controllers/business-profile.controller";
import { BusinessCampaignController } from "./controllers/business-campaign.controller";
import { BusinessAuditController } from "./controllers/business-audit.controller";
import { BusinessContributionController } from "./controllers/business-contribution.controller";
import { BusinessLeaderboardController } from "./controllers/business-leaderboard.controller";
import { BusinessRewardController } from "./controllers/business-reward.controller";
import { BusinessSettingsController } from "./controllers/business-settings.controller";
import { BusinessMediaController } from "./controllers/business-media.controller";

@Module({
  imports: [PrismaModule, RewardsModule, AuditModule, EligibilityModule],
  controllers: [
    BusinessDashboardController,
    BusinessProfileController,
    BusinessCampaignController,
    BusinessAuditController,
    BusinessContributionController,
    BusinessLeaderboardController,
    BusinessRewardController,
    BusinessSettingsController,
    BusinessMediaController,
  ],
  providers: [
    BusinessOwnerGuard,
    BusinessDashboardService,
    BusinessProfileService,
    BusinessCampaignService,
    BusinessContributionService,
    BusinessLeaderboardService,
    BusinessRewardService,
    BusinessSettingsService,
    BusinessMediaService,
    MediaStorageService,
  ],
  exports: [
    BusinessOwnerGuard,
    BusinessDashboardService,
    BusinessProfileService,
    BusinessCampaignService,
    BusinessContributionService,
    BusinessLeaderboardService,
    BusinessRewardService,
    BusinessSettingsService,
    BusinessMediaService,
    MediaStorageService,
  ],
})
export class BusinessModule {}
