import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { PublicCampaignsController } from "./public-campaigns.controller";
import { PublicCampaignsService } from "./public-campaigns.service";
import { CampaignPostsController } from "./campaign-posts.controller";
import { CampaignPostsService } from "./campaign-posts.service";

@Module({
  imports: [PrismaModule],
  controllers: [PublicCampaignsController, CampaignPostsController],
  providers: [PublicCampaignsService, CampaignPostsService],
  exports: [PublicCampaignsService, CampaignPostsService],
})
export class PublicCampaignsModule {}
