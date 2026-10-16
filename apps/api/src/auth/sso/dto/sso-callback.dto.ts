import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class SsoCallbackDto {
  @ApiProperty({ description: "Authorization code returned by MCOM Central" })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ description: "CSRF state value originally sent to Central" })
  @IsString()
  @MinLength(1)
  state!: string;
}
