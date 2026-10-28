import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

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

export class CampaignAllocationDto {
  @ApiProperty({ description: "Allocation destination id configured on the campaign" })
  @IsString()
  @IsNotEmpty()
  destinationId!: string;

  @ApiPropertyOptional({ description: "Amount allocated to this destination, in pence" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMinor?: number;

  @ApiPropertyOptional({ description: "Percentage allocated to this destination" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  percentage?: number;
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
    type: [CampaignAllocationDto],
    description: "Optional allocation split for campaigns that enable funding allocation",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignAllocationDto)
  @IsOptional()
  allocations?: CampaignAllocationDto[];

  @ApiPropertyOptional({
    description: "Whether the contributor accepted the campaign terms",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptedTerms?: boolean;

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
