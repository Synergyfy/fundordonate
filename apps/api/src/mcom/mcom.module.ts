import { Global, Module } from "@nestjs/common";
import { TokenCipher } from "../common/crypto/token-cipher";
import { McomClient } from "./mcom.client";
import { EntitlementService } from "./entitlement.service";
import { McomPaymentsService } from "./mcom-payments.service";
import { RewardsClient } from "./rewards-client.service";
import { McomRewardsWebhookService } from "./mcom-rewards-webhook.service";
import { McomEventVerifierService } from "./mcom-event-verifier.service";

@Global()
@Module({
  providers: [
    TokenCipher,
    McomClient,
    EntitlementService,
    McomPaymentsService,
    RewardsClient,
    McomRewardsWebhookService,
    McomEventVerifierService,
  ],
  exports: [
    TokenCipher,
    McomClient,
    EntitlementService,
    McomPaymentsService,
    RewardsClient,
    McomRewardsWebhookService,
    McomEventVerifierService,
  ],
})
export class McomModule {}
