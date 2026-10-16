import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { HubLocationType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class LocationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: HubLocationType })
  @IsOptional()
  @IsEnum(HubLocationType)
  type?: HubLocationType;

  @ApiPropertyOptional({ description: "Filter by parent hub location ID" })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: "Search by location name or slug" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: false, description: "Whether to include inactive locations" })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean = false;
}

export class CreateLocationDto {
  @ApiProperty({ example: "Manchester" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "manchester" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ enum: HubLocationType, default: HubLocationType.CITY })
  @IsEnum(HubLocationType)
  type!: HubLocationType;

  @ApiPropertyOptional({ description: "Parent location ID in hierarchy" })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: "Manchester City Hub" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Fund & Donate Manchester" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  heroHeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heroSupportingText?: string;

  @ApiPropertyOptional({ example: "M" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postcodePrefix?: string;

  @ApiPropertyOptional({ example: 53.4808 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -2.2426 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 5000000, description: "Target in pence" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ example: "ACTIVE" })
  @IsOptional()
  @IsString()
  activationStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: HubLocationType })
  @IsOptional()
  @IsEnum(HubLocationType)
  type?: HubLocationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  heroHeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heroSupportingText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postcodePrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activationStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateRollupConfigDto {
  @ApiProperty({ description: "Target definitions and multipliers across tiers" })
  @IsObject()
  config!: Record<string, any>;
}
