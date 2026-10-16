import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

/**
 * A single reward eligibility condition. Money is in pence. Mirrors the
 * canonical `conditions[]` shape used by `CampaignTemplate.rewardsConfig`, so
 * the trigger engine can normalise and enforce both identically.
 */
export class RewardConditionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsInt()
  minPence?: number | null;

  @IsOptional()
  @IsInt()
  maxPence?: number | null;

  @IsOptional()
  @IsInt()
  exactPence?: number | null;
}

/**
 * Attach one of the business's own MCOM Rewards (created in MCOM Rewards) to a
 * campaign it runs. Only allowed when the campaign's template has
 * `businessRewardsMode = "enabled"`.
 */
export class AttachCampaignRewardDto {
  @IsString()
  businessRewardId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardConditionDto)
  conditions?: RewardConditionDto[];

  @IsOptional()
  @IsIn(["independent", "cumulative"])
  qualificationMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
