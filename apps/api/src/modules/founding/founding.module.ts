import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { FoundingController } from "./founding.controller";
import { FoundingService } from "./founding.service";

@Module({
  imports: [PrismaModule],
  controllers: [FoundingController],
  providers: [FoundingService],
  exports: [FoundingService],
})
export class FoundingModule {}
