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

  @Get("slug/:slug")
  @ApiOperation({
    summary: "Get public campaign by slug",
    description: "Retrieves campaign detail by SEO slug.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved campaign" })
  async getBySlug(@Param("slug") slug: string) {
    return this.campaignsService.getBySlug(slug);
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
