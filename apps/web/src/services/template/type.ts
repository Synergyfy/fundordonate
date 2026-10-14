export interface CampaignTemplate {
  id: string;
  type: string;
  title: string;
  description?: string;
  shortDescription?: string;
  mode: string;
  categorySlug?: string;
  goalAmount: number;
  deadlineDays: number;
  contentStructure?: Record<string, unknown>;
  benefitsConfig?: Record<string, unknown>;
  rewardConfig?: Record<string, unknown>;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  instantiatedCount: number;
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  campaignId: string;
  locationId: string;
  locationName?: string;
  instantiatedAt: string;
}
