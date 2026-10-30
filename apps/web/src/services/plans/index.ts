import api from "../api";
import type {
  AccessPass,
  AccessPassCode,
  CreateAccessPassPayload,
  CreatePlanPayload,
  MembershipPlan,
  MyPlansResponse,
  PlanCatalog,
  PlanFeature,
  PlanOrder,
  PlanVariantUpsertPayload,
  PurchasePlanPayload,
  PurchasePlanResult,
} from "./type";

// =============================================================================
// User-facing plans
// =============================================================================

export const planService = {
  async getCatalog(): Promise<PlanCatalog> {
    return api.get("/plans/catalog");
  },

  async getMine(): Promise<MyPlansResponse> {
    return api.get("/plans/me");
  },

  async getCapabilities(version?: string) {
    return api.get("/plans/capabilities", {
      params: version ? { version } : undefined,
    });
  },

  async purchase(payload: PurchasePlanPayload): Promise<PurchasePlanResult> {
    return api.post("/plans/purchase", payload);
  },

  async confirmOrder(
    orderId: string,
    payload: { paymentIntentId?: string; orderId?: string } = {},
  ): Promise<any> {
    return api.post(`/plans/orders/${orderId}/confirm`, payload);
  },

  async redeemAccessPass(payload: {
    code: string;
    confirmForfeit?: boolean;
  }): Promise<{
    entitlement: any;
    accessPass: AccessPass;
    expiresAt: string;
    forfeited: {
      kind: string;
      planName: string | null;
      expiresAt: string;
    } | null;
  }> {
    return api.post("/plans/access-pass/redeem", payload);
  },
};

// =============================================================================
// Admin CRUD
// =============================================================================

export const planAdminService = {
  // Feature catalogue
  async listFeatures(): Promise<PlanFeature[]> {
    return api.get("/admin/plans/features");
  },

  async updateFeature(
    key: string,
    payload: Partial<
      Pick<
        PlanFeature,
        | "name"
        | "description"
        | "category"
        | "sortOrder"
        | "defaultEnabled"
        | "supportsLimit"
        | "defaultLimit"
        | "isActive"
      >
    >,
  ): Promise<PlanFeature> {
    return api.patch(`/admin/plans/features/${encodeURIComponent(key)}`, payload);
  },

  // Plans
  async listPlans(includeInactive = true): Promise<MembershipPlan[]> {
    return api.get("/admin/plans", {
      params: { includeInactive: includeInactive ? "true" : "false" },
    });
  },

  async getPlan(id: string): Promise<MembershipPlan> {
    return api.get(`/admin/plans/${id}`);
  },

  async createPlan(payload: CreatePlanPayload): Promise<MembershipPlan> {
    return api.post("/admin/plans", payload);
  },

  async updatePlan(
    id: string,
    payload: Partial<CreatePlanPayload>,
  ): Promise<MembershipPlan> {
    return api.put(`/admin/plans/${id}`, payload);
  },

  async deletePlan(id: string): Promise<{
    deleted: boolean;
    archived: boolean;
    message?: string;
  }> {
    return api.delete(`/admin/plans/${id}`);
  },

  async createVariant(
    planId: string,
    payload: PlanVariantUpsertPayload,
  ): Promise<MembershipPlan> {
    return api.post(`/admin/plans/${planId}/variants`, payload);
  },

  async updateVariant(
    planId: string,
    variantId: string,
    payload: Partial<PlanVariantUpsertPayload>,
  ): Promise<MembershipPlan> {
    return api.put(`/admin/plans/${planId}/variants/${variantId}`, payload);
  },

  async deleteVariant(
    planId: string,
    variantId: string,
  ): Promise<{ deleted: boolean; archived: boolean }> {
    return api.delete(`/admin/plans/${planId}/variants/${variantId}`);
  },

  // Access passes
  async listAccessPasses(includeInactive = true): Promise<AccessPass[]> {
    return api.get("/admin/access-passes", {
      params: { includeInactive: includeInactive ? "true" : "false" },
    });
  },

  async getAccessPass(id: string): Promise<AccessPass> {
    return api.get(`/admin/access-passes/${id}`);
  },

  async createAccessPass(payload: CreateAccessPassPayload): Promise<AccessPass> {
    return api.post("/admin/access-passes", payload);
  },

  async updateAccessPass(
    id: string,
    payload: Partial<CreateAccessPassPayload>,
  ): Promise<AccessPass> {
    return api.put(`/admin/access-passes/${id}`, payload);
  },

  async deleteAccessPass(id: string): Promise<{
    deleted: boolean;
    archived: boolean;
  }> {
    return api.delete(`/admin/access-passes/${id}`);
  },

  // Reporting
  async listOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    kind?: string;
    search?: string;
  } = {}): Promise<{
    items: PlanOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return api.get("/admin/plans/orders", { params });
  },

  async listCodes(params: {
    page?: number;
    limit?: number;
    status?: string;
    accessPassId?: string;
    search?: string;
  } = {}): Promise<{
    items: AccessPassCode[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return api.get("/admin/plans/access-pass-codes", { params });
  },
};

export type * from "./type";
