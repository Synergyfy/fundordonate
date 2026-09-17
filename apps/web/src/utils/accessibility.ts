// =============================================================================
// Accessibility Utilities
// Helpers for ARIA labels, focus management, and keyboard navigation.
// =============================================================================

/**
 * Generate a unique ID for form elements.
 */
export function useId(prefix: string = "el"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Announce a message to screen readers.
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const el = document.createElement("div");
  el.setAttribute("aria-live", priority);
  el.setAttribute("aria-atomic", "true");
  el.className = "sr-only";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 1000);
}

/**
 * Trap focus within a container (for modals).
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);
  firstFocusable?.focus();

  return () => container.removeEventListener("keydown", handleKeyDown);
}

/**
 * Get ARIA label for a campaign card.
 */
export function getCampaignCardAriaLabel(campaign: {
  title: string;
  raisedAmount: number;
  goalAmount: number;
  deadline: string;
  _count?: { donations?: number; pledges?: number };
}): string {
  const progress = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
  const backers = (campaign._count?.donations || 0) + (campaign._count?.pledges || 0);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return `${campaign.title}. £${(campaign.raisedAmount / 100).toLocaleString()} raised of £${(campaign.goalAmount / 100).toLocaleString()}, ${progress}% complete. ${backers} backer${backers !== 1 ? "s" : ""}. ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left.`;
}

/**
 * Get ARIA label for a progress bar.
 */
export function getProgressAriaLabel(current: number, max: number, label?: string): string {
  const percentage = Math.round((current / max) * 100);
  return `${label ? `${label}: ` : ""}${percentage}% complete. £${(current / 100).toLocaleString()} of £${(max / 100).toLocaleString()}.`;
}

/**
 * Get ARIA label for a leaderboard entry.
 */
export function getLeaderboardEntryAriaLabel(entry: {
  rank: number;
  user?: { firstName?: string; username: string };
  totalContributed: number;
  campaignCount: number;
}): string {
  const name = entry.user?.firstName || entry.user?.username || "Anonymous";
  return `Rank ${entry.rank}: ${name}. £${(entry.totalContributed / 100).toLocaleString()} total contributed across ${entry.campaignCount} campaign${entry.campaignCount !== 1 ? "s" : ""}.`;
}

/**
 * Keyboard shortcuts for common actions.
 */
export const KEYBOARD_SHORTCUTS = {
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: " ",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
} as const;

/**
 * Handle keyboard activation (Enter or Space).
 */
export function handleKeyboardActivation(
  e: React.KeyboardEvent,
  handler: () => void
) {
  if (e.key === KEYBOARD_SHORTCUTS.ENTER || e.key === KEYBOARD_SHORTCUTS.SPACE) {
    e.preventDefault();
    handler();
  }
}
