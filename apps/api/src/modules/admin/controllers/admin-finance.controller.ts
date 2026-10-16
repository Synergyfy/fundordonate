import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { AdminGuard } from "../guards/admin.guard";
import { AdminFinanceService } from "../services/admin-finance.service";
import {
  DonationsQueryDto,
  PayoutsQueryDto,
  RefundDonationDto,
  UpdatePayoutStatusDto,
} from "../dto/finance-admin.dto";

@ApiTags("Admin Finance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminFinanceController {
  constructor(private readonly financeService: AdminFinanceService) {}

  // ---------------------------------------------------------------------------
  // DONATIONS & CONTRIBUTIONS
  // ---------------------------------------------------------------------------

  @Get("donations")
  @ApiOperation({ summary: "List contributions and donations ledger with pagination and filters" })
  @ApiResponse({ status: 200, description: "Successfully retrieved donations ledger" })
  async getDonations(@Query() query: DonationsQueryDto) {
    return this.financeService.getDonations(query);
  }

  @Get("donations/:id")
  @ApiOperation({ summary: "Get single contribution transaction detail" })
  @ApiResponse({ status: 200, description: "Successfully retrieved contribution detail" })
  async getDonation(@Param("id") id: string) {
    return this.financeService.getDonation(id);
  }

  @Post("donations/:id/refund")
  @ApiOperation({ summary: "Process refund for a contribution and adjust campaign raised amount" })
  @ApiResponse({ status: 200, description: "Contribution successfully refunded" })
  async refundDonation(
    @Param("id") id: string,
    @Body() dto: RefundDonationDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.financeService.refundDonation(id, dto, adminUserId);
  }

  @Put("donations/:id/status")
  @ApiOperation({ summary: "Update a contribution/donation lifecycle status" })
  @ApiResponse({ status: 200, description: "Contribution status updated" })
  async updateDonationStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.financeService.updateContributionStatus(id, status, adminUserId);
  }

  @Get("pledges")
  @ApiOperation({ summary: "List business self-funding pledges and recurring commitments" })
  @ApiResponse({ status: 200, description: "Successfully retrieved pledges" })
  async getPledges(@Query() query: DonationsQueryDto) {
    return this.financeService.getDonations(query);
  }

  @Put("pledges/:id/status")
  @ApiOperation({ summary: "Update a pledge lifecycle status" })
  @ApiResponse({ status: 200, description: "Pledge status updated" })
  async updatePledgeStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.financeService.updateContributionStatus(id, status, adminUserId);
  }

  // ---------------------------------------------------------------------------
  // FINANCE & PAYOUTS
  // ---------------------------------------------------------------------------

  @Get("finance/overview")
  @ApiOperation({ summary: "Get financial balances: total gross, refunds, net fees, and escrow" })
  @ApiResponse({ status: 200, description: "Successfully retrieved financial overview" })
  async getFinanceOverview() {
    return this.financeService.getFinanceOverview();
  }

  @Get("finance/payouts")
  @ApiOperation({ summary: "List merchant payout requests" })
  @ApiResponse({ status: 200, description: "Successfully retrieved payout requests" })
  async getPayouts(@Query() query: PayoutsQueryDto) {
    return this.financeService.getPayouts(query);
  }

  @Put("finance/payouts/:id")
  @ApiOperation({ summary: "Approve or reject a payout request" })
  @ApiResponse({ status: 200, description: "Payout status updated successfully" })
  async updatePayoutStatus(
    @Param("id") id: string,
    @Body() dto: UpdatePayoutStatusDto,
    @CurrentUser("id") adminUserId: string,
  ) {
    return this.financeService.updatePayoutStatus(id, dto, adminUserId);
  }
}
