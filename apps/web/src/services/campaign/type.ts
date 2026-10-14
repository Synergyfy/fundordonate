export interface TemplateRequirementCheck {
  id: string;
  label: string;
  hint: string;
  met: boolean;
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
  sourceNote?: string;
}

export interface TemplateRewardBlueprint {
  id: string;
  name: string;
  category: string;
  rule: string;
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
