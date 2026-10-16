import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class SsoDirectLoginDto {
  @ApiProperty({ description: "Short-lived handshake JWT issued by MCOM Central" })
  @IsString()
  @MinLength(1)
  token!: string;
}
