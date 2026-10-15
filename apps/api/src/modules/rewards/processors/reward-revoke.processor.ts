import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";
import { RewardEngineService } from "../services/reward-engine.service";
import {
  REWARD_REVOKE_QUEUE,
  type RewardRevokeJobData,
} from "../rewards.queues";

/** Worker that revokes a contribution's rewards after a refund. */
@Processor(REWARD_REVOKE_QUEUE)
export class RewardRevokeProcessor extends WorkerHost {
  private readonly logger = new Logger(RewardRevokeProcessor.name);

  constructor(private readonly rewardEngine: RewardEngineService) {
    super();
  }

  async process(job: Job<RewardRevokeJobData>): Promise<unknown> {
    const contributionId = job.data?.contributionId;
    if (!contributionId) {
      throw new UnrecoverableError("reward-revoke job is missing contributionId");
    }

    const revoked = await this.rewardEngine.revokeContributionRewards(contributionId);
    this.logger.log(
      `Revoked ${revoked} reward(s) for refunded contribution ${contributionId}`,
    );
    return { contributionId, revoked };
  }
}
