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
import { ApiExcludeController } from "@nestjs/swagger";
import { McomRewardsWebhookService } from "@/mcom/mcom-rewards-webhook.service";
import { McomEventVerifierService } from "@/mcom/mcom-event-verifier.service";
import type { McomRewardIssuance } from "@/mcom/rewards-client.service";

interface McomWebhookBody {
  event?: string;
  timestamp?: string;
  source?: string;
  data?: McomRewardIssuance;
}

/**
 * Inbound lifecycle events from MCOM Rewards.
 *
 * Public route authenticated by an RS256 Bearer service token (audience
 * `fundordonate`), verified offline via Central's JWKS — no HMAC / shared
 * secret. Served on the path MCOM Rewards is configured to push to
 * (`/api/v1/partner/events`); `/api/v1/webhooks/mcom` is kept as an alias.
 */
@ApiExcludeController()
@Controller()
export class McomWebhooksController {
  private readonly logger = new Logger(McomWebhooksController.name);

  constructor(
    private readonly webhookService: McomRewardsWebhookService,
    private readonly verifier: McomEventVerifierService,
  ) {}

  @Post(["partner/events", "webhooks/mcom"])
  @HttpCode(HttpStatus.OK)
  async handle(
    @Headers("authorization") authorization: string,
    @Headers("x-mcom-event") eventHeader: string,
    @Body() body: McomWebhookBody,
  ) {
    // Throws 401 when the token is missing/invalid/expired or has the wrong
    // issuer/audience.
    await this.verifier.verify(this.bearer(authorization));

    const event = eventHeader || body?.event || "unknown";
    if (!body?.data?.id) {
      this.logger.warn(`MCOM event ${event} missing data.id — acknowledged, ignored`);
      return { received: true };
    }

    await this.webhookService.handleEvent(event, body.data);
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
