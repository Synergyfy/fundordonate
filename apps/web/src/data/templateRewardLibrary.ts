// =============================================================================
// Reusable Reward Library — Demo Data
// Central catalogue of approved reward assets. Campaign templates reference
// these rewards instead of recreating assets that already exist in the
// MCOM ecosystem (gift cards, vouchers, loyalty access, etc.).
// =============================================================================

export type RewardCategory =
  | "gift_card"
  | "egift_card"
  | "voucher"
  | "coupon"
  | "deal"
  | "membership"
  | "other";

export type RewardAudience = "business" | "consumer" | "both";

export type RewardSource = "mcom" | "fundordonate";

export type DeliveryMethod =
  | "digital_delivery"
  | "voucher_code"
  | "external_link"
  | "instructions"
  | "mcom_asset"
  | "other";

export interface LibraryReward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  /** Reward face value in GBP. Null when the reward has no fixed value. */
  valueGbp: number | null;
  audience: RewardAudience;
  source: RewardSource;
  status: "active" | "draft" | "archived";
  defaultDelivery: DeliveryMethod;
  /** Number of campaigns currently using this reward. */
  uses: number;
  tags: string[];
}

export const REWARD_CATEGORY_META: Record<RewardCategory, { label: string; color: string }> = {
  gift_card: { label: "Gift Card", color: "bg-amber-100 text-amber-700" },
  egift_card: { label: "E-Gift Card", color: "bg-blue-100 text-blue-700" },
  voucher: { label: "Voucher", color: "bg-purple-100 text-purple-700" },
  coupon: { label: "Coupon", color: "bg-pink-100 text-pink-700" },
  deal: { label: "Deal", color: "bg-green-100 text-green-700" },
  membership: { label: "Membership / Access", color: "bg-indigo-100 text-indigo-700" },
  other: { label: "Other Reward", color: "bg-gray-100 text-gray-600" },
};

export const AUDIENCE_META: Record<RewardAudience, { label: string; color: string }> = {
  business: { label: "Business", color: "bg-blue-100 text-blue-700" },
  consumer: { label: "Consumer", color: "bg-green-100 text-green-700" },
  both: { label: "Both", color: "bg-indigo-100 text-indigo-700" },
};

export const SOURCE_META: Record<RewardSource, { label: string; color: string }> = {
  mcom: { label: "MCOM Asset", color: "bg-teal-100 text-teal-700" },
  fundordonate: { label: "FundOrDonate", color: "bg-primary-100 text-primary-700" },
};

export const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; hint: string }[] = [
  { value: "digital_delivery", label: "Digital Delivery", hint: "Reward is sent digitally to the contributor." },
  { value: "voucher_code", label: "Voucher / Code", hint: "A unique voucher or redemption code is issued." },
  { value: "external_link", label: "External Link", hint: "Contributor is directed to an external redemption URL." },
  { value: "instructions", label: "Instructions", hint: "Redemption instructions are issued manually." },
  { value: "mcom_asset", label: "MCOM-Connected Asset", hint: "Delivered through the existing MCOM ecosystem." },
  { value: "other", label: "Other Configured Method", hint: "Any other delivery method configured for this asset." },
];

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = Object.fromEntries(
  DELIVERY_OPTIONS.map((o) => [o.value, o.label])
) as Record<DeliveryMethod, string>;

export const LIBRARY_REWARDS: LibraryReward[] = [
  {
    id: "lr-egift-5",
    name: "£5 E-Gift Card",
    description: "Digital £5 gift card issued from the MCOM gift card catalogue.",
    category: "egift_card",
    valueGbp: 5,
    audience: "both",
    source: "mcom",
    status: "active",
    defaultDelivery: "digital_delivery",
    uses: 14,
    tags: ["gift card", "digital", "mcom"],
  },
  {
    id: "lr-egift-10",
    name: "£10 E-Gift Card",
    description: "Digital £10 gift card issued from the MCOM gift card catalogue.",
    category: "egift_card",
    valueGbp: 10,
    audience: "both",
    source: "mcom",
    status: "active",
    defaultDelivery: "digital_delivery",
    uses: 12,
    tags: ["gift card", "digital", "mcom"],
  },
  {
    id: "lr-egift-15",
    name: "£15 E-Gift Card",
    description: "Digital £15 gift card issued from the MCOM gift card catalogue.",
    category: "egift_card",
    valueGbp: 15,
    audience: "both",
    source: "mcom",
    status: "active",
    defaultDelivery: "digital_delivery",
    uses: 9,
    tags: ["gift card", "digital", "mcom"],
  },
  {
    id: "lr-gift-25",
    name: "£25 Physical Gift Card",
    description: "Physical £25 gift card posted to the contributor's address.",
    category: "gift_card",
    valueGbp: 25,
    audience: "consumer",
    source: "mcom",
    status: "active",
    defaultDelivery: "instructions",
    uses: 5,
    tags: ["gift card", "physical"],
  },
  {
    id: "lr-mcom-30",
    name: "30 Days MCOM Rewards & Loyalty Access",
    description: "Thirty days of MCOM Rewards & Loyalty membership benefits.",
    category: "membership",
    valueGbp: null,
    audience: "both",
    source: "mcom",
    status: "active",
    defaultDelivery: "mcom_asset",
    uses: 8,
    tags: ["loyalty", "membership", "mcom"],
  },
  {
    id: "lr-mcom-90",
    name: "90 Days MCOM Rewards & Loyalty Access",
    description: "Ninety days of MCOM Rewards & Loyalty membership benefits.",
    category: "membership",
    valueGbp: null,
    audience: "business",
    source: "mcom",
    status: "active",
    defaultDelivery: "mcom_asset",
    uses: 4,
    tags: ["loyalty", "membership", "mcom"],
  },
  {
    id: "lr-voucher-5off",
    name: "£5 High Street Voucher",
    description: "£5 off voucher redeemable at participating high street partners.",
    category: "voucher",
    valueGbp: 5,
    audience: "both",
    source: "fundordonate",
    status: "active",
    defaultDelivery: "voucher_code",
    uses: 7,
    tags: ["voucher", "high street"],
  },
  {
    id: "lr-coupon-10pc",
    name: "10% Partner Coupon",
    description: "One-time 10% discount coupon for partner stores.",
    category: "coupon",
    valueGbp: null,
    audience: "consumer",
    source: "fundordonate",
    status: "active",
    defaultDelivery: "voucher_code",
    uses: 6,
    tags: ["coupon", "discount"],
  },
  {
    id: "lr-deal-coffee",
    name: "Free Coffee Weekend Deal",
    description: "Weekend coffee deal at participating cafés.",
    category: "deal",
    valueGbp: null,
    audience: "consumer",
    source: "fundordonate",
    status: "active",
    defaultDelivery: "external_link",
    uses: 3,
    tags: ["deal", "hospitality"],
  },
  {
    id: "lr-access-founder",
    name: "Founding Member Access",
    description: "Founding member access benefits for supporters of the programme.",
    category: "membership",
    valueGbp: null,
    audience: "both",
    source: "fundordonate",
    status: "active",
    defaultDelivery: "mcom_asset",
    uses: 5,
    tags: ["membership", "founding"],
  },
  {
    id: "lr-listing-upgrade",
    name: "Business Listing Upgrade",
    description: "Three-month premium listing upgrade for a local business.",
    category: "other",
    valueGbp: null,
    audience: "business",
    source: "fundordonate",
    status: "active",
    defaultDelivery: "instructions",
    uses: 2,
    tags: ["business", "listing"],
  },
  {
    id: "lr-thankyou-cert",
    name: "Thank-You Certificate",
    description: "Digital thank-you certificate issued after a contribution.",
    category: "other",
    valueGbp: null,
    audience: "both",
    source: "fundordonate",
    status: "draft",
    defaultDelivery: "digital_delivery",
    uses: 0,
    tags: ["certificate", "digital"],
  },
];
