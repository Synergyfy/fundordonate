import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { FoundingController } from "./founding.controller";
import { FoundingService } from "./founding.service";
import { AdminFoundingController } from "./admin-founding.controller";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";

@Module({
  imports: [PrismaModule],
  controllers: [FoundingController, AdminFoundingController],
  providers: [FoundingService, AdminGuard],
  exports: [FoundingService],
})
export class FoundingModule {}
