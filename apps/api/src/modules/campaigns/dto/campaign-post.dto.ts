import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateCampaignPostDto {
  @ApiProperty({ description: "Short update title", maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: "Update body (HTML supported)" })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content!: string;
}

export class UpdateCampaignPostDto {
  @ApiProperty({ required: false, maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiProperty({ required: false, description: "Update body (HTML supported)" })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content?: string;
}
