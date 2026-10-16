import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CampaignFieldAnswerDto {
  @ApiProperty({
    description: "Unique identifier of the template field being answered",
    example: "community_goal",
  })
  @IsString()
  @IsNotEmpty()
  fieldId!: string;

  @ApiProperty({
    description: "Value submitted by the business owner for the field",
    example: "Provide 1,000 warm meals during the winter holidays",
  })
  @IsString()
  @IsNotEmpty()
  value!: string;
}
