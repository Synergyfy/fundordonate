import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BusinessCampaignStatus, BusinessStatus } from "@prisma/client";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditDataService } from "./audit-data.service";
import {
  AUDIT_RECONCILE_QUEUE,
  type AuditReconcileJobData,
} from "../audit.queues";

/** Batch size / delay sized to stay well under the provider's per-IP throttle. */
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 2000;

export interface ReconcileBusinessResult {
  businessId: string;
  linkStatus: string;
  error?: string;
}

export interface ReconcileAllResult {
  businesses: number;
  refreshed: number;
  failures: number;
}

/**
 * Reconciliation safety net for the 247GBS Audit snapshot.
 *
 * The user-present read path keeps a business's snapshot fresh, but admin/
 * bulk/hub paths have no user session and the optional completion event can be
 * dropped (the provider does not retry). This job periodically re-reads a
 * linked owner's data server-side — minting the delegated token from the
 * user's stored, refreshable Central token — so the mirror stays current.
 */
@Injectable()
export class AuditReconciliationService implements OnModuleInit {
  private readonly logger = new Logger(AuditReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditData: AuditDataService,
    private readonly config: ConfigService,
    @InjectQueue(AUDIT_RECONCILE_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled =
      this.config.get<boolean>("audit.reconcileEnabled") ?? true;
    if (!enabled) {
      this.logger.log("247GBS Audit reconciliation scheduler disabled");
      return;
    }

    const every =
      this.config.get<number>("audit.reconcileIntervalMs") ?? 900_000;
    try {
      await this.queue.upsertJobScheduler(
        "audit-reconcile-scheduled",
        { every },
        {
          name: "reconcile-all",
          data: {} satisfies AuditReconcileJobData,
          opts: {
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 100 },
          },
        },
      );
      this.logger.log(
        `247GBS Audit reconciliation scheduled every ${Math.round(every / 1000)}s`,
      );
    } catch (err) {
      this.logger.warn(
        `Could not register 247GBS Audit reconciliation scheduler: ${(err as Error).message}`,
      );
    }
  }

  /** Enqueue a refresh for one business (used by the inbound completion event). */
  async enqueueBusiness(businessId: string): Promise<void> {
    await this.queue.add(
      "reconcile-business",
      { businessId } satisfies AuditReconcileJobData,
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
    );
  }

  /** Enqueue a refresh for every business owned by an MCOM user. */
  async enqueueByMcomUserId(mcomUserId: string): Promise<void> {
    const businesses = await this.prisma.business.findMany({
      where: { owner: { mcomUserId } },
      select: { id: true },
    });
    await Promise.all(
      businesses.map((b) => this.enqueueBusiness(b.id)),
    );
  }

  /**
   * Refresh every business that could plausibly need it: ones already linked to
   * 247GBS Audit, or ones with a live campaign. Unlinked businesses are skipped
   * (nothing to read, and we must not spam the provider).
   */
  async reconcileAll(): Promise<ReconcileAllResult> {
    const businesses = await this.prisma.business.findMany({
      where: {
        owner: { mcomUserId: { not: null } },
        status: BusinessStatus.ACTIVE,
        OR: [
          { auditLinkStatus: { not: "NOT_LINKED" } },
          { campaigns: { some: { status: BusinessCampaignStatus.ACTIVE } } },
        ],
      },
      select: { id: true },
    });

    const result: ReconcileAllResult = {
      businesses: businesses.length,
      refreshed: 0,
      failures: 0,
    };

    for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
      const batch = businesses.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((b) => this.reconcileBusiness(b.id)),
      );
      for (const one of batchResults) {
        if (one.error) result.failures += 1;
        else result.refreshed += 1;
      }
      if (i + BATCH_SIZE < businesses.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    if (result.failures > 0) {
      this.logger.warn(
        `247GBS Audit reconciliation finished with ${result.failures} failure(s)`,
      );
    }
    return result;
  }

  async reconcileBusiness(businessId: string): Promise<ReconcileBusinessResult> {
    try {
      const status = await this.auditData.refresh(businessId);
      return { businessId, linkStatus: status.linkStatus };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(
        `Failed to reconcile 247GBS Audit snapshot for business ${businessId}: ${message}`,
      );
      return { businessId, linkStatus: "ERROR", error: message };
    }
  }

  /** Refresh every business owned by an MCOM user (used by the event worker). */
  async reconcileByMcomUserId(
    mcomUserId: string,
  ): Promise<ReconcileBusinessResult[]> {
    const businesses = await this.prisma.business.findMany({
      where: { owner: { mcomUserId } },
      select: { id: true },
    });
    return Promise.all(
      businesses.map((b) => this.reconcileBusiness(b.id)),
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
