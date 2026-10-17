import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";
import { AuditReconciliationService } from "../services/audit-reconciliation.service";
import {
  AUDIT_RECONCILE_QUEUE,
  type AuditReconcileJobData,
} from "../audit.queues";

export { AUDIT_RECONCILE_QUEUE } from "../audit.queues";
export type { AuditReconcileJobData } from "../audit.queues";

/**
 * Worker for the 247GBS Audit snapshot reconciliation. Handles the periodic
 * `reconcile-all` sweep (scheduled by {@link AuditReconciliationService}) plus
 * ad-hoc `reconcile-business` / `reconcile-user` jobs.
 */
@Processor(AUDIT_RECONCILE_QUEUE)
export class AuditReconcileProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditReconcileProcessor.name);

  constructor(private readonly reconciliation: AuditReconciliationService) {
    super();
  }

  async process(job: Job<AuditReconcileJobData>): Promise<unknown> {
    switch (job.name) {
      case "reconcile-all":
        return this.reconciliation.reconcileAll();

      case "reconcile-business": {
        const businessId = job.data?.businessId;
        if (!businessId) {
          throw new UnrecoverableError(
            "reconcile-business job is missing businessId",
          );
        }
        return this.reconciliation.reconcileBusiness(businessId);
      }

      case "reconcile-user": {
        const mcomUserId = job.data?.mcomUserId;
        if (!mcomUserId) {
          throw new UnrecoverableError(
            "reconcile-user job is missing mcomUserId",
          );
        }
        return this.reconciliation.reconcileByMcomUserId(mcomUserId);
      }

      default:
        this.logger.warn(`Unknown audit-reconcile job: ${job.name}`);
        return null;
    }
  }
}
