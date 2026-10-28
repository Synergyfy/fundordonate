import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RecommendationKind, RecommendationStatus } from "@prisma/client";

export class SubmitLocationRecommendationDto {
  @ApiPropertyOptional({ enum: RecommendationKind, default: RecommendationKind.HIGH_STREET })
  @IsOptional()
  @IsEnum(RecommendationKind)
  kind?: RecommendationKind = RecommendationKind.HIGH_STREET;

  @ApiProperty({ example: "Chapel Walk" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "manchester", description: "City slug or id" })
  @IsString()
  @MinLength(1)
  citySlug!: string;

  @ApiPropertyOptional({ example: "ancoats", description: "Local area slug or id" })
  @IsOptional()
  @IsString()
  areaSlug?: string;

  @ApiPropertyOptional({ type: [String], example: ["M4"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(12, { each: true })
  postcodes?: string[];

  @ApiPropertyOptional({ example: "Jane Smith" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  suggestedBy?: string;

  @ApiProperty({ enum: ["business", "consumer"], example: "consumer" })
  @IsIn(["business", "consumer"])
  submittedByRole!: "business" | "consumer";

  @ApiPropertyOptional({ example: "New pedestrianised high street" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class PublicRecommendationsQueryDto {
  @ApiPropertyOptional({ description: "Filter by city slug or id" })
  @IsOptional()
  @IsString()
  citySlug?: string;

  @ApiPropertyOptional({ enum: RecommendationStatus })
  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;
}

export class AdminRecommendationsQueryDto {
  @ApiPropertyOptional({ enum: RecommendationStatus })
  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;

  @ApiPropertyOptional({ description: "Search by high street, city or area name" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
