// =============================================================================
// Membership Tiers Configuration
// Bronze/Silver/Gold/Platinum × Standard/Pro/Pro+
// Pulls from configuration — not hardcoded business rules.
// =============================================================================

export type AccessLevel = "standard" | "pro" | "pro_plus";
export type TierLevel = "bronze" | "silver" | "gold" | "platinum";

export interface MembershipVariant {
  id: string;
  accessLevel: AccessLevel;
  label: string;
  price: number;
  duration: string;
  durationDays: number;
  access: string[];
  benefits: string[];
  eligibility: string[];
  rewards: string[];
  foundingMemberOnly?: boolean;
}

export interface MembershipTier {
  id: TierLevel;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  variants: MembershipVariant[];
}

export const ACCESS_LABELS: Record<AccessLevel, string> = {
  standard: "Standard",
  pro: "Pro",
  pro_plus: "Pro+",
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    description: "Entry-level founding membership with essential benefits.",
    variants: [
      {
        id: "bronze-standard",
        accessLevel: "standard",
        label: "Bronze Standard",
        price: 50,
        duration: "90 days",
        durationDays: 90,
        access: ["Community forum", "Season updates", "Basic leaderboard"],
        benefits: ["Founding Member badge", "Community recognition", "Season newsletter"],
        eligibility: ["Any business on the high street"],
        rewards: ["Bronze badge", "Community recognition", "Season updates"],
      },
      {
        id: "bronze-pro",
        accessLevel: "pro",
        label: "Bronze Pro",
        price: 75,
        duration: "180 days",
        durationDays: 180,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights"],
        benefits: ["All Standard benefits", "Priority event access", "Monthly newsletter"],
        eligibility: ["Businesses with active participation"],
        rewards: ["Bronze badge", "Priority access", "Monthly newsletter", "Leaderboard points"],
      },
      {
        id: "bronze-pro-plus",
        accessLevel: "pro_plus",
        label: "Bronze Pro+",
        price: 120,
        duration: "365 days",
        durationDays: 365,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Annual summary"],
        benefits: ["All Pro benefits", "Annual recognition", "Extended access"],
        eligibility: ["Businesses committed to long-term participation"],
        rewards: ["Bronze badge", "Annual recognition", "Extended rewards", "Priority support"],
      },
    ],
  },
  {
    id: "silver",
    name: "Silver",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Mid-level founding membership with enhanced benefits.",
    variants: [
      {
        id: "silver-standard",
        accessLevel: "standard",
        label: "Silver Standard",
        price: 100,
        duration: "90 days",
        durationDays: 90,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights"],
        benefits: ["All Bronze benefits", "Priority event access", "Monthly newsletter"],
        eligibility: ["Businesses with active participation"],
        rewards: ["Silver badge", "Priority access", "Monthly newsletter", "Leaderboard points"],
      },
      {
        id: "silver-pro",
        accessLevel: "pro",
        label: "Silver Pro",
        price: 150,
        duration: "180 days",
        durationDays: 180,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights"],
        benefits: ["All Standard benefits", "Voting rights on campaigns", "Exclusive events"],
        eligibility: ["Businesses with established presence"],
        rewards: ["Silver badge", "Voting rights", "Exclusive events", "Enhanced leaderboard"],
      },
      {
        id: "silver-pro-plus",
        accessLevel: "pro_plus",
        label: "Silver Pro+",
        price: 240,
        duration: "365 days",
        durationDays: 365,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights", "Annual gala"],
        benefits: ["All Pro benefits", "Annual gala invitation", "Founding recognition wall"],
        eligibility: ["Businesses committed to long-term participation"],
        rewards: ["Silver badge", "Annual gala", "Founding wall", "Premium support"],
      },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    description: "Premium founding membership with full benefits.",
    variants: [
      {
        id: "gold-standard",
        accessLevel: "standard",
        label: "Gold Standard",
        price: 150,
        duration: "90 days",
        durationDays: 90,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights"],
        benefits: ["All Silver benefits", "Voting rights on campaigns", "Exclusive events"],
        eligibility: ["Businesses with established presence"],
        rewards: ["Gold badge", "Voting rights", "Exclusive events", "Enhanced leaderboard"],
      },
      {
        id: "gold-pro",
        accessLevel: "pro",
        label: "Gold Pro",
        price: 225,
        duration: "180 days",
        durationDays: 180,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights", "Premium events"],
        benefits: ["All Standard benefits", "Premium community events", "Direct hub access"],
        eligibility: ["Businesses with strong community ties"],
        rewards: ["Gold badge", "Premium events", "Direct hub access", "Top leaderboard"],
      },
      {
        id: "gold-pro-plus",
        accessLevel: "pro_plus",
        label: "Gold Pro+",
        price: 360,
        duration: "365 days",
        durationDays: 365,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights", "Premium events", "Annual dinner"],
        benefits: ["All Pro benefits", "Annual recognition dinner", "Founding Member Monthly programme"],
        eligibility: ["Businesses committed to long-term leadership"],
        rewards: ["Gold badge", "Annual dinner", "Founding wall", "Premium rewards", "Direct support"],
      },
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Elite founding membership with maximum benefits and recognition.",
    variants: [
      {
        id: "platinum-standard",
        accessLevel: "standard",
        label: "Platinum Standard",
        price: 200,
        duration: "90 days",
        durationDays: 90,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights", "Premium events"],
        benefits: ["All Gold benefits", "Premium community events", "Direct hub access"],
        eligibility: ["Businesses with strong community ties"],
        rewards: ["Platinum badge", "Premium events", "Direct hub access", "Top leaderboard"],
      },
      {
        id: "platinum-pro",
        accessLevel: "pro",
        label: "Platinum Pro",
        price: 300,
        duration: "180 days",
        durationDays: 180,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights", "Premium events", "VIP access"],
        benefits: ["All Standard benefits", "VIP event access", "Founding Member Monthly programme"],
        eligibility: ["Businesses with exceptional community involvement"],
        rewards: ["Platinum badge", "VIP access", "Founding Monthly", "Premium rewards"],
      },
      {
        id: "platinum-pro-plus",
        accessLevel: "pro_plus",
        label: "Platinum Pro+",
        price: 480,
        duration: "365 days",
        durationDays: 365,
        access: ["Community forum", "Season updates", "Full leaderboard", "Campaign insights", "Voting rights", "Premium events", "VIP access", "Annual gala"],
        benefits: ["All Pro benefits", "Annual recognition dinner", "Founding Member Monthly programme", "Premium rewards"],
        eligibility: ["Businesses committed to long-term leadership"],
        rewards: ["Platinum badge", "Annual dinner", "Founding Monthly", "Premium rewards", "Direct support", "VIP recognition"],
      },
    ],
  },
];

export function getMembershipTier(tierId: TierLevel): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find(t => t.id === tierId);
}

export function getMembershipVariant(variantId: string): MembershipVariant | undefined {
  for (const tier of MEMBERSHIP_TIERS) {
    const variant = tier.variants.find(v => v.id === variantId);
    if (variant) return variant;
  }
  return undefined;
}

export function getVariantsByAccessLevel(accessLevel: AccessLevel): MembershipVariant[] {
  const results: MembershipVariant[] = [];
  for (const tier of MEMBERSHIP_TIERS) {
    const variant = tier.variants.find(v => v.accessLevel === accessLevel);
    if (variant) results.push(variant);
  }
  return results;
}
