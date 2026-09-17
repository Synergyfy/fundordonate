// =============================================================================
// Demo Reward Data
// Provides trigger-based reward tiers for demo campaigns.
// Used when the backend API is unavailable.
// =============================================================================

export interface DemoReward {
  id: string;
  title: string;
  description: string;
  order: number;
  triggerType: string;
  triggerConfig: { mode: string; min?: number; max?: number; exact?: number };
  audience: string;
  quantityType: string;
  quantityLimit: number | null;
  quantityClaimed: number;
  claimDeadlineDays: number;
  fulfilmentType: string;
  rewardType: string;
  items: { title: string; physicalType: string }[];
}

// Demo rewards keyed by campaign slug
const DEMO_REWARDS_BY_CAMPAIGN: Record<string, DemoReward[]> = {
  "support-worcester-high-street": [
    {
      id: "demo-r1",
      title: "£5 Digital E-Card",
      description: "Receive a £5 digital e-card when you contribute £10 or more to this campaign.",
      order: 0,
      triggerType: "contribution",
      triggerConfig: { mode: "min", min: 1000 },
      audience: "both",
      quantityType: "unlimited",
      quantityLimit: null,
      quantityClaimed: 0,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      rewardType: "ecard",
      items: [{ title: "£5 Digital E-Card", physicalType: "digital" }],
    },
    {
      id: "demo-r2",
      title: "£10 E-Card + Partner Voucher",
      description: "A £10 e-card plus a partner voucher when you contribute £50 or more.",
      order: 1,
      triggerType: "contribution",
      triggerConfig: { mode: "range", min: 5000, max: 9999 },
      audience: "both",
      quantityType: "limited",
      quantityLimit: 200,
      quantityClaimed: 12,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      rewardType: "ecard",
      items: [
        { title: "£10 Digital E-Card", physicalType: "digital" },
        { title: "£5 Partner Voucher", physicalType: "digital" },
      ],
    },
    {
      id: "demo-r3",
      title: "£25 E-Card + Premium Voucher",
      description: "A £25 e-card and premium partner voucher for contributions of £100 or more.",
      order: 2,
      triggerType: "contribution",
      triggerConfig: { mode: "range", min: 10000, max: 19999 },
      audience: "business",
      quantityType: "limited",
      quantityLimit: 100,
      quantityClaimed: 5,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      rewardType: "ecard",
      items: [
        { title: "£25 Digital E-Card", physicalType: "digital" },
        { title: "£10 Premium Partner Voucher", physicalType: "digital" },
      ],
    },
    {
      id: "demo-r4",
      title: "£50 E-Card + Voucher + Discount",
      description: "Our premium reward package for major contributors of £200 or more.",
      order: 3,
      triggerType: "contribution",
      triggerConfig: { mode: "min", min: 20000 },
      audience: "both",
      quantityType: "limited",
      quantityLimit: 50,
      quantityClaimed: 2,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      rewardType: "ecard",
      items: [
        { title: "£50 Digital E-Card", physicalType: "digital" },
        { title: "£20 Partner Voucher", physicalType: "digital" },
        { title: "10% Partner Discount Code", physicalType: "digital" },
      ],
    },
  ],
  "birmingham-high-street-community": [
    {
      id: "demo-r5",
      title: "Community Supporter Badge",
      description: "A digital badge showing your support for Birmingham's high street community.",
      order: 0,
      triggerType: "contribution",
      triggerConfig: { mode: "min", min: 500 },
      audience: "both",
      quantityType: "unlimited",
      quantityLimit: null,
      quantityClaimed: 0,
      claimDeadlineDays: 30,
      fulfilmentType: "internal",
      rewardType: "standard",
      items: [{ title: "Digital Supporter Badge", physicalType: "digital" }],
    },
    {
      id: "demo-r6",
      title: "£10 E-Card",
      description: "A £10 digital e-card for Birmingham high street businesses.",
      order: 1,
      triggerType: "contribution",
      triggerConfig: { mode: "min", min: 2500 },
      audience: "consumer",
      quantityType: "unlimited",
      quantityLimit: null,
      quantityClaimed: 0,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      rewardType: "ecard",
      items: [{ title: "£10 Digital E-Card", physicalType: "digital" }],
    },
    {
      id: "demo-r7",
      title: "£25 E-Card + Discount Bundle",
      description: "Premium reward for significant contributors to Birmingham's regeneration.",
      order: 2,
      triggerType: "contribution",
      triggerConfig: { mode: "min", min: 10000 },
      audience: "both",
      quantityType: "limited",
      quantityLimit: 75,
      quantityClaimed: 8,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      rewardType: "ecard",
      items: [
        { title: "£25 Digital E-Card", physicalType: "digital" },
        { title: "15% Partner Discount", physicalType: "digital" },
      ],
    },
  ],
};

// Default rewards for campaigns without specific demo rewards
const DEFAULT_REWARDS: DemoReward[] = [
  {
    id: "demo-default-r1",
    title: "Supporter E-Card",
    description: "A thank-you digital e-card for supporting this campaign.",
    order: 0,
    triggerType: "contribution",
    triggerConfig: { mode: "min", min: 1000 },
    audience: "both",
    quantityType: "unlimited",
    quantityLimit: null,
    quantityClaimed: 0,
    claimDeadlineDays: 30,
    fulfilmentType: "manual",
    rewardType: "ecard",
    items: [{ title: "Thank-You Digital E-Card", physicalType: "digital" }],
  },
  {
    id: "demo-default-r2",
    title: "Premium Supporter Package",
    description: "A premium reward package for generous contributors.",
    order: 1,
    triggerType: "contribution",
    triggerConfig: { mode: "min", min: 10000 },
    audience: "both",
    quantityType: "limited",
    quantityLimit: 100,
    quantityClaimed: 3,
    claimDeadlineDays: 30,
    fulfilmentType: "manual",
    rewardType: "ecard",
    items: [
      { title: "£25 Digital E-Card", physicalType: "digital" },
      { title: "Supporter Certificate", physicalType: "digital" },
    ],
  },
];

/**
 * Get demo rewards for a campaign by slug.
 * Falls back to default rewards if no specific rewards exist.
 */
export function getDemoRewardsForCampaign(campaignSlug: string): DemoReward[] {
  return DEMO_REWARDS_BY_CAMPAIGN[campaignSlug] || DEFAULT_REWARDS;
}

/**
 * Simulate reward evaluation after a contribution.
 * Returns which rewards the contribution qualifies for based on trigger config.
 */
export function simulateRewardEvaluation(
  campaignSlug: string,
  contributionAmount: number // pence
): { reward: DemoReward; triggerValue: Record<string, unknown> }[] {
  const rewards = getDemoRewardsForCampaign(campaignSlug);
  const qualifying: { reward: DemoReward; triggerValue: Record<string, unknown> }[] = [];

  for (const reward of rewards) {
    const tc = reward.triggerConfig;
    let matches = false;

    switch (tc.mode) {
      case "min":
        matches = contributionAmount >= (tc.min ?? 0);
        break;
      case "range":
        matches = contributionAmount >= (tc.min ?? 0) && contributionAmount <= (tc.max ?? Infinity);
        break;
      case "exact":
        matches = contributionAmount === tc.exact;
        break;
    }

    if (matches) {
      qualifying.push({
        reward,
        triggerValue: {
          contributionAmount,
          triggerMode: tc.mode,
          matchedAt: new Date().toISOString(),
        },
      });
    }
  }

  // Simulate "highest only" mode — return only the last (highest) qualifying reward
  if (qualifying.length > 0) {
    const highest = qualifying[qualifying.length - 1];
    if (highest) return [highest];
  }

  return [];
}
