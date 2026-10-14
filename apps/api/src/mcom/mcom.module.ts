import { Global, Module } from "@nestjs/common";
import { TokenCipher } from "../common/crypto/token-cipher";
import { McomClient } from "./mcom.client";
import { EntitlementService } from "./entitlement.service";
import { McomPaymentsService } from "./mcom-payments.service";

@Global()
@Module({
  providers: [TokenCipher, McomClient, EntitlementService, McomPaymentsService],
  exports: [TokenCipher, McomClient, EntitlementService, McomPaymentsService],
})
export class McomModule {}
