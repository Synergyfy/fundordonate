import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export class AdminLeaderboardQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ["national", "city", "local_area", "high_street"],
    default: "national",
    description: "Geographic ranking scope",
  })
  @IsOptional()
  @IsIn(["national", "city", "local_area", "high_street"])
  scope?: "national" | "city" | "local_area" | "high_street" = "national";

  @ApiPropertyOptional({
    description: "Location name/slug used when scope is city, local_area, or high_street",
    example: "manchester",
  })
  @IsOptional()
  @IsString()
  location?: string;
}
