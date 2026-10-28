// =============================================================================
// Location Recommendations Service
// Community high street / local area recommendations and the admin review flow.
// Backed by the API (public submit + admin review endpoints).
// =============================================================================

import api from "@/services/api";
import { adminApi } from "@/services/admin";

export type RecommendationStatus = "pending" | "approved" | "rejected";
export type RecommendationAudience = "business" | "consumer";
export type RecommendationKind = "high_street" | "local_area";

export interface LocationRecommendation {
  id: string;
  kind: RecommendationKind;
  name: string;
  slug?: string;
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
  createdLocationId?: string | null;
}

export interface RecommendationCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface RecommendationListResult {
  items: LocationRecommendation[];
  counts: RecommendationCounts;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Public projection returned to the Add City wizard (no recommender identity). */
export interface CommunityRecommendation {
  id: string;
  kind: RecommendationKind;
  name: string;
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  postcodes: string[];
  status: RecommendationStatus;
  createdAt: string;
}

export interface SubmitRecommendationInput {
  kind: RecommendationKind;
  name: string;
  citySlug: string;
  cityName?: string;
  areaSlug: string;
  areaName?: string;
  postcodes?: string[];
  suggestedBy?: string;
  submittedByRole: RecommendationAudience;
  note?: string;
}

function extractApiError(err: unknown, fallback: string): string {
  const error = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return error?.message || fallback;
}

export async function submitLocationRecommendation(
  input: SubmitRecommendationInput,
): Promise<LocationRecommendation> {
  try {
    return await api.post<LocationRecommendation>("/hub/recommendations", {
      kind: input.kind === "local_area" ? "LOCAL_AREA" : "HIGH_STREET",
      name: input.name.trim(),
      citySlug: input.citySlug,
      areaSlug: input.areaSlug,
      postcodes: input.postcodes ?? [],
      suggestedBy: input.suggestedBy,
      submittedByRole: input.submittedByRole,
      note: input.note,
    });
  } catch (err) {
    throw new Error(extractApiError(err, "Could not submit your recommendation."));
  }
}

export async function listLocationRecommendations(filter?: {
  status?: RecommendationStatus;
}): Promise<RecommendationListResult> {
  try {
    const result = await adminApi.getLocationRecommendations({
      status: filter?.status?.toUpperCase(),
      limit: 100,
    });
    return result as RecommendationListResult;
  } catch (err) {
    throw new Error(extractApiError(err, "Could not load recommendations."));
  }
}

export async function getLocationRecommendationCounts(): Promise<RecommendationCounts> {
  try {
    return (await adminApi.getLocationRecommendationCounts()) as RecommendationCounts;
  } catch {
    return { pending: 0, approved: 0, rejected: 0, total: 0 };
  }
}

/** Used by the city wizard's High Streets step. */
export async function getCommunityRecommendations(
  citySlug?: string,
): Promise<CommunityRecommendation[]> {
  try {
    const result = await api.get<{ items: CommunityRecommendation[] }>("/hub/recommendations", {
      params: citySlug ? { citySlug } : undefined,
    });
    return result?.items ?? [];
  } catch {
    return [];
  }
}

export async function approveLocationRecommendation(id: string): Promise<{
  recommendation: LocationRecommendation;
  location?: { id: string; name: string; slug: string; type: string };
  reusedExistingLocation?: boolean;
}> {
  try {
    return await adminApi.approveLocationRecommendation(id);
  } catch (err) {
    throw new Error(extractApiError(err, "Could not approve the recommendation."));
  }
}

export async function rejectLocationRecommendation(id: string): Promise<LocationRecommendation> {
  try {
    return await adminApi.rejectLocationRecommendation(id);
  } catch (err) {
    throw new Error(extractApiError(err, "Could not reject the recommendation."));
  }
}
