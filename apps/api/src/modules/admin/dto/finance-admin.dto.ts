import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContributionStatus, ContributionType } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class DonationsQueryDto {
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

  @ApiPropertyOptional({ enum: ContributionStatus })
  @IsOptional()
  @IsEnum(ContributionStatus)
  status?: ContributionStatus;

  @ApiPropertyOptional({ enum: ContributionType })
  @IsOptional()
  @IsEnum(ContributionType)
  type?: ContributionType;

  @ApiPropertyOptional({ description: "Filter by gateway (e.g. stripe, mcom_wallet)" })
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional({ description: "Search by reference, backer email, or business name" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter from date (ISO string)" })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Filter to date (ISO string)" })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class RefundDonationDto {
  @ApiPropertyOptional({ example: 2500, description: "Refund amount in pence (defaults to full contribution amount)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ example: "Customer requested cancellation within cooling period." })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PayoutsQueryDto {
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

  @ApiPropertyOptional({ enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "Filter by business ID" })
  @IsOptional()
  @IsString()
  businessId?: string;
}

export class UpdatePayoutStatusDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED", "COMPLETED"], example: "APPROVED" })
  @IsEnum(["APPROVED", "REJECTED", "COMPLETED"])
  status!: "APPROVED" | "REJECTED" | "COMPLETED";

  @ApiPropertyOptional({ example: "Bank account details mismatch" })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
