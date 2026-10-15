import api from "../api";
import type {
  BusinessTemplateView,
  Campaign,
  CampaignDetailData,
  CampaignQueryDto,
  Category,
  PaginatedCampaigns,
  PaginatedResponse,
  SaveCampaignAnswersDto,
} from "./type";

export const campaignService = {
  // ── Business Owner Campaign Centre ──

  async getTemplates(): Promise<BusinessTemplateView[]> {
    return api.get("/business/templates");
  },

  async claimTemplate(templateId: string): Promise<{ campaignId: string }> {
    return api.post(`/business/templates/${templateId}/claim`);
  },

  async getMyCampaigns(query?: CampaignQueryDto): Promise<PaginatedCampaigns> {
    return api.get("/business/campaigns", { params: query });
  },

  async getCampaignDetail(campaignId: string): Promise<CampaignDetailData> {
    return api.get(`/business/campaigns/${campaignId}`);
  },

  async saveAnswers(
    campaignId: string,
    dto: SaveCampaignAnswersDto,
  ): Promise<{ success: boolean; message: string }> {
    return api.patch(`/business/campaigns/${campaignId}/answers`, dto);
  },

  async submitForReview(campaignId: string): Promise<{ status: string }> {
    return api.post(`/business/campaigns/${campaignId}/submit`);
  },

  // ── General Campaign Directory & Lifecycle ──

  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    mode?: string;
    authorId?: string;
    categoryId?: string;
    tag?: string;
    campaignTypeId?: string;
    seasonId?: string;
    locationId?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<Campaign>> {
    return api.get("/campaigns", { params });
  },

  async getById(id: string): Promise<Campaign> {
    return api.get(`/campaigns/${id}`);
  },

  async getBySlug(slug: string): Promise<Campaign> {
    return api.get(`/campaigns/slug/${slug}`);
  },

  async getFeatured(limit = 6): Promise<Campaign[]> {
    return api.get("/campaigns/featured", { params: { limit } });
  },

  async create(data: {
    title: string;
    shortDescription?: string;
    description?: string;
    goalAmount: number;
    deadline: string;
    mode?: string;
    categoryId?: string;
    fundId?: string;
  }): Promise<Campaign> {
    return api.post("/campaigns", data);
  },

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    return api.put(`/campaigns/${id}`, data);
  },

  async updateStatus(id: string, status: string): Promise<Campaign> {
    return api.patch(`/campaigns/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  },

  async uploadImage(campaignId: string, file: File, alt?: string): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    if (alt) formData.append("alt", alt);

    return api.post(`/campaigns/${campaignId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async removeImage(campaignId: string, imageId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/images/${imageId}`);
  },

  async getCategories(): Promise<Category[]> {
    return api.get("/categories");
  },

  async listTrash(page = 1, limit = 20): Promise<PaginatedResponse<Campaign>> {
    return api.get("/campaigns/trash/list", { params: { page, limit } });
  },

  async restore(id: string): Promise<Campaign> {
    return api.post(`/campaigns/trash/restore/${id}`);
  },

  // ── Comments ──

  async getComments(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return api.get(`/campaigns/${campaignId}/comments`, { params: { page, limit } });
  },

  async addComment(campaignId: string, content: string, parentId?: string): Promise<any> {
    return api.post(`/campaigns/${campaignId}/comments`, { content, parentId });
  },

  async updateComment(campaignId: string, commentId: string, content: string): Promise<any> {
    return api.put(`/campaigns/${campaignId}/comments/${commentId}`, { content });
  },

  async deleteComment(campaignId: string, commentId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/comments/${commentId}`);
  },

  async moderateComment(campaignId: string, commentId: string, status: string): Promise<any> {
    return api.patch(`/campaigns/${campaignId}/comments/${commentId}/moderate`, { status });
  },

  async getPendingComments(campaignId?: string): Promise<any[]> {
    const params: Record<string, string> = {};
    if (campaignId) params.campaignId = campaignId;
    return api.get("/campaigns/comments/pending/list", { params });
  },

  async toggleBookmark(campaignId: string): Promise<{ bookmarked: boolean }> {
    return api.post(`/campaigns/${campaignId}/bookmark`);
  },

  async getRelated(campaignId: string, limit = 3): Promise<Campaign[]> {
    return api.get(`/campaigns/${campaignId}/related`, { params: { limit } });
  },

  // ── Posts (Updates) ──

  async getPosts(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return api.get(`/campaigns/${campaignId}/posts`, { params: { page, limit } });
  },

  async createPost(campaignId: string, data: { title: string; content: string }): Promise<any> {
    return api.post(`/campaigns/${campaignId}/posts`, data);
  },

  async updatePost(campaignId: string, postId: string, data: { title?: string; content?: string }): Promise<any> {
    return api.put(`/campaigns/${campaignId}/posts/${postId}`, data);
  },

  async deletePost(campaignId: string, postId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/posts/${postId}`);
  },

  // ── Donations & Pledges ──

  async createDonation(campaignId: string, data: {
    amount: number;
    notes?: string;
    isAnonymous?: boolean;
    tributeType?: string;
    tributeTo?: string;
    tributeNotificationEmail?: string;
    tributeNotificationMessage?: string;
    paymentMethod?: string;
  }): Promise<any> {
    return api.post(`/campaigns/${campaignId}/donations`, data);
  },

  async getDonation(uid: string): Promise<any> {
    return api.get(`/campaigns/0/donations/${uid}`);
  },

  async getCampaignDonations(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return api.get(`/campaigns/${campaignId}/donations/list/all`, { params: { page, limit } });
  },

  async createPledge(campaignId: string, data: {
    amount: number;
    rewardId?: string;
    bonusSupportAmount?: number;
    shippingCost?: number;
    notes?: string;
    paymentMethod?: string;
  }): Promise<any> {
    return api.post(`/campaigns/${campaignId}/pledges`, data);
  },

  async getPledge(uid: string): Promise<any> {
    return api.get(`/campaigns/0/pledges/${uid}`);
  },

  async getCampaignPledges(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return api.get(`/campaigns/${campaignId}/pledges/list/all`, { params: { page, limit } });
  },

  async cancelPledge(campaignId: string, pledgeId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/pledges/${pledgeId}/cancel`);
  },

  async getCampaignRewards(campaignId: string): Promise<PaginatedResponse<any>> {
    return api.get(`/campaigns/${campaignId}/rewards`);
  },

  // ── User History ──

  async getUserDonations(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return api.get("/campaigns/0/user/donations", { params: { page, limit } });
  },

  async getUserPledges(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return api.get("/campaigns/0/user/pledges", { params: { page, limit } });
  },

  // ── Hierarchy ──

  async getChildren(campaignId: string): Promise<Campaign[]> {
    return api.get(`/campaigns/hierarchy/${campaignId}/children`);
  },

  async getParent(campaignId: string): Promise<Campaign | null> {
    return api.get(`/campaigns/hierarchy/${campaignId}/parent`);
  },

  async getHierarchyTree(campaignId: string): Promise<any> {
    return api.get(`/campaigns/hierarchy/${campaignId}/tree`);
  },

  // ── Opportunities & Discovery ──

  async getOpportunityTypes(): Promise<any[]> {
    return api.get("/campaigns/opportunities/types");
  },

  async listByOpportunity(typeSlug: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Campaign>> {
    return api.get(`/campaigns/opportunities/${typeSlug}`, { params });
  },

  async listSelfFunding(params?: { page?: number; limit?: number; level?: string }): Promise<PaginatedResponse<Campaign>> {
    return api.get("/campaigns/self-funding", { params });
  },

  async discover(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    mode?: string;
    authorId?: string;
    categoryId?: string;
    tag?: string;
    campaignTypeId?: string;
    seasonId?: string;
    sortBy?: string;
    sortOrder?: string;
    parentId?: string;
    isEvergreen?: boolean;
    isSelfFunding?: boolean;
    selfFundingLevel?: string;
    location?: string;
  }): Promise<PaginatedResponse<Campaign>> {
    return api.get("/campaigns/discover", { params });
  },

  // ── Spillover Rules ──

  async getSpilloverRules(params?: { campaignId?: string; seasonId?: string }): Promise<any[]> {
    try {
      const res = await api.get("/spillover-rules", { params });
      return res || [];
    } catch {
      return [];
    }
  },

  async setSpilloverRule(rule: {
    campaignId?: string;
    seasonId?: string;
    action: string;
    priority?: number;
    thresholdPercentage?: number;
    allocationPercentage?: number;
    targetCampaignId?: string;
    targetSeasonId?: string;
    description?: string;
  }): Promise<any> {
    try {
      return await api.post("/spillover-rules", rule);
    } catch {
      return null;
    }
  },

  async deleteSpilloverRule(id: string): Promise<void> {
    try {
      await api.delete(`/spillover-rules/${id}`);
    } catch {
      // ignore
    }
  },

  // ── Surplus & Season ──

  async getCampaignSurplus(campaignId: string): Promise<any[]> {
    try {
      const res = await api.get(`/campaigns/${campaignId}/surplus`);
      return res || [];
    } catch {
      return [];
    }
  },

  async getSeasonTransitions(seasonId: string): Promise<any[]> {
    try {
      const res = await api.get(`/seasons/${seasonId}/transitions`);
      return res || [];
    } catch {
      return [];
    }
  },

  async triggerSeasonTransition(seasonId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await api.post(`/seasons/${seasonId}/transition`);
    } catch {
      return { success: false, message: "API unavailable" };
    }
  },
};

export const campaignApi = campaignService;
export default campaignService;
export type * from "./type";
