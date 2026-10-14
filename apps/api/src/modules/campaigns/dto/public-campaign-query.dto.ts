import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export enum CampaignAudienceFilter {
  BUSINESS = "business",
  CONSUMER = "consumer",
  ALL = "all",
}

export class PublicCampaignQueryDto {
  @ApiPropertyOptional({ enum: CampaignAudienceFilter, default: CampaignAudienceFilter.ALL })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ description: "Filter by mode: fund or donation" })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: "Filter by city slug or name" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: "Filter by category name" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "Search query matching title, description, or merchant" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by status", default: "ACTIVE" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
