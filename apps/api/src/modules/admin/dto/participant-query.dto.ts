import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BusinessStatus, MembershipTier } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class UsersQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by role: admin | fundraiser | backer | donor" })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: "Filter by userType: admin | business | consumer" })
  @IsOptional()
  @IsString()
  userType?: string;

  @ApiPropertyOptional({ description: "Search by email, username, or name" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: "fundraiser", description: "Role to set: admin | fundraiser | collaborator | backer | donor" })
  @IsString()
  role!: string;
}

export class BusinessesQueryDto {
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

  @ApiPropertyOptional({ enum: BusinessStatus })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ enum: MembershipTier })
  @IsOptional()
  @IsEnum(MembershipTier)
  membershipTier?: MembershipTier;

  @ApiPropertyOptional({ description: "Filter by city" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: "Search by business name, slug, or email" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class VerifyBusinessDto {
  @ApiProperty({ enum: BusinessStatus, example: BusinessStatus.ACTIVE })
  @IsEnum(BusinessStatus)
  status!: BusinessStatus;
}

export class UpdateBusinessTierDto {
  @ApiProperty({ enum: MembershipTier, example: MembershipTier.GOLD })
  @IsEnum(MembershipTier)
  membershipTier!: MembershipTier;
}

export class ConsumersQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by city" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: "Search by name, email, or username" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class BackersQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by membership level" })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: "Filter by city" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: "Search by backer name, email, or username" })
  @IsOptional()
  @IsString()
  search?: string;
}
