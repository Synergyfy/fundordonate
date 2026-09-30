// =============================================================================
// Location Recommendations — community submissions (businesses & consumers)
//
// Businesses and consumers can recommend a high street that is missing from the
// hierarchy. Recommendations go into a PENDING admin review queue. Admin approval
// never auto-confirms a location: it creates the high street as "suggested"
// (source "recommendation"), and it still has to be confirmed via the High
// Streets admin page — geographic/community data only ever SUGGESTS layers.
//
// Frontend-only demo store: in-memory data + fake async (setTimeout).
// =============================================================================

import {
  addHighStreet,
  addLocalArea,
  getAddedAreas,
  getAddedStreets,
  slugify,
} from "./locationRegistry";
import { getLocalAreasForCity, getHighStreetsForArea } from "./highStreetData";

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

let seq = 0;
const nextId = () => `rec-${Date.now().toString(36)}-${(seq++).toString(36)}`;
const now = () => new Date().toISOString();
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const recommendations: LocationRecommendation[] = [
  {
    id: "rec-seed-1",
    kind: "high_street",
    name: "Beech Road",
    citySlug: "manchester",
    cityName: "Manchester",
    areaSlug: "chorlton",
    areaName: "Chorlton",
    postcodes: ["M21 9EG"],
    suggestedBy: "Sarah M.",
    submittedByRole: "consumer",
    note: "Independent shops and cafés, always busy at weekends.",
    status: "pending",
    createdAt: "2026-09-20T10:15:00.000Z",
  },
  {
    id: "rec-seed-2",
    kind: "high_street",
    name: "Junction Road",
    citySlug: "london",
    cityName: "London",
    areaSlug: "camden",
    areaName: "Camden",
    postcodes: ["NW1 9JX"],
    suggestedBy: "Kingsway Electronics Ltd",
    submittedByRole: "business",
    note: "We are a shop on this road — would love to take part in the season.",
    status: "pending",
    createdAt: "2026-09-22T14:40:00.000Z",
  },
  {
    id: "rec-seed-3",
    kind: "high_street",
    name: "Warwick Road",
    citySlug: "birmingham",
    cityName: "Birmingham",
    areaSlug: "jewellery-quarter",
    areaName: "Jewellery Quarter",
    postcodes: ["B16 0LJ"],
    suggestedBy: "James O.",
    submittedByRole: "consumer",
    note: "",
    status: "pending",
    createdAt: "2026-09-25T09:05:00.000Z",
  },
  {
    id: "rec-seed-4",
    kind: "high_street",
    name: "Example Street",
    citySlug: "manchester",
    cityName: "Manchester",
    areaSlug: "ancoats",
    areaName: "Ancoats",
    postcodes: [],
    suggestedBy: "Test submitter",
    submittedByRole: "business",
    note: "Duplicate of an existing street.",
    status: "rejected",
    createdAt: "2026-09-10T16:00:00.000Z",
    reviewedAt: "2026-09-12T11:30:00.000Z",
  },
];

/** Sync read (live array, newest first). */
export function getLocationRecommendations(filter?: {
  status?: RecommendationStatus;
  citySlug?: string;
  role?: RecommendationAudience;
}): LocationRecommendation[] {
  return recommendations
    .filter(
      (r) =>
        (!filter?.status || r.status === filter?.status) &&
        (!filter?.citySlug || r.citySlug === filter?.citySlug) &&
        (!filter?.role || r.submittedByRole === filter?.role)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLocationRecommendationCounts(): {
  pending: number;
  approved: number;
  rejected: number;
} {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const r of recommendations) {
    if (r.status === "pending") pending++;
    else if (r.status === "approved") approved++;
    else rejected++;
  }
  return { pending, approved, rejected };
}

/** Fake-async list for the admin queue page. */
export async function listLocationRecommendations(filter?: {
  status?: RecommendationStatus;
  citySlug?: string;
  role?: RecommendationAudience;
}): Promise<LocationRecommendation[]> {
  await delay(300);
  return getLocationRecommendations(filter);
}

/** Fake-async submission from a business or consumer form. */
export async function submitLocationRecommendation(
  input: SubmitRecommendationInput
): Promise<LocationRecommendation> {
  await delay(450);
  const name = input.name.trim();
  if (!name) throw new Error("High street name is required.");
  if (!input.citySlug || !input.areaSlug)
    throw new Error("City and local area are required.");
  const rec: LocationRecommendation = {
    id: nextId(),
    kind: input.kind,
    name,
    citySlug: input.citySlug,
    cityName: input.cityName,
    areaSlug: input.areaSlug,
    areaName: input.areaName,
    postcodes: (input.postcodes ?? []).map((p) => p.trim()).filter(Boolean),
    suggestedBy: input.suggestedBy?.trim() || "Anonymous",
    submittedByRole: input.submittedByRole,
    note: input.note?.trim() ?? "",
    status: "pending",
    createdAt: now(),
  };
  recommendations.unshift(rec);
  return rec;
}

/**
 * Admin approves a recommendation. The location is created as "suggested"
 * (never confirmed) — it still needs confirmation on the High Streets page.
 */
export async function approveLocationRecommendation(id: string): Promise<void> {
  await delay(350);
  const rec = recommendations.find((r) => r.id === id);
  if (!rec) throw new Error("Recommendation not found.");
  if (rec.status === "approved") return;

  const label = `${rec.submittedByRole === "business" ? "Business" : "Consumer"} recommendation (${rec.suggestedBy})`;

  if (rec.kind === "high_street") {
    const slug = slugify(rec.name);
    const existsInRegistry = getAddedStreets({ citySlug: rec.citySlug }).some(
      (s) => s.slug === slug
    );
    const existsInGeo = getHighStreetsForArea(rec.citySlug, rec.areaSlug).some(
      (s) => s.slug === slug
    );
    if (!existsInRegistry && !existsInGeo) {
      addHighStreet({
        citySlug: rec.citySlug,
        areaSlug: rec.areaSlug,
        name: rec.name,
        postcodes: rec.postcodes,
        source: "recommendation",
        suggestedBy: label,
        state: "suggested",
      });
    }
  } else {
    const slug = slugify(rec.name);
    const existsInGeo = getLocalAreasForCity(rec.citySlug).some(
      (a) => a.slug === slug
    );
    const existsInRegistry = getAddedAreas(rec.citySlug).some(
      (a) => a.slug === slug
    );
    if (!existsInGeo && !existsInRegistry) {
      addLocalArea({
        citySlug: rec.citySlug,
        name: rec.name,
        source: "recommendation",
        state: "suggested",
      });
    }
  }

  rec.status = "approved";
  rec.reviewedAt = now();
}

/** Admin rejects a recommendation (nothing is added to the hierarchy). */
export async function rejectLocationRecommendation(
  id: string,
  _reason?: string
): Promise<void> {
  await delay(300);
  const rec = recommendations.find((r) => r.id === id);
  if (!rec) throw new Error("Recommendation not found.");
  if (rec.status === "rejected") return;
  rec.status = "rejected";
  rec.reviewedAt = now();
}
