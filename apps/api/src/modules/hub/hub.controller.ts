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

  @Get("locations/resolve")
  @ApiOperation({
    summary: "Resolve a canonical UK Hub path",
    description:
      "Resolves /uk-hub-activation/* paths against HubLocation.fullPath and returns the location, ancestors, children and live stats.",
  })
  @ApiResponse({ status: 200, description: "Successfully resolved location path" })
  async resolveLocationPath(@Query("path") path: string) {
    return this.hubService.resolveLocationPath(path);
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

  @Get("hub/locations/:id/stats")
  @ApiOperation({
    summary: "Get live aggregated stats for a location",
    description:
      "Returns funding, campaigns, backers and per-child roll-up for a city, local area, or high street.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved location stats" })
  async getLocationStats(@Param("id") id: string) {
    return this.hubService.getLocationStats(id);
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

  @Get("seasons")
  @ApiOperation({ summary: "List active or all seasons publicly" })
  @ApiResponse({ status: 200, description: "Successfully retrieved seasons" })
  async getSeasons(@Query("status") status?: string) {
    return this.hubService.getSeasons(status);
  }

  @Get("seasons/current")
  @ApiOperation({ summary: "Get current or next scheduled season publicly" })
  @ApiResponse({ status: 200, description: "Successfully retrieved current season" })
  async getCurrentSeason() {
    return this.hubService.getCurrentSeason();
  }

  @Get("seasons/:id")
  @ApiOperation({ summary: "Get season detail publicly" })
  @ApiResponse({ status: 200, description: "Successfully retrieved season detail" })
  async getSeasonById(@Param("id") id: string) {
    return this.hubService.getSeasonById(id);
  }

  @Get("seasons/:id/metrics")
  @ApiOperation({ summary: "Get season metrics publicly" })
  @ApiResponse({ status: 200, description: "Successfully retrieved season metrics" })
  async getSeasonMetrics(@Param("id") id: string) {
    return this.hubService.getSeasonMetrics(id);
  }
}
