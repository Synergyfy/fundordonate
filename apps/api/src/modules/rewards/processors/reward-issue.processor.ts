import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, Queue, UnrecoverableError } from "bullmq";
import { RewardTriggerService } from "../services/reward-trigger.service";
import { McomRewardsError } from "@/mcom/rewards-client.service";
import {
  REWARD_ISSUE_DLQ,
  REWARD_ISSUE_QUEUE,
  type RewardIssueJobData,
} from "../rewards.queues";

/**
 * BullMQ worker that evaluates a completed contribution and issues qualifying
 * rewards. Moving issuance off the payment/self-fund request path means a slow
 * or unavailable MCOM Rewards no longer drops the reward — the job is retried
 * with exponential backoff. The deterministic idempotency key
 * (`fd:<campaignId>:<cfg>:<who>`) makes retries safe.
 *
 * Permanent provider rejections (e.g. a point offer whose recipient is not a
 * resolved MCOM Rewards Participant → HTTP 400) are wrapped in
 * `UnrecoverableError` so they fail fast into the DLQ instead of burning
 * retries on something that cannot succeed.
 */
@Processor(REWARD_ISSUE_QUEUE)
export class RewardIssueProcessor extends WorkerHost {
  private readonly logger = new Logger(RewardIssueProcessor.name);

  constructor(
    private readonly rewardTrigger: RewardTriggerService,
    @InjectQueue(REWARD_ISSUE_DLQ) private readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<RewardIssueJobData>): Promise<unknown> {
    switch (job.name) {
      case "issue-contribution":
        return this.issueContribution(job);
      default:
        this.logger.warn(`Unknown reward-issue job: ${job.name}`);
        return null;
    }
  }

  private async issueContribution(job: Job<RewardIssueJobData>) {
    const contributionId = job.data?.contributionId;
    if (!contributionId) {
      throw new UnrecoverableError("reward-issue job is missing contributionId");
    }

    try {
      const issued = await this.rewardTrigger.evaluateContributionStrict(contributionId);
      this.logger.log(
        `Reward issuance for contribution ${contributionId}: ${issued.length} issued/matched`,
      );
      return { contributionId, issued: issued.length };
    } catch (err) {
      if (this.isPermanent(err)) {
        const detail =
          err instanceof McomRewardsError
            ? `HTTP ${err.httpStatus}${err.code ? ` [${err.code}]` : ""}: ${err.message}`
            : (err as Error).message;
        throw new UnrecoverableError(`MCOM Rewards permanently rejected issuance — ${detail}`);
      }
      // Transient (network/timeout, 429, 5xx, ENTITLEMENT_UNAVAILABLE) —
      // rethrow so BullMQ retries with exponential backoff.
      throw err;
    }
  }

  /**
   * Per the provider contract, only network/timeout, 429, 5xx and
   * `ENTITLEMENT_UNAVAILABLE` are retryable. Anything else (400 validation /
   * invalid-state, 401, 403 caller/scope/not-entitled, 404) is fatal. Unknown
   * (non-provider) errors are treated as retryable.
   */
  private isPermanent(err: unknown): boolean {
    if (!(err instanceof McomRewardsError)) return false;
    return !err.retryable;
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job<RewardIssueJobData>, err: Error): Promise<void> {
    const maxAttempts = job.opts?.attempts ?? 1;
    const exhausted =
      err instanceof UnrecoverableError || job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Reward-issue job ${job.id} attempt ${job.attemptsMade}/${maxAttempts} failed` +
        `${exhausted ? " (moving to DLQ)" : " (will retry)"}: ${err.message}`,
    );

    if (!exhausted) return;

    try {
      await this.dlq.add(
        "dead-letter",
        {
          contributionId: job.data?.contributionId,
          failedJobId: job.id,
          attemptsMade: job.attemptsMade,
          error: err.message,
        },
        { removeOnComplete: false, removeOnFail: false },
      );
    } catch (dlqErr) {
      this.logger.error(
        `Failed to move reward-issue job ${job.id} to DLQ: ${(dlqErr as Error).message}`,
      );
    }
  }
}
