// =============================================================================
// Plans, access passes & capabilities
// =============================================================================

export type PlanAccessLevel = "STANDARD" | "PRO" | "PRO_PLUS";
export type PlanAudience = "BUSINESS" | "CONSUMER" | "BOTH";
export type PlanOrderKind = "PLAN" | "ACCESS_PASS";
export type PlanOrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";
export type AccessPassCodeStatus =
  | "AVAILABLE"
  | "ACTIVE"
  | "USED"
  | "EXPIRED"
  | "REVOKED";

export interface CapabilityRule {
  enabled: boolean;
  limit: number | null;
  unlimited: boolean;
}

export type CapabilityMap = Record<string, CapabilityRule>;

export interface PlanFeature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  sortOrder: number;
  defaultEnabled: boolean;
  supportsLimit: boolean;
  defaultLimit: number | null;
  isActive: boolean;
}

export interface PlanVariant {
  id: string;
  planId: string;
  accessLevel: PlanAccessLevel;
  name: string;
  description: string | null;
  durationDays: number;
  priceMinor: number;
  currency: string;
  isActive: boolean;
  capabilities: CapabilityMap;
  /** Display bullet points authored in MCOM Console (optional). */
  features?: string[];
  sortOrder: number;
  counts?: { orders: number; entitlements: number };
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  audience: PlanAudience;
  badge: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  variants: PlanVariant[];
}

export interface AccessPass {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationDays: number;
  priceMinor: number;
  currency: string;
  capabilities: CapabilityMap;
  /** Display bullet points authored in MCOM Console (optional). */
  features?: string[];
  codeValidityDays: number | null;
  isActive: boolean;
  sortOrder: number;
  count?: { codes: number; orders: number; entitlements: number };
}

export interface AccessPassCode {
  id: string;
  accessPassId: string;
  code: string;
  status: AccessPassCodeStatus;
  ownerId: string | null;
  orderId: string | null;
  expiresAt: string | null;
  activatedAt: string | null;
  entitlementExpiresAt: string | null;
  createdAt: string;
  accessPass?: AccessPass;
}

export interface UserEntitlement {
  id: string;
  userId: string;
  kind: "PLAN" | "ACCESS_PASS";
  status: "ACTIVE" | "EXPIRED" | "FORFEITED" | "CANCELLED";
  planVariantId: string | null;
  accessPassId: string | null;
  planName: string | null;
  accessLevel: PlanAccessLevel | null;
  capabilities: CapabilityMap;
  startedAt: string;
  expiresAt: string;
  forfeitedAt: string | null;
  planVariant?: PlanVariant & {
    plan?: { id: string; name: string; badge: string | null };
  };
  accessPass?: AccessPass;
}

export interface PlanOrder {
  id: string;
  userId: string;
  kind: PlanOrderKind;
  status: PlanOrderStatus;
  planVariantId: string | null;
  accessPassId: string | null;
  amountMinor: number;
  currency: string;
  reference: string;
  mcomChargeId: string | null;
  paymentMethod: string | null;
  activationMode: "immediate" | "save_code";
  activatedAt: string | null;
  entitlementExpiresAt: string | null;
  accessPassCodeId: string | null;
  createdAt: string;
  product?: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    userType: string;
  } | null;
  planVariant?: { name: string; plan?: { id: string; name: string } };
  accessPass?: { id: string; name: string };
}

export interface PlanCatalog {
  plans: MembershipPlan[];
  accessPasses: AccessPass[];
  features: PlanFeature[];
}

export interface MyPlansResponse {
  active: UserEntitlement | null;
  effective: {
    source: "plan" | "access_pass" | "mcom" | "default";
    kind: string | null;
    planName: string | null;
    expiresAt: string | null;
    capabilities: CapabilityMap;
  };
  history: UserEntitlement[];
  codes: AccessPassCode[];
  orders: PlanOrder[];
}

export interface PurchasePlanPayload {
  kind: PlanOrderKind;
  planVariantId?: string;
  accessPassId?: string;
  method: "wallet" | "stripe" | "paypal";
  activationMode?: "immediate" | "save_code";
  metadata?: Record<string, unknown>;
  acceptedTerms?: boolean;
  confirmForfeit?: boolean;
}

export interface PurchasePlanResult {
  order: PlanOrder;
  activation: {
    order: PlanOrder;
    entitlement: UserEntitlement | null;
    code: AccessPassCode | null;
    renewed?: boolean;
  } | null;
  chargeId: string;
  status: string;
  method: string;
  amountMinor: string;
  reference: string;
  clientSecret?: string;
  publishableKey?: string;
  approvalUrl?: string;
}

export interface PlanVariantUpsertPayload {
  accessLevel: PlanAccessLevel;
  /** Ignored by the API; generated from the plan name and access level. */
  name?: string;
  description?: string | null;
  /** Ignored by the API; fixed by access level. */
  durationDays?: number;
  priceMinor: number;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
  capabilities?: CapabilityMap;
}

export interface CreatePlanPayload {
  name: string;
  slug?: string;
  description?: string | null;
  audience?: PlanAudience;
  badge?: string | null;
  color?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  variants?: PlanVariantUpsertPayload[];
}

export interface CreateAccessPassPayload {
  name: string;
  slug?: string;
  description?: string | null;
  durationDays: number;
  priceMinor: number;
  currency?: string;
  capabilities?: CapabilityMap;
  codeValidityDays?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}
