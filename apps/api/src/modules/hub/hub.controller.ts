import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HubService } from "./hub.service";

@ApiTags("Public UK Hub & Locations")
@Controller()
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Get(["hub/national-summary", "hub/national/summary"])
  @ApiOperation({
    summary: "Get live UK National Hub Summary",
    description: "Returns aggregated nationwide city activation counts, targets, and raised totals.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved national summary" })
  async getNationalSummary() {
    return this.hubService.getNationalSummary();
  }

  @Get("hub/cities")
  @ApiOperation({
    summary: "Get live list of UK cities for Hub Activation",
    description: "Returns cities with live activation statuses, progress, funding, coordinates, and hierarchy counts.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved cities" })
  async getCities() {
    return this.hubService.getCities();
  }

  @Get("hub/cities/:slug")
  @ApiOperation({
    summary: "Get single city hub detail",
    description: "Returns city profile with local areas, high streets, and active campaigns.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved city detail" })
  async getCityBySlug(@Param("slug") slug: string) {
    return this.hubService.getCityBySlug(slug);
  }

  @Get("locations/tree")
  @ApiOperation({
    summary: "Get public location hierarchy tree",
    description: "Returns tree from Cities down to High Streets for location navigation.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved location tree" })
  async getLocationTree() {
    return this.hubService.getLocationTree();
  }

  @Get("locations")
  @ApiOperation({
    summary: "List locations publicly with optional type/parentId filter",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved locations" })
  async getLocations(
    @Query("type") type?: string,
    @Query("parentId") parentId?: string,
    @Query("search") search?: string,
  ) {
    return this.hubService.getLocations({ type, parentId, search });
  }
}
