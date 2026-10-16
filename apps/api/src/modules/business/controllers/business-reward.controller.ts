import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
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
import { AttachCampaignRewardDto } from "../dto/attach-campaign-reward.dto";
import { McomRewardsErrorFilter } from "@/modules/rewards/filters/mcom-rewards-error.filter";

@ApiTags("Business Rewards & Gamification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@UseFilters(McomRewardsErrorFilter)
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

  @Get("rewards/available")
  @ApiOperation({
    summary: "List the business's own MCOM Rewards",
    description:
      "Fetches the rewards this business created on MCOM Rewards (live), which it may attach to a campaign it runs.",
  })
  @ApiResponse({ status: 200, description: "Paginated business-owned MCOM rewards" })
  async listAvailableRewards(
    @CurrentBusiness("id") businessId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.rewardService.listAvailableRewards(businessId, query);
  }

  @Get("campaigns/:id/reward-attachments")
  @ApiOperation({
    summary: "List a campaign's reward attachments",
    description:
      "Returns the template's rewards (coexisting), the business-owned rewards attached to this campaign, and whether the template allows attaching.",
  })
  @ApiResponse({ status: 200, description: "Campaign reward attachments" })
  async listCampaignRewardAttachments(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
  ) {
    return this.rewardService.listCampaignRewardAttachments(businessId, campaignId);
  }

  @Post("campaigns/:id/reward-attachments")
  @ApiOperation({
    summary: "Attach one of the business's own MCOM rewards to a campaign",
  })
  @ApiResponse({ status: 201, description: "Reward attached" })
  async attachCampaignReward(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
    @Body() dto: AttachCampaignRewardDto,
  ) {
    return this.rewardService.attachCampaignReward(businessId, campaignId, dto);
  }

  @Delete("campaigns/:id/reward-attachments/:attachmentId")
  @ApiOperation({ summary: "Detach a business-owned reward from a campaign" })
  @ApiResponse({ status: 200, description: "Reward detached" })
  async detachCampaignReward(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
    @Param("attachmentId") attachmentId: string,
  ) {
    return this.rewardService.detachCampaignReward(
      businessId,
      campaignId,
      attachmentId,
    );
  }
}
