import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminParticipantsService } from "../services/admin-participants.service";
import {
  BackersQueryDto,
  BusinessesQueryDto,
  ConsumersQueryDto,
  UpdateBusinessTierDto,
  UpdateUserRoleDto,
  UsersQueryDto,
  VerifyBusinessDto,
} from "../dto/participant-query.dto";
import { Request } from "express";

@ApiTags("Admin Participants")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminParticipantsController {
  constructor(private readonly participantsService: AdminParticipantsService) {}

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------

  @Get("users")
  @ApiOperation({ summary: "List registered platform users with filters" })
  @ApiResponse({ status: 200, description: "Successfully retrieved users list" })
  async getUsers(@Query() query: UsersQueryDto) {
    return this.participantsService.getUsers(query);
  }

  @Get("users/:id")
  @ApiOperation({ summary: "Get single user details with profile and contributions" })
  @ApiResponse({ status: 200, description: "Successfully retrieved user detail" })
  async getUser(@Param("id") id: string) {
    return this.participantsService.getUser(id);
  }

  @Put("users/:id/role")
  @ApiOperation({ summary: "Update role permissions for a user" })
  @ApiResponse({ status: 200, description: "User role updated successfully" })
  async updateUserRole(
    @Param("id") id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.id;
    return this.participantsService.updateUserRole(id, dto, adminUserId);
  }

  // ---------------------------------------------------------------------------
  // BUSINESSES
  // ---------------------------------------------------------------------------

  @Get("businesses")
  @ApiOperation({ summary: "List businesses with status, category, and tier filters" })
  @ApiResponse({ status: 200, description: "Successfully retrieved businesses list" })
  async getBusinesses(@Query() query: BusinessesQueryDto) {
    return this.participantsService.getBusinesses(query);
  }

  @Get("businesses/:id")
  @ApiOperation({ summary: "Get single business details with owner, campaigns, and settings" })
  @ApiResponse({ status: 200, description: "Successfully retrieved business detail" })
  async getBusiness(@Param("id") id: string) {
    return this.participantsService.getBusiness(id);
  }

  @Put("businesses/:id/verification")
  @ApiOperation({ summary: "Update business verification status (ACTIVE, SUSPENDED, PENDING)" })
  @ApiResponse({ status: 200, description: "Verification status updated successfully" })
  async verifyBusiness(
    @Param("id") id: string,
    @Body() dto: VerifyBusinessDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.id;
    return this.participantsService.verifyBusiness(id, dto, adminUserId);
  }

  @Put("businesses/:id/tier")
  @ApiOperation({ summary: "Update business membership tier (BRONZE, SILVER, GOLD, PLATINUM)" })
  @ApiResponse({ status: 200, description: "Membership tier updated successfully" })
  async updateBusinessTier(
    @Param("id") id: string,
    @Body() dto: UpdateBusinessTierDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)?.id;
    return this.participantsService.updateBusinessTier(id, dto, adminUserId);
  }

  // ---------------------------------------------------------------------------
  // CONSUMERS & BACKERS
  // ---------------------------------------------------------------------------

  @Get("consumers")
  @ApiOperation({ summary: "List consumer profiles with participation records" })
  @ApiResponse({ status: 200, description: "Successfully retrieved consumers list" })
  async getConsumers(@Query() query: ConsumersQueryDto) {
    return this.participantsService.getConsumers(query);
  }

  @Get("backers")
  @ApiOperation({ summary: "List backers with total contributions and backing history" })
  @ApiResponse({ status: 200, description: "Successfully retrieved backers list" })
  async getBackers(@Query() query: BackersQueryDto) {
    return this.participantsService.getBackers(query);
  }

  @Get("founding-members")
  @ApiOperation({ summary: "List founding members with active subscription & tier details" })
  @ApiResponse({ status: 200, description: "Successfully retrieved founding members list" })
  async getFoundingMembers() {
    return this.participantsService.getFoundingMembers();
  }
}
