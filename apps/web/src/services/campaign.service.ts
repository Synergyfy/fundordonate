import api from "@/lib/api";

interface Campaign {
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
  children?: { id: string; slug: string; title: string; shortDescription?: string; goalAmount: number; raisedAmount: number; deadline: string; mode: string; featuredImage?: string; location?: string; isSelfFunding?: boolean; selfFundingLevel?: string; _count?: { donations: number; pledges: number } }[];
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
  campaignType?: { id: string; name: string; slug: string; isOpportunity?: boolean; eligibleTiers?: string; eligibleLevels?: string; parentInitiative?: string } | null;
}

interface Reward {
  id?: string;
  title: string;
  description?: string;
  amount: number;
  deliveryDate?: string;
  limit?: number;
  status: string;
  order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const campaignApi = {
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
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<Campaign>> {
    const res = await api.get("/campaigns", { params });
    return res.data.data;
  },

  async getById(id: string): Promise<Campaign> {
    const res = await api.get(`/campaigns/${id}`);
    return res.data.data;
  },

  async getBySlug(slug: string): Promise<Campaign> {
    const res = await api.get(`/campaigns/slug/${slug}`);
    return res.data.data;
  },

  async getFeatured(limit = 6): Promise<Campaign[]> {
    const res = await api.get("/campaigns/featured", { params: { limit } });
    return res.data.data;
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
    const res = await api.post("/campaigns", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const res = await api.put(`/campaigns/${id}`, data);
    return res.data.data;
  },

  async updateStatus(id: string, status: string): Promise<Campaign> {
    const res = await api.patch(`/campaigns/${id}/status`, { status });
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  },

  async uploadImage(campaignId: string, file: File, alt?: string): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    if (alt) formData.append("alt", alt);

    const res = await api.post(`/campaigns/${campaignId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async removeImage(campaignId: string, imageId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/images/${imageId}`);
  },

  async getCategories(): Promise<Category[]> {
    const res = await api.get("/categories");
    return res.data.data;
  },

  async listTrash(page = 1, limit = 20): Promise<PaginatedResponse<Campaign>> {
    const res = await api.get("/campaigns/trash/list", { params: { page, limit } });
    return res.data.data;
  },

  async restore(id: string): Promise<Campaign> {
    const res = await api.post(`/campaigns/trash/restore/${id}`);
    return res.data.data;
  },

  async getComments(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const res = await api.get(`/campaigns/${campaignId}/comments`, { params: { page, limit } });
    return res.data.data;
  },

  async addComment(campaignId: string, content: string, parentId?: string): Promise<any> {
    const res = await api.post(`/campaigns/${campaignId}/comments`, { content, parentId });
    return res.data.data;
  },

  async toggleBookmark(campaignId: string): Promise<{ bookmarked: boolean }> {
    const res = await api.post(`/campaigns/${campaignId}/bookmark`);
    return res.data.data;
  },

  async getRelated(campaignId: string, limit = 3): Promise<Campaign[]> {
    const res = await api.get(`/campaigns/${campaignId}/related`, { params: { limit } });
    return res.data.data;
  },

  // Posts (Updates)
  async getPosts(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const res = await api.get(`/campaigns/${campaignId}/posts`, { params: { page, limit } });
    return res.data.data;
  },

  async createPost(campaignId: string, data: { title: string; content: string }): Promise<any> {
    const res = await api.post(`/campaigns/${campaignId}/posts`, data);
    return res.data.data;
  },

  async updatePost(campaignId: string, postId: string, data: { title?: string; content?: string }): Promise<any> {
    const res = await api.put(`/campaigns/${campaignId}/posts/${postId}`, data);
    return res.data.data;
  },

  async deletePost(campaignId: string, postId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/posts/${postId}`);
  },

  // Comments
  async updateComment(campaignId: string, commentId: string, content: string): Promise<any> {
    const res = await api.put(`/campaigns/${campaignId}/comments/${commentId}`, { content });
    return res.data.data;
  },

  async deleteComment(campaignId: string, commentId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/comments/${commentId}`);
  },

  async moderateComment(campaignId: string, commentId: string, status: string): Promise<any> {
    const res = await api.patch(`/campaigns/${campaignId}/comments/${commentId}/moderate`, { status });
    return res.data.data;
  },

  async getPendingComments(campaignId?: string): Promise<any[]> {
    const params: Record<string, string> = {};
    if (campaignId) params.campaignId = campaignId;
    const res = await api.get("/campaigns/comments/pending/list", { params });
    return res.data.data;
  },

  // Donations
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
    const res = await api.post(`/campaigns/${campaignId}/donations`, data);
    return res.data.data;
  },

  async getDonation(uid: string): Promise<any> {
    const res = await api.get(`/campaigns/0/donations/${uid}`);
    return res.data.data;
  },

  async getCampaignDonations(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const res = await api.get(`/campaigns/${campaignId}/donations/list/all`, { params: { page, limit } });
    return res.data.data;
  },

  // Pledges
  async createPledge(campaignId: string, data: {
    amount: number;
    rewardId?: string;
    bonusSupportAmount?: number;
    shippingCost?: number;
    notes?: string;
    paymentMethod?: string;
  }): Promise<any> {
    const res = await api.post(`/campaigns/${campaignId}/pledges`, data);
    return res.data.data;
  },

  async getPledge(uid: string): Promise<any> {
    const res = await api.get(`/campaigns/0/pledges/${uid}`);
    return res.data.data;
  },

  async getCampaignPledges(campaignId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const res = await api.get(`/campaigns/${campaignId}/pledges/list/all`, { params: { page, limit } });
    return res.data.data;
  },

  async cancelPledge(campaignId: string, pledgeId: string): Promise<void> {
    await api.delete(`/campaigns/${campaignId}/pledges/${pledgeId}/cancel`);
  },

  // Rewards
  async getCampaignRewards(campaignId: string): Promise<PaginatedResponse<any>> {
    const res = await api.get(`/campaigns/${campaignId}/rewards`);
    return res.data.data;
  },

  // User History
  async getUserDonations(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const res = await api.get("/campaigns/0/user/donations", { params: { page, limit } });
    return res.data.data;
  },

  async getUserPledges(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const res = await api.get("/campaigns/0/user/pledges", { params: { page, limit } });
    return res.data.data;
  },

  // ── Campaign Hierarchy ──
  async getChildren(campaignId: string): Promise<Campaign[]> {
    const res = await api.get(`/campaigns/hierarchy/${campaignId}/children`);
    return res.data.data;
  },

  async getParent(campaignId: string): Promise<Campaign | null> {
    const res = await api.get(`/campaigns/hierarchy/${campaignId}/parent`);
    return res.data.data;
  },

  async getHierarchyTree(campaignId: string): Promise<any> {
    const res = await api.get(`/campaigns/hierarchy/${campaignId}/tree`);
    return res.data.data;
  },

  // ── Opportunities ──
  async getOpportunityTypes(): Promise<any[]> {
    const res = await api.get("/campaigns/opportunities/types");
    return res.data.data;
  },

  async listByOpportunity(typeSlug: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Campaign>> {
    const res = await api.get(`/campaigns/opportunities/${typeSlug}`, { params });
    return res.data.data;
  },

  // ── Self-Funding ──
  async listSelfFunding(params?: { page?: number; limit?: number; level?: string }): Promise<PaginatedResponse<Campaign>> {
    const res = await api.get("/campaigns/self-funding", { params });
    return res.data.data;
  },

  // ── Enhanced Discovery ──
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
    const res = await api.get("/campaigns/discover", { params });
    return res.data.data;
  },
};
