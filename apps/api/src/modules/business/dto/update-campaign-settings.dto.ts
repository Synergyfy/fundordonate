import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";

export class UpdateCampaignSettingsDto {
  @ApiProperty({
    description:
      "Campaign presentation settings, e.g. { faqs: [...], terms: {...} }",
    type: Object,
  })
  @IsObject()
  settings!: Record<string, unknown>;
}
