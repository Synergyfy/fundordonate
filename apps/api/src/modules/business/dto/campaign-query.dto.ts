import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { BusinessCampaignStatus } from "@prisma/client";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";

export class CampaignQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: BusinessCampaignStatus,
    description: "Filter campaigns by operational status",
  })
  @IsOptional()
  @IsEnum(BusinessCampaignStatus)
  status?: BusinessCampaignStatus;
}
