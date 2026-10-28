import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ADMIN_TASKS_QUEUE } from "../processors/admin-tasks.constants";

/**
 * Registers recurring admin background jobs on startup.
 *
 * These sweep jobs keep campaign and season state fresh without needing a
 * request to trigger them:
 *  - `campaign-lifecycle-sweep` starts campaigns whose start date has arrived
 *    and completes those whose end date has passed.
 *  - `season-rollup-sweep` refreshes aggregate metrics for active seasons.
 */
@Injectable()
export class CampaignSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(CampaignSchedulerService.name);

  constructor(@InjectQueue(ADMIN_TASKS_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.queue.upsertJobScheduler(
        "campaign-lifecycle-sweep",
        { every: 5 * 60 * 1000 }, // every 5 minutes
        {
          name: "campaign-lifecycle-sweep",
          data: {},
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      );

      await this.queue.upsertJobScheduler(
        "city-activation-sweep",
        { every: 15 * 60 * 1000 }, // every 15 minutes
        {
          name: "city-activation-sweep",
          data: {},
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      );

      await this.queue.upsertJobScheduler(
        "season-rollup-sweep",
        { every: 60 * 60 * 1000 }, // hourly
        {
          name: "season-rollup-sweep",
          data: {},
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      );

      await this.queue.upsertJobScheduler(
        "auth-cleanup-sweep",
        { every: 24 * 60 * 60 * 1000 }, // daily
        {
          name: "auth-cleanup-sweep",
          data: {},
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      );

      this.logger.log("Registered recurring campaign, season, and auth background jobs");
    } catch (err) {
      // Never block boot if Redis scheduling is briefly unavailable.
      this.logger.error(`Failed to register recurring jobs: ${(err as Error).message}`);
    }
  }
}
