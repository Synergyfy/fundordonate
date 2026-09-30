// =============================================================================
// Reward Rules — Admin
// Configure rules that determine when rewards are earned and delivered.
// =============================================================================

import { useState, useMemo } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Clock,
  Users,
  Package,
  Layers,
  DollarSign,
  AlertCircle,
  Copy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RuleType = "contribution" | "timing" | "audience" | "quantity" | "combination";

interface RewardRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  conditions: Record<string, unknown>;
  enabled: boolean;
  priority: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RULE_TYPE_OPTIONS: { value: RuleType; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "contribution", label: "Contribution", color: "bg-blue-100 text-blue-700", icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: "timing", label: "Timing", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3.5 w-3.5" /> },
  { value: "audience", label: "Audience", color: "bg-purple-100 text-purple-700", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "quantity", label: "Quantity", color: "bg-green-100 text-green-700", icon: <Package className="h-3.5 w-3.5" /> },
  { value: "combination", label: "Combination", color: "bg-pink-100 text-pink-700", icon: <Layers className="h-3.5 w-3.5" /> },
];

const TYPE_MAP = Object.fromEntries(RULE_TYPE_OPTIONS.map((t) => [t.value, t]));

type TabFilter = "all" | RuleType;

const TAB_OPTIONS: { value: TabFilter; label: string }[] = [
  { value: "all", label: "All Rules" },
  { value: "contribution", label: "Contribution" },
  { value: "timing", label: "Timing" },
  { value: "audience", label: "Audience" },
  { value: "quantity", label: "Quantity" },
  { value: "combination", label: "Combination" },
];

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const DEMO_RULES: RewardRule[] = [
  {
    id: "rule-1",
    name: "Minimum Backer Contribution",
    description: "Rewards are only given for contributions of £10 or more",
    type: "contribution",
    conditions: { minAmount: 10 },
    enabled: true,
    priority: 1,
  },
  {
    id: "rule-2",
    name: "Early Bird Bonus",
    description: "Extra reward for contributions made within the first 7 days",
    type: "timing",
    conditions: { earlyBirdDays: 7 },
    enabled: true,
    priority: 2,
  },
  {
    id: "rule-3",
    name: "First 100 Backers",
    description: "Special recognition for the first 100 contributors",
    type: "quantity",
    conditions: { maxQuantity: 100, orderType: "first" },
    enabled: true,
    priority: 3,
  },
  {
    id: "rule-4",
    name: "Business Contributor Exclusive",
    description: "Certain rewards are only available to business contributors",
    type: "audience",
    conditions: { audience: "business" },
    enabled: false,
    priority: 4,
  },
  {
    id: "rule-5",
    name: "High Value Supporter",
    description: "Special rewards for contributions of £100 or more",
    type: "contribution",
    conditions: { minAmount: 100 },
    enabled: true,
    priority: 5,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function summarizeConditions(type: RuleType, conditions: Record<string, unknown>): string {
  switch (type) {
    case "contribution": {
      const parts: string[] = [];
      if (conditions.minAmount != null) parts.push(`Min: £${conditions.minAmount}`);
      if (conditions.maxAmount != null) parts.push(`Max: £${conditions.maxAmount}`);
      if (conditions.contributionType) parts.push(`Type: ${conditions.contributionType}`);
      if (conditions.firstTime) parts.push("First-time only");
      return parts.join(" · ") || "No conditions";
    }
    case "timing": {
      if (conditions.earlyBirdDays) return `Within first ${conditions.earlyBirdDays} days`;
      if (conditions.lastMinuteDays) return `Within last ${conditions.lastMinuteDays} days`;
      if (conditions.milestone) return `Milestone: ${conditions.milestone}`;
      return "No conditions";
    }
    case "audience": {
      if (conditions.audience) return `Audience: ${String(conditions.audience)}`;
      if (conditions.newContributor) return "New contributors only";
      if (conditions.returning) return "Returning contributors";
      if (conditions.foundingMember) return "Founding members only";
      return "No conditions";
    }
    case "quantity": {
      const parts: string[] = [];
      if (conditions.orderType === "first" && conditions.maxQuantity) parts.push(`First ${conditions.maxQuantity}`);
      if (conditions.orderType === "top" && conditions.maxQuantity) parts.push(`Top ${conditions.maxQuantity}`);
      if (conditions.limitPerReward) parts.push(`Limit: ${conditions.limitPerReward} per reward`);
      if (conditions.onePerCustomer) parts.push("One per customer");
      return parts.join(" · ") || "No conditions";
    }
    case "combination": {
      const logic = conditions.logic === "or" ? "OR" : "AND";
      const count = Array.isArray(conditions.rules) ? conditions.rules.length : 0;
      return `${count} conditions (${logic} logic)`;
    }
    default:
      return "No conditions";
  }
}

// ---------------------------------------------------------------------------
// Modal Component
// ---------------------------------------------------------------------------

interface RuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: RewardRule) => void;
  initial?: RewardRule | null;
}

function RuleModal({ open, onClose, onSave, initial }: RuleModalProps) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState<RuleType>(initial?.type || "contribution");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [priority, setPriority] = useState(initial?.priority || 1);

  // Contribution conditions
  const [minAmount, setMinAmount] = useState(initial?.conditions?.minAmount != null ? String(initial.conditions.minAmount) : "");
  const [maxAmount, setMaxAmount] = useState(initial?.conditions?.maxAmount != null ? String(initial.conditions.maxAmount) : "");
  const [contributionType, setContributionType] = useState(String(initial?.conditions?.contributionType) || "");
  const [firstTimeOnly, setFirstTimeOnly] = useState(Boolean(initial?.conditions?.firstTime));

  // Timing conditions
  const [earlyBirdDays, setEarlyBirdDays] = useState(initial?.conditions?.earlyBirdDays != null ? String(initial.conditions.earlyBirdDays) : "");
  const [lastMinuteDays, setLastMinuteDays] = useState(initial?.conditions?.lastMinuteDays != null ? String(initial.conditions.lastMinuteDays) : "");
  const [milestone, setMilestone] = useState(String(initial?.conditions?.milestone) || "");

  // Audience conditions
  const [audience, setAudience] = useState(String(initial?.conditions?.audience) || "");
  const [newContributor, setNewContributor] = useState(Boolean(initial?.conditions?.newContributor));
  const [returningContributor, setReturningContributor] = useState(Boolean(initial?.conditions?.returning));
  const [foundingMember, setFoundingMember] = useState(Boolean(initial?.conditions?.foundingMember));

  // Quantity conditions
  const [orderType, setOrderType] = useState(String(initial?.conditions?.orderType) || "first");
  const [maxQuantity, setMaxQuantity] = useState(initial?.conditions?.maxQuantity != null ? String(initial.conditions.maxQuantity) : "");
  const [limitPerReward, setLimitPerReward] = useState(initial?.conditions?.limitPerReward != null ? String(initial.conditions.limitPerReward) : "");
  const [onePerCustomer, setOnePerCustomer] = useState(Boolean(initial?.conditions?.onePerCustomer));

  // Combination conditions
  const [comboLogic, setComboLogic] = useState(initial?.conditions?.logic || "and");

  const handleSave = () => {
    if (!name.trim()) return;

    let conditions: Record<string, unknown> = {};

    switch (type) {
      case "contribution":
        if (minAmount) conditions.minAmount = Number(minAmount);
        if (maxAmount) conditions.maxAmount = Number(maxAmount);
        if (contributionType) conditions.contributionType = contributionType;
        if (firstTimeOnly) conditions.firstTime = true;
        break;
      case "timing":
        if (earlyBirdDays) conditions.earlyBirdDays = Number(earlyBirdDays);
        if (lastMinuteDays) conditions.lastMinuteDays = Number(lastMinuteDays);
        if (milestone) conditions.milestone = milestone;
        break;
      case "audience":
        if (audience) conditions.audience = audience;
        if (newContributor) conditions.newContributor = true;
        if (returningContributor) conditions.returning = true;
        if (foundingMember) conditions.foundingMember = true;
        break;
      case "quantity":
        conditions.orderType = orderType;
        if (maxQuantity) conditions.maxQuantity = Number(maxQuantity);
        if (limitPerReward) conditions.limitPerReward = Number(limitPerReward);
        if (onePerCustomer) conditions.onePerCustomer = true;
        break;
      case "combination":
        conditions.logic = comboLogic;
        conditions.rules = [];
        break;
    }

    onSave({
      id: initial?.id || `rule-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      type,
      conditions,
      enabled,
      priority,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{initial ? "Edit Rule" : "Create Rule"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name
              <Tooltip
                position="bottom"
                content="A short, distinctive name for this rule. It is shown in the rules list and in rule summaries."
              />
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="e.g. Minimum Backer Contribution"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <Tooltip
                position="bottom"
                content="Explain in plain language what this rule does and when it applies. Shown beneath the rule name in the list."
              />
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100 resize-none"
              placeholder="Describe what this rule does..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Type
              <Tooltip
                position="bottom"
                content="Determines which condition fields appear below: Contribution = amount thresholds, Timing = campaign dates, Audience = who qualifies, Quantity = limited claim slots, Combination = several conditions joined with AND/OR."
              />
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RuleType)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              >
                {RULE_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Conditions (dynamic based on type) */}
          <div className="rounded-lg bg-gray-50 p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
              Conditions
              <Tooltip
                content="The fields below change with the Rule Type chosen above — set exactly when this rule applies."
              />
            </h4>

            {type === "contribution" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Min Amount (£)
                      <Tooltip content="Only contributions of at least this amount qualify for the rule. Leave blank for no minimum." />
                    </label>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Max Amount (£)
                      <Tooltip content="Contributions above this amount are excluded. Leave blank for no upper limit." />
                    </label>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                      placeholder="No limit"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Contribution Type
                    <Tooltip content="Restrict the rule to money, product or service contributions. Choose Any to accept every type." />
                  </label>
                  <select
                    value={contributionType}
                    onChange={(e) => setContributionType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Any</option>
                    <option value="money">Money</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={firstTimeOnly}
                      onChange={(e) => setFirstTimeOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    First-time contributor only
                  </label>
                  <Tooltip content="Tick to exclude anyone who has contributed to a campaign before — the rule then applies only to first-time contributors." />
                </div>
              </div>
            )}

            {type === "timing" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Early Bird (within first X days)
                    <Tooltip content="The rule only applies to contributions made within the first X days after the campaign starts." />
                  </label>
                  <input
                    type="number"
                    value={earlyBirdDays}
                    onChange={(e) => setEarlyBirdDays(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g. 7"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Last Minute (within last X days)
                    <Tooltip content="The rule only applies to contributions made during the final X days before the campaign closes." />
                  </label>
                  <input
                    type="number"
                    value={lastMinuteDays}
                    onChange={(e) => setLastMinuteDays(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Campaign Milestone
                    <Tooltip content="The rule starts applying once the campaign reaches this milestone (e.g. 50% funded, 100 backers)." />
                  </label>
                  <input
                    type="text"
                    value={milestone}
                    onChange={(e) => setMilestone(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g. 50% funded"
                  />
                </div>
              </div>
            )}

            {type === "audience" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Audience Type
                    <Tooltip content="Limit this rule to business or consumer contributors. Choose Any to apply it to everyone." />
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Any</option>
                    <option value="business">Business Only</option>
                    <option value="consumer">Consumer Only</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={newContributor} onChange={(e) => setNewContributor(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    New contributor only
                  </label>
                  <Tooltip content="Applies only to people making their very first contribution on FundOrDonate." />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={returningContributor} onChange={(e) => setReturningContributor(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    Returning contributor only
                  </label>
                  <Tooltip content="Applies only to people who have already contributed at least once before." />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={foundingMember} onChange={(e) => setFoundingMember(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    Founding member only
                  </label>
                  <Tooltip content="Applies only to active founding members — everyone else is excluded." />
                </div>
              </div>
            )}

            {type === "quantity" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Order Type
                    <Tooltip content="First N = the earliest contributors in order of contribution. Top N = the highest-value contributors." />
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="first">First N contributors</option>
                    <option value="top">Top N contributors</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Max Quantity
                    <Tooltip content="How many contributors can qualify in total. Once this many have been counted, the rule stops applying." />
                  </label>
                  <input
                    type="number"
                    value={maxQuantity}
                    onChange={(e) => setMaxQuantity(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Limit Per Reward
                    <Tooltip content="Maximum number of times each reward may be claimed under this rule (e.g. 1 = one per reward)." />
                  </label>
                  <input
                    type="number"
                    value={limitPerReward}
                    onChange={(e) => setLimitPerReward(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="e.g. 1"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={onePerCustomer} onChange={(e) => setOnePerCustomer(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    One per customer
                  </label>
                  <Tooltip content="Tick so each customer can only benefit from this rule once, however many times they contribute." />
                </div>
              </div>
            )}

            {type === "combination" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Logic
                    <Tooltip content="AND = every combined condition must match. OR = any one of the combined conditions can match." />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setComboLogic("and")}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        comboLogic === "and"
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      AND (all match)
                    </button>
                    <button
                      type="button"
                      onClick={() => setComboLogic("or")}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        comboLogic === "or"
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      OR (any match)
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-400">
                  Combine multiple rules with logic conditions. Additional rule conditions can be configured after creation.
                </div>
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority (ordering)
              <Tooltip
                content="Rules are evaluated from the lowest number upwards when more than one rule could apply. Use 1 for the most important rule."
              />
            </label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              min={1}
            />
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Enabled
              <Tooltip
                content="Disabled rules are saved but never applied to contributions. Toggle them off to pause a rule without deleting it."
              />
            </label>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ backgroundColor: enabled ? "#10b981" : "#d1d5db" }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {initial ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RewardRulesPage() {
  const [rules, setRules] = useState<RewardRule[]>(DEMO_RULES);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);

  const filtered = useMemo(() => {
    let result = rules;
    if (activeTab !== "all") result = result.filter((r) => r.type === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.priority - b.priority);
  }, [rules, activeTab, search]);

  const stats = useMemo(() => ({
    total: rules.length,
    enabled: rules.filter((r) => r.enabled).length,
    disabled: rules.filter((r) => !r.enabled).length,
    types: RULE_TYPE_OPTIONS.map((t) => ({
      ...t,
      count: rules.filter((r) => r.type === t.value).length,
    })),
  }), [rules]);

  const handleSave = (rule: RewardRule) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === rule.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = rule;
        return next;
      }
      return [...prev, rule];
    });
    setModalOpen(false);
    setEditingRule(null);
  };

  const handleToggle = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDelete = (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleDuplicate = (rule: RewardRule) => {
    setRules((prev) => [
      ...prev,
      { ...rule, id: `rule-${Date.now()}`, name: `${rule.name} (Copy)`, priority: prev.length + 1 },
    ]);
  };

  const handleMovePriority = (ruleId: string, direction: "up" | "down") => {
    setRules((prev) => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = sorted.findIndex((r) => r.id === ruleId);
      if (idx < 0) return prev;
      if (direction === "up" && idx > 0) {
        const temp = sorted[idx]!.priority;
        sorted[idx] = { ...sorted[idx]!, priority: sorted[idx - 1]!.priority };
        sorted[idx - 1] = { ...sorted[idx - 1]!, priority: temp };
      } else if (direction === "down" && idx < sorted.length - 1) {
        const temp = sorted[idx]!.priority;
        sorted[idx] = { ...sorted[idx]!, priority: sorted[idx + 1]!.priority };
        sorted[idx + 1] = { ...sorted[idx + 1]!, priority: temp };
      }
      return sorted;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reward Rules</h1>
          <p className="text-sm text-gray-500">Configure rules that determine when rewards are earned and delivered</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Rules</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-green-600">{stats.enabled}</div>
          <div className="text-xs text-gray-500">Enabled</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-400">{stats.disabled}</div>
          <div className="text-xs text-gray-500">Disabled</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-blue-600">{stats.types.find((t) => t.value === "contribution")?.count || 0}</div>
          <div className="text-xs text-gray-500">Contribution</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-amber-600">{stats.types.find((t) => t.value === "timing")?.count || 0}</div>
          <div className="text-xs text-gray-500">Timing</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules by name or description..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm border">
            <AlertCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No rules found.</p>
          </div>
        )}

        {filtered.map((rule) => {
          const typeInfo = TYPE_MAP[rule.type];
          return (
            <div
              key={rule.id}
              className={`rounded-xl bg-white p-4 shadow-sm border transition ${
                !rule.enabled ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${typeInfo?.color ?? ""}`}>
                      {typeInfo?.icon}
                      {typeInfo?.label ?? ""}
                    </span>
                    {!rule.enabled && (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{rule.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {summarizeConditions(rule.type, rule.conditions)}
                    </span>
                    <span>Priority: {rule.priority}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMovePriority(rule.id, "up")}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleMovePriority(rule.id, "down")}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setEditingRule(rule); setModalOpen(true); }}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`rounded p-1.5 transition ${
                      rule.enabled
                        ? "text-green-500 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={rule.enabled ? "Disable" : "Enable"}
                  >
                    {rule.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(rule)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <RuleModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRule(null); }}
        onSave={handleSave}
        initial={editingRule}
      />
    </div>
  );
}
