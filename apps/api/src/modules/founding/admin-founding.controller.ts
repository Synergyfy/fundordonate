import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { FoundingService } from "./founding.service";
import {
  AdminProgrammeQueryDto,
  CreateFoundingProgrammeDto,
  UpdateFoundingProgrammeDto,
} from "./dto/admin-programme.dto";

@ApiTags("Admin — Founding Programmes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/founding")
export class AdminFoundingController {
  constructor(private readonly foundingService: FoundingService) {}

  @Get("programmes")
  @ApiOperation({ summary: "List founding programmes with location and member counts" })
  @ApiResponse({ status: 200, description: "Successfully retrieved founding programmes" })
  async listProgrammes(@Query() query: AdminProgrammeQueryDto) {
    return this.foundingService.adminListProgrammes(query);
  }

  @Get("memberships")
  @ApiOperation({ summary: "List founding memberships with programme and location context" })
  @ApiResponse({ status: 200, description: "Successfully retrieved founding memberships" })
  async listMemberships(
    @Query("programmeId") programmeId?: string,
    @Query("locationId") locationId?: string,
    @Query("audience") audience?: string,
    @Query("status") status?: string,
  ) {
    return this.foundingService.adminListMemberships({
      programmeId,
      locationId,
      audience: audience as any,
      status: status as any,
    });
  }

  @Post("programmes")
  @ApiOperation({ summary: "Create a location-scoped founding programme" })
  @ApiResponse({ status: 201, description: "Programme created" })
  async createProgramme(@Body() dto: CreateFoundingProgrammeDto) {
    return this.foundingService.createProgramme(dto);
  }

  @Put("programmes/:id")
  @ApiOperation({ summary: "Update a founding programme" })
  @ApiResponse({ status: 200, description: "Programme updated" })
  async updateProgramme(
    @Param("id") id: string,
    @Body() dto: UpdateFoundingProgrammeDto,
  ) {
    return this.foundingService.updateProgramme(id, dto);
  }

  @Delete("programmes/:id")
  @ApiOperation({ summary: "Delete an empty founding programme" })
  @ApiResponse({ status: 200, description: "Programme deleted" })
  async archiveProgramme(@Param("id") id: string) {
    return this.foundingService.archiveProgramme(id);
  }
}
