import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Query params for browsing the MCOM Rewards catalogue (proxied to the
 * provider API). Mirrors the provider's `page/limit/search/rewardType/audience`.
 */
export class McomRewardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  rewardType?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  /**
   * Filter by reward source. Use `"mcom vault"` for admin/MCOM-created rewards
   * (the only ones that can be gifted via `/partner/rewards/{id}/gift`).
   */
  @IsOptional()
  @IsString()
  source?: string;
}
