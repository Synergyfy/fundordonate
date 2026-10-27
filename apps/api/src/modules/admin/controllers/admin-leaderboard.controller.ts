import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminLeaderboardService } from "../services/admin-leaderboard.service";
import { AdminLeaderboardQueryDto } from "../dto/admin-leaderboard-query.dto";

@ApiTags("Admin Leaderboards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/leaderboards")
export class AdminLeaderboardController {
  constructor(
    private readonly leaderboardService: AdminLeaderboardService,
  ) {}

  @Get("business")
  @ApiOperation({
    summary: "Get the platform-wide business leaderboard",
    description:
      "Ranks active businesses by completed contribution total. Optional geographic scope.",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved business leaderboard",
  })
  async getBusinessLeaderboard(@Query() query: AdminLeaderboardQueryDto) {
    return this.leaderboardService.getBusinessLeaderboard(query);
  }
}
