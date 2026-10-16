import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { PublicCampaignsController } from "./public-campaigns.controller";
import { PublicCampaignsService } from "./public-campaigns.service";

@Module({
  imports: [PrismaModule],
  controllers: [PublicCampaignsController],
  providers: [PublicCampaignsService],
  exports: [PublicCampaignsService],
})
export class PublicCampaignsModule {}
