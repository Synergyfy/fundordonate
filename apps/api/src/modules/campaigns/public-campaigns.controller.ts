import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PublicCampaignsService } from "./public-campaigns.service";
import { PublicCampaignQueryDto } from "./dto/public-campaign-query.dto";

@ApiTags("Public Campaigns Directory")
@Controller("campaigns")
export class PublicCampaignsController {
  constructor(private readonly campaignsService: PublicCampaignsService) {}

  @Get()
  @ApiOperation({
    summary: "List public campaigns",
    description: "Returns active campaigns filtered by audience (business/consumer), mode, city, or search.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaigns list" })
  async list(@Query() query: PublicCampaignQueryDto) {
    return this.campaignsService.list(query);
  }

  @Get("featured")
  @ApiOperation({
    summary: "List featured public campaigns",
    description:
      "Returns the highest-raising active campaigns for the homepage featured sections. Optionally filters by audience (business/consumer).",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved featured campaigns" })
  async featured(@Query() query: PublicCampaignQueryDto) {
    return this.campaignsService.listFeatured(query.limit, query.audience);
  }

  @Get("slug/:slug")
  @ApiOperation({
    summary: "Get public campaign by slug",
    description: "Retrieves campaign detail by SEO slug.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign" })
  async getBySlug(@Param("slug") slug: string) {
    return this.campaignsService.getBySlug(slug);
  }

  @Get(":id/rewards")
  @ApiOperation({
    summary: "Get public reward rules for a campaign",
    description:
      "Returns the campaign's reward rules (no codes/recipient data) for the campaign page and pledge checkout reward selection.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign rewards" })
  async getRewards(@Param("id") id: string) {
    return this.campaignsService.getRewards(id);
  }

  @Get("contributions/reference/:reference")
  @ApiOperation({
    summary: "Get a contribution by reference",
    description: "Retrieves a single contribution (public fields) for the post-payment confirmation page.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved contribution" })
  async getContributionByReference(@Param("reference") reference: string) {
    return this.campaignsService.getContributionByReference(reference);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get public campaign by ID",
    description: "Retrieves single campaign detail by UUID.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign" })
  async getById(@Param("id") id: string) {
    return this.campaignsService.getById(id);
  }
}
