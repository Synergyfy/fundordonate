// =============================================================================
// Location Recommendations Service
// Manages community high street recommendations and admin approval flow.
// =============================================================================

import { adminApi } from "@/services/admin";

export type RecommendationStatus = "pending" | "approved" | "rejected";
export type RecommendationAudience = "business" | "consumer";
export type RecommendationKind = "high_street" | "local_area";

export interface LocationRecommendation {
  id: string;
  kind: RecommendationKind;
  name: string;
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  postcodes: string[];
  suggestedBy: string;
  submittedByRole: RecommendationAudience;
  note: string;
  status: RecommendationStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface SubmitRecommendationInput {
  kind: RecommendationKind;
  name: string;
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  postcodes?: string[];
  suggestedBy?: string;
  submittedByRole: RecommendationAudience;
  note?: string;
}

const STORAGE_KEY = "fundordonate_location_recommendations";

function getStoredRecommendations(): LocationRecommendation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRecommendations(list: LocationRecommendation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

export async function submitLocationRecommendation(
  input: SubmitRecommendationInput
): Promise<LocationRecommendation> {
  const item: LocationRecommendation = {
    id: `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind: input.kind,
    name: input.name.trim(),
    citySlug: input.citySlug,
    cityName: input.cityName,
    areaSlug: input.areaSlug,
    areaName: input.areaName,
    postcodes: input.postcodes || [],
    suggestedBy: input.suggestedBy || "",
    submittedByRole: input.submittedByRole,
    note: input.note || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const current = getStoredRecommendations();
  current.unshift(item);
  saveRecommendations(current);
  return item;
}

export async function listLocationRecommendations(filter?: {
  status?: RecommendationStatus;
}): Promise<LocationRecommendation[]> {
  const current = getStoredRecommendations();
  if (filter?.status) {
    return current.filter((r) => r.status === filter.status);
  }
  return current;
}

export function getLocationRecommendationCounts(): {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
} {
  const current = getStoredRecommendations();
  return {
    pending: current.filter((r) => r.status === "pending").length,
    approved: current.filter((r) => r.status === "approved").length,
    rejected: current.filter((r) => r.status === "rejected").length,
    total: current.length,
  };
}

export function getCommunityRecommendations(citySlug?: string): LocationRecommendation[] {
  const current = getStoredRecommendations();
  if (citySlug) {
    return current.filter((r) => r.citySlug === citySlug);
  }
  return current;
}

export async function approveLocationRecommendation(id: string): Promise<boolean> {
  const current = getStoredRecommendations();
  const rec = current.find((r) => r.id === id);
  if (!rec) return false;

  rec.status = "approved";
  rec.reviewedAt = new Date().toISOString();
  saveRecommendations(current);

  // Create real location in database via adminApi
  try {
    await adminApi.createLocation({
      name: rec.name,
      type: rec.kind === "high_street" ? "HIGH_STREET" : "LOCAL_AREA",
      activationStatus: "ACTIVE",
    });
  } catch (err) {
    console.warn("Could not sync recommended location to admin API:", err);
  }

  return true;
}

export async function rejectLocationRecommendation(id: string): Promise<boolean> {
  const current = getStoredRecommendations();
  const rec = current.find((r) => r.id === id);
  if (!rec) return false;

  rec.status = "rejected";
  rec.reviewedAt = new Date().toISOString();
  saveRecommendations(current);
  return true;
}
