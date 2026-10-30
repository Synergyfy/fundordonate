// =============================================================================
// MCOM Central access-denial messaging
//
// Central returns a stable reason code when a user has no active trial,
// membership or access pass. Both the public upgrade page and the in-dashboard
// purchase page use these messages so the explanation stays consistent.
// =============================================================================

export interface EntitlementReasonMessage {
  title: string;
  body: string;
}

export const ENTITLEMENT_REASON_MESSAGES: Record<string, EntitlementReasonMessage> = {
  PLATFORM_NOT_IN_MEMBERSHIP: {
    title: "FundorDonate isn't included in your membership",
    body: "Your MCOM membership is active, but it doesn't currently bundle access to FundorDonate. Choose a plan or access pass below to unlock it.",
  },
  TRIAL_NO_TASKS: {
    title: "Trial available — no programme tasks yet",
    body: "You're in a trial window, but no active programme tasks are configured for FundorDonate yet. Choose a plan or access pass below for full access.",
  },
  TRIAL_EXPIRED: {
    title: "Your trial has ended",
    body: "Your FundorDonate trial access has expired. Choose a plan or access pass below to continue.",
  },
  UNVERIFIED: {
    title: "Verification required",
    body: "Your MCOM business verification fee hasn't been paid yet. Complete verification to unlock trial access, or choose a plan below.",
  },
  MEMBERSHIP_EXPIRED: {
    title: "Your membership has expired",
    body: "Renew your MCOM membership to restore access, or choose a plan or access pass below.",
  },
  NO_ACTIVE_ENTITLEMENT: {
    title: "No active plan for FundorDonate",
    body: "There's no active plan or entitlement for your account yet. Choose a plan or access pass below to get started.",
  },
};

export const DEFAULT_ENTITLEMENT_REASON_MESSAGE: EntitlementReasonMessage = {
  title: "Access required",
  body: "Your account doesn't currently have access to FundorDonate. Choose a plan or access pass below to continue.",
};

export function getEntitlementReasonMessage(
  reason: string | null | undefined
): EntitlementReasonMessage {
  if (!reason) return DEFAULT_ENTITLEMENT_REASON_MESSAGE;
  return ENTITLEMENT_REASON_MESSAGES[reason] ?? DEFAULT_ENTITLEMENT_REASON_MESSAGE;
}
