import {
  Body,
  Controller,
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
import { OptionalJwtAuthGuard } from "@/auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { SupportService } from "./support.service";
import { CreateTicketDto, UpdateTicketDto } from "./dto/create-ticket.dto";

@ApiTags("Support")
@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post("support/tickets")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Submit a support ticket" })
  @ApiResponse({ status: 201, description: "Ticket created" })
  async create(
    @CurrentUser("id") userId: string | null,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.create(userId ?? null, dto);
  }

  @Get("admin/support/tickets")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: "List support tickets (admin)" })
  @ApiResponse({ status: 200, description: "Successfully retrieved tickets" })
  async list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.supportService.list({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  @Put("admin/support/tickets/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: "Update a support ticket status (admin)" })
  @ApiResponse({ status: 200, description: "Ticket updated" })
  async update(@Param("id") id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateStatus(id, dto.status);
  }
}
