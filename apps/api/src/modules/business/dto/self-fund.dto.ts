import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class SelfFundDto {
  @ApiProperty({
    description: "Amount to contribute in pence (£100.00 = 10000)",
    example: 10000,
    minimum: 100,
  })
  @IsInt()
  @Min(100)
  amount!: number;

  @ApiProperty({
    description: "Payment gateway identifier (e.g. stripe, paypal)",
    example: "stripe",
  })
  @IsString()
  @IsNotEmpty()
  gateway!: string;

  @ApiProperty({
    description: "Gateway payment token or payment intent ID",
    example: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
  })
  @IsString()
  @IsNotEmpty()
  paymentToken!: string;
}
