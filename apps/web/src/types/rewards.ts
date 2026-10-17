// =============================================================================
// Reward & Asset Domain Types & Configurations
// =============================================================================

export type AssetStatus = "active" | "draft" | "archived";
export type DigitalAssetType = "gift-card" | "voucher" | "coupon" | "deal";

export const DIGITAL_TYPE_ORDER: DigitalAssetType[] = ["gift-card", "voucher", "coupon", "deal"];

export const DIGITAL_TYPE_META: Record<DigitalAssetType, { label: string; color: string }> = {
  "gift-card": { label: "Gift Card", color: "bg-purple-100 text-purple-700" },
  voucher: { label: "Voucher", color: "bg-blue-100 text-blue-700" },
  coupon: { label: "Coupon", color: "bg-amber-100 text-amber-700" },
  deal: { label: "Deal", color: "bg-rose-100 text-rose-700" },
};

export type DigitalCodeMode = "fixed" | "auto" | "none";
export type DigitalAvailability = "open" | "limited" | "scheduled";

export const AVAILABILITY_META: Record<DigitalAvailability, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-green-100 text-green-700" },
  limited: { label: "Limited", color: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Scheduled", color: "bg-sky-100 text-sky-700" },
};

export interface DigitalAsset {
  id: string;
  type: DigitalAssetType;
  name: string;
  description: string;
  valueGbp: number | null;
  codeMode: DigitalCodeMode;
  code: string;
  minSpend: number | null;
  usageLimit: number | null;
  availability: DigitalAvailability;
  startDate: string;
  endDate: string;
  claimConditions: string;
  instructions: string;
  status: AssetStatus;
}

export type PhysicalDeliveryMethod = "delivery" | "collection" | "both";

export interface PhysicalAsset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  quantityAvailable: number;
  quantityTotal: number;
  quantityMaxIssued?: number;
  startDate?: string;
  endDate?: string;
  fulfilment?: string;
  claimInstructions?: string;
  expiryDays?: number;
  deliveryMethod: PhysicalDeliveryMethod;
  collectionAddress: string;
  status: AssetStatus;
  createdAt: string;
}

export type McomPlatformGroup = "mcom" | "247gbs";

export interface McomPlatformAsset {
  id: string;
  name: string;
  type: string;
  status: "available" | "limited";
}

export interface McomPlatform {
  id: string;
  group: McomPlatformGroup;
  code: string;
  name: string;
  description: string;
  connected: boolean;
  status: "active" | "inactive";
  assets: McomPlatformAsset[];
}

export const MCOM_GROUP_META: Record<
  McomPlatformGroup,
  { label: string; color: string; iconColor: string; description: string }
> = {
  mcom: {
    label: "MCOM",
    color: "bg-teal-100 text-teal-700",
    iconColor: "bg-teal-100 text-teal-600",
    description: "Internal Assets give businesses access to MCOM platforms.",
  },
  "247gbs": {
    label: "247GBS",
    color: "bg-indigo-100 text-indigo-700",
    iconColor: "bg-indigo-100 text-indigo-600",
    description: "Internal Assets give businesses access to 247GBS platforms.",
  },
};

export const MCOM_PLATFORMS: McomPlatform[] = [
  {
    id: "svc-mcomvcard",
    group: "mcom",
    code: "mcomvcard",
    name: "MCOM VCard",
    description: "Digital business card and contact sharing",
    connected: true,
    status: "active",
    assets: [{ id: "ast-vcard-basic", name: "Basic VCard Access", type: "Access", status: "available" }],
  },
  {
    id: "svc-mcommall",
    group: "mcom",
    code: "mcommall",
    name: "MCOM Mall",
    description: "Digital marketplace storefront placement",
    connected: true,
    status: "active",
    assets: [{ id: "ast-mall-listing", name: "Mall Vendor Slot", type: "Listing", status: "available" }],
  },
  {
    id: "svc-mcomreward",
    group: "mcom",
    code: "mcomreward",
    name: "MCOM Rewards Engine",
    description: "Reward issuance and loyalty tracking",
    connected: true,
    status: "active",
    assets: [{ id: "ast-reward-engine", name: "Rewards Engine Account", type: "Access", status: "available" }],
  },
];

export function getMcomPlatforms(): McomPlatform[] {
  return MCOM_PLATFORMS;
}

// ---------------------------------------------------------------------------
// Reward Library Types & Meta
// ---------------------------------------------------------------------------
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
  valueGbp: number | null;
  audience: RewardAudience;
  source: RewardSource;
  status: "active" | "draft" | "archived";
  defaultDelivery: DeliveryMethod;
  uses: number;
  tags: string[];
  /** MCOM Rewards provider id — set only when `source === "mcom"`. */
  mcomRewardId?: string | null;
  /**
   * MCOM Rewards provider source (e.g. "mcom vault" for admin/MCOM-created
   * rewards). When "mcom vault", the reward is gifted to contributors on behalf
   * of the platform.
   */
  mcomSource?: string | null;
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
];

// ---------------------------------------------------------------------------
// Issued rewards (MCOM Rewards mirror / FundOrDonate-local)
// ---------------------------------------------------------------------------
export type IssuedRewardStatus =
  | "ISSUED"
  | "REDEEMED"
  | "EXPIRED"
  | "REVOKED"
  | "FAILED";

export interface IssuedReward {
  id: string;
  externalIssuanceId: string;
  campaignId: string | null;
  campaignTitle: string | null;
  campaignImage: string | null;
  campaignLocation: string | null;
  title: string;
  rewardType: string | null;
  source: "mcom" | "fundordonate";
  status: IssuedRewardStatus | string;
  code: string | null;
  value: number | null;
  quantity: number;
  /** Reason metadata for FAILED issuances (needsActivation / businessNotEntitled / failureReason). */
  metadata?: Record<string, unknown> | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  revokedAt: string | null;
  earnedAt: string;
  updatedAt: string;
}

/** Human guidance for a FAILED issuance, derived from its metadata. */
export function issuedRewardGuidance(
  reward: Pick<IssuedReward, "status" | "metadata">,
): string | null {
  if ((reward.status ?? "").toUpperCase() !== "FAILED") return null;
  const meta = reward.metadata ?? {};
  if (meta.needsActivation) {
    return "Activate your MCOM Rewards account and this reward will be issued automatically.";
  }
  if (meta.businessNotEntitled) {
    return "This reward is temporarily unavailable — the campaign owner needs an active MCOM Rewards plan.";
  }
  return "We couldn't issue this reward automatically. Our team has been notified.";
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  order?: number;
  triggerType?: string;
  triggerConfig: { mode: string; min?: number; max?: number; exact?: number };
  audience?: string;
  quantityType?: string;
  quantityLimit?: number | null;
  quantityClaimed?: number;
  claimDeadlineDays?: number;
  fulfilmentType?: string;
  rewardType?: string;
  items?: { title: string; physicalType?: string }[];
}

export type CampaignRewardItem = RewardItem;

