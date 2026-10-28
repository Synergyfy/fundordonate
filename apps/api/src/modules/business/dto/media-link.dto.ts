import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class MediaLinkDto {
  @ApiProperty({ example: "https://cdn.example.com/campaign/hero.jpg" })
  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  url!: string;
}
