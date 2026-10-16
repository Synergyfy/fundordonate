import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LeaderboardService } from "./leaderboard.service";

@ApiTags("Leaderboards")
@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get the national leaderboard and per-city leaderboards" })
  @ApiResponse({ status: 200, description: "Successfully retrieved leaderboard overview" })
  async getOverview() {
    return this.leaderboardService.getOverview();
  }

  @Get("urgency/:level/:scopeId")
  @ApiOperation({ summary: "Urgency leaderboard (stub — returns empty entries)" })
  async getUrgency() {
    return null;
  }

  @Get("check-qualification/:level/:scopeId")
  @ApiOperation({ summary: "Urgency qualification check (stub)" })
  async checkQualification() {
    return { qualifies: false, rank: null, qualificationExpiresAt: null };
  }

  @Get(":level")
  @ApiOperation({ summary: "Get a national or scoped contributor leaderboard" })
  @ApiResponse({ status: 200, description: "Successfully retrieved leaderboard" })
  async getLeaderboard(
    @Param("level") level: string,
    @Query("top") top?: string,
    @Query("sortBy") sortBy?: "totalContributed" | "campaignCount",
  ) {
    return this.leaderboardService.getLeaderboard(level, undefined, Number(top) || 100, sortBy);
  }

  @Get(":level/:scopeId")
  @ApiOperation({ summary: "Get a scoped contributor leaderboard" })
  @ApiResponse({ status: 200, description: "Successfully retrieved leaderboard" })
  async getScopedLeaderboard(
    @Param("level") level: string,
    @Param("scopeId") scopeId: string,
    @Query("top") top?: string,
    @Query("sortBy") sortBy?: "totalContributed" | "campaignCount",
  ) {
    return this.leaderboardService.getLeaderboard(level, scopeId, Number(top) || 100, sortBy);
  }
}
