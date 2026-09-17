// =============================================================================
// Admin — Founding Programme Form Component
// Reusable form for creating and editing FoundingProgramme entities.
// =============================================================================

import { useState } from "react";
import type { FoundingProgramme, FoundingProgrammeStatus, FoundingAudience } from "@/types/uk-hub";
import { FOUNDING_STATUS_META } from "@/types/uk-hub";

interface FoundingFormData {
  locationId: string;
  audience: FoundingAudience;
  status: FoundingProgrammeStatus;
  title: string;
  description: string;
  totalAllocation: string;
  opensAt: string;
  closesAt: string;
  contributionAmounts: string;
  benefits: string[];
}

interface FoundingProgrammeFormProps {
  initial?: Partial<FoundingProgramme>;
  locationOptions: { id: string; name: string }[];
  onSubmit: (data: FoundingFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const ALL_BENEFITS = [
  { value: "early_access", label: "Early Access" },
  { value: "voting", label: "Voting Rights" },
  { value: "events", label: "Events Access" },
  { value: "priority_participation", label: "Priority Participation" },
  { value: "product_upgrades", label: "Product Upgrades" },
  { value: "community_recognition", label: "Community Recognition" },
];

export function FoundingProgrammeForm({
  initial,
  locationOptions,
  onSubmit,
  onCancel,
  isEdit = false,
}: FoundingProgrammeFormProps) {
  const [form, setForm] = useState<FoundingFormData>(() => {
    let amounts = "";
    let benefits: string[] = [];
    try {
      if (initial?.contributionConfig) {
        const c = JSON.parse(initial.contributionConfig);
        if (c.amounts) amounts = c.amounts.map((a: number) => a / 100).join(", ");
      }
      if (initial?.benefitConfig) {
        const b = JSON.parse(initial.benefitConfig);
        if (Array.isArray(b)) benefits = b;
      }
    } catch {}
    return {
      locationId: initial?.locationId || "",
      audience: initial?.audience || "BUSINESS",
      status: initial?.status || "DRAFT",
      title: initial?.title || "",
      description: initial?.description || "",
      totalAllocation: initial?.totalAllocation?.toString() || "",
      opensAt: initial?.opensAt ? new Date(initial.opensAt).toISOString().split("T")[0] || "" : "",
      closesAt: initial?.closesAt ? new Date(initial.closesAt).toISOString().split("T")[0] || "" : "",
      contributionAmounts: amounts,
      benefits,
    };
  });

  const set = (key: keyof FoundingFormData, val: string | string[]) => setForm(f => ({ ...f, [key]: val }));

  const toggleBenefit = (b: string) => {
    setForm(f => ({
      ...f,
      benefits: f.benefits.includes(b) ? f.benefits.filter(x => x !== b) : [...f.benefits, b],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Programme Details</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location *</label>
            <select
              required
              value={form.locationId}
              onChange={e => set("locationId", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Select location</option>
              {locationOptions.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Audience *</label>
            <select
              value={form.audience}
              onChange={e => set("audience", e.target.value as FoundingAudience)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="BUSINESS">🏢 Business</option>
              <option value="CONSUMER">👤 Consumer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={e => set("status", e.target.value as FoundingProgrammeStatus)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              {(Object.keys(FOUNDING_STATUS_META) as FoundingProgrammeStatus[]).map(s => (
                <option key={s} value={s}>{FOUNDING_STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Allocation *</label>
            <input
              type="number"
              required
              min="1"
              value={form.totalAllocation}
              onChange={e => set("totalAllocation", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="100"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => set("title", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="e.g. Birmingham Founding Business Member Programme"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={e => set("description", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Opens At</label>
            <input
              type="date"
              value={form.opensAt}
              onChange={e => set("opensAt", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Closes At</label>
            <input
              type="date"
              value={form.closesAt}
              onChange={e => set("closesAt", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </div>

      {/* Contribution & Benefits */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Contribution & Benefits</h3>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Contribution Tiers (pence, comma-separated)</label>
          <input
            type="text"
            value={form.contributionAmounts}
            onChange={e => set("contributionAmounts", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="5000, 15000, 30000"
          />
          <p className="mt-0.5 text-xs text-gray-400">Enter amounts in pence. E.g. 5000 = £50</p>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Benefits</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_BENEFITS.map(b => (
              <button
                key={b.value}
                type="button"
                onClick={() => toggleBenefit(b.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  form.benefits.includes(b.value)
                    ? "bg-primary-100 text-primary-700 border border-primary-300"
                    : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          {isEdit ? "Save Changes" : "Create Programme"}
        </button>
      </div>
    </form>
  );
}
