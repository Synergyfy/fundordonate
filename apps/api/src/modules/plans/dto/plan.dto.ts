import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import {
  PlanAccessLevel,
  PlanAudience,
  PlanOrderKind,
  PlanOrderStatus,
} from "@prisma/client";

const PAYMENT_METHODS = ["wallet", "stripe", "paypal"] as const;

export class CapabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: "Numeric quota; ignored when unlimited is true.",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  unlimited?: boolean;
}

export class PlanVariantDto {
  @ApiProperty({ enum: PlanAccessLevel })
  @IsEnum(PlanAccessLevel)
  accessLevel!: PlanAccessLevel;

  @ApiPropertyOptional({
    example: "Gold Standard",
    description:
      "Ignored. Variant names are generated from the plan name and access level.",
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 90,
    description:
      "Ignored for plan variants. Duration is fixed by accessLevel: Standard 90, Pro 180, Pro+ 365.",
    deprecated: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({ example: 15000, description: "Price in minor units (pence)." })
  @IsInt()
  @Min(0)
  priceMinor!: number;

  @ApiPropertyOptional({ default: "GBP" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { $ref: "#/components/schemas/CapabilityDto" },
    description: "Capability map keyed by PlanFeature.key.",
  })
  @IsOptional()
  @IsObject()
  capabilities?: Record<string, CapabilityDto>;

  @ApiPropertyOptional({
    type: [String],
    description: "Display bullet points shown on the public plan card.",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

export class CreatePlanDto {
  @ApiProperty({ example: "Gold" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: "gold" })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be lowercase kebab-case",
  })
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiPropertyOptional({ enum: PlanAudience, default: PlanAudience.BOTH })
  @IsOptional()
  @IsEnum(PlanAudience)
  audience?: PlanAudience;

  @ApiPropertyOptional({ example: "Most popular" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  badge?: string | null;

  @ApiPropertyOptional({ example: "#D4AF37" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ type: [PlanVariantDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PlanVariantDto)
  variants?: PlanVariantDto[];
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}

export class UpdatePlanVariantDto extends PartialType(PlanVariantDto) {}

export class CreateAccessPassDto {
  @ApiProperty({ example: "90-Day Campaign Pass" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: "90-day-campaign-pass" })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be lowercase kebab-case",
  })
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiProperty({
    example: 90,
    description: "How many days the access pass stays active after activation.",
  })
  @IsInt()
  @Min(1)
  durationDays!: number;

  @ApiProperty({ example: 9900, description: "Price in minor units (pence)." })
  @IsInt()
  @Min(0)
  priceMinor!: number;

  @ApiPropertyOptional({ default: "GBP" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { $ref: "#/components/schemas/CapabilityDto" },
  })
  @IsOptional()
  @IsObject()
  capabilities?: Record<string, CapabilityDto>;

  @ApiPropertyOptional({
    type: [String],
    description: "Display bullet points shown on the public access pass card.",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    nullable: true,
    description:
      "How long an unredeemed access-pass code remains valid. Null = never expires.",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  codeValidityDays?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateAccessPassDto extends PartialType(CreateAccessPassDto) {}

export class UpdatePlanFeatureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  defaultEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supportsLimit?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultLimit?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PurchasePlanDto {
  @ApiProperty({ enum: PlanOrderKind })
  @IsEnum(PlanOrderKind)
  kind!: PlanOrderKind;

  @ApiPropertyOptional({ description: "Required when kind = PLAN." })
  @IsOptional()
  @IsString()
  planVariantId?: string;

  @ApiPropertyOptional({ description: "Required when kind = ACCESS_PASS." })
  @IsOptional()
  @IsString()
  accessPassId?: string;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS as unknown as string[])
  method!: (typeof PAYMENT_METHODS)[number];

  @ApiPropertyOptional({
    enum: ["immediate", "save_code"],
    default: "immediate",
    description:
      "Access passes only: activate on payment, or keep a code for later.",
  })
  @IsOptional()
  @IsIn(["immediate", "save_code"])
  activationMode?: "immediate" | "save_code";

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptedTerms?: boolean;

  @ApiPropertyOptional({
    description:
      "Set true after the user confirms an active plan/access pass will be forfeited.",
  })
  @IsOptional()
  @IsBoolean()
  confirmForfeit?: boolean;
}

export class ConfirmPlanOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class RedeemAccessPassDto {
  @ApiProperty({ example: "FDAP-ABCD-EFGH-IJKL" })
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  code!: string;

  @ApiPropertyOptional({
    description:
      "Set true after the user confirms they understand an active plan/access pass will be forfeited.",
  })
  @IsOptional()
  @IsBoolean()
  confirmForfeit?: boolean;
}

export class AdminPlanOrdersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: PlanOrderStatus })
  @IsOptional()
  @IsEnum(PlanOrderStatus)
  status?: PlanOrderStatus;

  @ApiPropertyOptional({ enum: PlanOrderKind })
  @IsOptional()
  @IsEnum(PlanOrderKind)
  kind?: PlanOrderKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
