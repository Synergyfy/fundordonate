import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { McomSolutionApiKeyGuard } from "../guards/mcom-solution-api-key.guard";
import { ExternalPlanDto } from "../dto/external-plan.dto";
import { ExternalPlansService } from "../services/external-plans.service";

/**
 * Generic Billing API consumed by MCOM Solutions Console.
 *
 * Configure the app's **Billing API URL** in Console (for example
 * `http://localhost:5024`) and MCOM derives:
 *   `${billingApiUrl}/api/v1/system/plans`
 *
 * The **Plan Schema Endpoint** can point directly at
 * `/api/v1/system/plans/schema`.
 */
@ApiTags("System — MCOM Plans")
@Controller("system/plans")
@UseGuards(McomSolutionApiKeyGuard)
export class SystemPlansController {
  constructor(private readonly externalPlans: ExternalPlansService) {}

  @Get("schema")
  @ApiOperation({
    summary: "Capability schema consumed by MCOM's dynamic plan form",
  })
  getSchema() {
    return this.externalPlans.getSchema();
  }

  @Get()
  @ApiOperation({ summary: "List plans in MCOM's ExternalPlan format" })
  listPlans() {
    return this.externalPlans.listPlans();
  }

  @Post()
  @ApiOperation({ summary: "Create a plan from MCOM Console" })
  createPlan(@Body() dto: ExternalPlanDto) {
    return this.externalPlans.createPlan(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one plan in MCOM's ExternalPlan format" })
  getPlan(@Param("id") id: string) {
    return this.externalPlans.getPlan(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a plan from MCOM Console" })
  updatePlan(@Param("id") id: string, @Body() dto: ExternalPlanDto) {
    return this.externalPlans.updatePlan(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete a plan, or archive it when purchases exist",
  })
  deletePlan(@Param("id") id: string) {
    return this.externalPlans.deletePlan(id);
  }
}
