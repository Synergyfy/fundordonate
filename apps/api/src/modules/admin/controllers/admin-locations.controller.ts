import {
  Body,
  Controller,
  Delete,
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
import { AdminGuard } from "../guards/admin.guard";
import { AdminLocationsService } from "../services/admin-locations.service";
import {
  CreateLocationDto,
  LocationQueryDto,
  UpdateLocationDto,
  UpdateRollupConfigDto,
} from "../dto/location.dto";

@ApiTags("Admin Locations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/locations")
export class AdminLocationsController {
  constructor(private readonly locationsService: AdminLocationsService) {}

  @Get()
  @ApiOperation({
    summary: "List hub locations with pagination and hierarchy filters",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved locations" })
  async getLocations(@Query() query: LocationQueryDto) {
    return this.locationsService.getLocations(query);
  }

  @Get("tree")
  @ApiOperation({
    summary: "Get full hierarchical location tree (National -> Cities -> Local Areas -> High Streets)",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved location tree" })
  async getLocationTree() {
    return this.locationsService.getLocationTree();
  }

  @Get("rollup-config")
  @ApiOperation({
    summary: "Get rollup targets configuration and weighting multipliers",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved rollup configuration" })
  async getRollupConfig() {
    return this.locationsService.getRollupConfig();
  }

  @Put("rollup-config")
  @ApiOperation({
    summary: "Update rollup targets configuration",
  })
  @ApiResponse({ status: 200, description: "Successfully updated rollup configuration" })
  async updateRollupConfig(@Body() dto: UpdateRollupConfigDto) {
    return this.locationsService.updateRollupConfig(dto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get hub location details with parent, children, and business stats",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved location details" })
  async getLocation(@Param("id") id: string) {
    return this.locationsService.getLocation(id);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new hub location",
  })
  @ApiResponse({ status: 201, description: "Location created successfully" })
  async createLocation(@Body() dto: CreateLocationDto) {
    return this.locationsService.createLocation(dto);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update an existing hub location",
  })
  @ApiResponse({ status: 200, description: "Location updated successfully" })
  async updateLocation(@Param("id") id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.updateLocation(id, dto);
  }

  @Put(":id/status")
  @ApiOperation({
    summary: "Toggle active status of a location",
  })
  @ApiResponse({ status: 200, description: "Location status updated successfully" })
  async toggleLocationStatus(@Param("id") id: string, @Body("isActive") isActive: boolean) {
    return this.locationsService.toggleLocationStatus(id, Boolean(isActive));
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete an unused hub location",
  })
  @ApiResponse({ status: 200, description: "Location deleted successfully" })
  async deleteLocation(@Param("id") id: string) {
    return this.locationsService.deleteLocation(id);
  }
}
