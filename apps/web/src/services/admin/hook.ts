import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "./index";
import type {
  BulkCampaignActionPayload,
  CreateCampaignTemplatePayload,
  CreateEventPayload,
  CreateLocationPayload,
  CreateRewardPayload,
  CreateSeasonPayload,
  RequestCampaignChangesPayload,
  SeasonActionPayload,
  UpdateCampaignStatusPayload,
  UpdateCampaignTemplatePayload,
  UpdateEventPayload,
  UpdateFulfilmentPayload,
  UpdateLocationPayload,
  UpdateRewardPayload,
  UpdateSeasonPayload,
} from "./type";

// =============================================================================
// QUERY KEY FACTORY
// =============================================================================

export const adminKeys = {
  all: ["admin"] as const,

  // Dashboard
  stats: () => [...adminKeys.all, "stats"] as const,
  revenueChart: (period?: string) => [...adminKeys.all, "revenue-chart", period] as const,
  recentContributions: (limit?: number) => [...adminKeys.all, "recent-contributions", limit] as const,
  topCampaigns: (limit?: number) => [...adminKeys.all, "top-campaigns", limit] as const,
  activityFeed: (limit?: number) => [...adminKeys.all, "activity-feed", limit] as const,

  // Seasons
  seasons: (params?: Record<string, any>) => [...adminKeys.all, "seasons", params] as const,
  currentSeason: () => [...adminKeys.all, "seasons", "current"] as const,
  season: (id: string) => [...adminKeys.all, "season", id] as const,
  seasonReview: (id: string) => [...adminKeys.all, "season", id, "review"] as const,

  // Locations
  locations: (params?: Record<string, any>) => [...adminKeys.all, "locations", params] as const,
  locationTree: () => [...adminKeys.all, "locations", "tree"] as const,
  location: (id: string) => [...adminKeys.all, "location", id] as const,
  rollupConfig: () => [...adminKeys.all, "locations", "rollup-config"] as const,

  // Campaigns
  campaigns: (params?: Record<string, any>) => [...adminKeys.all, "campaigns", params] as const,
  campaign: (id: string) => [...adminKeys.all, "campaign", id] as const,
  templates: () => [...adminKeys.all, "templates"] as const,
  template: (id: string) => [...adminKeys.all, "template", id] as const,
  targetCalculation: (params?: Record<string, any>) => [...adminKeys.all, "targets", "calculation", params] as const,

  // Participants
  users: (params?: Record<string, any>) => [...adminKeys.all, "users", params] as const,
  user: (id: string) => [...adminKeys.all, "user", id] as const,
  businesses: (params?: Record<string, any>) => [...adminKeys.all, "businesses", params] as const,
  business: (id: string) => [...adminKeys.all, "business", id] as const,
  consumers: (params?: Record<string, any>) => [...adminKeys.all, "consumers", params] as const,
  backers: (params?: Record<string, any>) => [...adminKeys.all, "backers", params] as const,
  foundingMembers: () => [...adminKeys.all, "founding-members"] as const,

  // Finance
  donations: (params?: Record<string, any>) => [...adminKeys.all, "donations", params] as const,
  donation: (id: string) => [...adminKeys.all, "donation", id] as const,
  pledges: (params?: Record<string, any>) => [...adminKeys.all, "pledges", params] as const,
  financeOverview: () => [...adminKeys.all, "finance", "overview"] as const,
  payouts: (params?: Record<string, any>) => [...adminKeys.all, "finance", "payouts", params] as const,

  // Rewards
  rewards: () => [...adminKeys.all, "rewards"] as const,
  reward: (id: string) => [...adminKeys.all, "reward", id] as const,
  fulfilments: (params?: Record<string, any>) => [...adminKeys.all, "rewards", "fulfilment", params] as const,

  // System
  events: (params?: Record<string, any>) => [...adminKeys.all, "events", params] as const,
  event: (id: string) => [...adminKeys.all, "event", id] as const,
  settings: (category?: string) => [...adminKeys.all, "settings", category] as const,
  auditLogs: (params?: Record<string, any>) => [...adminKeys.all, "audit-logs", params] as const,
};

// =============================================================================
// 1. DASHBOARD HOOKS
// =============================================================================

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminService.getDashboardStats(),
  });
}

export function useAdminRevenueChart(period: string = "monthly") {
  return useQuery({
    queryKey: adminKeys.revenueChart(period),
    queryFn: () => adminService.getRevenueChart(period),
  });
}

export function useAdminRecentContributions(limit = 10) {
  return useQuery({
    queryKey: adminKeys.recentContributions(limit),
    queryFn: () => adminService.getRecentContributions(limit),
  });
}

export function useAdminTopCampaigns(limit = 5) {
  return useQuery({
    queryKey: adminKeys.topCampaigns(limit),
    queryFn: () => adminService.getTopCampaigns(limit),
  });
}

export function useAdminActivityFeed(limit = 20) {
  return useQuery({
    queryKey: adminKeys.activityFeed(limit),
    queryFn: () => adminService.getActivityFeed(limit),
  });
}

// =============================================================================
// 2. SEASONS HOOKS
// =============================================================================

export function useAdminSeasons(params?: Parameters<typeof adminService.getSeasons>[0]) {
  return useQuery({
    queryKey: adminKeys.seasons(params),
    queryFn: () => adminService.getSeasons(params),
  });
}

export function useAdminCurrentSeason() {
  return useQuery({
    queryKey: adminKeys.currentSeason(),
    queryFn: () => adminService.getCurrentSeason(),
  });
}

export function useAdminSeason(id: string) {
  return useQuery({
    queryKey: adminKeys.season(id),
    queryFn: () => adminService.getSeason(id),
    enabled: !!id,
  });
}

export function useAdminSeasonReview(id: string) {
  return useQuery({
    queryKey: adminKeys.seasonReview(id),
    queryFn: () => adminService.getSeasonReview(id),
    enabled: !!id,
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSeasonPayload) => adminService.createSeason(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.seasons() });
    },
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSeasonPayload }) =>
      adminService.updateSeason(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.season(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.seasons() });
    },
  });
}

export function useSeasonAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SeasonActionPayload }) =>
      adminService.performSeasonAction(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.season(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.seasons() });
      queryClient.invalidateQueries({ queryKey: adminKeys.currentSeason() });
    },
  });
}

// =============================================================================
// 3. LOCATIONS HOOKS
// =============================================================================

export function useAdminLocations(params?: Parameters<typeof adminService.getLocations>[0]) {
  return useQuery({
    queryKey: adminKeys.locations(params),
    queryFn: () => adminService.getLocations(params),
  });
}

export function useAdminLocationTree() {
  return useQuery({
    queryKey: adminKeys.locationTree(),
    queryFn: () => adminService.getLocationTree(),
  });
}

export function useAdminLocation(id: string) {
  return useQuery({
    queryKey: adminKeys.location(id),
    queryFn: () => adminService.getLocation(id),
    enabled: !!id,
  });
}

export function useAdminRollupConfig() {
  return useQuery({
    queryKey: adminKeys.rollupConfig(),
    queryFn: () => adminService.getRollupConfig(),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => adminService.createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
      queryClient.invalidateQueries({ queryKey: adminKeys.locationTree() });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLocationPayload }) =>
      adminService.updateLocation(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.location(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
      queryClient.invalidateQueries({ queryKey: adminKeys.locationTree() });
    },
  });
}

export function useToggleLocationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.toggleLocationStatus(id, isActive),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.location(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
      queryClient.invalidateQueries({ queryKey: adminKeys.locationTree() });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.locations() });
      queryClient.invalidateQueries({ queryKey: adminKeys.locationTree() });
    },
  });
}

export function useUpdateRollupConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Record<string, any>) => adminService.updateRollupConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rollupConfig() });
    },
  });
}

// =============================================================================
// 4. CAMPAIGNS & TEMPLATES HOOKS
// =============================================================================

export function useAdminCampaigns(params?: Parameters<typeof adminService.getCampaigns>[0]) {
  return useQuery({
    queryKey: adminKeys.campaigns(params),
    queryFn: () => adminService.getCampaigns(params),
  });
}

export function useAdminCampaign(id: string) {
  return useQuery({
    queryKey: adminKeys.campaign(id),
    queryFn: () => adminService.getCampaign(id),
    enabled: !!id,
  });
}

export function useUpdateAdminCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCampaignStatusPayload }) =>
      adminService.updateCampaignStatus(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.campaign(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.campaigns() });
    },
  });
}

export function useRequestCampaignChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RequestCampaignChangesPayload }) =>
      adminService.requestCampaignChanges(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.campaign(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.campaigns() });
    },
  });
}

export function useBulkCampaignAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkCampaignActionPayload) => adminService.bulkCampaignAction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.campaigns() });
    },
  });
}

export function useAdminTemplates() {
  return useQuery({
    queryKey: adminKeys.templates(),
    queryFn: () => adminService.getTemplates(),
  });
}

export function useAdminTemplate(id: string) {
  return useQuery({
    queryKey: adminKeys.template(id),
    queryFn: () => adminService.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateCampaignTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignTemplatePayload) => adminService.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
    },
  });
}

export function useUpdateCampaignTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCampaignTemplatePayload }) =>
      adminService.updateTemplate(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.template(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
    },
  });
}

export function useAdminTargetCalculation(params?: Parameters<typeof adminService.calculateTargets>[0]) {
  return useQuery({
    queryKey: adminKeys.targetCalculation(params),
    queryFn: () => adminService.calculateTargets(params),
  });
}

// =============================================================================
// 5. PARTICIPANTS HOOKS
// =============================================================================

export function useAdminUsers(params?: Parameters<typeof adminService.getUsers>[0]) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.getUsers(params),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminService.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminService.updateUserRole(id, role),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminBusinesses(params?: Parameters<typeof adminService.getBusinesses>[0]) {
  return useQuery({
    queryKey: adminKeys.businesses(params),
    queryFn: () => adminService.getBusinesses(params),
  });
}

export function useAdminBusiness(id: string) {
  return useQuery({
    queryKey: adminKeys.business(id),
    queryFn: () => adminService.getBusiness(id),
    enabled: !!id,
  });
}

export function useVerifyBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.verifyBusiness(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.business(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
    },
  });
}

export function useUpdateBusinessTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: string }) =>
      adminService.updateBusinessTier(id, tier),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.business(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
    },
  });
}

export function useAdminConsumers(params?: Parameters<typeof adminService.getConsumers>[0]) {
  return useQuery({
    queryKey: adminKeys.consumers(params),
    queryFn: () => adminService.getConsumers(params),
  });
}

export function useAdminBackers(params?: Parameters<typeof adminService.getBackers>[0]) {
  return useQuery({
    queryKey: adminKeys.backers(params),
    queryFn: () => adminService.getBackers(params),
  });
}

export function useAdminFoundingMembers() {
  return useQuery({
    queryKey: adminKeys.foundingMembers(),
    queryFn: () => adminService.getFoundingMembers(),
  });
}

// =============================================================================
// 6. FINANCE & PAYOUTS HOOKS
// =============================================================================

export function useAdminDonations(params?: Parameters<typeof adminService.getDonations>[0]) {
  return useQuery({
    queryKey: adminKeys.donations(params),
    queryFn: () => adminService.getDonations(params),
  });
}

export function useAdminDonation(id: string) {
  return useQuery({
    queryKey: adminKeys.donation(id),
    queryFn: () => adminService.getDonation(id),
    enabled: !!id,
  });
}

export function useRefundDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { amount?: number; reason?: string } }) =>
      adminService.refundDonation(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.donation(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.donations() });
      queryClient.invalidateQueries({ queryKey: adminKeys.financeOverview() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useAdminPledges(params?: Parameters<typeof adminService.getPledges>[0]) {
  return useQuery({
    queryKey: adminKeys.pledges(params),
    queryFn: () => adminService.getPledges(params),
  });
}

export function useAdminFinanceOverview() {
  return useQuery({
    queryKey: adminKeys.financeOverview(),
    queryFn: () => adminService.getFinanceOverview(),
  });
}

export function useAdminPayouts(params?: Parameters<typeof adminService.getPayouts>[0]) {
  return useQuery({
    queryKey: adminKeys.payouts(params),
    queryFn: () => adminService.getPayouts(params),
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; rejectionReason?: string } }) =>
      adminService.updatePayoutStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payouts() });
      queryClient.invalidateQueries({ queryKey: adminKeys.financeOverview() });
    },
  });
}

// =============================================================================
// 7. REWARDS & FULFILMENT HOOKS
// =============================================================================

export function useAdminRewards() {
  return useQuery({
    queryKey: adminKeys.rewards(),
    queryFn: () => adminService.getRewards(),
  });
}

export function useAdminReward(id: string) {
  return useQuery({
    queryKey: adminKeys.reward(id),
    queryFn: () => adminService.getReward(id),
    enabled: !!id,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRewardPayload) => adminService.createReward(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rewards() });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRewardPayload }) =>
      adminService.updateReward(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.reward(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.rewards() });
    },
  });
}

export function useAdminFulfilments(params?: Parameters<typeof adminService.getFulfilments>[0]) {
  return useQuery({
    queryKey: adminKeys.fulfilments(params),
    queryFn: () => adminService.getFulfilments(params),
  });
}

export function useUpdateFulfilment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFulfilmentPayload }) =>
      adminService.updateFulfilment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.fulfilments() });
    },
  });
}

// =============================================================================
// 8. EVENTS, SETTINGS & AUDIT HOOKS
// =============================================================================

export function useAdminEvents(params?: Parameters<typeof adminService.getEvents>[0]) {
  return useQuery({
    queryKey: adminKeys.events(params),
    queryFn: () => adminService.getEvents(params),
  });
}

export function useAdminEvent(id: string) {
  return useQuery({
    queryKey: adminKeys.event(id),
    queryFn: () => adminService.getEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => adminService.createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.events() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventPayload }) =>
      adminService.updateEvent(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.event(vars.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.events() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.events() });
    },
  });
}

export function useAdminSettings(category?: string) {
  return useQuery({
    queryKey: adminKeys.settings(category),
    queryFn: () => adminService.getSettings(category),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, any>) => adminService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useAdminAuditLogs(params?: Parameters<typeof adminService.getAuditLogs>[0]) {
  return useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminService.getAuditLogs(params),
  });
}
