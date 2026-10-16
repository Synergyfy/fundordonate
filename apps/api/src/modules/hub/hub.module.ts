import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { HubController } from "./hub.controller";
import { HubService } from "./hub.service";

@Module({
  imports: [PrismaModule],
  controllers: [HubController],
  providers: [HubService],
  exports: [HubService],
})
export class HubModule {}
