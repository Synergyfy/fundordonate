// =============================================================================
// Location Service — Frontend API Client
// Fetches location hierarchy data for the campaign wizard.
// =============================================================================

import type {
  LocationTreeResponse,
  LocationFlatItem,
} from "@/types/campaign-wizard";

const API_BASE = "/api";

// ── Public Endpoints (no auth required for tree) ──

export async function fetchLocationTree(): Promise<LocationTreeResponse> {
  const res = await fetch(`${API_BASE}/locations/tree`);
  if (!res.ok) throw new Error("Failed to fetch location tree");
  return res.json();
}

export async function fetchLocations(params?: {
  type?: string;
  parentId?: string;
  search?: string;
}): Promise<{ locations: LocationFlatItem[] }> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.parentId) qs.set("parentId", params.parentId);
  if (params?.search) qs.set("search", params.search);

  const res = await fetch(`${API_BASE}/locations?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

// ── Admin Endpoints (require admin auth) ──

export async function fetchAdminLocations(params?: {
  type?: string;
  parentId?: string;
  search?: string;
  includeInactive?: boolean;
}): Promise<{ locations: LocationFlatItem[] }> {
  const token = localStorage.getItem("fd_access_token");
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.parentId) qs.set("parentId", params.parentId);
  if (params?.search) qs.set("search", params.search);
  if (params?.includeInactive) qs.set("includeInactive", "true");

  const res = await fetch(`${API_BASE}/admin/locations?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch admin locations");
  return res.json();
}
