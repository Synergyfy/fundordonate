import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
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

export class EventsQueryDto {
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

  @ApiPropertyOptional({ enum: ["NATIONAL", "CITY", "LOCAL"] })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: "Manchester High Street Autumn Showcase" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ["NATIONAL", "CITY", "LOCAL"], default: "NATIONAL" })
  @IsOptional()
  @IsEnum(["NATIONAL", "CITY", "LOCAL"])
  scope?: string = "NATIONAL";

  @ApiPropertyOptional({ description: "Location ID if scope is CITY or LOCAL" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ example: "2026-10-25T18:00:00Z" })
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ example: "2026-10-25T21:00:00Z" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: "Oldham Street Community Hall, Manchester" })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ["NATIONAL", "CITY", "LOCAL"] })
  @IsOptional()
  @IsEnum(["NATIONAL", "CITY", "LOCAL"])
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SettingsQueryDto {
  @ApiPropertyOptional({ description: "Filter settings by category: general | payment | fee | security | notifications" })
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ description: "Key-value map of configuration properties to persist" })
  @IsObject()
  settings!: Record<string, any>;
}

export class AuditLogQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by entity type (e.g. campaign, business, user, season)" })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: "Filter from date (ISO string)" })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Filter to date (ISO string)" })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
