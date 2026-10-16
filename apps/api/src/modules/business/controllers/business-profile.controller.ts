import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { BusinessProfileService } from "../services/business-profile.service";
import { BusinessOnboardingDto } from "../dto/business-onboarding.dto";
import { UpdateBusinessProfileDto } from "../dto/update-business-profile.dto";

@ApiTags("Business Profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("business")
export class BusinessProfileController {
  constructor(private readonly profileService: BusinessProfileService) {}

  @Get("profile")
  @UseGuards(BusinessOwnerGuard)
  @ApiOperation({
    summary: "Get authenticated business profile",
    description: "Returns full details, location mapping, and membership tier for the authenticated business.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved business profile" })
  async getProfile(
    @CurrentBusiness("id") businessId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.profileService.getProfile(businessId, userId);
  }

  @Patch("profile")
  @UseGuards(BusinessOwnerGuard)
  @ApiOperation({
    summary: "Update business profile",
    description: "Updates contact details, description, categories, and media assets.",
  })
  @ApiResponse({ status: 200, description: "Successfully updated business profile" })
  async updateProfile(
    @CurrentBusiness("id") businessId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    return this.profileService.updateProfile(businessId, userId, dto);
  }

  @Post("onboarding")
  @ApiOperation({
    summary: "Complete business onboarding",
    description: "Initializes a business profile, connects location hierarchy, and provisions settings.",
  })
  @ApiResponse({ status: 201, description: "Business successfully onboarded" })
  async onboard(
    @CurrentUser("id") userId: string,
    @Body() dto: BusinessOnboardingDto,
  ) {
    return this.profileService.onboard(userId, dto);
  }
}
