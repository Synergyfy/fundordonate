// =============================================================================
// Consumer You-area demo data (Phase 8)
// Fake-async membership record + recognition list (setTimeout convention).
// =============================================================================

import type {
  MembershipLevel,
  MembershipStatus,
  MembershipTier,
} from "@fundordonate/types";

const DELAY_MS = 300;

function delay<T>(value: T, ms = DELAY_MS): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms));
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// ── Membership ──

export interface ConsumerMembership {
  id: string;
  tier: MembershipTier;
  level: MembershipLevel;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

const DEMO_MEMBERSHIP: ConsumerMembership = {
  id: "membership-demo-1",
  tier: "silver",
  level: "standard",
  status: "active",
  startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
  endDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
  autoRenew: true,
};

export async function getMembership(): Promise<ConsumerMembership | null> {
  return delay(DEMO_MEMBERSHIP);
}

// ── Recognitions ──

export type RecognitionIcon = "heart" | "flag" | "award";

export interface ConsumerRecognition {
  id: string;
  title: string;
  description: string;
  context: string;
  earnedDate: string;
  icon: RecognitionIcon;
}

const RECOGNITIONS: ConsumerRecognition[] = [
  {
    id: "rec-community-supporter",
    title: "Community Supporter",
    description:
      "Recognised for supporting projects that strengthen your local community.",
    context: "Camden, London",
    earnedDate: daysAgo(41),
    icon: "heart",
  },
  {
    id: "rec-campaign-supporter",
    title: "Campaign Supporter",
    description:
      "Recognised for backing your first campaign on FundOrDonate.",
    context: "Camden High Street campaign",
    earnedDate: daysAgo(6),
    icon: "flag",
  },
  {
    id: "rec-founding-member",
    title: "Founding Member",
    description:
      "Recognised for joining the Founding Membership programme.",
    context: "Lambeth Founding Membership",
    earnedDate: daysAgo(14),
    icon: "award",
  },
];

export async function listRecognitions(): Promise<ConsumerRecognition[]> {
  const items = [...RECOGNITIONS].sort((a, b) =>
    b.earnedDate.localeCompare(a.earnedDate),
  );
  return delay(items);
}
