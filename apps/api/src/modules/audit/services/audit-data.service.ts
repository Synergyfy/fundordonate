import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditLinkStatus, Prisma, type AuditSessionMirror } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { EntitlementService } from "@/mcom/entitlement.service";
import {
  AuditApiError,
  AuditClient,
  type AuditDiagnosticSummary,
  type AuditPreAudit,
  type AuditSummary,
} from "@/mcom/audit-client.service";
import type { AuditStatusView } from "../audit.types";
import { resolveAuditFieldValue } from "../audit-field-map";

/**
 * Owns FundOrDonate's local snapshot of a business owner's 247GBS Audit state.
 *
 * Reads are **user-delegated**: we exchange the owner's stored MCOM SSO token
 * for a delegated token scoped to 247GBS Audit and read that user's pre-audit +
 * audits. The result is persisted on `Business` + `AuditSessionMirror` so that
 * no-user-session paths (admin bulk, hub metrics, template pre-fill) never need
 * a token of their own. The `AuditReconciliationService` keeps the snapshot
 * fresh when no user is present.
 */
@Injectable()
export class AuditDataService {
  private readonly logger = new Logger(AuditDataService.name);
  private readonly snapshotTtlMs: number;
  /** De-dupes concurrent refreshes for the same business. */
  private readonly inflight = new Map<string, Promise<AuditStatusView>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly auditClient: AuditClient,
    private readonly config: ConfigService,
  ) {
    this.snapshotTtlMs =
      this.config.get<number>("audit.snapshotTtlMs") ?? 300_000;
  }

  /** Snapshot-only status — never calls the provider. */
  async getStatus(businessId: string): Promise<AuditStatusView> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        auditLinkStatus: true,
        auditPreAuditId: true,
        auditRecommendedType: true,
        auditDestinationType: true,
        auditDestinationTarget: true,
        auditConsentVersion: true,
        auditPreAuditCompletedAt: true,
        auditDiagnostic: true,
        auditSyncedAt: true,
        auditLastError: true,
        _count: { select: { auditSessions: true } },
      },
    });
    if (!business) throw new NotFoundException("Business not found");

    const latest = await this.prisma.auditSessionMirror.findFirst({
      where: { businessId, status: "COMPLETED" },
      orderBy: [{ providerUpdatedAt: "desc" }, { createdAt: "desc" }],
    });

    const available = business.auditLinkStatus === AuditLinkStatus.AVAILABLE;
    const syncedAt = business.auditSyncedAt;

    return {
      linkStatus: business.auditLinkStatus,
      linked: business.auditLinkStatus !== AuditLinkStatus.NOT_LINKED,
      hasPreAudit: available,
      hasConsent: available,
      preAuditId: business.auditPreAuditId,
      recommendedAuditType: business.auditRecommendedType,
      destinationType: business.auditDestinationType,
      destinationTarget: business.auditDestinationTarget,
      consentVersion: business.auditConsentVersion,
      preAuditCompletedAt:
        business.auditPreAuditCompletedAt?.toISOString() ?? null,
      diagnostic:
        (business.auditDiagnostic as unknown as AuditDiagnosticSummary | null) ??
        null,
      auditCount: business._count.auditSessions,
      latestAudit: latest ? this.toAuditSummary(latest) : null,
      syncedAt: syncedAt?.toISOString() ?? null,
      stale:
        !syncedAt || Date.now() - syncedAt.getTime() > this.snapshotTtlMs,
      lastError: business.auditLastError,
    };
  }

  /**
   * Live-read the owner's 247GBS Audit state and persist it. Safe to call
   * whenever a user is present (permission/eligibility pages) or from the
   * reconciliation job. Never throws for provider states — it maps them onto
   * `auditLinkStatus` and returns the resulting view. Concurrent calls for the
   * same business share one provider round-trip.
   */
  async refresh(businessId: string): Promise<AuditStatusView> {
    const existing = this.inflight.get(businessId);
    if (existing) return existing;

    const run = this.runRefresh(businessId).finally(() => {
      this.inflight.delete(businessId);
    });
    this.inflight.set(businessId, run);
    return run;
  }

  private async runRefresh(businessId: string): Promise<AuditStatusView> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { id: true, mcomUserId: true } } },
    });
    if (!business) throw new NotFoundException("Business not found");

    const mcomUserId = business.owner?.mcomUserId ?? null;
    if (!mcomUserId) {
      await this.persist(businessId, {
        auditLinkStatus: AuditLinkStatus.NOT_LINKED,
        auditLastError: null,
      });
      return this.getStatus(businessId);
    }

    const subjectToken = await this.entitlements.getFreshCentralToken(
      business.owner.id,
    );
    if (!subjectToken) {
      await this.persistError(
        businessId,
        "No usable MCOM SSO token for this user — sign-in required.",
      );
      return this.getStatus(businessId);
    }

    // Pre-audit first: it is the only read that distinguishes "no pre-audit"
    // (200 `available:false`) from "pre-audit not shared" (403 consent).
    let preAudit: AuditPreAudit;
    try {
      preAudit = await this.auditClient.getPreAudit(mcomUserId, subjectToken);
    } catch (err) {
      await this.handleRefreshError(businessId, err);
      return this.getStatus(businessId);
    }

    if (!preAudit.available) {
      await this.persist(businessId, {
        auditLinkStatus: AuditLinkStatus.NO_PRE_AUDIT,
        auditPreAuditId: null,
        auditRecommendedType: null,
        auditDestinationType: null,
        auditDestinationTarget: null,
        auditConsentVersion: null,
        auditPreAuditCompletedAt: null,
        auditDiagnostic: Prisma.JsonNull,
        auditSyncedAt: new Date(),
        auditLastError: preAudit.reason ?? null,
      });
      await this.tryMirrorAudits(businessId, mcomUserId, subjectToken);
      return this.getStatus(businessId);
    }

    await this.persist(businessId, {
      auditLinkStatus: AuditLinkStatus.AVAILABLE,
      auditPreAuditId: preAudit.id ?? null,
      auditRecommendedType: preAudit.recommendedAuditType ?? null,
      auditDestinationType: preAudit.destinationType ?? null,
      auditDestinationTarget: preAudit.destinationTarget ?? null,
      auditConsentVersion: preAudit.consentVersion ?? null,
      auditPreAuditCompletedAt: preAudit.completedAt
        ? new Date(preAudit.completedAt)
        : null,
      auditDiagnostic:
        (preAudit.diagnosticSummary as unknown as Prisma.InputJsonValue) ??
        Prisma.JsonNull,
      auditLinkedAt: business.auditLinkedAt ?? new Date(),
      auditSyncedAt: new Date(),
      auditLastError: null,
    });

    await this.tryMirrorAudits(businessId, mcomUserId, subjectToken);
    return this.getStatus(businessId);
  }

  /**
   * Refresh only when the snapshot is stale (or never synced). Used by
   * user-present endpoints so a fresh page load gets current data without a
   * provider call on every request.
   */
  async refreshIfStale(businessId: string): Promise<AuditStatusView> {
    const status = await this.getStatus(businessId);
    if (!status.stale) return status;
    return this.refresh(businessId);
  }

  /**
   * Refresh many businesses from 247GBS with bounded concurrency, so a large
   * admin batch stays within the provider's per-IP throttle. Best-effort: a
   * failed business is left at its current snapshot state (fail-closed).
   */
  async refreshMany(
    businessIds: string[],
    opts: { concurrency?: number; delayMs?: number } = {},
  ): Promise<void> {
    const concurrency = Math.max(1, opts.concurrency ?? 3);
    const delayMs = opts.delayMs ?? 1500;
    for (let i = 0; i < businessIds.length; i += concurrency) {
      const batch = businessIds.slice(i, i + concurrency);
      await Promise.all(
        batch.map((id) =>
          this.refresh(id).catch((err) => {
            this.logger.warn(
              `Audit refresh failed for business ${id}: ${(err as Error).message}`,
            );
          }),
        ),
      );
      if (i + concurrency < businessIds.length) await sleep(delayMs);
    }
  }

  /** The pre-audit diagnostic from the snapshot, or null. */
  async getDiagnostic(
    businessId: string,
  ): Promise<AuditDiagnosticSummary | null> {
    return (await this.getStatus(businessId)).diagnostic;
  }

  /** Mirrored audit sessions (newest first). */
  async listSessions(businessId: string): Promise<AuditSummary[]> {
    const rows = await this.prisma.auditSessionMirror.findMany({
      where: { businessId },
      orderBy: [{ providerCreatedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((row) => this.toAuditSummary(row));
  }

  /**
   * Resolve template field defaults from the pre-audit diagnostic. Returns a
   * map of `fieldId -> value`; unknown/unavailable values are omitted.
   */
  async getFieldDefaults(
    businessId: string,
    fields: Array<{ id?: string; auditKey?: string; source?: string }>,
  ): Promise<Record<string, string>> {
    const status = await this.getStatus(businessId);
    if (status.linkStatus !== AuditLinkStatus.AVAILABLE || !status.diagnostic) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const field of fields ?? []) {
      const value = resolveAuditFieldValue(field, status.diagnostic);
      if (value !== undefined && field?.id) out[field.id] = value;
    }
    return out;
  }

  // ── Persistence helpers ────────────────────────────────────────────────────

  private async persistError(businessId: string, message: string): Promise<void> {
    await this.persist(businessId, {
      auditLinkStatus: AuditLinkStatus.ERROR,
      auditSyncedAt: new Date(),
      auditLastError: message.slice(0, 500),
    });
  }

  private async handleRefreshError(
    businessId: string,
    err: unknown,
  ): Promise<void> {
    const apiErr = err instanceof AuditApiError ? err : null;
    if (apiErr?.isNotFound) {
      await this.persist(businessId, {
        auditLinkStatus: AuditLinkStatus.NOT_LINKED,
        auditSyncedAt: new Date(),
        auditLastError: apiErr.message.slice(0, 500),
      });
      return;
    }
    if (apiErr?.isConsentRequired) {
      await this.persist(businessId, {
        auditLinkStatus: AuditLinkStatus.CONSENT_REQUIRED,
        auditSyncedAt: new Date(),
        auditLastError: apiErr.message.slice(0, 500),
      });
      return;
    }
    if (apiErr?.isPeerError) {
      this.logger.error(
        `247GBS Audit peer/config error for business ${businessId}: ${apiErr.code ?? apiErr.message}`,
      );
    }
    await this.persistError(
      businessId,
      apiErr?.message ?? (err as Error)?.message ?? "Unknown audit read error",
    );
  }

  /** Best-effort audit mirroring — failures leave existing mirrors intact. */
  private async tryMirrorAudits(
    businessId: string,
    mcomUserId: string,
    subjectToken: string,
  ): Promise<void> {
    let audits: AuditSummary[] = [];
    try {
      const res = await this.auditClient.getAudits(mcomUserId, subjectToken);
      audits = Array.isArray(res?.audits) ? res.audits : [];
    } catch (err) {
      this.logger.debug(
        `Could not mirror audits for business ${businessId}: ${
          err instanceof AuditApiError ? err.code ?? err.message : (err as Error).message
        }`,
      );
      return;
    }

    if (audits.length === 0) return;

    await this.prisma.$transaction(
      audits.map((audit) =>
        this.prisma.auditSessionMirror.upsert({
          where: { auditId: audit.id },
          create: {
            businessId,
            auditId: audit.id,
            status: audit.status,
            auditType: audit.auditType,
            scopes: audit.scopes ?? [],
            sectorId: audit.sectorId,
            groupId: audit.groupId,
            businessTypeId: audit.businessTypeId,
            preAuditSessionId: audit.preAuditSessionId,
            calculatedMetrics: audit.calculatedMetrics
              ? (audit.calculatedMetrics as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            aiInsight: audit.aiInsight
              ? (audit.aiInsight as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            completedAt:
              audit.status === "COMPLETED"
                ? new Date(audit.updatedAt)
                : null,
            providerCreatedAt: new Date(audit.createdAt),
            providerUpdatedAt: new Date(audit.updatedAt),
            syncedAt: new Date(),
          },
          update: {
            status: audit.status,
            auditType: audit.auditType,
            scopes: audit.scopes ?? [],
            sectorId: audit.sectorId,
            groupId: audit.groupId,
            businessTypeId: audit.businessTypeId,
            preAuditSessionId: audit.preAuditSessionId,
            calculatedMetrics: audit.calculatedMetrics
              ? (audit.calculatedMetrics as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            aiInsight: audit.aiInsight
              ? (audit.aiInsight as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            completedAt:
              audit.status === "COMPLETED"
                ? new Date(audit.updatedAt)
                : null,
            providerUpdatedAt: new Date(audit.updatedAt),
            syncedAt: new Date(),
          },
        }),
      ),
    );
  }

  private persist(
    businessId: string,
    data: Prisma.BusinessUpdateInput,
  ): Promise<unknown> {
    return this.prisma.business.update({ where: { id: businessId }, data });
  }

  private toAuditSummary(row: AuditSessionMirror): AuditSummary {
    return {
      id: row.auditId,
      status: row.status,
      auditType: row.auditType,
      scopes: row.scopes,
      sectorId: row.sectorId,
      groupId: row.groupId,
      businessTypeId: row.businessTypeId,
      preAuditSessionId: row.preAuditSessionId,
      calculatedMetrics:
        (row.calculatedMetrics as unknown as AuditSummary["calculatedMetrics"]) ??
        null,
      aiInsight:
        (row.aiInsight as unknown as Record<string, unknown> | null) ?? null,
      createdAt: row.providerCreatedAt?.toISOString() ?? row.createdAt.toISOString(),
      updatedAt: row.providerUpdatedAt?.toISOString() ?? row.updatedAt.toISOString(),
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
