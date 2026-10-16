import {
  Body,
  Controller,
  Get,
  Param,
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
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { ConsumerService } from "./consumer.service";

@ApiTags("User Dashboard & Consumer Portal")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @Get("user/dashboard/stats")
  @ApiOperation({ summary: "Get aggregated dashboard stats for the current user" })
  async getDashboardStats(@CurrentUser("id") userId: string) {
    return this.consumerService.getDashboardStats(userId);
  }

  @Get("user/profile")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@CurrentUser("id") userId: string) {
    return this.consumerService.getProfile(userId);
  }

  @Put("user/profile")
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() data: { firstName?: string; lastName?: string; username?: string; avatar?: string },
  ) {
    return this.consumerService.updateProfile(userId, data);
  }

  @Get("user/donations")
  @ApiOperation({ summary: "Get user donations/contributions" })
  async getUserDonations(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.consumerService.getUserDonations(userId, Number(page), Number(limit));
  }

  @Get("user/pledges")
  @ApiOperation({ summary: "Get user pledges" })
  async getUserPledges(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.consumerService.getUserDonations(userId, Number(page), Number(limit));
  }

  @Get("consumer/overview")
  @ApiOperation({ summary: "Get consumer overview with stats, season, and recommendations" })
  async getConsumerOverview(@CurrentUser("id") userId: string) {
    return this.consumerService.getConsumerOverview(userId);
  }

  @Get("consumer/notifications")
  @ApiOperation({ summary: "Get consumer notifications" })
  async getNotifications(@CurrentUser("id") userId: string) {
    return this.consumerService.getNotifications(userId);
  }

  @Get("consumer/rewards")
  @ApiOperation({
    summary: "Get the current user's issued rewards",
    description:
      "Returns reward issuances earned by the user, including redemption code and lifecycle status.",
  })
  @ApiResponse({ status: 200, description: "Paginated reward issuances" })
  async getRewards(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.consumerService.getRewards(userId, Number(page), Number(limit));
  }

  @Get("consumer/rewards/:id")
  @ApiOperation({ summary: "Get a single issued reward for the current user" })
  @ApiResponse({ status: 200, description: "Reward issuance detail" })
  async getReward(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    return this.consumerService.getReward(userId, id);
  }
}
