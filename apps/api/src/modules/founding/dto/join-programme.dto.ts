import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class JoinProgrammeDto {
  @ApiProperty({ description: "Contribution amount in minor units (pence).", example: 5000 })
  @IsInt()
  @Min(0)
  contributionAmount!: number;

  @ApiPropertyOptional({ description: "Whether this is a recurring monthly membership." })
  @IsOptional()
  @IsBoolean()
  isMonthly?: boolean;

  @ApiPropertyOptional({ description: "Payment method used (stripe | paypal | wallet | offline)." })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: "Tier key (bronze | silver | gold | platinum)." })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: "Access level (standard | pro | pro_plus)." })
  @IsOptional()
  @IsString()
  accessLevel?: string;
}
