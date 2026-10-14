import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { CreateChargeDto } from "./dto/create-charge.dto";
import { ConfirmChargeDto } from "./dto/confirm-charge.dto";

@ApiTags("MCOM Payments & Wallet")
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("wallet/balance")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user's MCOM Central Hub wallet balance",
    description:
      "Fetches live balance and availableBalance from Central Hub (/api/v1/wallet/partner/balance/:userId)",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved balance" })
  async getWalletBalance(@CurrentUser("id") userId: string) {
    return this.paymentsService.getWalletBalance(userId);
  }

  @Post("payments/charges")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Create an MCOM Pay charge",
    description:
      "Initiates a charge in minor units via Stripe, PayPal, or MCOM Wallet directly against Central Hub.",
  })
  @ApiResponse({ status: 201, description: "Charge created successfully" })
  async createCharge(
    @CurrentUser("id") userId: string | null,
    @Body() dto: CreateChargeDto,
  ) {
    return this.paymentsService.createCharge(userId, dto);
  }

  @Post("payments/charges/:id/confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Confirm a charge after client payment completion",
    description:
      "Confirms charge with Central Hub using paymentIntentId (Stripe) or orderId (PayPal).",
  })
  @ApiResponse({ status: 200, description: "Charge confirmed successfully" })
  async confirmCharge(
    @Param("id") chargeId: string,
    @Body() dto: ConfirmChargeDto,
  ) {
    return this.paymentsService.confirmCharge(chargeId, dto);
  }

  @Post("payments/webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "MCOM Central Hub webhook receiver",
    description:
      "Handles payment.succeeded and payment.refunded events signed with HMAC SHA-256.",
  })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("x-mcom-webhook-signature") signature: string,
    @Body() body: any,
  ) {
    const rawBody =
      req.rawBody ||
      (Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof body === "string" ? body : JSON.stringify(body)));

    return this.paymentsService.processWebhook(rawBody, signature);
  }
}
