import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, ValidateNested } from "class-validator";
import { CampaignFieldAnswerDto } from "./campaign-field-answer.dto";

export class SaveCampaignAnswersDto {
  @ApiProperty({
    type: [CampaignFieldAnswerDto],
    description: "Collection of field answers submitted by the business owner",
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CampaignFieldAnswerDto)
  answers!: CampaignFieldAnswerDto[];
}
