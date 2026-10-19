import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuditDataService } from "./services/audit-data.service";
import { AuditReconciliationService } from "./services/audit-reconciliation.service";
import { AuditReconcileProcessor } from "./processors/audit-reconcile.processor";
import { AuditEventsController } from "./controllers/audit-events.controller";
import { AUDIT_RECONCILE_QUEUE } from "./audit.queues";

/**
 * 247GBS Audit ecosystem integration.
 *
 * `AuditClient` + `EntitlementService` are provided by the global `McomModule`.
 * This module owns the local snapshot (`AuditDataService`), the reconciliation
 * safety net, and the optional inbound completion-event receiver. The
 * business-facing read endpoints live in `BusinessModule` (which imports this
 * module) so they can reuse the business-owner guard without a module cycle.
 */
@Module({
  imports: [BullModule.registerQueue({ name: AUDIT_RECONCILE_QUEUE })],
  controllers: [AuditEventsController],
  providers: [
    AuditDataService,
    AuditReconciliationService,
    AuditReconcileProcessor,
  ],
  exports: [AuditDataService, AuditReconciliationService],
})
export class AuditModule {}
