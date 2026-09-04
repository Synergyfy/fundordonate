// =============================================================================
// Roles & Permissions System — Backend Implementation
// Imports from shared @fundordonate/types for single source of truth.
// =============================================================================

import { Role as SharedRole, Permission as SharedPermission, CampaignStatus, VALID_STATUS_TRANSITIONS, STATUS_TRANSITION_ACTORS } from "@fundordonate/types";

// Re-export for local use
export type Role = SharedRole;
export type Permission = SharedPermission;
export { CampaignStatus, VALID_STATUS_TRANSITIONS, STATUS_TRANSITION_ACTORS };

// =============================================================================
// Role → Permission Mapping
// =============================================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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

// =============================================================================
// Permission Helpers
// =============================================================================

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getAllRoles(): Role[] {
  return Object.keys(ROLE_PERMISSIONS) as Role[];
}

export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    admin: "Administrator",
    fundraiser: "Fundraiser",
    collaborator: "Collaborator",
    backer: "Backer",
    donor: "Donor",
  };
  return displayNames[role] ?? role;
}

export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    admin: "Full platform access and management",
    fundraiser: "Can create and manage own campaigns",
    collaborator: "Can contribute to assigned campaigns",
    backer: "Can donate and pledge to campaigns",
    donor: "Can donate to campaigns",
  };
  return descriptions[role] ?? "";
}

// =============================================================================
// Status Transition Helpers
// =============================================================================

export function canTransitionStatus(
  currentStatus: CampaignStatus,
  targetStatus: CampaignStatus,
  userRole: Role
): boolean {
  const validTargets = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!validTargets?.includes(targetStatus)) return false;

  const allowedActors = STATUS_TRANSITION_ACTORS[targetStatus];
  return allowedActors?.includes(userRole) ?? false;
}
