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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminSystemService } from "../services/admin-system.service";
import {
  AuditLogQueryDto,
  CreateEventDto,
  EventsQueryDto,
  SettingsQueryDto,
  UpdateEventDto,
  UpdateSettingsDto,
} from "../dto/system-admin.dto";

@ApiTags("Admin System")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  // ---------------------------------------------------------------------------
  // EVENTS MANAGEMENT
  // ---------------------------------------------------------------------------

  @Get("events")
  @ApiOperation({ summary: "List platform promotional and community events" })
  @ApiResponse({ status: 200, description: "Successfully retrieved events list" })
  async getEvents(@Query() query: EventsQueryDto) {
    return this.systemService.getEvents(query);
  }

  @Get("events/:id")
  @ApiOperation({ summary: "Get single event detail" })
  @ApiResponse({ status: 200, description: "Successfully retrieved event detail" })
  async getEvent(@Param("id") id: string) {
    return this.systemService.getEvent(id);
  }

  @Post("events")
  @ApiOperation({ summary: "Create a new promotional event" })
  @ApiResponse({ status: 201, description: "Event created successfully" })
  async createEvent(@Body() dto: CreateEventDto) {
    return this.systemService.createEvent(dto);
  }

  @Put("events/:id")
  @ApiOperation({ summary: "Update an existing promotional event" })
  @ApiResponse({ status: 200, description: "Event updated successfully" })
  async updateEvent(@Param("id") id: string, @Body() dto: UpdateEventDto) {
    return this.systemService.updateEvent(id, dto);
  }

  @Delete("events/:id")
  @ApiOperation({ summary: "Delete a promotional event" })
  @ApiResponse({ status: 200, description: "Event deleted successfully" })
  async deleteEvent(@Param("id") id: string) {
    return this.systemService.deleteEvent(id);
  }

  // ---------------------------------------------------------------------------
  // SETTINGS & CONFIGURATION
  // ---------------------------------------------------------------------------

  @Get("settings")
  @ApiOperation({ summary: "Get platform settings map (fee rules, limits, notifications)" })
  @ApiResponse({ status: 200, description: "Successfully retrieved settings" })
  async getSettings(@Query() query: SettingsQueryDto) {
    return this.systemService.getSettings(query.category);
  }

  @Put("settings")
  @ApiOperation({ summary: "Update platform settings map" })
  @ApiResponse({ status: 200, description: "Settings updated successfully" })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.systemService.updateSettings(dto);
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------

  @Get("audit-logs")
  @ApiOperation({ summary: "List administrative action audit logs with filter criteria" })
  @ApiResponse({ status: 200, description: "Successfully retrieved audit logs" })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.systemService.getAuditLogs(query);
  }
}
