import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { PlanCatalogService } from "../services/plan-catalog.service";
import {
  AdminPlanOrdersQueryDto,
  CreateAccessPassDto,
  CreatePlanDto,
  PlanVariantDto,
  UpdateAccessPassDto,
  UpdatePlanDto,
  UpdatePlanFeatureDto,
  UpdatePlanVariantDto,
} from "../dto/plan.dto";

@ApiTags("Admin — Plans & Access Passes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminPlansController {
  constructor(private readonly catalog: PlanCatalogService) {}

  // ── Feature catalogue ────────────────────────────────────────────────────

  @Get("plans/features")
  @ApiOperation({ summary: "List the capability catalogue" })
  @ApiResponse({ status: 200, description: "Features retrieved" })
  async listFeatures() {
    return this.catalog.listFeatures();
  }

  @Patch("plans/features/:key")
  @ApiOperation({ summary: "Update a capability definition or default access" })
  @ApiResponse({ status: 200, description: "Feature updated" })
  async updateFeature(
    @Param("key") key: string,
    @Body() dto: UpdatePlanFeatureDto,
  ) {
    return this.catalog.updateFeature(key, dto);
  }

  // ── Reporting ────────────────────────────────────────────────────────────

  @Get("plans/orders")
  @ApiOperation({ summary: "List plan and access pass orders" })
  @ApiResponse({ status: 200, description: "Orders retrieved" })
  async listOrders(@Query() query: AdminPlanOrdersQueryDto) {
    return this.catalog.listOrders(query);
  }

  @Get("plans/access-pass-codes")
  @ApiOperation({ summary: "List issued access pass codes" })
  @ApiResponse({ status: 200, description: "Codes retrieved" })
  async listAccessPassCodes(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("accessPassId") accessPassId?: string,
    @Query("search") search?: string,
  ) {
    return this.catalog.listAccessPassCodes({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      accessPassId,
      search,
    });
  }

  // ── Plans ────────────────────────────────────────────────────────────────

  @Get("plans")
  @ApiOperation({ summary: "List plans and their variants" })
  @ApiResponse({ status: 200, description: "Plans retrieved" })
  async listPlans(@Query("includeInactive") includeInactive?: string) {
    return this.catalog.listPlans(includeInactive === "true");
  }

  @Post("plans")
  @ApiOperation({ summary: "Create a plan (optionally with variants)" })
  @ApiResponse({ status: 201, description: "Plan created" })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.catalog.createPlan(dto);
  }

  @Get("plans/:id")
  @ApiOperation({ summary: "Get a plan" })
  @ApiResponse({ status: 200, description: "Plan retrieved" })
  async getPlan(@Param("id") id: string) {
    return this.catalog.getPlan(id);
  }

  @Put("plans/:id")
  @ApiOperation({ summary: "Update a plan and its variants" })
  @ApiResponse({ status: 200, description: "Plan updated" })
  async updatePlan(@Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.catalog.updatePlan(id, dto);
  }

  @Delete("plans/:id")
  @ApiOperation({
    summary: "Delete a plan (archived instead when purchases exist)",
  })
  @ApiResponse({ status: 200, description: "Plan deleted or archived" })
  async deletePlan(@Param("id") id: string) {
    return this.catalog.deletePlan(id);
  }

  @Post("plans/:id/variants")
  @ApiOperation({ summary: "Add a duration variant to a plan" })
  @ApiResponse({ status: 201, description: "Variant created" })
  async createVariant(
    @Param("id") planId: string,
    @Body() dto: PlanVariantDto,
  ) {
    return this.catalog.createVariant(planId, dto);
  }

  @Put("plans/:id/variants/:variantId")
  @ApiOperation({ summary: "Update a plan variant and its capabilities" })
  @ApiResponse({ status: 200, description: "Variant updated" })
  async updateVariant(
    @Param("id") planId: string,
    @Param("variantId") variantId: string,
    @Body() dto: UpdatePlanVariantDto,
  ) {
    return this.catalog.updateVariant(planId, variantId, dto);
  }

  @Delete("plans/:id/variants/:variantId")
  @ApiOperation({ summary: "Delete or archive a plan variant" })
  @ApiResponse({ status: 200, description: "Variant deleted or archived" })
  async deleteVariant(
    @Param("id") planId: string,
    @Param("variantId") variantId: string,
  ) {
    return this.catalog.deleteVariant(planId, variantId);
  }

  // ── Access passes ────────────────────────────────────────────────────────

  @Get("access-passes")
  @ApiOperation({ summary: "List access passes" })
  @ApiResponse({ status: 200, description: "Access passes retrieved" })
  async listAccessPasses(@Query("includeInactive") includeInactive?: string) {
    return this.catalog.listAccessPasses(includeInactive === "true");
  }

  @Post("access-passes")
  @ApiOperation({ summary: "Create an access pass product" })
  @ApiResponse({ status: 201, description: "Access pass created" })
  async createAccessPass(@Body() dto: CreateAccessPassDto) {
    return this.catalog.createAccessPass(dto);
  }

  @Get("access-passes/:id")
  @ApiOperation({ summary: "Get an access pass" })
  @ApiResponse({ status: 200, description: "Access pass retrieved" })
  async getAccessPass(@Param("id") id: string) {
    return this.catalog.getAccessPass(id);
  }

  @Put("access-passes/:id")
  @ApiOperation({ summary: "Update an access pass" })
  @ApiResponse({ status: 200, description: "Access pass updated" })
  async updateAccessPass(
    @Param("id") id: string,
    @Body() dto: UpdateAccessPassDto,
  ) {
    return this.catalog.updateAccessPass(id, dto);
  }

  @Delete("access-passes/:id")
  @ApiOperation({
    summary: "Delete an access pass (archived instead when used)",
  })
  @ApiResponse({ status: 200, description: "Access pass deleted or archived" })
  async deleteAccessPass(@Param("id") id: string) {
    return this.catalog.deleteAccessPass(id);
  }
}
