import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

/**
 * Admin request to issue a catalogued MCOM reward to a recipient.
 * Code-based rewards need only an email; point offers additionally require the
 * recipient to resolve to a Participant in MCOM Rewards (mcomUserId).
 */
export class IssueMcomRewardDto {
  @IsString()
  mcomRewardId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mcomUserId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  rewardConfigId?: string;

  /**
   * Sponsoring business whose MCOM entitlement is checked. When omitted, it is
   * resolved from `campaignId` (the campaign owner's Central id/email).
   */
  @IsOptional()
  @IsString()
  businessMcomUserId?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
