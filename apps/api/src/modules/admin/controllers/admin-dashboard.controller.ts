import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import {
  RecentItemsQueryDto,
  RevenueChartQueryDto,
} from "../dto/dashboard-query.dto";

@ApiTags("Admin Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/stats")
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({
    summary: "Get platform KPI metrics summary",
    description: "Returns revenue, active campaigns, total businesses, backers, average donation, and conversion rates.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved dashboard KPI metrics" })
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get("revenue")
  @ApiOperation({
    summary: "Get periodic revenue chart dataset",
    description: "Returns aggregated revenue timeline based on interval: daily, weekly, monthly, or yearly.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved revenue timeline" })
  async getRevenueChart(@Query() query: RevenueChartQueryDto) {
    return this.dashboardService.getRevenueChart(query.period);
  }

  @Get("recent")
  @ApiOperation({
    summary: "Get recent contributions and donations",
    description: "Returns latest contributions with backer, business, and campaign relations.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved recent transactions" })
  async getRecentContributions(@Query() query: RecentItemsQueryDto) {
    return this.dashboardService.getRecentContributions(query.limit);
  }

  @Get("top-campaigns")
  @ApiOperation({
    summary: "Get top campaigns by raised funding",
    description: "Returns top campaigns ordered by amount raised.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved top campaigns" })
  async getTopCampaigns(@Query() query: RecentItemsQueryDto) {
    return this.dashboardService.getTopCampaigns(query.limit);
  }

  @Get("activity")
  @ApiOperation({
    summary: "Get system administrative activity feed",
    description: "Returns audit log events with actor and timestamp.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved activity feed" })
  async getActivityFeed(@Query() query: RecentItemsQueryDto) {
    return this.dashboardService.getActivityFeed(query.limit);
  }
}
