// =============================================================================
// MCOM Central Hub — web app links
//
// Central Hub is the source of truth for user identity, contact details and
// business information. FundOrDonate is read-only for those fields, so any
// "edit" action must deep-link to the matching Central Hub page.
// =============================================================================

import { MCOM_CONFIG } from "./config";
import { isBusinessDashboardUser, type DashboardUser } from "./roles";

/** Central Hub page where the signed-in user edits their master profile. */
export function getCentralProfilePath(user?: DashboardUser | null): string {
  return user && isBusinessDashboardUser(user)
    ? "/dashboard/business-profile"
    : "/customer/profile";
}

/** Absolute Central Hub profile URL for the given (or currently signed-in) user. */
export function getCentralProfileUrl(user?: DashboardUser | null): string {
  const base = MCOM_CONFIG.CENTRAL_APP_URL.replace(/\/+$/, "");
  return `${base}${getCentralProfilePath(user)}`;
}
