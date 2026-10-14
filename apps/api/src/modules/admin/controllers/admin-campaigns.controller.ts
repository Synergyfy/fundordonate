import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminCampaignsService } from "../services/admin-campaigns.service";
import {
  AdminCampaignQueryDto,
  BulkCampaignActionDto,
  CreateCampaignTemplateDto,
  RequestCampaignChangesDto,
  UpdateCampaignStatusDto,
  UpdateCampaignTemplateDto,
} from "../dto/campaign-admin.dto";
import { Request } from "express";

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
  async createTemplate(@Body() dto: CreateCampaignTemplateDto) {
    return this.campaignsService.createTemplate(dto);
  }

  @Put("templates/:id")
  @ApiOperation({
    summary: "Update an existing campaign template blueprint",
  })
  @ApiResponse({ status: 200, description: "Template updated successfully" })
  async updateTemplate(@Param("id") id: string, @Body() dto: UpdateCampaignTemplateDto) {
    return this.campaignsService.updateTemplate(id, dto);
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
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.id;
    return this.campaignsService.updateCampaignStatus(id, dto, adminUserId);
  }

  @Post(":id/changes")
  @ApiOperation({
    summary: "Request changes on specific campaign field answers",
  })
  @ApiResponse({ status: 201, description: "Changes requested successfully" })
  async requestChanges(
    @Param("id") id: string,
    @Body() dto: RequestCampaignChangesDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.id;
    return this.campaignsService.requestChanges(id, dto, adminUserId);
  }

  @Post("bulk")
  @ApiOperation({
    summary: "Bulk update status of multiple campaigns",
  })
  @ApiResponse({ status: 200, description: "Bulk action initiated or queued" })
  async bulkAction(@Body() dto: BulkCampaignActionDto, @Req() req: Request) {
    const adminUserId = (req.user as any)?.id;
    return this.campaignsService.bulkAction(dto, adminUserId);
  }
}
