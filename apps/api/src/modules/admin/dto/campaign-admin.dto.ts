import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  BusinessCampaignStatus,
  MembershipTier,
  TemplateApprovalMode,
  TemplateOrigin,
  TemplateStatus,
} from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class AdminCampaignQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: BusinessCampaignStatus })
  @IsOptional()
  @IsEnum(BusinessCampaignStatus)
  status?: BusinessCampaignStatus;

  @ApiPropertyOptional({ enum: ["business", "consumer", "all"] })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}

export class UpdateCampaignStatusDto {
  @ApiProperty({ enum: BusinessCampaignStatus, example: BusinessCampaignStatus.APPROVED })
  @IsEnum(BusinessCampaignStatus)
  status!: BusinessCampaignStatus;

  @ApiPropertyOptional({ description: "Optional review note or feedback" })
  @IsOptional()
  @IsString()
  note?: string;
}

export class RequestCampaignChangesDto {
  @ApiProperty({ example: "campaign_title" })
  @IsString()
  fieldId!: string;

  @ApiProperty({ example: "Campaign Title" })
  @IsString()
  label!: string;

  @ApiProperty({ example: "Please refine the title to specify your high street location." })
  @IsString()
  note!: string;
}

export class BulkCampaignActionDto {
  @ApiProperty({ enum: ["approve", "reject", "archive"], example: "approve" })
  @IsEnum(["approve", "reject", "archive"])
  action!: "approve" | "reject" | "archive";

  @ApiProperty({ type: [String], example: ["campaign-uuid-1", "campaign-uuid-2"] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  campaignIds!: string[];
}

export class CreateCampaignTemplateDto {
  @ApiProperty({ example: "Winter High Street Funding Campaign" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "winter-high-street-funding-campaign" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: "Empower local businesses through high street community collaboration" })
  @IsString()
  tagline!: string;

  @ApiPropertyOptional({ description: "Optional Season ID" })
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional({ enum: TemplateOrigin, default: TemplateOrigin.DIRECT })
  @IsOptional()
  @IsEnum(TemplateOrigin)
  origin?: TemplateOrigin = TemplateOrigin.DIRECT;

  @ApiPropertyOptional({ enum: TemplateApprovalMode, default: TemplateApprovalMode.ADMIN_REVIEW })
  @IsOptional()
  @IsEnum(TemplateApprovalMode)
  approvalMode?: TemplateApprovalMode = TemplateApprovalMode.ADMIN_REVIEW;

  @ApiPropertyOptional({ enum: TemplateStatus, default: TemplateStatus.DRAFT })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus = TemplateStatus.DRAFT;

  @ApiPropertyOptional({ example: "fund", description: "donation | crowdfunding | fund" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ["BUSINESS", "CONSUMER", "BOTH"], default: "BOTH" })
  @IsOptional()
  @IsString()
  audience?: string = "BOTH";

  @ApiPropertyOptional({ enum: MembershipTier, default: MembershipTier.BRONZE })
  @IsOptional()
  @IsEnum(MembershipTier)
  minEligibilityTier?: MembershipTier = MembershipTier.BRONZE;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  minContributionRequired?: boolean = false;

  @ApiPropertyOptional({ default: 0, description: "Amount in pence" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minContributionAmount?: number = 0;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  selfFundingEnabled?: boolean = true;

  @ApiPropertyOptional({ default: "optional" })
  @IsOptional()
  @IsString()
  selfFundingMode?: string = "optional";

  @ApiPropertyOptional({ default: 10000, description: "Self funding amount in pence" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  selfFundingAmount?: number = 10000;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selfFundingRewardName?: string;

  @ApiPropertyOptional({
    enum: ["disabled", "coexist", "replace"],
    default: "disabled",
    description:
      "How a claiming business's own MCOM Rewards interact with the template rewards: disabled (not allowed), coexist (added alongside), or replace (supersede the template rewards).",
  })
  @IsOptional()
  @IsIn(["disabled", "coexist", "replace", "enabled"])
  businessRewardsMode?: string = "disabled";

  @ApiPropertyOptional({ description: "Array of fields schema" })
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  fieldsConfig?: any[];

  @ApiPropertyOptional({ description: "Array of rewards configuration" })
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  rewardsConfig?: any[];

  @ApiPropertyOptional({ description: "Array of assets configuration" })
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  mcomAssetsConfig?: any[];

  @ApiPropertyOptional({ description: "Array of requirements configuration" })
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  requirementsConfig?: any[];

  @ApiPropertyOptional({
    description:
      "Full wizard configuration (sections, funding, location, visibility, access, contribution rules)",
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateCampaignTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional({ enum: TemplateOrigin })
  @IsOptional()
  @IsEnum(TemplateOrigin)
  origin?: TemplateOrigin;

  @ApiPropertyOptional({ enum: TemplateApprovalMode })
  @IsOptional()
  @IsEnum(TemplateApprovalMode)
  approvalMode?: TemplateApprovalMode;

  @ApiPropertyOptional({ enum: TemplateStatus })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({ description: "donation | crowdfunding | fund" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ["BUSINESS", "CONSUMER", "BOTH"] })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ enum: MembershipTier })
  @IsOptional()
  @IsEnum(MembershipTier)
  minEligibilityTier?: MembershipTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  minContributionRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minContributionAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  selfFundingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selfFundingMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  selfFundingAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selfFundingRewardName?: string;

  @ApiPropertyOptional({ enum: ["disabled", "coexist", "replace"] })
  @IsOptional()
  @IsIn(["disabled", "coexist", "replace", "enabled"])
  businessRewardsMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  fieldsConfig?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  rewardsConfig?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  mcomAssetsConfig?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Object)
  @IsArray()
  requirementsConfig?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      "Full wizard configuration (sections, funding, location, visibility, access, contribution rules)",
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateCampaignTemplateStatusDto {
  @ApiProperty({ enum: TemplateStatus })
  @IsEnum(TemplateStatus)
  status!: TemplateStatus;
}

export class DuplicateCampaignTemplateDto {
  @ApiPropertyOptional({ description: "Name for the duplicated template" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}

export class InstantiateCampaignTemplateDto {
  @ApiPropertyOptional({
    type: [String],
    description: "Target business IDs to instantiate the template for",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessIds?: string[];

  @ApiPropertyOptional({
    description: "Instantiate for every business in this hub location",
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: "Target amount for each instance in pence" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetAmount?: number;

  @ApiPropertyOptional({ description: "Campaign duration in days" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deadlineDays?: number;

  @ApiPropertyOptional({
    description:
      "Force assignment, overriding eligibility. Only honoured when the template allows admin override.",
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
