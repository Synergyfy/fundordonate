import {
  Controller,
  Get,
  Param,
  Post,
  Body,
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
import { AdminGuard } from "../../admin/guards/admin.guard";
import { RewardsClient } from "@/mcom/rewards-client.service";
import { RewardEngineService } from "../services/reward-engine.service";
import { RewardTriggerService } from "../services/reward-trigger.service";
import { RewardReconciliationService } from "../services/reward-reconciliation.service";
import { McomRewardQueryDto } from "../dto/mcom-reward-query.dto";
import { IssueMcomRewardDto } from "../dto/issue-mcom-reward.dto";
import { McomRewardsErrorFilter } from "../filters/mcom-rewards-error.filter";

/**
 * Admin-facing proxy to the MCOM Rewards catalogue. Rewards are owned by MCOM
 * Rewards; FundOrDonate only lets an admin browse and attach them to campaigns.
 */
@ApiTags("Admin MCOM Rewards Catalogue")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseFilters(McomRewardsErrorFilter)
@Controller("admin/mcom-rewards")
export class McomRewardsCatalogController {
  constructor(
    private readonly rewardsClient: RewardsClient,
    private readonly rewardEngine: RewardEngineService,
    private readonly rewardTrigger: RewardTriggerService,
    private readonly reconciliation: RewardReconciliationService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Browse the MCOM Rewards catalogue" })
  @ApiResponse({ status: 200, description: "Paginated MCOM Rewards catalogue" })
  async list(@Query() query: McomRewardQueryDto) {
    return this.rewardsClient.listRewards({
      page: query.page,
      limit: query.limit,
      search: query.search,
      rewardType: query.rewardType,
      audience: query.audience,
    });
  }

  @Post("issue")
  @ApiOperation({ summary: "Issue a catalogued MCOM reward to a recipient" })
  @ApiResponse({ status: 201, description: "Reward issued; issuance mirror returned" })
  async issue(@Body() dto: IssueMcomRewardDto) {
    const business =
      dto.businessMcomUserId || dto.businessEmail
        ? { mcomUserId: dto.businessMcomUserId, email: dto.businessEmail }
        : undefined;

    return this.rewardEngine.issue({
      mcomRewardId: dto.mcomRewardId,
      recipient: { email: dto.email, mcomUserId: dto.mcomUserId, name: dto.name },
      business,
      campaignId: dto.campaignId,
      userId: dto.userId,
      rewardConfigId: dto.rewardConfigId,
      quantity: dto.quantity,
    });
  }

  @Post("evaluate/contribution/:contributionId")
  @ApiOperation({
    summary: "Re-evaluate one contribution against the campaign's reward rules",
    description:
      "Runs the reward trigger engine for a completed contribution and issues any qualifying rewards (idempotent).",
  })
  @ApiResponse({ status: 201, description: "Issuances created or matched" })
  async evaluateContribution(@Param("contributionId") contributionId: string) {
    const issuances = await this.rewardTrigger.evaluateContribution(contributionId);
    return { issued: issuances.length, issuances };
  }

  @Post("evaluate/campaign/:campaignId")
  @ApiOperation({
    summary: "Re-evaluate all completed contributions in a campaign",
    description: "Backfill / reconciliation pass over a campaign's completed contributions.",
  })
  @ApiResponse({ status: 201, description: "Issuances created or matched" })
  async evaluateCampaign(@Param("campaignId") campaignId: string) {
    const issuances = await this.rewardTrigger.evaluateCampaign(campaignId);
    return { issued: issuances.length, issuances };
  }

  @Post("reconcile")
  @ApiOperation({
    summary: "Reconcile every active/issued campaign against MCOM Rewards",
    description:
      "Mirrors provider issuances locally and backfills any missing issuance by re-evaluating completed contributions. Safety net for missed webhooks/queue jobs.",
  })
  @ApiResponse({ status: 201, description: "Reconciliation summary" })
  async reconcile() {
    return this.reconciliation.reconcileAll();
  }

  @Post("reconcile/:campaignId")
  @ApiOperation({
    summary: "Reconcile a single campaign against MCOM Rewards",
    description: "Mirrors provider issuances for the campaign and backfills missing ones.",
  })
  @ApiResponse({ status: 201, description: "Per-campaign reconciliation result" })
  async reconcileCampaign(@Param("campaignId") campaignId: string) {
    return this.reconciliation.reconcileCampaign(campaignId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single MCOM reward from the catalogue" })
  @ApiResponse({ status: 200, description: "MCOM reward detail" })
  async getOne(@Param("id") id: string) {
    return this.rewardsClient.getReward(id);
  }
}
