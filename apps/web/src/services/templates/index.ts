// =============================================================================
// Campaign Templates Service
// Wires campaign template management to the live adminApi backend.
// =============================================================================

import { adminApi } from "@/services/admin";

export type TemplateLifecycle = "draft" | "active" | "inactive" | "archived";
export type TemplateCampaignType = "donation" | "crowdfunding" | "fund";

export interface TemplateSection {
  id: string;
  label: string;
  hint: string;
  source: "admin" | "business";
  enabled: boolean;
  required: boolean;
}

export type TemplateLocationLevel =
  | "national"
  | "city"
  | "local_area"
  | "high_street"
  | "business";

export interface TemplateStructureConfig {
  funding: {
    targetRequired: boolean;
    methods: string[];
    minContributionEnabled: boolean;
    minContribution: string;
    duration: "30" | "60" | "90" | "custom";
    customDays: string;
    rules: string[];
    payments: string[];
  };
  location: {
    required: boolean;
    levels: TemplateLocationLevel[];
    allowMultiple: boolean;
  };
  visibility: {
    marketplace: boolean;
    hub: boolean;
    search: boolean;
    adminReview: boolean;
    presentation: "image" | "video" | "story";
  };
  seasonId: string;
}

export interface TemplateStructure {
  mode: string;
  layout: string;
  sections: TemplateSection[];
  config: TemplateStructureConfig;
}

export type TemplateFieldSource =
  | "template"
  | "business_account"
  | "business_mcom"
  | "audit_business"
  | "admin"
  | "admin_mcom";

export type TemplateFieldAccess = "no" | "configurable" | "conditional";

export interface TemplateFieldRow {
  id: string;
  field: string;
  source: TemplateFieldSource;
  access: TemplateFieldAccess;
}

export type TemplateAccessTypeId =
  | "automatic"
  | "audit"
  | "contribution"
  | "membership"
  | "admin_assigned"
  | "combination";

export interface TemplateAccessRules {
  type: TemplateAccessTypeId;
  eligibility: string[];
  minContributionEnabled: boolean;
  minContribution: string;
  accessAsReward: boolean;
  accessRewardThreshold: string;
  adminApproval: boolean;
}

export interface ContributionRules {
  mode: "not_allowed" | "optional" | "required";
  amountType: "fixed" | "minimum" | "from_audit" | "admin_rule";
  fixedAmount: string;
  minAmount: string;
  auditRequirement: string;
  auditPercent: string;
  adminRule: string;
  rewardForOwnContribution: boolean;
  countsTowardTarget: boolean;
  showDisclosure: boolean;
  maxSelfContribution: string;
}

export interface MasterTemplate {
  id: string;
  name: string;
  tagline: string;
  season: string;
  audience: "business" | "consumer" | "both";
  accessType: string;
  origin: "audit" | "direct";
  requirements: Array<{ id: string; label: string; hint: string; met: boolean }>;
  approval: "admin_review" | "automatic";
  contributionRequirement: { required: boolean; amount: number };
  purpose: string;
  campaignType: TemplateCampaignType;
  lifecycle: TemplateLifecycle;
  owner: "admin";
  masterTemplate: true;
  campaignsUsing: number;
  createdAt: string;
  updatedAt: string;
  structure: TemplateStructure;
  dataSources: string[];
  accessRules: TemplateAccessRules;
  accessConditions: string[];
  fieldRows: TemplateFieldRow[];
  contributionRules: ContributionRules;
  rewards: any[];
  mcomAssets: any[];
}

export interface TemplateSaveInput {
  name: string;
  purpose: string;
  campaignType: TemplateCampaignType;
  audience: "business" | "consumer" | "both";
  seasonId: string;
  seasonLabel: string;
  sections: TemplateSection[];
  funding: TemplateStructureConfig["funding"];
  location: TemplateStructureConfig["location"];
  visibility: TemplateStructureConfig["visibility"];
  access: TemplateAccessRules;
  accessTypeName: string;
  fieldRows: TemplateFieldRow[];
  selfFundingRules: ContributionRules;
  rewards: any[];
  mcomAssets: any[];
  campaignTypeName: string;
  lifecycle: TemplateLifecycle;
}

const templateCache = new Map<string, MasterTemplate>();

export function getAdminTemplateById(id: string): MasterTemplate | undefined {
  return templateCache.get(id);
}

export function saveTemplate(
  input: TemplateSaveInput,
  existingId?: string
): MasterTemplate {
  const id = existingId || `tpl-${Date.now()}`;
  const master: MasterTemplate = {
    id,
    name: input.name,
    tagline: input.purpose,
    season: input.seasonLabel,
    audience: input.audience,
    accessType: input.accessTypeName,
    origin: "direct",
    requirements: [],
    approval: input.visibility.adminReview || input.access.adminApproval ? "admin_review" : "automatic",
    contributionRequirement: { required: input.access.minContributionEnabled, amount: Number(input.access.minContribution || 0) },
    purpose: input.purpose,
    campaignType: input.campaignType,
    lifecycle: input.lifecycle,
    owner: "admin",
    masterTemplate: true,
    campaignsUsing: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    structure: {
      mode: "custom",
      layout: "standard",
      sections: input.sections,
      config: {
        funding: input.funding,
        location: input.location,
        visibility: input.visibility,
        seasonId: input.seasonId,
      },
    },
    dataSources: [],
    accessRules: input.access,
    accessConditions: [],
    fieldRows: input.fieldRows,
    contributionRules: input.selfFundingRules,
    rewards: input.rewards,
    mcomAssets: input.mcomAssets,
  };
  templateCache.set(id, master);

  const payload = {
    name: input.name,
    category: input.campaignType,
    description: input.purpose,
    targetAudience: input.audience,
    metadata: {
      funding: input.funding,
      location: input.location,
      visibility: input.visibility,
      access: input.access,
      fieldRows: input.fieldRows,
      selfFundingRules: input.selfFundingRules,
      rewards: input.rewards,
      mcomAssets: input.mcomAssets,
      lifecycle: input.lifecycle,
    },
  };

  if (existingId) {
    adminApi.updateTemplate(existingId, payload).catch((err) => console.error("updateTemplate error:", err));
  } else {
    adminApi.createTemplate(payload as any).catch((err) => console.error("createTemplate error:", err));
  }

  return master;
}

export function adaptAdminTemplateToMaster(tpl: any): MasterTemplate {
  const meta = tpl?.metadata || {};
  return {
    id: tpl.id,
    name: tpl.name || "",
    tagline: tpl.description || "",
    season: meta.seasonLabel || "Active Season",
    audience: (tpl.targetAudience || "both") as any,
    accessType: meta.access?.type || "automatic",
    origin: "direct",
    requirements: [],
    approval: meta.visibility?.adminReview ? "admin_review" : "automatic",
    contributionRequirement: { required: false, amount: 0 },
    purpose: tpl.description || "",
    campaignType: (tpl.category || "donation") as any,
    lifecycle: meta.lifecycle || "active",
    owner: "admin",
    masterTemplate: true,
    campaignsUsing: tpl.campaignsCount || 0,
    createdAt: tpl.createdAt || new Date().toISOString(),
    updatedAt: tpl.updatedAt || new Date().toISOString(),
    structure: {
      mode: "custom",
      layout: "standard",
      sections: meta.sections || [],
      config: {
        funding: meta.funding || {
          targetRequired: true,
          methods: ["card"],
          minContributionEnabled: false,
          minContribution: "0",
          duration: "30",
          customDays: "30",
          rules: [],
          payments: [],
        },
        location: meta.location || { required: false, levels: ["national"], allowMultiple: false },
        visibility: meta.visibility || {
          marketplace: true,
          hub: true,
          search: true,
          adminReview: true,
          presentation: "image",
        },
        seasonId: meta.seasonId || "",
      },
    },
    dataSources: meta.dataSources || [],
    accessRules: meta.access || {
      type: "automatic",
      eligibility: [],
      minContributionEnabled: false,
      minContribution: "0",
      accessAsReward: false,
      accessRewardThreshold: "0",
      adminApproval: false,
    },
    accessConditions: [],
    fieldRows: meta.fieldRows || [],
    contributionRules: meta.selfFundingRules || {
      mode: "optional",
      amountType: "minimum",
      fixedAmount: "0",
      minAmount: "0",
      auditRequirement: "none",
      auditPercent: "0",
      adminRule: "none",
      rewardForOwnContribution: false,
      countsTowardTarget: true,
      showDisclosure: true,
      maxSelfContribution: "1000",
    },
    rewards: meta.rewards || [],
    mcomAssets: meta.mcomAssets || [],
  };
}
