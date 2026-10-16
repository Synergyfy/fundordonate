/**
 * Shared helpers for reading the reward rules persisted on
 * `CampaignTemplate.rewardsConfig`.
 *
 * Two shapes exist in the wild:
 *   1. Canonical (written by the admin template wizard):
 *        `{ id, name, source, conditions: [{ mode, minPence, maxPence, exactPence }], qualificationMode, ... }`
 *   2. Legacy/loose (older seeds & early wizards):
 *        `{ id, name, rule: "Unlocked for backers contributing £25 or more", category: "Discount" }`
 *
 * `effectiveConditions()` normalises both so eligibility is enforced uniformly,
 * falling back to a minimum parsed from the human-readable `rule` copy.
 */

export interface StoredRewardCondition {
  mode?: string;
  minPence?: number | null;
  maxPence?: number | null;
  exactPence?: number | null;
  // legacy/loose fallbacks
  min?: number | null;
  max?: number | null;
  exact?: number | null;
}

export interface StoredRewardConfig {
  id?: string;
  name?: string;
  rule?: string;
  source?: string;
  mcomRewardId?: string | null;
  /**
   * The provider's reward source for MCOM rewards (e.g. "mcom vault" for
   * admin/MCOM-created rewards, "partner" for partner-catalogue rewards).
   * Determines whether the reward is gifted (platform-sponsored) or issued
   * (business-sponsored).
   */
  mcomSource?: string | null;
  rewardCategory?: string;
  valueGbp?: number | null;
  audience?: string;
  delivery?: string;
  qualificationMode?: string;
  conditions?: StoredRewardCondition[];
  trigger?: StoredRewardCondition;
  quantityType?: string;
  quantityLimit?: number | string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
}

/** Normalise the explicit `conditions[]` / legacy `trigger` into a flat list. */
export function normalizeConditions(cfg: StoredRewardConfig): StoredRewardCondition[] {
  const coerce = (c: StoredRewardCondition): StoredRewardCondition => ({
    mode: c.mode,
    minPence: c.minPence ?? c.min ?? null,
    maxPence: c.maxPence ?? c.max ?? null,
    exactPence: c.exactPence ?? c.exact ?? null,
  });

  if (Array.isArray(cfg.conditions) && cfg.conditions.length > 0) {
    return cfg.conditions.map(coerce);
  }
  if (cfg.trigger) {
    return [coerce(cfg.trigger)];
  }
  return [];
}

/** Parse a minimum amount in pence from free-text rule copy (e.g. "£25 or more"). */
export function parseMinPenceFromRule(rule?: string | null): number | null {
  if (!rule) return null;
  const match = rule.match(/£\s?([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

/**
 * The conditions that should actually gate a reward. When a config declares no
 * conditions but its `rule` text states a minimum, that minimum is enforced.
 * Returns `[]` for genuinely unconditional rewards.
 */
export function effectiveConditions(cfg: StoredRewardConfig): StoredRewardCondition[] {
  const explicit = normalizeConditions(cfg);
  if (explicit.length > 0) return explicit;
  const minPence = parseMinPenceFromRule(cfg.rule);
  if (minPence != null) return [{ mode: "minimum", minPence }];
  return [];
}

/** The minimum qualifying contribution in pence for a reward, or 0. */
export function minQualifyingPence(cfg: StoredRewardConfig): number {
  const conditions = effectiveConditions(cfg);
  if (conditions.length === 0) return 0;
  const mins = conditions
    .map((c) => c.exactPence ?? c.minPence ?? 0)
    .filter((n): n is number => typeof n === "number" && n > 0);
  return mins.length > 0 ? Math.min(...mins) : 0;
}

/**
 * Whether a stored reward is an admin/MCOM-created ("mcom vault") reward that
 * must be delivered as a **platform gift** (`/partner/rewards/{id}/gift`, no
 * sponsor business) rather than a business-sponsored catalogue issue.
 */
export function isPlatformGiftReward(cfg: StoredRewardConfig): boolean {
  return (
    cfg.source === "mcom" &&
    (cfg.mcomSource ?? "").trim().toLowerCase() === "mcom vault"
  );
}

// ---------------------------------------------------------------------------
// Campaign template — business-owned rewards mode
// ---------------------------------------------------------------------------

/**
 * How a template treats rewards the business created in MCOM Rewards and
 * attached to its campaign:
 *   - `disabled` — businesses cannot attach their own rewards.
 *   - `coexist`  — businesses may attach theirs; template rewards still apply.
 *   - `replace`  — the business's own rewards supersede the template rewards
 *                  (once the business has attached at least one).
 *
 * `"enabled"` is a legacy alias for `coexist`.
 */
export type BusinessRewardsMode = "disabled" | "coexist" | "replace";

export function normalizeBusinessRewardsMode(
  mode?: string | null,
): BusinessRewardsMode {
  const m = (mode ?? "").toLowerCase();
  if (m === "replace") return "replace";
  if (m === "coexist" || m === "enabled") return "coexist";
  return "disabled";
}

/** Whether a business may attach its own rewards on this template. */
export function businessRewardsAttachmentAllowed(mode?: string | null): boolean {
  return normalizeBusinessRewardsMode(mode) !== "disabled";
}

/** Whether the template's own rewards are superseded by the business's. */
export function businessRewardsReplaceTemplate(mode?: string | null): boolean {
  return normalizeBusinessRewardsMode(mode) === "replace";
}
