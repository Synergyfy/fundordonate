import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiExcludeController } from "@nestjs/swagger";
import { McomEventVerifierService } from "@/mcom/mcom-event-verifier.service";
import { AuditReconciliationService } from "../services/audit-reconciliation.service";

interface AuditCompletedBody {
  auditId?: string;
  mcomUserId?: string | null;
  status?: string;
  auditType?: string | null;
  sectorId?: string | null;
  calculatedMetrics?: Record<string, unknown> | null;
  completedAt?: string;
}

/**
 * Inbound "audit completed" event from 247GBS Audit (optional).
 *
 * Authenticated by an RS256 **service token** with `aud=fundordonate`,
 * `sub=247gbs-audit` and scope `audit:write`, verified offline via Central's
 * JWKS — no shared secret. The provider logs and swallows failures and does not
 * retry, so this is a *freshness optimization only*: the authoritative repair
 * path is {@link AuditReconciliationService}.
 *
 * Served at the path 247GBS Audit is configured to push to
 * (`/api/v1/partner/audit-events`).
 */
@ApiExcludeController()
@Controller()
export class AuditEventsController {
  private readonly logger = new Logger(AuditEventsController.name);

  constructor(
    private readonly reconciliation: AuditReconciliationService,
    private readonly verifier: McomEventVerifierService,
    private readonly config: ConfigService,
  ) {}

  @Post("partner/audit-events")
  @HttpCode(HttpStatus.OK)
  async handle(
    @Headers("authorization") authorization: string,
    @Body() body: AuditCompletedBody,
  ) {
    await this.verifier.verify(this.bearer(authorization), {
      expectedSub: "247gbs-audit",
      requiredScopes: [
        this.config.get<string>("audit.eventScope") ?? "audit:write",
      ],
    });

    const mcomUserId = body?.mcomUserId ?? null;
    if (!mcomUserId) {
      this.logger.warn(
        `Audit event ${body?.auditId ?? "(no id)"} carried no mcomUserId — acknowledged, ignored`,
      );
      return { received: true };
    }

    await this.reconciliation.enqueueByMcomUserId(mcomUserId);
    return { received: true };
  }

  private bearer(header?: string): string {
    if (!header) {
      throw new UnauthorizedException("Missing MCOM event token");
    }
    const [scheme, value] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !value) {
      throw new UnauthorizedException("Invalid Authorization header");
    }
    return value;
  }
}
