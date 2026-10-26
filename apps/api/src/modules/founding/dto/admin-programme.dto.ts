import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FoundingAudience, FoundingProgrammeStatus } from "@prisma/client";
import {
  IsArray,
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

export class AdminProgrammeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ enum: FoundingAudience })
  @IsOptional()
  @IsEnum(FoundingAudience)
  audience?: FoundingAudience;

  @ApiPropertyOptional({ enum: FoundingProgrammeStatus })
  @IsOptional()
  @IsEnum(FoundingProgrammeStatus)
  status?: FoundingProgrammeStatus;
}

export class CreateFoundingProgrammeDto {
  @ApiProperty({ description: "HubLocation ID the programme belongs to" })
  @IsString()
  locationId!: string;

  @ApiProperty({ enum: FoundingAudience })
  @IsEnum(FoundingAudience)
  audience!: FoundingAudience;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FoundingProgrammeStatus, default: FoundingProgrammeStatus.OPEN })
  @IsOptional()
  @IsEnum(FoundingProgrammeStatus)
  status?: FoundingProgrammeStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAllocation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiPropertyOptional({ description: "Price matrix keyed by metal_level (pence)" })
  @IsOptional()
  @IsObject()
  contributionConfig?: Record<string, number>;

  @ApiPropertyOptional({ description: "Benefit keys granted to members" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefitConfig?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  eligibilityConfig?: Record<string, unknown>;
}

export class UpdateFoundingProgrammeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FoundingProgrammeStatus })
  @IsOptional()
  @IsEnum(FoundingProgrammeStatus)
  status?: FoundingProgrammeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAllocation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  contributionConfig?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefitConfig?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  eligibilityConfig?: Record<string, unknown>;
}
