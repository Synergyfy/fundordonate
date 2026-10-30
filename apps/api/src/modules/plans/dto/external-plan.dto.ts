import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

/**
 * DTOs for the MCOM Console "Generic Billing API" contract.
 *
 * MCOM sends prices in major units (pounds) and describes capabilities as
 * `configuration.quotas` + `configuration.featureFlags`. FundorDonate stores
 * pence and a unified capability map, so the integration service translates
 * between the two shapes.
 */
export class ExternalPlanVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: "STANDARD" })
  @IsString()
  tier!: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  tierLevel?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 49 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paypalPlanId?: string;
}

export class ExternalPlanDto {
  @ApiPropertyOptional({ example: "Gold" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: "gold" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ type: [ExternalPlanVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalPlanVariantDto)
  variants?: ExternalPlanVariantDto[];

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  tierPrices?: Record<string, number>;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  tierFeatures?: Record<string, string[]>;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  tierEntitlements?: unknown[];

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  tierDurations?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quarterlyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  annualPrice?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  trialDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeMonthlyPriceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeQuarterlyPriceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeAnnualPriceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paypalMonthlyPlanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paypalQuarterlyPlanId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paypalAnnualPlanId?: string;

  @ApiPropertyOptional({ description: "Included by MCOM; ignored by FundorDonate." })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  created_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updated_at?: string;
}
