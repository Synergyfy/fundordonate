import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { PlanAudience } from "@prisma/client";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { PlanCatalogService } from "../services/plan-catalog.service";
import { PlanEntitlementService } from "../services/plan-entitlement.service";
import {
  ConfirmPlanOrderDto,
  PurchasePlanDto,
  RedeemAccessPassDto,
} from "../dto/plan.dto";

@ApiTags("Plans & Access Passes")
@Controller("plans")
export class PlansController {
  constructor(
    private readonly catalog: PlanCatalogService,
    private readonly entitlements: PlanEntitlementService,
  ) {}

  @Get("catalog")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Public plan and access pass catalogue",
  })
  @ApiResponse({ status: 200, description: "Catalogue retrieved" })
  async getCatalog() {
    // Plans and access passes are a business-only product line.
    return this.catalog.getCatalog(PlanAudience.BUSINESS);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Current entitlement, purchase history and saved access pass codes",
  })
  @ApiResponse({ status: 200, description: "Entitlement retrieved" })
  async getMine(@CurrentUser("id") userId: string) {
    return this.entitlements.getMine(userId);
  }

  @Get("capabilities")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Resolved feature capabilities for the current user",
    description:
      "Pass the last known `version` to receive a lightweight { unchanged: true } response when nothing has changed.",
  })
  @ApiResponse({ status: 200, description: "Capabilities retrieved" })
  async getCapabilities(
    @CurrentUser("id") userId: string,
    @Query("version") version?: string,
  ) {
    return this.entitlements.getCapabilities(userId, version);
  }

  @Post("purchase")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Buy a plan or access pass through MCOM Pay",
    description:
      "Creates a plan order and an MCOM Pay charge. Only business accounts can purchase. Wallet payments activate immediately; card/PayPal orders activate after confirmation or the payment webhook.",
  })
  @ApiResponse({ status: 201, description: "Order created" })
  async purchase(
    @CurrentUser("id") userId: string,
    @Body() dto: PurchasePlanDto,
  ) {
    return this.entitlements.purchase(userId, dto);
  }

  @Post("orders/:id/confirm")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Confirm a card/PayPal plan order after client completion",
  })
  @ApiResponse({ status: 200, description: "Order confirmed" })
  async confirmOrder(
    @CurrentUser("id") userId: string,
    @Param("id") orderId: string,
    @Body() dto: ConfirmPlanOrderDto,
  ) {
    return this.entitlements.confirmOrder(userId, orderId, dto);
  }

  @Post("access-pass/redeem")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Redeem an access pass code",
    description:
      "If another plan or access pass is active, returns 409 with details unless confirmForfeit is true.",
  })
  @ApiResponse({ status: 200, description: "Access pass activated" })
  async redeem(
    @CurrentUser("id") userId: string,
    @Body() dto: RedeemAccessPassDto,
  ) {
    return this.entitlements.redeemAccessPass(userId, dto);
  }
}
