import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateBusinessSettingsDto {
  @ApiPropertyOptional({ description: "Toggle email alerts", example: true })
  @IsOptional()
  @IsBoolean()
  emailAlerts?: boolean;

  @ApiPropertyOptional({ description: "Toggle campaign update alerts", example: true })
  @IsOptional()
  @IsBoolean()
  campaignUpdates?: boolean;

  @ApiPropertyOptional({ description: "Toggle leaderboard rank shift alerts", example: true })
  @IsOptional()
  @IsBoolean()
  leaderboardChanges?: boolean;

  @ApiPropertyOptional({ description: "Toggle rewards unlocked alerts", example: true })
  @IsOptional()
  @IsBoolean()
  rewardsEarned?: boolean;

  @ApiPropertyOptional({ description: "Toggle new backer alerts", example: false })
  @IsOptional()
  @IsBoolean()
  newBackers?: boolean;

  @ApiPropertyOptional({ description: "Toggle weekly summary digest", example: true })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;
}
