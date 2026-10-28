import {
  Body,
  Controller,
  Get,
  Param,
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
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { AdminGuard } from "../guards/admin.guard";
import { AdminCampaignsService } from "../services/admin-campaigns.service";
import {
  AdminCampaignQueryDto,
  BulkCampaignActionDto,
  CreateAdminCampaignDto,
  CreateCampaignTemplateDto,
  DuplicateCampaignTemplateDto,
  InstantiateCampaignTemplateDto,
  RequestCampaignChangesDto,
  UpdateAdminCampaignDto,
  UpdateCampaignStatusDto,
  UpdateCampaignTemplateDto,
  UpdateCampaignTemplateStatusDto,
} from "../dto/campaign-admin.dto";
import { SetCampaignLocationsDto } from "../dto/campaign-locations.dto";

@ApiTags("Admin Campaigns")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/campaigns")
export class AdminCampaignsController {
  constructor(private readonly campaignsService: AdminCampaignsService) {}

  @Get()
  @ApiOperation({
    summary: "List all campaigns with filters (status, audience, season, location)",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaigns list" })
  async getCampaigns(@Query() query: AdminCampaignQueryDto) {
    return this.campaignsService.getCampaigns(query);
  }

  @Post()
  @ApiOperation({
    summary: "Create a platform campaign directly (no template or business)",
  })
  @ApiResponse({ status: 201, description: "Campaign created successfully" })
  async createCampaign(
    @Body() dto: CreateAdminCampaignDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.createCampaign(dto, adminUserId);
  }

  @Get("templates")
  @ApiOperation({
    summary: "List campaign templates with instance counts",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved templates list" })
  async getTemplates() {
    return this.campaignsService.getTemplates();
  }

  @Get("templates/:id")
  @ApiOperation({
    summary: "Get single campaign template blueprint detail",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved template detail" })
  async getTemplate(@Param("id") id: string) {
    return this.campaignsService.getTemplate(id);
  }

  @Post("templates")
  @ApiOperation({
    summary: "Create a new campaign template blueprint",
  })
  @ApiResponse({ status: 201, description: "Template created successfully" })
  async createTemplate(
    @Body() dto: CreateCampaignTemplateDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.createTemplate(dto, adminUserId);
  }

  @Put("templates/:id")
  @ApiOperation({
    summary: "Update an existing campaign template blueprint",
  })
  @ApiResponse({ status: 200, description: "Template updated successfully" })
  async updateTemplate(
    @Param("id") id: string,
    @Body() dto: UpdateCampaignTemplateDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.updateTemplate(id, dto, adminUserId);
  }

  @Put("templates/:id/status")
  @ApiOperation({
    summary: "Update a template's lifecycle status (draft/active/inactive/archived)",
  })
  @ApiResponse({ status: 200, description: "Template status updated successfully" })
  async updateTemplateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateCampaignTemplateStatusDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.updateTemplateStatus(id, dto, adminUserId);
  }

  @Post("templates/:id/duplicate")
  @ApiOperation({
    summary: "Clone an existing campaign template into a new draft",
  })
  @ApiResponse({ status: 201, description: "Template duplicated successfully" })
  async duplicateTemplate(
    @Param("id") id: string,
    @Body() dto: DuplicateCampaignTemplateDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.duplicateTemplate(id, dto, adminUserId);
  }

  @Post("templates/:id/instantiate")
  @ApiOperation({
    summary: "Instantiate a template for one or more businesses (background for large batches)",
  })
  @ApiResponse({ status: 201, description: "Template instantiation initiated" })
  async instantiateTemplate(
    @Param("id") id: string,
    @Body() dto: InstantiateCampaignTemplateDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.instantiateTemplate(id, dto, adminUserId);
  }

  @Get("templates/:id/instances")
  @ApiOperation({
    summary: "List campaign instances spawned from a template",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved template instances" })
  async getTemplateInstances(@Param("id") id: string) {
    return this.campaignsService.getTemplateInstances(id);
  }

  @Get("targets/calculation")
  @ApiOperation({
    summary: "Target calculation formula engine preview",
  })
  @ApiResponse({ status: 200, description: "Successfully calculated target projections" })
  async calculateTargets(
    @Query("tier") tier?: string,
    @Query("businessCount") businessCount?: number,
    @Query("baseTargetPerBusiness") baseTargetPerBusiness?: number,
  ) {
    return this.campaignsService.calculateTargets({
      tier,
      businessCount: businessCount ? Number(businessCount) : undefined,
      baseTargetPerBusiness: baseTargetPerBusiness ? Number(baseTargetPerBusiness) : undefined,
    });
  }

  @Get(":id/locations")
  @ApiOperation({ summary: "Get a campaign's primary and additional hub locations" })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign locations" })
  async getCampaignLocations(@Param("id") id: string) {
    return this.campaignsService.getCampaignLocations(id);
  }

  @Put(":id/locations")
  @ApiOperation({ summary: "Replace a campaign's primary and additional hub locations" })
  @ApiResponse({ status: 200, description: "Campaign locations updated" })
  async setCampaignLocations(
    @Param("id") id: string,
    @Body() dto: SetCampaignLocationsDto,
  ) {
    return this.campaignsService.setCampaignLocations(id, dto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get campaign detail with business, field answers, and requested changes",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign details" })
  async getCampaign(@Param("id") id: string) {
    return this.campaignsService.getCampaign(id);
  }

  @Put(":id/status")
  @ApiOperation({
    summary: "Update campaign status (approve, reject, activate, pause)",
  })
  @ApiResponse({ status: 200, description: "Campaign status updated successfully" })
  async updateCampaignStatus(
    @Param("id") id: string,
    @Body() dto: UpdateCampaignStatusDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.updateCampaignStatus(id, dto, adminUserId);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update editable campaign fields (title, description, target, dates)",
  })
  @ApiResponse({ status: 200, description: "Campaign updated successfully" })
  async updateCampaign(
    @Param("id") id: string,
    @Body() dto: UpdateAdminCampaignDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.updateCampaign(id, dto, adminUserId);
  }

  @Post(":id/changes")
  @ApiOperation({
    summary: "Request changes on specific campaign field answers",
  })
  @ApiResponse({ status: 201, description: "Changes requested successfully" })
  async requestChanges(
    @Param("id") id: string,
    @Body() dto: RequestCampaignChangesDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.requestChanges(id, dto, adminUserId);
  }

  @Post("bulk")
  @ApiOperation({
    summary: "Bulk update status of multiple campaigns",
  })
  @ApiResponse({ status: 200, description: "Bulk action initiated or queued" })
  async bulkAction(
    @Body() dto: BulkCampaignActionDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.campaignsService.bulkAction(dto, adminUserId);
  }
}
