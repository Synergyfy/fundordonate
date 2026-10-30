import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { PlansController } from "./controllers/plans.controller";
import { AdminPlansController } from "./controllers/admin-plans.controller";
import { SystemPlansController } from "./controllers/system-plans.controller";
import { AccessPassCatalogueController } from "./controllers/access-pass-catalogue.controller";
import { PlanCatalogService } from "./services/plan-catalog.service";
import { PlanEntitlementService } from "./services/plan-entitlement.service";
import { ExternalPlansService } from "./services/external-plans.service";
import { CapabilityService } from "./services/capability.service";
import { PlanFeatureGuard } from "./guards/plan-feature.guard";
import { McomSolutionApiKeyGuard } from "./guards/mcom-solution-api-key.guard";

@Module({
  imports: [PrismaModule],
  controllers: [
    PlansController,
    AdminPlansController,
    SystemPlansController,
    AccessPassCatalogueController,
  ],
  providers: [
    CapabilityService,
    PlanCatalogService,
    PlanEntitlementService,
    ExternalPlansService,
    PlanFeatureGuard,
    McomSolutionApiKeyGuard,
  ],
  exports: [
    CapabilityService,
    PlanCatalogService,
    PlanEntitlementService,
    ExternalPlansService,
    PlanFeatureGuard,
  ],
})
export class PlansModule {}
