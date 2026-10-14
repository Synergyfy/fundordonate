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
import { BusinessRewardService } from "../services/business-reward.service";

@ApiTags("Business Rewards & Gamification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business")
export class BusinessRewardController {
  constructor(private readonly rewardService: BusinessRewardService) {}

  @Get("rewards")
  @ApiOperation({
    summary: "Get earned and locked rewards",
    description: "Returns earned reward badges with unlock dates alongside locked rewards with percentage progress.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved rewards" })
  async getRewards(@CurrentBusiness("id") businessId: string) {
    return this.rewardService.getRewards(businessId);
  }
}
