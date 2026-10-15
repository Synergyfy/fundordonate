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
import { AdminGuard } from "../guards/admin.guard";
import { AdminRewardsService } from "../services/admin-rewards.service";

/**
 * Admin Reward Library.
 *
 * Rewards are authored on `CampaignTemplate.rewardsConfig` and issued through
 * `RewardIssuance`; this controller exposes them as the library + fulfilment
 * views the admin UI consumes. It is intentionally read-mostly: fulfilment
 * updates persist against the issuance metadata.
 */
@ApiTags("Admin Reward Library")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/rewards")
export class AdminRewardsController {
  constructor(private readonly rewardsService: AdminRewardsService) {}

  @Get()
  @ApiOperation({ summary: "List the reward library (campaign reward rules)" })
  @ApiResponse({ status: 200, description: "Successfully retrieved rewards" })
  async getRewards() {
    return this.rewardsService.getRewards();
  }

  @Get("fulfilment")
  @ApiOperation({ summary: "List reward fulfilment records (issuances)" })
  @ApiResponse({ status: 200, description: "Successfully retrieved fulfilments" })
  async getFulfilments(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("rewardId") rewardId?: string,
    @Query("search") search?: string,
  ) {
    return this.rewardsService.getFulfilments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      rewardId,
      search,
    });
  }

  @Put("fulfilment/:id")
  @ApiOperation({ summary: "Update a reward fulfilment record" })
  @ApiResponse({ status: 200, description: "Fulfilment updated" })
  async updateFulfilment(
    @Param("id") id: string,
    @Body()
    body: {
      status?: string;
      trackingNumber?: string;
      courier?: string;
      notes?: string;
      shippingAddress?: Record<string, unknown>;
    },
  ) {
    return this.rewardsService.updateFulfilment(id, body);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single reward library entry" })
  @ApiResponse({ status: 200, description: "Reward detail" })
  async getReward(@Param("id") id: string) {
    return this.rewardsService.getReward(id);
  }
}
