import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export enum SeasonStatusEnum {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  CLOSING = "CLOSING",
  REVIEW = "REVIEW",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum SeasonActionTypeEnum {
  ACTIVATE = "activate",
  CLOSE = "close",
  REVIEW = "review",
  COMPLETE = "complete",
  ARCHIVE = "archive",
}

export class SeasonQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: SeasonStatusEnum })
  @IsOptional()
  @IsEnum(SeasonStatusEnum)
  status?: SeasonStatusEnum;

  @ApiPropertyOptional({ description: "Search term matching season name or reference code" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateSeasonDto {
  @ApiProperty({ example: "Autumn 2026" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "UK Activation Programme" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  programmeName?: string;

  @ApiPropertyOptional({ example: "S26-AUT" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  referenceCode?: string;

  @ApiPropertyOptional({ example: "The autumn 2026 activation season." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ example: "2026-09-01T00:00:00Z" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: "2026-11-30T23:59:59Z" })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ example: 91 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({ example: 50000000, description: "Overall target in pence (£500,000.00)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overallTarget!: number;

  @ApiProperty({ example: 10000000, description: "National target in pence" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nationalTarget!: number;

  @ApiProperty({ example: 5000000, description: "Default city target in pence" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cityTargetDefault!: number;

  @ApiProperty({ example: 1000000, description: "Default local area target in pence" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  localAreaTargetDefault!: number;

  @ApiProperty({ example: 500000, description: "Default high street target in pence" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  highStreetTargetDefault!: number;

  @ApiProperty({ example: 100000, description: "Default business campaign target in pence" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  businessCampaignTargetDefault!: number;

  @ApiPropertyOptional({ description: "Target activation scope (national, cities, local areas)" })
  @IsOptional()
  @IsObject()
  activationScope?: Record<string, any>;

  @ApiPropertyOptional({ description: "Participation configurations" })
  @IsOptional()
  @IsObject()
  participationConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: "Gamification & leaderboard configurations" })
  @IsOptional()
  @IsObject()
  engagementConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: "Spillover rules" })
  @IsOptional()
  @IsObject()
  spilloverConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: "Communication channel settings" })
  @IsOptional()
  @IsObject()
  communicationConfig?: Record<string, any>;
}

export class UpdateSeasonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programmeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  overallTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nationalTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cityTargetDefault?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  localAreaTargetDefault?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  highStreetTargetDefault?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  businessCampaignTargetDefault?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  activationScope?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  participationConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  engagementConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  spilloverConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  communicationConfig?: Record<string, any>;
}

export class SeasonActionDto {
  @ApiProperty({ enum: SeasonActionTypeEnum, example: SeasonActionTypeEnum.ACTIVATE })
  @IsEnum(SeasonActionTypeEnum)
  action!: SeasonActionTypeEnum;

  @ApiPropertyOptional({ description: "Optional notes for the lifecycle transition" })
  @IsOptional()
  @IsString()
  note?: string;
}
