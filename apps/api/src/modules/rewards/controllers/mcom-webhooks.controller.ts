import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request } from "express";
import { McomRewardsWebhookService } from "@/mcom/mcom-rewards-webhook.service";
import type { McomRewardIssuance } from "@/mcom/rewards-client.service";

interface McomWebhookBody {
  event?: string;
  data?: McomRewardIssuance;
}

/**
 * Inbound lifecycle webhooks from MCOM Rewards. Public route authenticated by
 * an HMAC-SHA256 signature over the raw body (`x-mcom-signature`).
 */
@ApiExcludeController()
@Controller("webhooks")
export class McomWebhooksController {
  private readonly logger = new Logger(McomWebhooksController.name);

  constructor(private readonly webhookService: McomRewardsWebhookService) {}

  @Post("mcom")
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("x-mcom-signature") signature: string,
    @Headers("x-mcom-event") eventHeader: string,
    @Body() body: McomWebhookBody,
  ) {
    const rawBody =
      req.rawBody ??
      Buffer.from(typeof body === "string" ? body : JSON.stringify(body));

    if (!this.webhookService.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException("Invalid MCOM webhook signature");
    }

    const event = eventHeader || body?.event || "unknown";
    if (!body?.data?.id) {
      this.logger.warn(`MCOM webhook ${event} missing data.id — acknowledged, ignored`);
      return { received: true };
    }

    await this.webhookService.handleEvent(event, body.data);
    return { received: true };
  }
}
