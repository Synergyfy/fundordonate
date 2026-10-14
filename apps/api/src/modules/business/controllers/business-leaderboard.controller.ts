import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { BusinessLeaderboardService } from "../services/business-leaderboard.service";
import { LeaderboardQueryDto } from "../dto/leaderboard-query.dto";

@ApiTags("Business Leaderboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business")
export class BusinessLeaderboardController {
  constructor(
    private readonly leaderboardService: BusinessLeaderboardService,
  ) {}

  @Get("leaderboard")
  @ApiOperation({
    summary: "Get business leaderboard rankings",
    description: "Returns dense ranking of businesses by total contribution within the specified geographic scope.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved leaderboard" })
  async getLeaderboard(
    @CurrentBusiness("id") businessId: string,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.leaderboardService.getLeaderboard(businessId, query);
  }
}
