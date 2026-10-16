import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { ContributionType } from "@prisma/client";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export class ContributionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ContributionType,
    description: "Filter contributions by channel (IN_STORE, ONLINE, FUNDING_SPLIT, SELF_FUNDING)",
  })
  @IsOptional()
  @IsEnum(ContributionType)
  type?: ContributionType;

  @ApiPropertyOptional({
    description: "Filter transactions from date (ISO 8601 string)",
    example: "2026-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Filter transactions to date (ISO 8601 string)",
    example: "2026-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
