import { Info } from "lucide-react";
import type { CapabilityMap, PlanFeature } from "@/services/plans/type";

const CATEGORY_LABELS: Record<string, string> = {
  campaigns: "Campaigns & templates",
  rewards: "Rewards",
  contributions: "Contributions",
  leaderboards: "Leaderboards",
  profile: "Business profile & recognition",
  analytics: "Analytics & insights",
  notifications: "Notifications",
  support: "Support",
  general: "General",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  campaigns:
    "Whether the business can create campaigns, how many campaigns it can claim in total, how many can run at once, how many premium templates it can hold, and campaign promotion.",
  rewards:
    "Whether the business can attach its own rewards and use the premium reward library. Attach rewards can carry a quota.",
  contributions:
    "Access to the contribution ledger and the ability to filter by channel, date or transaction reference.",
  leaderboards:
    "Which geographic rankings the business can see, plus whether position changes and peer totals are shown.",
  profile:
    "Richer business listing, promoted placement in the directory, and tier/founding recognition badges.",
  analytics:
    "The KPI overview and whether advanced campaign/season performance reports are available.",
  notifications:
    "Automated weekly summary emails and alert preferences for leaderboard moves, new backers and reward unlocks.",
  support: "Access to the faster, dedicated support channel.",
  general: "General platform capabilities.",
};

/**
 * Admin capability matrix: every feature is shown, grouped, with a toggle and
 * (where relevant) a numeric limit / unlimited switch.
 */
export function PlanCapabilityEditor({
  features,
  value,
  onChange,
}: {
  features: PlanFeature[];
  value: CapabilityMap;
  onChange: (next: CapabilityMap) => void;
}) {
  const grouped = features.reduce<Record<string, PlanFeature[]>>(
    (acc, feature) => {
      (acc[feature.category] ??= []).push(feature);
      return acc;
    },
    {},
  );

  const update = (
    key: string,
    patch: Partial<{ enabled: boolean; limit: number | null; unlimited: boolean }>,
  ) => {
    const current = value[key] ?? {
      enabled: false,
      limit: null,
      unlimited: false,
    };
    onChange({ ...value, [key]: { ...current, ...patch } });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Tick a feature to include it in this plan or access pass. A feature
          with a quota shows a <strong>Limit</strong> field: enter the maximum
          the business can use (for example 3 attached rewards). Tick{" "}
          <strong>Unlimited</strong> to remove the cap. Unticked features are
          locked for this product.
        </p>
      </div>
      {Object.entries(grouped).map(([category, rows]) => (
        <div key={category}>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
            {CATEGORY_LABELS[category] ?? category}
          </h4>
          {CATEGORY_DESCRIPTIONS[category] && (
            <p className="mb-2 text-xs text-gray-500">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
          )}
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {rows.map((feature) => {
              const rule = value[feature.key] ?? {
                enabled: false,
                limit: null,
                unlimited: false,
              };
              return (
                <div
                  key={feature.key}
                  className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) =>
                        update(feature.key, { enabled: e.target.checked })
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {feature.name}
                      </span>
                      {feature.description && (
                        <span className="block text-xs text-gray-500">
                          {feature.description}
                        </span>
                      )}
                    </span>
                  </label>
                  {feature.supportsLimit && (
                    <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        Limit
                        <input
                          type="number"
                          min={0}
                          disabled={!rule.enabled || rule.unlimited}
                          value={rule.limit ?? ""}
                          onChange={(e) =>
                            update(feature.key, {
                              limit:
                                e.target.value === ""
                                  ? null
                                  : Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={rule.unlimited}
                          disabled={!rule.enabled}
                          onChange={(e) =>
                            update(feature.key, {
                              unlimited: e.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                        />
                        Unlimited
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
