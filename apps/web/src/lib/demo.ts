// =============================================================================
// FundOrDonate — Demo Mode Isolation
// Clearly separates demo-only behavior from production auth.
// =============================================================================

import { FEATURES, CONFIG } from "./config";
import { STORAGE_KEYS } from "./config";

// =============================================================================
// Demo Users
// =============================================================================

export interface DemoUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: string;
  businessId?: string | null;
  avatar?: string;
  emailVerified: boolean;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  admin: {
    id: "demo-admin-001",
    email: "sarah.mitchell@demo.fundordonate",
    username: "sarah_mitchell",
    firstName: "Sarah",
    lastName: "Mitchell",
    role: "admin",
    userType: "admin",
    emailVerified: true,
  },
  business: {
    id: "demo-business-001",
    email: "sarah.johnson@demo.fundordonate",
    username: "sarah_johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "fundraiser",
    userType: "business",
    businessId: "demo-biz-001",
    emailVerified: true,
  },
  fundraiser: {
    id: "demo-fundraiser-001",
    email: "james.hartley@demo.fundordonate",
    username: "james_hartley",
    firstName: "James",
    lastName: "Hartley",
    role: "fundraiser",
    userType: "business",
    businessId: "demo-biz-001",
    emailVerified: true,
  },
  donor: {
    id: "demo-donor-001",
    email: "priya.sharma@demo.fundordonate",
    username: "priya_sharma",
    firstName: "Priya",
    lastName: "Sharma",
    role: "donor",
    userType: "consumer",
    emailVerified: true,
  },
  backer: {
    id: "demo-backer-001",
    email: "daniel.kowalski@demo.fundordonate",
    username: "daniel_kowalski",
    firstName: "Daniel",
    lastName: "Kowalski",
    role: "backer",
    userType: "consumer",
    emailVerified: true,
  },
  collaborator: {
    id: "demo-collaborator-001",
    email: "aisha.okonkwo@demo.fundordonate",
    username: "aisha_okonkwo",
    firstName: "Aisha",
    lastName: "Okonkwo",
    role: "collaborator",
    userType: "consumer",
    emailVerified: true,
  },
};

// =============================================================================
// Demo Mode Functions
// =============================================================================

export function isDemoMode(): boolean {
  if (!FEATURES.DEMO_MODE_ENABLED) return false;
  return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === "true";
}

export function getDemoRole(): string | null {
  return localStorage.getItem(STORAGE_KEYS.DEMO_ROLE);
}

export function enableDemoMode(role: string): void {
  if (!FEATURES.DEMO_MODE_ENABLED) {
    console.warn("Demo mode is not enabled in this environment");
    return;
  }
  localStorage.setItem(STORAGE_KEYS.DEMO_MODE, "true");
  localStorage.setItem(STORAGE_KEYS.DEMO_ROLE, role);
}

export function disableDemoMode(): void {
  localStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
  localStorage.removeItem(STORAGE_KEYS.DEMO_ROLE);
}

export function getDemoUser(role: string): DemoUser | null {
  if (!isDemoMode()) return null;
  return DEMO_USERS[role] || null;
}

// =============================================================================
// Production Safety Check
// =============================================================================

/**
 * Warn if demo mode is active in production.
 * Returns true if demo mode was disabled (i.e. it was active in production).
 * This function should be called during app initialization, BEFORE loadUser().
 */
export function validateDemoModeSafety(): boolean {
  if (CONFIG.NODE_ENV === "production" && isDemoMode()) {
    console.error(
      "[SECURITY] Demo mode is active in production! This should never happen."
    );
    disableDemoMode();
    return true;
  }
  return false;
}
