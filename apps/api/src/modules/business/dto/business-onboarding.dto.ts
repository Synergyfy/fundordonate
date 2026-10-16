import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";
import { MembershipTier, PreferredAudience } from "@prisma/client";

export class BusinessOnboardingDto {
  @ApiProperty({ description: "Official business name", example: "Sarah's Bakery" })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty({ description: "Industry / business type", example: "Restaurant & Cafe" })
  @IsString()
  @IsNotEmpty()
  businessType!: string;

  @ApiPropertyOptional({ description: "Companies House registration number", example: "12345678" })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: "Detailed description of the business",
    example: "Artisan bakery serving the Northern Quarter community since 2019.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Primary contact email for the business", example: "sarah@sarahsbakery.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "Contact phone number", example: "+44 161 123 4567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Official website URL", example: "https://sarahsbakery.co.uk" })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: "City name", example: "Manchester" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ description: "Local area or borough", example: "Northern Quarter" })
  @IsString()
  @IsNotEmpty()
  localArea!: string;

  @ApiProperty({ description: "High street or commercial road", example: "Oldham Street" })
  @IsString()
  @IsNotEmpty()
  highStreet!: string;

  @ApiPropertyOptional({ description: "Full street address", example: "142 Oldham Street" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: "UK postcode", example: "M4 1LN" })
  @IsString()
  @IsNotEmpty()
  postcode!: string;

  @ApiProperty({ description: "Primary category", example: "Food & Drink" })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({ description: "Secondary categories", example: ["Bakery", "Community"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategories?: string[];

  @ApiPropertyOptional({
    enum: PreferredAudience,
    description: "Preferred audience orientation",
    default: PreferredAudience.BOTH,
  })
  @IsOptional()
  @IsEnum(PreferredAudience)
  preferredAudience?: PreferredAudience;

  @ApiPropertyOptional({ description: "Initial campaign goal orientation", example: "community" })
  @IsOptional()
  @IsString()
  campaignGoal?: string;

  @ApiPropertyOptional({
    enum: MembershipTier,
    description: "Selected membership tier",
    default: MembershipTier.BRONZE,
  })
  @IsOptional()
  @IsEnum(MembershipTier)
  membershipTier?: MembershipTier;

  @ApiPropertyOptional({ description: "Optional Pre-audit reference code", example: "AUD-000123" })
  @IsOptional()
  @IsString()
  auditReference?: string;
}
