import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { BullModule } from "@nestjs/bullmq";
import { ADMIN_TASKS_QUEUE, AdminTasksProcessor } from "./processors/admin-tasks.processor";

// Guards
import { AdminGuard } from "./guards/admin.guard";

// Services
import { AdminDashboardService } from "./services/admin-dashboard.service";
import { AdminSeasonsService } from "./services/admin-seasons.service";
import { AdminLocationsService } from "./services/admin-locations.service";
import { AdminCampaignsService } from "./services/admin-campaigns.service";
import { AdminParticipantsService } from "./services/admin-participants.service";
import { AdminFinanceService } from "./services/admin-finance.service";
import { AdminRewardsService } from "./services/admin-rewards.service";
import { AdminSystemService } from "./services/admin-system.service";

// Controllers
import { AdminDashboardController } from "./controllers/admin-dashboard.controller";
import { AdminSeasonsController } from "./controllers/admin-seasons.controller";
import { AdminLocationsController } from "./controllers/admin-locations.controller";
import { AdminCampaignsController } from "./controllers/admin-campaigns.controller";
import { AdminParticipantsController } from "./controllers/admin-participants.controller";
import { AdminFinanceController } from "./controllers/admin-finance.controller";
import { AdminRewardsController } from "./controllers/admin-rewards.controller";
import { AdminSystemController } from "./controllers/admin-system.controller";

@Module({
  imports: [
    PrismaModule,
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
    AdminRewardsController,
    AdminSystemController,
  ],
  providers: [
    AdminGuard,
    AdminTasksProcessor,
    AdminDashboardService,
    AdminSeasonsService,
    AdminLocationsService,
    AdminCampaignsService,
    AdminParticipantsService,
    AdminFinanceService,
    AdminRewardsService,
    AdminSystemService,
  ],
  exports: [
    AdminGuard,
    AdminDashboardService,
    AdminSeasonsService,
    AdminLocationsService,
    AdminCampaignsService,
    AdminParticipantsService,
    AdminFinanceService,
    AdminRewardsService,
    AdminSystemService,
  ],
})
export class AdminModule {}
