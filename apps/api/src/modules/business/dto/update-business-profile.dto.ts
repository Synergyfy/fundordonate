import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";
import { PreferredAudience } from "@prisma/client";

export class UpdateBusinessProfileDto {
  @ApiPropertyOptional({ description: "Business display name", example: "Sarah's Bakery" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Industry / business type", example: "Restaurant & Cafe" })
  @IsOptional()
  @IsString()
  businessType?: string;

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

  @ApiPropertyOptional({ description: "Primary contact email", example: "sarah@sarahsbakery.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Contact phone number", example: "+44 161 123 4567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Official website URL", example: "https://sarahsbakery.co.uk" })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: "Logo image URL", example: "https://example.com/logo.png" })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: "Cover image URL", example: "https://example.com/cover.png" })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: "Primary category", example: "Food & Drink" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "Secondary categories", example: ["Bakery", "Community"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategories?: string[];

  @ApiPropertyOptional({
    enum: PreferredAudience,
    description: "Preferred audience orientation",
  })
  @IsOptional()
  @IsEnum(PreferredAudience)
  preferredAudience?: PreferredAudience;

  @ApiPropertyOptional({ description: "Campaign goal orientation", example: "community" })
  @IsOptional()
  @IsString()
  campaignGoal?: string;
}
