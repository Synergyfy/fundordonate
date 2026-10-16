import api from "../api";
import type {
  ActivityFeedItem,
  AdminBacker,
  AdminBusiness,
  AdminCampaign,
  AdminCampaignDetail,
  AdminCampaignTemplate,
  AdminConsumer,
  AdminDashboardStats,
  AdminEvent,
  AdminFoundingMember,
  AdminFulfilment,
  AdminLocation,
  AdminPayout,
  AdminReward,
  AdminSeason,
  AdminSettingsMap,
  AdminUser,
  BulkCampaignActionPayload,
  CreateCampaignTemplatePayload,
  CreateEventPayload,
  CreateLocationPayload,
  CreateRewardPayload,
  CreateSeasonPayload,
  DuplicateCampaignTemplatePayload,
  FinanceOverview,
  InstantiateCampaignTemplatePayload,
  InstantiateCampaignTemplateResult,
  LocationTreeResponse,
  McomRewardCataloguePage,
  PaginatedResponse,
  RecentContribution,
  RequestCampaignChangesPayload,
  RevenueChartItem,
  SeasonActionPayload,
  SeasonReviewData,
  TargetCalculationResult,
  TemplateInstance,
  UpdateCampaignStatusPayload,
  UpdateCampaignTemplatePayload,
  UpdateEventPayload,
  UpdateFulfilmentPayload,
  UpdateLocationPayload,
  UpdateRewardPayload,
  UpdateSeasonPayload,
} from "./type";

export const adminService = {
  // ---------------------------------------------------------------------------
  // 1. Dashboard & KPI Stats
  // ---------------------------------------------------------------------------
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return api.get("/admin/stats");
  },

  async getRevenueChart(period: string = "monthly"): Promise<RevenueChartItem[]> {
    return api.get("/admin/stats/revenue", { params: { period } });
  },

  async getRecentContributions(limit = 10): Promise<RecentContribution[]> {
    return api.get("/admin/stats/recent", { params: { limit } });
  },

  async getTopCampaigns(limit = 5): Promise<any[]> {
    return api.get("/admin/stats/top-campaigns", { params: { limit } });
  },

  async getActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
    return api.get("/admin/stats/activity", { params: { limit } });
  },

  // ---------------------------------------------------------------------------
  // 2. Seasons & Lifecycle
  // ---------------------------------------------------------------------------
  async getSeasons(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<AdminSeason>> {
    return api.get("/admin/seasons", { params });
  },

  async getCurrentSeason(): Promise<AdminSeason> {
    return api.get("/admin/seasons/current");
  },

  async getSeason(id: string): Promise<AdminSeason> {
    return api.get(`/admin/seasons/${id}`);
  },

  async getSeasonReview(id: string): Promise<SeasonReviewData> {
    return api.get(`/admin/seasons/${id}/review`);
  },

  async createSeason(payload: CreateSeasonPayload): Promise<AdminSeason> {
    return api.post("/admin/seasons", payload);
  },

  async updateSeason(id: string, payload: UpdateSeasonPayload): Promise<AdminSeason> {
    return api.put(`/admin/seasons/${id}`, payload);
  },

  async performSeasonAction(id: string, payload: SeasonActionPayload): Promise<any> {
    return api.post(`/admin/seasons/${id}/action`, payload);
  },

  // ---------------------------------------------------------------------------
  // 3. Hub Locations & Rollup Config
  // ---------------------------------------------------------------------------
  async getLocations(params: {
    page?: number;
    limit?: number;
    type?: string;
    parentId?: string;
    search?: string;
    includeInactive?: boolean;
  } = {}): Promise<PaginatedResponse<AdminLocation>> {
    return api.get("/admin/locations", { params });
  },

  async getLocationTree(): Promise<LocationTreeResponse> {
    return api.get("/admin/locations/tree");
  },

  async getLocation(id: string): Promise<AdminLocation> {
    return api.get(`/admin/locations/${id}`);
  },

  async createLocation(payload: CreateLocationPayload): Promise<AdminLocation> {
    return api.post("/admin/locations", payload);
  },

  async updateLocation(id: string, payload: UpdateLocationPayload): Promise<AdminLocation> {
    return api.put(`/admin/locations/${id}`, payload);
  },

  async toggleLocationStatus(id: string, isActive: boolean): Promise<any> {
    return api.put(`/admin/locations/${id}/status`, { isActive });
  },

  async deleteLocation(id: string): Promise<any> {
    return api.delete(`/admin/locations/${id}`);
  },

  async getRollupConfig(): Promise<any> {
    return api.get("/admin/locations/rollup-config");
  },

  async updateRollupConfig(config: Record<string, any>): Promise<any> {
    return api.put("/admin/locations/rollup-config", { config });
  },

  // ---------------------------------------------------------------------------
  // 4. Campaigns & Campaign Templates
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // 4. Campaigns & Campaign Templates
  // ---------------------------------------------------------------------------
  async getCampaigns(params: Record<string, any> = {}): Promise<PaginatedResponse<AdminCampaign>> {
    const res: any = await api.get("/admin/campaigns", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 10;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      campaigns: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async getCampaign(id: string): Promise<AdminCampaignDetail> {
    return api.get(`/admin/campaigns/${id}`);
  },

  async updateCampaignStatus(id: string, payloadOrStatus: string | UpdateCampaignStatusPayload): Promise<any> {
    const payload = typeof payloadOrStatus === "string" ? { status: payloadOrStatus } : payloadOrStatus;
    return api.put(`/admin/campaigns/${id}/status`, payload);
  },

  async createCampaign(data: Record<string, any>): Promise<any> {
    return api.post("/campaigns", data);
  },

  async updateCampaign(id: string, data: Record<string, any>): Promise<any> {
    return api.put(`/campaigns/${id}`, data);
  },

  async deleteCampaign(id: string): Promise<any> {
    return api.delete(`/campaigns/${id}`);
  },

  async requestCampaignChanges(id: string, payload: RequestCampaignChangesPayload): Promise<any> {
    return api.post(`/admin/campaigns/${id}/changes`, payload);
  },

  async bulkCampaignAction(payload: BulkCampaignActionPayload): Promise<any> {
    return api.post("/admin/campaigns/bulk", payload);
  },

  async getTemplates(): Promise<AdminCampaignTemplate[]> {
    return api.get("/admin/campaigns/templates");
  },

  async getTemplate(id: string): Promise<AdminCampaignTemplate> {
    return api.get(`/admin/campaigns/templates/${id}`);
  },

  async createTemplate(payload: CreateCampaignTemplatePayload): Promise<AdminCampaignTemplate> {
    return api.post("/admin/campaigns/templates", payload);
  },

  async updateTemplate(id: string, payload: UpdateCampaignTemplatePayload): Promise<AdminCampaignTemplate> {
    return api.put(`/admin/campaigns/templates/${id}`, payload);
  },

  async updateTemplateStatus(
    id: string,
    status: AdminCampaignTemplate["status"],
  ): Promise<AdminCampaignTemplate> {
    return api.put(`/admin/campaigns/templates/${id}/status`, { status });
  },

  async duplicateTemplate(
    id: string,
    payload: DuplicateCampaignTemplatePayload = {},
  ): Promise<AdminCampaignTemplate> {
    return api.post(`/admin/campaigns/templates/${id}/duplicate`, payload);
  },

  async instantiateTemplate(
    id: string,
    payload: InstantiateCampaignTemplatePayload,
  ): Promise<InstantiateCampaignTemplateResult> {
    return api.post(`/admin/campaigns/templates/${id}/instantiate`, payload);
  },

  async getTemplateInstances(id: string): Promise<TemplateInstance[]> {
    return api.get(`/admin/campaigns/templates/${id}/instances`);
  },

  /** Browse the MCOM Rewards catalogue (proxied through the service mesh). */
  async getMcomRewards(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      rewardType?: string;
      audience?: string;
      /** Filter by source, e.g. "mcom vault" for admin/MCOM-created rewards. */
      source?: string;
    } = {},
  ): Promise<McomRewardCataloguePage> {
    return api.get("/admin/mcom-rewards", { params });
  },

  /** Issue a catalogued MCOM reward to a recipient. */
  async issueMcomReward(payload: {
    mcomRewardId: string;
    email?: string;
    mcomUserId?: string;
    name?: string;
    campaignId?: string;
    userId?: string;
    rewardConfigId?: string;
    quantity?: number;
  }): Promise<unknown> {
    return api.post("/admin/mcom-rewards/issue", payload);
  },

  async calculateTargets(params: {
    tier?: string;
    businessCount?: number;
    baseTargetPerBusiness?: number;
  } = {}): Promise<TargetCalculationResult> {
    return api.get("/admin/campaigns/targets/calculation", { params });
  },

  // ---------------------------------------------------------------------------
  // 5. Participants (Users, Businesses, Consumers, Backers, Founding Members)
  // ---------------------------------------------------------------------------
  async getUsers(params: Record<string, any> = {}): Promise<PaginatedResponse<AdminUser>> {
    const res: any = await api.get("/admin/users", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      users: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async getUser(id: string): Promise<any> {
    return api.get(`/admin/users/${id}`);
  },

  async updateUserRole(id: string, role: string): Promise<any> {
    return api.put(`/admin/users/${id}/role`, { role });
  },

  async getBusinesses(params: Record<string, any> = {}): Promise<PaginatedResponse<AdminBusiness>> {
    const res: any = await api.get("/admin/businesses", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      businesses: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async getBusiness(id: string): Promise<AdminBusiness> {
    return api.get(`/admin/businesses/${id}`);
  },

  async verifyBusiness(id: string, status: string): Promise<any> {
    return api.put(`/admin/businesses/${id}/verification`, { status });
  },

  async updateBusinessTier(id: string, membershipTier: string): Promise<any> {
    return api.put(`/admin/businesses/${id}/tier`, { membershipTier });
  },

  async getConsumers(params: Record<string, any> = {}): Promise<PaginatedResponse<AdminConsumer>> {
    const res: any = await api.get("/admin/consumers", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      consumers: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async getBackers(params: Record<string, any> = {}): Promise<PaginatedResponse<AdminBacker>> {
    const res: any = await api.get("/admin/backers", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      backers: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async getFoundingMembers(): Promise<AdminFoundingMember[]> {
    return api.get("/admin/founding-members");
  },

  // ---------------------------------------------------------------------------
  // 6. Finance, Donations, Pledges & Payouts
  // ---------------------------------------------------------------------------
  async getDonations(params: Record<string, any> = {}): Promise<PaginatedResponse<RecentContribution>> {
    const res: any = await api.get("/admin/donations", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      donations: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async getDonation(id: string): Promise<any> {
    return api.get(`/admin/donations/${id}`);
  },

  async updateDonationStatus(id: string, status: string): Promise<any> {
    return api.put(`/admin/donations/${id}/status`, { status });
  },

  async refundDonation(id: string, payload: { amount?: number; reason?: string } = {}): Promise<any> {
    return api.post(`/admin/donations/${id}/refund`, payload);
  },

  async getPledges(params: Record<string, any> = {}): Promise<PaginatedResponse<RecentContribution>> {
    const res: any = await api.get("/admin/pledges", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      pledges: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async updatePledgeStatus(id: string, status: string): Promise<any> {
    return api.put(`/admin/pledges/${id}/status`, { status });
  },

  async getFinanceOverview(): Promise<FinanceOverview> {
    return api.get("/admin/finance/overview");
  },

  async getPayouts(params: Record<string, any> = {}): Promise<PaginatedResponse<AdminPayout>> {
    const res: any = await api.get("/admin/finance/payouts", { params });
    const items = res?.items || (Array.isArray(res) ? res : []);
    const total = res?.total ?? items.length;
    const page = res?.page ?? 1;
    const limit = res?.limit ?? 20;
    const totalPages = (res?.totalPages ?? Math.ceil(total / limit)) || 1;
    return {
      items,
      payouts: items,
      total,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    } as any;
  },

  async updatePayoutStatus(id: string, payload: { status: string; rejectionReason?: string }): Promise<any> {
    return api.put(`/admin/finance/payouts/${id}`, payload);
  },

  // ---------------------------------------------------------------------------
  // 7. Rewards & Fulfilment
  // ---------------------------------------------------------------------------
  async getRewards(): Promise<AdminReward[]> {
    return api.get("/admin/rewards");
  },

  async getReward(id: string): Promise<AdminReward> {
    return api.get(`/admin/rewards/${id}`);
  },

  async createReward(payload: CreateRewardPayload): Promise<AdminReward> {
    return api.post("/admin/rewards", payload);
  },

  async updateReward(id: string, payload: UpdateRewardPayload): Promise<AdminReward> {
    return api.put(`/admin/rewards/${id}`, payload);
  },

  async getFulfilments(params: {
    page?: number;
    limit?: number;
    status?: string;
    rewardId?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<AdminFulfilment>> {
    return api.get("/admin/rewards/fulfilment", { params });
  },

  async updateFulfilment(id: string, payload: UpdateFulfilmentPayload): Promise<any> {
    return api.put(`/admin/rewards/fulfilment/${id}`, payload);
  },

  // ---------------------------------------------------------------------------
  // 8. Events, Settings & System Logs
  // ---------------------------------------------------------------------------
  async getEvents(params: {
    page?: number;
    limit?: number;
    scope?: string;
    locationId?: string;
    isPublished?: boolean;
    search?: string;
  } = {}): Promise<PaginatedResponse<AdminEvent>> {
    return api.get("/admin/events", { params });
  },

  async getEvent(id: string): Promise<AdminEvent> {
    return api.get(`/admin/events/${id}`);
  },

  async createEvent(payload: CreateEventPayload): Promise<AdminEvent> {
    return api.post("/admin/events", payload);
  },

  async updateEvent(id: string, payload: UpdateEventPayload): Promise<AdminEvent> {
    return api.put(`/admin/events/${id}`, payload);
  },

  async deleteEvent(id: string): Promise<any> {
    return api.delete(`/admin/events/${id}`);
  },

  async getSettings(category?: string): Promise<AdminSettingsMap> {
    return api.get("/admin/settings", { params: { category } });
  },

  async updateSettings(settings: Record<string, any>): Promise<AdminSettingsMap> {
    return api.put("/admin/settings", { settings });
  },

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<PaginatedResponse<ActivityFeedItem>> {
    return api.get("/admin/audit-logs", { params });
  },
};

export const adminApi = adminService;
export default adminService;
export type * from "./type";
