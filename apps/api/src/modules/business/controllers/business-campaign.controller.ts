import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { BusinessCampaignService } from "../services/business-campaign.service";
import { CampaignQueryDto } from "../dto/campaign-query.dto";
import { SaveCampaignAnswersDto } from "../dto/save-campaign-answers.dto";
import { UpdateCampaignSettingsDto } from "../dto/update-campaign-settings.dto";

@ApiTags("Business Campaigns & Campaign Centre")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business")
export class BusinessCampaignController {
  constructor(private readonly campaignService: BusinessCampaignService) {}

  @Get("templates")
  @ApiOperation({
    summary: "Get Campaign Centre templates",
    description: "Lists all admin master templates evaluated against business profile (available vs locked).",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved templates" })
  async getTemplates(@CurrentBusiness("id") businessId: string) {
    return this.campaignService.getTemplates(businessId);
  }

  @Post("templates/:id/claim")
  @ApiOperation({
    summary: "Claim campaign template",
    description: "Grants permission to use an admin master template, initializes a campaign draft, and pre-populates known answers.",
  })
  @ApiResponse({ status: 201, description: "Template successfully claimed" })
  async claimTemplate(
    @CurrentBusiness("id") businessId: string,
    @Param("id") templateId: string,
  ) {
    return this.campaignService.claimTemplate(businessId, templateId);
  }

  @Get("campaigns")
  @ApiOperation({
    summary: "List business campaigns",
    description: "Retrieves paginated list of campaigns created by the business with optional status filter.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaigns" })
  async getMyCampaigns(
    @CurrentBusiness("id") businessId: string,
    @Query() query: CampaignQueryDto,
  ) {
    return this.campaignService.getMyCampaigns(businessId, query);
  }

  @Get("campaigns/:id")
  @ApiOperation({
    summary: "Get campaign details",
    description: "Retrieves full configuration, field blueprints, saved answers, and requested changes for a campaign instance.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign detail" })
  async getCampaignDetail(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
  ) {
    return this.campaignService.getCampaignDetail(businessId, campaignId);
  }

  @Patch("campaigns/:id/answers")
  @ApiOperation({
    summary: "Save campaign wizard answers",
    description: "Upserts strongly-typed field answers submitted by the business owner during setup.",
  })
  @ApiResponse({ status: 200, description: "Successfully saved field answers" })
  async saveAnswers(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
    @Body() dto: SaveCampaignAnswersDto,
  ) {
    await this.campaignService.saveAnswers(businessId, campaignId, dto);
    return { success: true, message: "Field answers saved successfully" };
  }

  @Patch("campaigns/:id/settings")
  @ApiOperation({
    summary: "Update campaign presentation settings",
    description:
      "Stores campaign-level FAQ, terms and other presentation settings as JSON.",
  })
  @ApiResponse({ status: 200, description: "Settings updated" })
  async saveSettings(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
    @Body() dto: UpdateCampaignSettingsDto,
  ) {
    return this.campaignService.saveSettings(businessId, campaignId, dto);
  }

  @Post("campaigns/:id/submit")
  @ApiOperation({
    summary: "Submit campaign for review or activation",
    description: "Validates all required fields and transitions status to PENDING_REVIEW or ACTIVE.",
  })
  @ApiResponse({ status: 200, description: "Campaign submitted successfully" })
  async submitForReview(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
  ) {
    return this.campaignService.submitForReview(businessId, campaignId);
  }
}
