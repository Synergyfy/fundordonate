import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { McomSolutionApiKeyGuard } from "../guards/mcom-solution-api-key.guard";
import { ExternalPlansService } from "../services/external-plans.service";

/**
 * Access-pass catalogue consumed by MCOM Solutions Console.
 *
 * Register `{billingApiUrl}/api/v1/access-passes/plans` as the app's
 * **Access Pass Plans Endpoint**.
 */
@ApiTags("System — MCOM Access Passes")
@Controller("access-passes")
@UseGuards(McomSolutionApiKeyGuard)
export class AccessPassCatalogueController {
  constructor(private readonly externalPlans: ExternalPlansService) {}

  @Get("plans")
  @ApiOperation({ summary: "List access passes for MCOM's bundle builder" })
  listPlans() {
    return this.externalPlans.listAccessPasses();
  }
}
