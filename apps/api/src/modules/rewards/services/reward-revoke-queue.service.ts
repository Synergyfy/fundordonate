import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { REWARD_REVOKE_QUEUE, type RewardRevokeJobData } from "../rewards.queues";
import { RewardEngineService } from "./reward-engine.service";

/**
 * Producer for the reward-revoke queue. Refunds enqueue here so revocation is
 * durable and retried (a provider outage must not leave a refunded backer with
 * a live reward). Idempotent per contribution; falls back to an inline attempt
 * if the queue is unavailable.
 */
@Injectable()
export class RewardRevokeQueueService {
  private readonly logger = new Logger(RewardRevokeQueueService.name);

  constructor(
    @InjectQueue(REWARD_REVOKE_QUEUE) private readonly queue: Queue<RewardRevokeJobData>,
    private readonly rewardEngine: RewardEngineService,
  ) {}

  async enqueueContribution(contributionId: string): Promise<void> {
    try {
      await this.queue.add(
        "revoke-contribution",
        { contributionId },
        {
          jobId: `revoke-${contributionId}`,
          attempts: 5,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: { count: 1_000 },
          removeOnFail: false,
        },
      );
    } catch (err) {
      this.logger.warn(
        `Could not enqueue reward revocation for contribution ${contributionId} ` +
          `(${(err as Error).message}); falling back to inline best-effort`,
      );
      await this.rewardEngine.revokeContributionRewards(contributionId).catch(() => {});
    }
  }
}
