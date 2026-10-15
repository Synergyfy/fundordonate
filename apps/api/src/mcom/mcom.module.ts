import { Global, Module } from "@nestjs/common";
import { TokenCipher } from "../common/crypto/token-cipher";
import { McomClient } from "./mcom.client";
import { EntitlementService } from "./entitlement.service";
import { McomPaymentsService } from "./mcom-payments.service";
import { RewardsClient } from "./rewards-client.service";
import { McomRewardsWebhookService } from "./mcom-rewards-webhook.service";

@Global()
@Module({
  providers: [
    TokenCipher,
    McomClient,
    EntitlementService,
    McomPaymentsService,
    RewardsClient,
    McomRewardsWebhookService,
  ],
  exports: [
    TokenCipher,
    McomClient,
    EntitlementService,
    McomPaymentsService,
    RewardsClient,
    McomRewardsWebhookService,
  ],
})
export class McomModule {}
