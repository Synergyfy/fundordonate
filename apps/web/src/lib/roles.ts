// =============================================================================
// Roles & Permissions System — Frontend Implementation
// Imports from shared @fundordonate/types for single source of truth.
// =============================================================================

import { Role as SharedRole, Permission as SharedPermission } from "@fundordonate/types";

// Re-export for local use
export type Role = SharedRole;
export type Permission = SharedPermission;

// =============================================================================
// Permission Helpers
// =============================================================================

export function hasPermission(role: Role, permission: Permission): boolean {
  // Inline permission mapping for frontend use
  const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
      "campaign:create", "campaign:read", "campaign:update", "campaign:delete",
      "campaign:publish", "campaign:archive", "campaign:manage_own", "campaign:manage_assigned",
      "campaign:submit", "campaign:approve", "campaign:reject",
      "donation:create", "donation:read", "donation:manage",
      "pledge:create", "pledge:read", "pledge:manage",
      "comment:create", "comment:moderate",
      "user:read", "user:manage", "user:delete",
      "payment:process", "payment:refund",
      "withdrawal:request", "withdrawal:approve",
      "settings:read", "settings:manage",
      "reports:view",
    ],
    fundraiser: [
      "campaign:create", "campaign:read", "campaign:update",
      "campaign:manage_own", "campaign:submit",
      "donation:read", "pledge:read",
      "comment:create",
      "withdrawal:request",
      "reports:view",
    ],
    collaborator: [
      "campaign:read", "campaign:update", "campaign:manage_assigned",
      "donation:read", "pledge:read",
      "comment:create",
    ],
    backer: [
      "campaign:read",
      "donation:create", "donation:read",
      "pledge:create", "pledge:read",
      "comment:create",
    ],
    donor: [
      "campaign:read",
      "donation:create", "donation:read",
      "comment:create",
    ],
  };
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// =============================================================================
// Dashboard Routing
// =============================================================================

/** Minimal identity shape needed to decide which dashboard a user belongs to. */
export interface DashboardUser {
  userType: string;
  role: string;
}

/**
 * Whether the user belongs on the business dashboard. Central Hub uses this to
 * decide between the business wallet (`/dashboard/wallet`) and the customer
 * wallet (`/customer/wallet`).
 */
export function isBusinessDashboardUser(user: DashboardUser): boolean {
  return (
    user.userType === "business" ||
    user.role === "business" ||
    user.role === "fundraiser"
  );
}

/**
 * Central Hub wallet page for a user. Business users (and admins, who can
 * access the business dashboard) use the business wallet; everyone else uses
 * the customer wallet.
 */
export function getCentralWalletPath(
  user: DashboardUser | null | undefined,
): "/dashboard/wallet" | "/customer/wallet" {
  if (!user) return "/customer/wallet";
  if (user.userType === "admin" || user.role === "admin") {
    return "/dashboard/wallet";
  }
  return isBusinessDashboardUser(user) ? "/dashboard/wallet" : "/customer/wallet";
}

/**
 * Resolves the dashboard a user should land on.
 * Uses userType (account type) for primary routing, role (capability) for
 * refinement. This is the single source of truth for role-based redirects.
 */
export function getDashboardRoute(user: DashboardUser): string {
  if (user.userType === "admin" || user.role === "admin") {
    return "/admin";
  }
  if (isBusinessDashboardUser(user)) {
    return "/dashboard";
  }
  return "/consumer";
}

// =============================================================================
// UI Helpers
// =============================================================================

export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    admin: "bg-purple-100 text-purple-700",
    fundraiser: "bg-blue-100 text-blue-700",
    collaborator: "bg-teal-100 text-teal-700",
    backer: "bg-green-100 text-green-700",
    donor: "bg-gray-100 text-gray-700",
  };
  return colors[role] ?? "bg-gray-100 text-gray-700";
}
