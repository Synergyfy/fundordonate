import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { RewardTriggerService } from "./reward-trigger.service";
import { REWARD_ISSUE_QUEUE, type RewardIssueJobData } from "../rewards.queues";

/**
 * Producer for the durable reward-issue queue.
 *
 * Payment and self-funding handlers call {@link enqueueContribution} instead of
 * evaluating reward rules inline, so a slow/unavailable MCOM Rewards can never
 * block or fail the contribution. If the queue itself is unreachable (e.g.
 * Redis is down) we fall back to inline best-effort evaluation so the reward is
 * still attempted rather than silently dropped.
 */
@Injectable()
export class RewardIssueQueueService {
  private readonly logger = new Logger(RewardIssueQueueService.name);

  constructor(
    @InjectQueue(REWARD_ISSUE_QUEUE) private readonly queue: Queue<RewardIssueJobData>,
    private readonly rewardTrigger: RewardTriggerService,
  ) {}

  /**
   * Enqueue reward evaluation for a completed contribution. Idempotent per
   * contribution — a stable job id means repeat calls collapse into one job.
   */
  async enqueueContribution(contributionId: string): Promise<void> {
    try {
      await this.queue.add(
        "issue-contribution",
        { contributionId },
        {
          // Stable id (no `:` — BullMQ forbids it in custom job ids) so the
          // same contribution is never queued twice.
          jobId: `contribution-${contributionId}`,
          attempts: 5,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: { count: 1_000 },
          removeOnFail: false,
        },
      );
    } catch (err) {
      this.logger.warn(
        `Could not enqueue reward issuance for contribution ${contributionId} ` +
          `(${(err as Error).message}); falling back to inline best-effort evaluation`,
      );
      await this.rewardTrigger.evaluateContribution(contributionId);
    }
  }
}
