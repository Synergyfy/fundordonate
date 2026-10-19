import type { AuditDiagnosticSummary } from "@/mcom/audit-client.service";

/**
 * Maps a campaign-template field to a value in the 247GBS pre-audit
 * `diagnosticSummary`.
 *
 * 247GBS Audit never exposes raw pre-audit answers — only the server-computed
 * diagnostic. A template field may therefore declare an explicit dot-path via
 * `field.auditKey` (e.g. `"funding.fundingGapFormatted"`); otherwise we resolve
 * a sensible default from a small alias table keyed by the field id.
 */
export const AUDIT_FIELD_ALIASES: Record<string, string> = {
  funding_gap: "funding.fundingGapFormatted",
  funding_need: "funding.fundingNeedFormatted",
  own_contribution: "funding.ownContributionFormatted",
  funding_timing: "funding.timing",
  funding_status: "funding.status",
  business_category: "business.category",
  business_location: "business.location",
  operating_status: "business.operatingStatus",
  operating_tenure: "business.operatingTenure",
  identified_needs: "business.identifiedNeeds",
  excess_stock: "operations.excessStockLevel",
  spare_capacity: "operations.spareCapacityLevel",
  marketing_budget: "marketing.budgetFormatted",
  marketing_needs: "marketing.needs",
  readiness: "readiness.label",
  readiness_level: "readiness.level",
  recommended_audit_type: "recommendation.auditType",
  recommendation: "recommendation.title",
  recommendation_rationale: "recommendation.rationale",
  key_takeaway: "recommendation.keyTakeaway",
};

/** Resolve a template field's default value from the pre-audit diagnostic. */
export function resolveAuditFieldValue(
  field: { id?: string; auditKey?: string; source?: string } | null | undefined,
  diagnostic: AuditDiagnosticSummary | null | undefined,
): string | undefined {
  if (!field || !diagnostic) return undefined;

  const explicitKey = String(field.auditKey ?? "").trim();
  if (explicitKey) {
    return stringify(readPath(diagnostic, explicitKey));
  }

  const id = String(field.id ?? "").trim();
  const alias = id.replace(/^f_/, "");
  const path = AUDIT_FIELD_ALIASES[id] ?? AUDIT_FIELD_ALIASES[alias];
  return path ? stringify(readPath(diagnostic, path)) : undefined;
}

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function stringify(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    const joined = value.filter((v) => v !== null && v !== undefined).join(", ");
    return joined.length ? joined : undefined;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}
