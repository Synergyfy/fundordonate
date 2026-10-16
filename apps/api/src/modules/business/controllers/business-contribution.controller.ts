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
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { BusinessContributionService } from "../services/business-contribution.service";
import { ContributionQueryDto } from "../dto/contribution-query.dto";
import { SelfFundDto } from "../dto/self-fund.dto";

@ApiTags("Business Contributions & Self-Funding")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business")
export class BusinessContributionController {
  constructor(
    private readonly contributionService: BusinessContributionService,
  ) {}

  @Get("contributions")
  @ApiOperation({
    summary: "Get contribution ledger",
    description: "Returns paginated list of in-store and online contributions with channel breakdowns and aggregate totals.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved contributions" })
  async getContributions(
    @CurrentBusiness("id") businessId: string,
    @Query() query: ContributionQueryDto,
  ) {
    return this.contributionService.getContributions(businessId, query);
  }

  @Post("campaigns/:id/self-fund")
  @ApiOperation({
    summary: "Execute self-funding payment",
    description: "Records a self-funding contribution into the campaign, unlocks rewards, and updates totals atomically.",
  })
  @ApiResponse({ status: 201, description: "Self-funding processed successfully" })
  async selfFund(
    @CurrentBusiness("id") businessId: string,
    @Param("id") campaignId: string,
    @Body() dto: SelfFundDto,
  ) {
    return this.contributionService.selfFund(businessId, campaignId, dto);
  }
}
