import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export enum RevenueChartPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export class RevenueChartQueryDto {
  @ApiPropertyOptional({
    enum: RevenueChartPeriod,
    default: RevenueChartPeriod.MONTHLY,
    description: "Aggregation interval for revenue chart data",
  })
  @IsOptional()
  @IsEnum(RevenueChartPeriod)
  period?: RevenueChartPeriod = RevenueChartPeriod.MONTHLY;
}

export class RecentItemsQueryDto {
  @ApiPropertyOptional({
    default: 10,
    minimum: 1,
    maximum: 100,
    description: "Number of recent items to return",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
