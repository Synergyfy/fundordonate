import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { ActivationService } from "./activation.service";
import { ActivationController } from "./activation.controller";

@Module({
  imports: [PrismaModule],
  controllers: [ActivationController],
  providers: [ActivationService, AdminGuard],
  exports: [ActivationService],
})
export class ActivationModule {}
