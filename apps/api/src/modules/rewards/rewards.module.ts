import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { McomRewardsCatalogController } from "./controllers/mcom-rewards-catalog.controller";
import { McomWebhooksController } from "./controllers/mcom-webhooks.controller";
import { RewardEngineService } from "./services/reward-engine.service";
import { RewardTriggerService } from "./services/reward-trigger.service";
import { RewardReservationService } from "./services/reward-reservation.service";
import { RewardIssueQueueService } from "./services/reward-issue-queue.service";
import { RewardRevokeQueueService } from "./services/reward-revoke-queue.service";
import { RewardReconciliationService } from "./services/reward-reconciliation.service";
import { RewardIssueProcessor } from "./processors/reward-issue.processor";
import { RewardRevokeProcessor } from "./processors/reward-revoke.processor";
import { RewardReconcileProcessor } from "./processors/reward-reconcile.processor";
import {
  REWARD_ISSUE_DLQ,
  REWARD_ISSUE_QUEUE,
  REWARD_RECONCILE_QUEUE,
  REWARD_REVOKE_QUEUE,
} from "./rewards.queues";

/**
 * MCOM Rewards ecosystem integration.
 *
 * `RewardsClient` and `McomRewardsWebhookService` are provided by the global
 * `McomModule`; this module wires the HTTP surface (admin catalogue proxy /
 * issue + inbound webhook receiver), the reward trigger engine, the durable
 * issuance + revocation queues, the race-safe reservation layer and the
 * reconciliation safety net.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: REWARD_ISSUE_QUEUE },
      { name: REWARD_ISSUE_DLQ },
      { name: REWARD_REVOKE_QUEUE },
      { name: REWARD_RECONCILE_QUEUE },
    ),
  ],
  controllers: [McomRewardsCatalogController, McomWebhooksController],
  providers: [
    RewardEngineService,
    RewardReservationService,
    RewardTriggerService,
    RewardIssueQueueService,
    RewardRevokeQueueService,
    RewardReconciliationService,
    RewardIssueProcessor,
    RewardRevokeProcessor,
    RewardReconcileProcessor,
  ],
  exports: [
    RewardEngineService,
    RewardReservationService,
    RewardTriggerService,
    RewardIssueQueueService,
    RewardRevokeQueueService,
    RewardReconciliationService,
  ],
})
export class RewardsModule {}
