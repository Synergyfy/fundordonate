import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateRewardDefinitionDto {
  @ApiProperty({ example: "FIRST_CONTRIBUTION" })
  @IsString()
  code!: string;

  @ApiProperty({ example: "First Contribution" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "Awarded after making your first contribution to any high street campaign." })
  @IsString()
  description!: string;

  @ApiProperty({ example: "🌟" })
  @IsString()
  icon!: string;

  @ApiProperty({
    example: { type: "TOTAL_CONTRIBUTION", threshold: 1000 },
    description: "JSON rule configuration for earning the reward",
  })
  @IsObject()
  criteria!: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateRewardDefinitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  criteria?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FulfilmentQueryDto {
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

  @ApiPropertyOptional({ enum: ["PENDING", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rewardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateFulfilmentDto {
  @ApiProperty({ enum: ["PENDING", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"], example: "DISPATCHED" })
  @IsEnum(["PENDING", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED"])
  status!: string;

  @ApiPropertyOptional({ example: "GB123456789" })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: "Royal Mail" })
  @IsOptional()
  @IsString()
  courier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
