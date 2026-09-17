// =============================================================================
// Admin — Location Form Component
// Reusable form for creating and editing HubLocation entities.
// =============================================================================

import { useState } from "react";
import type { HubLocation, LocationType, LocationInternalLifecycle, LocationPublicStatus } from "@/types/uk-hub";
import { LOCATION_TYPE_META } from "@/types/uk-hub";

export interface LocationFormData {
  name: string;
  slug: string;
  type: LocationType;
  parentId: string;
  shortDescription: string;
  description: string;
  heroHeadline: string;
  heroSupportingText: string;
  internalLifecycle: LocationInternalLifecycle;
  publicStatus: LocationPublicStatus;
  statusOverride: LocationPublicStatus | "";
  isActive: boolean;
  isPublic: boolean;
  mapVisible: boolean;
  latitude: string;
  longitude: string;
  mapZoomLevel: string;
  primaryImage: string;
  secondaryImage: string;
  isFeaturedNationally: boolean;
  featuredPriority: string;
  fundingTarget: string;
  fundingRaised: string;
  activationThreshold: string;
  activationTrigger: string;
  activationUnlocks: string;
  foundingBusinessTotal: string;
  foundingConsumerTotal: string;
}

interface LocationFormProps {
  initial?: Partial<HubLocation>;
  allLocations: HubLocation[];
  onSubmit: (data: LocationFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const DEFAULT_FORM: LocationFormData = {
  name: "",
  slug: "",
  type: "CITY",
  parentId: "",
  shortDescription: "",
  description: "",
  heroHeadline: "",
  heroSupportingText: "",
  internalLifecycle: "DRAFT",
  publicStatus: "NEEDS_ACTIVATION",
  statusOverride: "",
  isActive: false,
  isPublic: true,
  mapVisible: false,
  latitude: "",
  longitude: "",
  mapZoomLevel: "10",
  primaryImage: "",
  secondaryImage: "",
  isFeaturedNationally: false,
  featuredPriority: "",
  fundingTarget: "",
  fundingRaised: "0",
  activationThreshold: "80",
  activationTrigger: "",
  activationUnlocks: "",
  foundingBusinessTotal: "",
  foundingConsumerTotal: "",
};

export function LocationForm({ initial, allLocations, onSubmit, onCancel, isEdit = false }: LocationFormProps) {
  const [form, setForm] = useState<LocationFormData>(() => ({
    ...DEFAULT_FORM,
    ...(initial as Record<string, unknown>),
    parentId: initial?.parentId || "",
    latitude: initial?.latitude?.toString() || "",
    longitude: initial?.longitude?.toString() || "",
    mapZoomLevel: initial?.mapZoomLevel?.toString() || "10",
    fundingTarget: initial?.fundingTarget?.toString() || "",
    fundingRaised: initial?.fundingRaised?.toString() || "",
    activationThreshold: initial?.activationThreshold?.toString() || "",
    activationTrigger: ((initial as unknown as Record<string, unknown>)?.activationTrigger as string) || "",
    activationUnlocks: ((initial as unknown as Record<string, unknown>)?.activationUnlocks as string) || "",
    foundingBusinessTotal: initial?.foundingBusinessTotal?.toString() || "",
    foundingConsumerTotal: initial?.foundingConsumerTotal?.toString() || "",
    featuredPriority: initial?.featuredPriority?.toString() || "",
    statusOverride: initial?.statusOverride || "",
  } as LocationFormData));

  const set = (key: keyof LocationFormData, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  // Auto-generate slug from name
  const autoSlug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const parents = allLocations.filter(l => l.id !== initial?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, slug: form.slug || autoSlug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="e.g. Birmingham"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => set("slug", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder={autoSlug}
            />
            <p className="mt-0.5 text-xs text-gray-400">Auto-generated if empty</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type *</label>
            <select
              value={form.type}
              onChange={e => set("type", e.target.value as LocationType)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              {(Object.keys(LOCATION_TYPE_META) as LocationType[]).map(t => (
                <option key={t} value={t}>{LOCATION_TYPE_META[t].icon} {LOCATION_TYPE_META[t].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Location</label>
            <select
              value={form.parentId}
              onChange={e => set("parentId", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">None (top-level)</option>
              {parents.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Short Description</label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={e => set("shortDescription", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Brief description for cards and search results"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Full Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={e => set("description", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Full description for the hub page"
          />
        </div>
      </div>

      {/* Hero Content */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Hero Content</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Headline</label>
            <input
              type="text"
              value={form.heroHeadline}
              onChange={e => set("heroHeadline", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="e.g. Birmingham City Hub"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supporting Text</label>
            <input
              type="text"
              value={form.heroSupportingText}
              onChange={e => set("heroSupportingText", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="Part of the UK Hub Activation Programme"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Image URL</label>
            <input
              type="url"
              value={form.primaryImage}
              onChange={e => set("primaryImage", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Image URL</label>
            <input
              type="url"
              value={form.secondaryImage}
              onChange={e => set("secondaryImage", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Status & Lifecycle */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Status & Lifecycle</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Internal Lifecycle</label>
            <select
              value={form.internalLifecycle}
              onChange={e => set("internalLifecycle", e.target.value as LocationInternalLifecycle)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              {["DRAFT", "IDENTIFIED", "PREPARING", "LAUNCHING", "ACTIVATING", "ACTIVE", "EXPANDING", "ARCHIVED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Public Status</label>
            <select
              value={form.publicStatus}
              onChange={e => set("publicStatus", e.target.value as LocationPublicStatus)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              {["NEEDS_ACTIVATION", "MAKING_PROGRESS", "ACTIVE"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Override</label>
            <select
              value={form.statusOverride}
              onChange={e => set("statusOverride", e.target.value as LocationPublicStatus | "")}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">None (use calculated)</option>
              {["NEEDS_ACTIVATION", "MAKING_PROGRESS", "ACTIVE"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} className="rounded" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublic} onChange={e => set("isPublic", e.target.checked)} className="rounded" />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.mapVisible} onChange={e => set("mapVisible", e.target.checked)} className="rounded" />
            Map Visible
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeaturedNationally} onChange={e => set("isFeaturedNationally", e.target.checked)} className="rounded" />
            Featured Nationally
          </label>
        </div>
      </div>

      {/* Map & Location */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Map & Coordinates</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={e => set("latitude", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="51.5074"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={e => set("longitude", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="-0.1278"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zoom Level</label>
            <input
              type="number"
              min="5"
              max="18"
              value={form.mapZoomLevel}
              onChange={e => set("mapZoomLevel", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </div>

      {/* Funding & Founding */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900">Funding & Founding</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Funding Target (pence)</label>
            <input
              type="number"
              value={form.fundingTarget}
              onChange={e => set("fundingTarget", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="500000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Funding Raised (pence)</label>
            <input
              type="number"
              value={form.fundingRaised}
              onChange={e => set("fundingRaised", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Activation Threshold (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.activationThreshold}
              onChange={e => set("activationThreshold", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Featured Priority</label>
            <input
              type="number"
              min="0"
              value={form.featuredPriority}
              onChange={e => set("featuredPriority", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Founding Business Total</label>
            <input
              type="number"
              value={form.foundingBusinessTotal}
              onChange={e => set("foundingBusinessTotal", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Founding Consumer Total</label>
            <input
              type="number"
              value={form.foundingConsumerTotal}
              onChange={e => set("foundingConsumerTotal", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="200"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Activation Trigger (admin rule)</label>
            <input
              type="text"
              value={form.activationTrigger}
              onChange={e => set("activationTrigger", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="e.g. 80% funding + 50% founding allocation + operating resources confirmed"
            />
            <p className="mt-1 text-[11px] text-gray-400">What must be true for this location to become Active. Not a universal percentage.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unlocks at Active (comma-separated)</label>
            <input
              type="text"
              value={form.activationUnlocks}
              onChange={e => set("activationUnlocks", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="e.g. Voting rights, Product trials, Member events"
            />
            <p className="mt-1 text-[11px] text-gray-400">Access and features that become available when the trigger is reached.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {isEdit ? "Save Changes" : "Create Location"}
        </button>
      </div>
    </form>
  );
}
