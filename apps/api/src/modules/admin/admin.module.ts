import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { BullModule } from "@nestjs/bullmq";
import { AdminTasksProcessor } from "./processors/admin-tasks.processor";
import { ADMIN_TASKS_QUEUE } from "./processors/admin-tasks.constants";

// Guards
import { AdminGuard } from "./guards/admin.guard";

// Services
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { AdminSeasonsService } from "./services/admin-seasons.service";
import { AdminLocationsService } from "./services/admin-locations.service";
import { AdminCampaignsService } from "./services/admin-campaigns.service";
import { CampaignSchedulerService } from "./services/campaign-scheduler.service";
import { AdminParticipantsService } from "./services/admin-participants.service";
import { AdminFinanceService } from "./services/admin-finance.service";
import { AdminSystemService } from "./services/admin-system.service";
import { AdminRewardsService } from "./services/admin-rewards.service";
import { AdminLeaderboardService } from "./services/admin-leaderboard.service";

// Controllers
import { AdminDashboardController } from "./controllers/admin-dashboard.controller";
import { AdminSeasonsController } from "./controllers/admin-seasons.controller";
import { AdminLocationsController } from "./controllers/admin-locations.controller";
import { AdminCampaignsController } from "./controllers/admin-campaigns.controller";
import { AdminParticipantsController } from "./controllers/admin-participants.controller";
import { AdminFinanceController } from "./controllers/admin-finance.controller";
import { AdminSystemController } from "./controllers/admin-system.controller";
import { AdminRewardsController } from "./controllers/admin-rewards.controller";
import { AdminLeaderboardController } from "./controllers/admin-leaderboard.controller";

import { RewardsModule } from "../rewards/rewards.module";
import { AuditModule } from "../audit/audit.module";
import { EligibilityModule } from "../eligibility/eligibility.module";

@Module({
  imports: [
    PrismaModule,
    RewardsModule,
    AuditModule,
    EligibilityModule,
    BullModule.registerQueue({
      name: ADMIN_TASKS_QUEUE,
    }),
  ],
  controllers: [
    AdminDashboardController,
    AdminSeasonsController,
    AdminLocationsController,
    AdminCampaignsController,
    AdminParticipantsController,
    AdminFinanceController,
    AdminSystemController,
    AdminRewardsController,
    AdminLeaderboardController,
  ],
  providers: [
    AdminGuard,
    AdminTasksProcessor,
    AdminDashboardService,
    AdminSeasonsService,
    AdminLocationsService,
    AdminCampaignsService,
    CampaignSchedulerService,
    AdminParticipantsService,
    AdminFinanceService,
    AdminSystemService,
    AdminRewardsService,
    AdminLeaderboardService,
  ],
  exports: [
    AdminGuard,
    AdminDashboardService,
    AdminSeasonsService,
    AdminLocationsService,
    AdminCampaignsService,
    AdminParticipantsService,
    AdminFinanceService,
    AdminSystemService,
    AdminRewardsService,
    AdminLeaderboardService,
  ],
})
export class AdminModule {}
