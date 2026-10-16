import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ConfirmChargeDto {
  @ApiPropertyOptional({
    description: "Stripe PaymentIntent ID returned after Stripe.js confirmCardPayment",
  })
  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @ApiPropertyOptional({
    description: "PayPal Order ID returned after PayPal approval",
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}
