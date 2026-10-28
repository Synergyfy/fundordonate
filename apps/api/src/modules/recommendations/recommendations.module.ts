import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { RecommendationsService } from "./recommendations.service";
import { PublicRecommendationsController } from "./controllers/public-recommendations.controller";
import { AdminRecommendationsController } from "./controllers/admin-recommendations.controller";

@Module({
  imports: [PrismaModule],
  controllers: [PublicRecommendationsController, AdminRecommendationsController],
  providers: [RecommendationsService, AdminGuard],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
