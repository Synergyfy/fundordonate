import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import { AuditDataService } from "@/modules/audit/services/audit-data.service";
import type { AuditStatusView } from "@/modules/audit/audit.types";

/**
 * Business-facing 247GBS Audit surface. The pre-audit/audit data itself is
 * owned by 247GBS Audit; these routes expose FundOrDonate's local snapshot of
 * it, plus a live refresh and deep links for the not-shared states.
 */
@ApiTags("Business Audit")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business")
export class BusinessAuditController {
  constructor(
    private readonly auditData: AuditDataService,
    private readonly config: ConfigService,
  ) {}

  @Get("me/audit")
  @ApiOperation({
    summary: "Get the business's 247GBS Audit status",
    description:
      "Returns the owner's linked pre-audit + audit snapshot (refreshing it when stale), including funding diagnostic, recommended audit type and deep links when the data is not shared.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved audit status" })
  async getAuditStatus(@CurrentBusiness("id") businessId: string) {
    const status = await this.auditData.refreshIfStale(businessId);
    return this.withDeepLinks(status);
  }

  @Post("me/audit/refresh")
  @ApiOperation({
    summary: "Force a refresh of the 247GBS Audit snapshot",
    description:
      "Performs a live delegated read against 247GBS Audit and persists the result.",
  })
  @ApiResponse({ status: 200, description: "Snapshot refreshed" })
  async refresh(@CurrentBusiness("id") businessId: string) {
    const status = await this.auditData.refresh(businessId);
    return this.withDeepLinks(status);
  }

  @Get("me/audit/sessions")
  @ApiOperation({
    summary: "List the business's mirrored audit sessions",
    description: "Returns the locally mirrored 247GBS audit sessions and metrics.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved audit sessions" })
  async listSessions(@CurrentBusiness("id") businessId: string) {
    return this.auditData.listSessions(businessId);
  }

  private withDeepLinks(status: AuditStatusView) {
    const webUrl = (this.config.get<string>("audit.webUrl") ?? "").replace(
      /\/+$/,
      "",
    );
    return {
      ...status,
      deepLinks: webUrl
        ? {
            preAudit: `${webUrl}/audit/pre-audit`,
            signIn: `${webUrl}/auth/signin`,
          }
        : null,
    };
  }
}
