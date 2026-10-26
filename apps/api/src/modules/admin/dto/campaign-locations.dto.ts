import { ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsOptional, IsString } from "class-validator";

export class SetCampaignLocationsDto {
  @ApiPropertyOptional({
    description:
      "HubLocation ID that owns the campaign's financial progress. Omit to keep the current primary location.",
  })
  @IsOptional()
  @IsString()
  primaryLocationId?: string;

  @ApiPropertyOptional({
    description:
      "HubLocation IDs where the campaign is a secondary presence. Visibility-only unless promoted to primary.",
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  secondaryLocationIds?: string[];

  @ApiPropertyOptional({
    description:
      "Additional HubLocation IDs where the campaign is visible but whose funding is not counted.",
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  additionalLocationIds?: string[];
}
