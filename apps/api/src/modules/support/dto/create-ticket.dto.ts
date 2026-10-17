import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTicketDto {
  @ApiProperty({ example: "Jane Smith" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: "jane@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "general" })
  @IsString()
  topic!: string;

  @ApiPropertyOptional({ example: "Question about my contribution" })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: "I'd like to know how my contribution is being used." })
  @IsString()
  @MinLength(10)
  message!: string;

  @ApiPropertyOptional({ example: "web" })
  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateTicketDto {
  @ApiProperty({ example: "RESOLVED" })
  @IsString()
  status!: string;
}
