import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { BusinessSettingsService } from "../services/business-settings.service";
import { UpdateBusinessSettingsDto } from "../dto/update-business-settings.dto";

@ApiTags("Business Settings & Preferences")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business")
export class BusinessSettingsController {
  constructor(private readonly settingsService: BusinessSettingsService) {}

  @Get("settings")
  @ApiOperation({
    summary: "Get business settings",
    description: "Returns email alert toggles, notification preferences, and digest settings.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved settings" })
  async getSettings(@CurrentBusiness("id") businessId: string) {
    return this.settingsService.getSettings(businessId);
  }

  @Patch("settings")
  @ApiOperation({
    summary: "Update business settings",
    description: "Updates email notification toggles and digest frequencies.",
  })
  @ApiResponse({ status: 200, description: "Successfully updated settings" })
  async updateSettings(
    @CurrentBusiness("id") businessId: string,
    @Body() dto: UpdateBusinessSettingsDto,
  ) {
    return this.settingsService.updateSettings(businessId, dto);
  }
}
