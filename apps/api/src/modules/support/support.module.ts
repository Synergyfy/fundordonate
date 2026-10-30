import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { PlansModule } from "@/modules/plans/plans.module";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [SupportController],
  providers: [SupportService, AdminGuard],
  exports: [SupportService],
})
export class SupportModule {}
