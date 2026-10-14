import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ example: "admin@fundordonate.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Admin123!" })
  @IsString()
  @MinLength(1)
  password!: string;
}
