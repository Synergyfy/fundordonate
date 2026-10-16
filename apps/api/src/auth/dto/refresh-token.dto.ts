import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: "The refresh token issued at login/register (optional if refresh_token cookie is present).",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  refreshToken?: string;
}
