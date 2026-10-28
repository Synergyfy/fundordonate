import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { RecommendationsService } from "../recommendations.service";
import { AdminRecommendationsQueryDto } from "../dto/recommendation.dto";

@ApiTags("Admin Location Recommendations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/location-recommendations")
export class AdminRecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @ApiOperation({
    summary: "List location recommendations with status counts",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved recommendations" })
  async list(@Query() query: AdminRecommendationsQueryDto) {
    return this.recommendationsService.listAdmin(query);
  }

  @Get("counts")
  @ApiOperation({ summary: "Get recommendation counts by status" })
  @ApiResponse({ status: 200, description: "Successfully retrieved counts" })
  async counts() {
    return this.recommendationsService.counts();
  }

  @Post(":id/approve")
  @ApiOperation({
    summary: "Approve a recommendation",
    description:
      "Creates a SUGGESTED location under the submitted local area (high street) or city (local area). Suggested locations stay hidden publicly until confirmed.",
  })
  @ApiResponse({ status: 200, description: "Recommendation approved" })
  @ApiResponse({ status: 400, description: "Invalid hierarchy / missing local area" })
  @ApiResponse({ status: 409, description: "Already reviewed" })
  async approve(@Param("id") id: string, @CurrentUser("id") adminUserId: string) {
    return this.recommendationsService.approve(id, adminUserId);
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a recommendation" })
  @ApiResponse({ status: 200, description: "Recommendation rejected" })
  @ApiResponse({ status: 409, description: "Already reviewed" })
  async reject(@Param("id") id: string, @CurrentUser("id") adminUserId: string) {
    return this.recommendationsService.reject(id, adminUserId);
  }
}
