export interface TemplateRequirementCheck {
  id: string;
  label: string;
  hint: string;
  met: boolean;
  action?: "audit" | "membership" | "contribution" | "account" | "donation" | null;
  campaignId?: string;
  minDonationPence?: number;
}

export interface SetupFieldBlueprint {
  id: string;
  label: string;
  question?: string;
  value: string;
  source: string;
  locked: boolean;
  editable: boolean;
  required: boolean;
  inputType: "text" | "number" | "date" | "textarea";
  /** Which control to render — richer than `inputType` for setup answers. */
  kind?: "money" | "media" | "documents" | "contact" | "date" | "textarea" | "text";
  sourceNote?: string;
}

export interface TemplateRewardBlueprint {
  id: string;
  name: string;
  category: string;
  rule: string;
  fulfilmentProvider?: string | null;
  fulfilmentKind?: string | null;
  audience?: string | null;
}

export interface TemplateAssetBlueprint {
  id: string;
  name: string;
  type: string;
}

export interface BusinessTemplateView {
  id: string;
  name: string;
  tagline: string;
  season: string;
  origin: string;
  approval: string;
  status: "available" | "locked";
  /** Human label for the configured access model (e.g. "Automatic"). */
  accessType: string;
  /** Minimum amount the business must have raised through FundOrDonate to unlock, if configured. */
  contributionRequirement: { required: boolean; amount: number };
  /** Campaign the business must donate to during setup (never locks claiming). */
  requiredCampaign: {
    campaignId: string;
    title: string;
    minPence: number;
  } | null;
  requirements: TemplateRequirementCheck[];
  selfFunding: {
    enabled: boolean;
    mode: string;
    amount: number;
    rewardName: string | null;
  };
  fields: SetupFieldBlueprint[];
  rewards: TemplateRewardBlueprint[];
  mcomAssets: TemplateAssetBlueprint[];
  businessRewardsMode?: string;
  audience?: string;
  premium?: boolean;
  requiredFeature?: string | null;
  featureUnlocked?: boolean;
}

export interface MyCampaignItem {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  description: string | null;
  status: string;
  raised: number;
  target: number;
  businessContribution: number;
  rewardTriggered: string | null;
  backers: number;
  endDate: string | null;
  percentage: number;
  createdAt: string;
}

export interface PaginatedCampaigns {
  items: MyCampaignItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignFieldAnswerItem {
  fieldId: string;
  value: string;
  source: string;
}

export interface CampaignRequestedChangeItem {
  fieldId: string;
  label: string;
  note: string;
}

export interface RequiredCampaignContribution {
  campaignId: string;
  title: string;
  /** Minimum completed donation (pence). `0` means any completed donation. */
  minPence: number;
  donatedPence: number;
  /** Whether the business owner's completed donations satisfy the requirement. */
  met: boolean;
}

export interface CampaignDetailData {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  status: string;
  target: number;
  raised: number;
  businessContribution: number;
  rewardTriggered: string | null;
  backers: number;
  /** Campaign period (ISO) — set when the campaign goes live. */
  startDate?: string | null;
  endDate?: string | null;
  /** Donation to the attached campaign, required before submission. */
  requiredCampaign: RequiredCampaignContribution | null;
  template: {
    id: string;
    name: string;
    tagline: string;
    approvalMode: string;
    selfFunding: {
      enabled: boolean;
      mode: string;
      amount: number;
      rewardName: string | null;
    };
    fields: SetupFieldBlueprint[];
    rewards: TemplateRewardBlueprint[];
    mcomAssets: TemplateAssetBlueprint[];
    businessRewardsMode?: string;
    audience?: string;
  };
  answers: CampaignFieldAnswerItem[];
  changes: CampaignRequestedChangeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFieldAnswerDto {
  fieldId: string;
  value: string;
}

export interface SaveCampaignAnswersDto {
  answers: CampaignFieldAnswerDto[];
}

// ── Business-owned MCOM Rewards (attach to a campaign) ──

export interface McomBusinessReward {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  rewardType?: string | null;
  status?: string;
  quantity?: number | null;
  remainingQuantity?: number | null;
  fulfilmentProvider?: string | null;
  fulfilmentKind?: string | null;
  consumerEligible?: boolean | null;
  businessEligible?: boolean | null;
}

export interface RewardConditionDto {
  id?: string;
  mode?: string;
  minPence?: number | null;
  maxPence?: number | null;
  exactPence?: number | null;
}

export interface CampaignRewardAttachment {
  id: string;
  campaignId: string;
  businessRewardId: string;
  title: string;
  description?: string | null;
  image?: string | null;
  rewardType?: string | null;
  fulfilmentProvider?: string | null;
  fulfilmentKind?: string | null;
  audience?: string | null;
  businessId?: string | null;
  businessName?: string | null;
  conditions: RewardConditionDto[];
  qualificationMode: string;
  enabled: boolean;
  maxQuantity?: number | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRewardAttachmentsResponse {
  businessRewardsMode: string;
  templateRewards: TemplateRewardBlueprint[];
  attachments: CampaignRewardAttachment[];
}

export interface AttachCampaignRewardDto {
  businessRewardId: string;
  conditions?: RewardConditionDto[];
  qualificationMode?: "independent" | "cumulative";
  maxQuantity?: number;
  expiresAt?: string;
}

export interface CampaignQueryDto {
  status?: string;
  page?: number;
  limit?: number;
}

// ── General Campaign Interfaces ──

export interface Reward {
  id?: string;
  title: string;
  description?: string;
  amount: number;
  deliveryDate?: string;
  limit?: number;
  status: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  status: string;
  mode: string;
  featuredImage?: string;
  videoUrl?: string;
  platformFee?: number;
  settings: string;
  createdAt: string;
  authorId: string;
  categoryId?: string;
  fundId?: string;
  author?: { id: string; firstName: string; lastName: string; avatar: string; username: string };
  category?: { id: string; name: string; slug: string };
  images?: { id: string; url: string; alt?: string; order: number }[];
  rewards?: Reward[];
  /** Admin-configured checkout rules, surfaced by the public campaigns API. */
  participation?: {
    backCampaign?: boolean;
    foundingMember?: boolean;
    foundingMemberMonthly?: boolean;
    donateContribute?: boolean;
  };
  contributionRules?: {
    minContribution?: string;
    maxContribution?: string;
    suggestedAmounts?: string[];
    allowCustomAmount?: boolean;
    contributionTypes?: string[];
  };
  allocationEnabled?: boolean;
  allocationDestinations?: { id: string; name: string; description?: string; percentage?: string }[];
  terms?: Record<string, string>;
  leaderboard?: { enabled?: boolean };
  tags?: { tag: { id: string; name: string; slug: string } }[];
  _count?: { donations: number; pledges: number; comments: number; bookmarks: number };
  // Campaign Hierarchy
  parentId?: string;
  parent?: { id: string; slug: string; title: string } | null;
  children?: {
    id: string;
    slug: string;
    title: string;
    shortDescription?: string;
    goalAmount: number;
    raisedAmount: number;
    deadline: string;
    mode: string;
    featuredImage?: string;
    location?: string;
    isSelfFunding?: boolean;
    selfFundingLevel?: string;
    _count?: { donations: number; pledges: number };
  }[];
  // Campaign Context
  location?: string;
  locationId?: string | null;
  hierarchyLevel?: string;
  isEvergreen?: boolean;
  participationTypes?: string;
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;
  // Self-Funding
  isSelfFunding?: boolean;
  selfFundingLevel?: string;
  ownerContribution?: number;
  campaignTarget?: number;
  // Campaign Type
  campaignType?: {
    id: string;
    name: string;
    slug: string;
    isOpportunity?: boolean;
    eligibleTiers?: string;
    eligibleLevels?: string;
    parentInitiative?: string;
  } | null;
}
