import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { FoundingService } from "./founding.service";
import { JoinProgrammeDto } from "./dto/join-programme.dto";

@ApiTags("Founding Membership Programmes")
@Controller("founding")
export class FoundingController {
  constructor(private readonly foundingService: FoundingService) {}

  @Get("programmes")
  @ApiOperation({ summary: "List founding programmes for a location (id or slug)" })
  @ApiResponse({ status: 200, description: "Successfully retrieved programmes" })
  async getProgrammes(@Query("locationId") locationId: string) {
    return this.foundingService.getProgrammes(locationId);
  }

  @Get("my-memberships")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the current user's founding memberships" })
  @ApiResponse({ status: 200, description: "Successfully retrieved memberships" })
  async getMyMemberships(@CurrentUser("id") userId: string) {
    return this.foundingService.getMyMemberships(userId);
  }

  @Get("contributor-profile/:userId")
  @ApiOperation({ summary: "Get a contributor's founding profile" })
  @ApiResponse({ status: 200, description: "Successfully retrieved contributor profile" })
  async getContributorProfile(@Param("userId") userId: string) {
    return this.foundingService.getContributorProfile(userId);
  }

  @Get("check-original")
  @ApiOperation({ summary: "Check whether a user is an Original Founding Member for a location" })
  @ApiResponse({ status: 200, description: "Successfully checked original status" })
  async checkOriginal(
    @Query("userId") userId: string,
    @Query("locationId") locationId: string,
  ) {
    return this.foundingService.checkOriginal(userId, locationId);
  }

  @Get("programmes/:id")
  @ApiOperation({ summary: "Get a single founding programme" })
  @ApiResponse({ status: 200, description: "Successfully retrieved programme" })
  async getProgramme(@Param("id") id: string) {
    return this.foundingService.getProgramme(id);
  }

  @Get("programmes/:id/members")
  @ApiOperation({ summary: "List members of a founding programme" })
  @ApiResponse({ status: 200, description: "Successfully retrieved members" })
  async getProgrammeMembers(@Param("id") id: string) {
    return this.foundingService.getProgrammeMembers(id);
  }

  @Post("programmes/:id/join")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Join a founding programme" })
  @ApiResponse({ status: 201, description: "Successfully joined programme" })
  async joinProgramme(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: JoinProgrammeDto,
  ) {
    return this.foundingService.joinProgramme(userId, id, dto);
  }
}
