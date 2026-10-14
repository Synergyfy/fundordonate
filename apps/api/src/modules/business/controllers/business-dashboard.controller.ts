import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { BusinessDashboardService } from "../services/business-dashboard.service";

@ApiTags("Business Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business/dashboard")
export class BusinessDashboardController {
  constructor(private readonly dashboardService: BusinessDashboardService) {}

  @Get("overview")
  @ApiOperation({
    summary: "Get business dashboard overview",
    description: "Returns aggregated KPI metrics, active campaigns, teaser template, and leaderboard rank in a single response.",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved dashboard overview",
  })
  async getOverview(@CurrentBusiness("id") businessId: string) {
    return this.dashboardService.getOverview(businessId);
  }
}
