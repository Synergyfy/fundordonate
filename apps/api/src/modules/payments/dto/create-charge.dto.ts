import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum PaymentMethod {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  WALLET = "wallet",
}

export enum ChargePurposeType {
  DONATION = "DONATION",
  PLEDGE = "PLEDGE",
  MEMBERSHIP = "MEMBERSHIP",
  SELF_FUNDING = "SELF_FUNDING",
}

export class CreateChargeDto {
  @ApiProperty({
    description: "Amount in minor units (pence), e.g. 1000 = £10.00",
    example: 1000,
  })
  @IsNumber()
  @Min(1)
  amountMinor!: number;

  @ApiProperty({
    description: "Payment method: stripe (card), paypal, or wallet (MCOM credits)",
    enum: PaymentMethod,
    example: PaymentMethod.WALLET,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method!: PaymentMethod;

  @ApiProperty({
    description: "Purpose of the charge",
    enum: ChargePurposeType,
    example: ChargePurposeType.DONATION,
  })
  @IsEnum(ChargePurposeType)
  @IsNotEmpty()
  type!: ChargePurposeType;

  @ApiPropertyOptional({
    description: "Associated campaign UUID (for donations, pledges, self-funding)",
    example: "c464c8c7-43c2-4752-9426-5bceaa5fa222",
  })
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({
    description: "Associated business UUID",
    example: "b103e5c9-1c70-4a88-82df-777c5ba72345",
  })
  @IsString()
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional({
    description: "Associated founding membership programme ID",
  })
  @IsString()
  @IsOptional()
  membershipProgrammeId?: string;

  @ApiPropertyOptional({
    description: "Optional reward ID for pledges",
  })
  @IsString()
  @IsOptional()
  rewardId?: string;

  @ApiPropertyOptional({
    description: "Optional tribute or backer notes",
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: "Whether the backer chooses to be anonymous",
    default: false,
  })
  @IsOptional()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: "Description displayed on MCOM Central Hub receipts / ledger",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Additional structured metadata",
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
