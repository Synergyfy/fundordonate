import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export enum LeaderboardScope {
  NATIONAL = "national",
  CITY = "city",
  LOCAL_AREA = "local_area",
  HIGH_STREET = "high_street",
}

export class LeaderboardQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: LeaderboardScope,
    default: LeaderboardScope.CITY,
    description: "Geographic ranking scope",
  })
  @IsOptional()
  @IsEnum(LeaderboardScope)
  scope?: LeaderboardScope = LeaderboardScope.CITY;

  @ApiPropertyOptional({
    description: "Location slug or identifier (e.g. 'manchester', 'northern-quarter')",
    example: "manchester",
  })
  @IsOptional()
  @IsString()
  location?: string;
}
