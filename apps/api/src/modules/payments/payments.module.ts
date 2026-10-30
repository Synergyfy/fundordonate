import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RewardsModule } from "@/modules/rewards/rewards.module";
import { EligibilityModule } from "@/modules/eligibility/eligibility.module";
import { PlansModule } from "@/modules/plans/plans.module";

@Module({
  imports: [RewardsModule, EligibilityModule, PlansModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
