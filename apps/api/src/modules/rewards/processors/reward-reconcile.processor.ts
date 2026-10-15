import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";
import { RewardReconciliationService } from "../services/reward-reconciliation.service";
import {
  REWARD_RECONCILE_QUEUE,
  type ReconcileCampaignJobData,
} from "../rewards.queues";

// Re-exported for callers that only import the processor.
export { REWARD_RECONCILE_QUEUE } from "../rewards.queues";
export type { ReconcileCampaignJobData } from "../rewards.queues";

/**
 * Worker for the reconciliation safety net. Handles both the periodic
 * `reconcile-all` sweep (scheduled by {@link RewardReconciliationService}) and
 * ad-hoc `reconcile-campaign` jobs.
 */
@Processor(REWARD_RECONCILE_QUEUE)
export class RewardReconcileProcessor extends WorkerHost {
  private readonly logger = new Logger(RewardReconcileProcessor.name);

  constructor(private readonly reconciliation: RewardReconciliationService) {
    super();
  }

  async process(job: Job<ReconcileCampaignJobData>): Promise<unknown> {
    switch (job.name) {
      case "reconcile-all":
        return this.reconciliation.reconcileAll();

      case "reconcile-campaign": {
        const campaignId = job.data?.campaignId;
        if (!campaignId) {
          throw new UnrecoverableError("reconcile-campaign job is missing campaignId");
        }
        return this.reconciliation.reconcileCampaign(campaignId);
      }

      default:
        this.logger.warn(`Unknown reward-reconcile job: ${job.name}`);
        return null;
    }
  }
}
