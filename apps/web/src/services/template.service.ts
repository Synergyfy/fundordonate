// =============================================================================
// Campaign Template Service (Frontend)
// API methods for campaign templates.
// =============================================================================

import api from "@/lib/api";

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

export const templateApi = {
  /**
   * Get all campaign templates.
   */
  async getTemplates(filters?: { type?: string; status?: string }): Promise<CampaignTemplate[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.status) params.set("status", filters.status);
      const res = await api.get(`/templates?${params.toString()}`);
      return res.data.data || [];
    } catch {
      return getDemoTemplates();
    }
  },

  /**
   * Get a single template by ID.
   */
  async getTemplate(templateId: string): Promise<CampaignTemplate | null> {
    try {
      const res = await api.get(`/templates/${templateId}`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Create a new template.
   */
  async createTemplate(data: Partial<CampaignTemplate>): Promise<CampaignTemplate | null> {
    try {
      const res = await api.post("/templates", data);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Update a template.
   */
  async updateTemplate(templateId: string, data: Partial<CampaignTemplate>): Promise<CampaignTemplate | null> {
    try {
      const res = await api.put(`/templates/${templateId}`, data);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Instantiate a template at a location.
   */
  async instantiateTemplate(
    templateId: string,
    locationId: string,
    locationName: string,
    customizations?: { title?: string; description?: string; goalAmount?: number; deadline?: string }
  ): Promise<{ id: string } | null> {
    try {
      const res = await api.post(`/templates/${templateId}/instantiate`, {
        locationId,
        locationName,
        customizations,
      });
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get instances of a template.
   */
  async getTemplateInstances(templateId: string): Promise<TemplateInstance[]> {
    try {
      const res = await api.get(`/templates/${templateId}/instances`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Archive a template.
   */
  async archiveTemplate(templateId: string): Promise<void> {
    try {
      await api.put(`/templates/${templateId}/archive`);
    } catch {
      // ignore
    }
  },
};

// =============================================================================
// Demo Fallback Data
// =============================================================================

function getDemoTemplates(): CampaignTemplate[] {
  return [
    {
      id: "tpl-city-activation",
      type: "city_activation",
      title: "City Activation Campaign",
      description: "Launch a city-wide activation campaign to engage residents and businesses in establishing your local hub.",
      shortDescription: "Activate your city hub with community participation.",
      mode: "fund",
      goalAmount: 10000000,
      deadlineDays: 90,
      status: "ACTIVE",
      instantiatedCount: 12,
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    },
    {
      id: "tpl-borough-launch",
      type: "borough_launch",
      title: "Borough Launch Campaign",
      description: "Launch a borough-level campaign to establish the local hub in your borough.",
      shortDescription: "Launch your borough hub with local support.",
      mode: "fund",
      goalAmount: 5000000,
      deadlineDays: 60,
      status: "ACTIVE",
      instantiatedCount: 28,
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    },
    {
      id: "tpl-high-street-drive",
      type: "high_street_drive",
      title: "High Street Drive",
      description: "Support your local high street with a targeted campaign to bring businesses and communities together.",
      shortDescription: "Drive high street engagement and support.",
      mode: "fund",
      goalAmount: 2000000,
      deadlineDays: 45,
      status: "ACTIVE",
      instantiatedCount: 56,
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    },
    {
      id: "tpl-founder-recruitment",
      type: "founder_recruitment",
      title: "Founder Recruitment Campaign",
      description: "Recruit founding members for your hub with exclusive benefits and early access.",
      shortDescription: "Recruit founding members with exclusive benefits.",
      mode: "fund",
      goalAmount: 3000000,
      deadlineDays: 30,
      status: "ACTIVE",
      instantiatedCount: 45,
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    },
  ];
}
