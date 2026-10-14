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
import { AdminSeasonsService } from "../services/admin-seasons.service";
import {
  CreateSeasonDto,
  SeasonActionDto,
  SeasonQueryDto,
  UpdateSeasonDto,
} from "../dto/season.dto";
import { Request } from "express";

@ApiTags("Admin Seasons")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/seasons")
export class AdminSeasonsController {
  constructor(private readonly seasonsService: AdminSeasonsService) {}

  @Get()
  @ApiOperation({
    summary: "List all activation seasons with pagination & filters",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved seasons list" })
  async getSeasons(@Query() query: SeasonQueryDto) {
    return this.seasonsService.getSeasons(query);
  }

  @Get("current")
  @ApiOperation({
    summary: "Get currently active or next scheduled season",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved current season" })
  async getCurrentSeason() {
    return this.seasonsService.getCurrentSeason();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get detailed configuration and targets for a season",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved season details" })
  async getSeason(@Param("id") id: string) {
    return this.seasonsService.getSeason(id);
  }

  @Get(":id/review")
  @ApiOperation({
    summary: "Get season performance review and surplus metrics",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved season review" })
  async getSeasonReview(@Param("id") id: string) {
    return this.seasonsService.getSeasonReview(id);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new activation season with target blueprints",
  })
  @ApiResponse({ status: 201, description: "Season successfully created" })
  async createSeason(@Body() dto: CreateSeasonDto, @Req() req: Request) {
    const adminUserId = (req.user as any)?.id;
    return this.seasonsService.createSeason(dto, adminUserId);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update an existing season's parameters and targets",
  })
  @ApiResponse({ status: 200, description: "Season successfully updated" })
  async updateSeason(@Param("id") id: string, @Body() dto: UpdateSeasonDto) {
    return this.seasonsService.updateSeason(id, dto);
  }

  @Post(":id/action")
  @ApiOperation({
    summary: "Perform lifecycle action on season (activate, close, review, complete, archive)",
  })
  @ApiResponse({ status: 200, description: "Lifecycle action performed successfully" })
  async performAction(@Param("id") id: string, @Body() actionDto: SeasonActionDto) {
    return this.seasonsService.performAction(id, actionDto);
  }
}
