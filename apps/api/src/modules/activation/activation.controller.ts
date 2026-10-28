import {
  Controller,
  Get,
  Param,
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
import { AdminGuard } from "@/modules/admin/guards/admin.guard";
import { ActivationService } from "./activation.service";

@ApiTags("Admin City Activation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/city-activation")
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Get("preview")
  @ApiOperation({
    summary: "Evaluate activation rules for every city without changing status",
    description:
      "Uses all active campaigns attributed to each city and returns metrics, rule outcomes and the projected next status.",
  })
  @ApiResponse({ status: 200, description: "Successfully evaluated cities" })
  async preview() {
    return this.activationService.evaluateAll({ apply: false });
  }

  @Post("run")
  @ApiOperation({
    summary: "Evaluate and promote cities that pass their activation rules",
    description:
      "Forward-only promotion: Inactive → Making Progress → Active. Manual status overrides are respected.",
  })
  @ApiResponse({ status: 200, description: "Activation evaluation completed" })
  async run() {
    return this.activationService.evaluateAll({ apply: true });
  }

  @Get(":cityId")
  @ApiOperation({ summary: "Evaluate one city without changing its status" })
  @ApiResponse({ status: 200, description: "Successfully evaluated city" })
  async previewCity(@Param("cityId") cityId: string) {
    return this.activationService.evaluateCity(cityId, { apply: false });
  }
}
