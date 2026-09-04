// =============================================================================
// FundOrDonate — Shared Utilities
// Used by both backend (apps/api) and frontend (apps/web).
// =============================================================================

import { MINOR_UNITS, DEFAULT_CURRENCY } from "./constants";

// =============================================================================
// Slug Generation
// =============================================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =============================================================================
// UID Generation
// =============================================================================

export function generateUid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 15)
  );
}

// =============================================================================
// Currency Formatting
// =============================================================================

export function formatCurrency(amountInMinorUnits: number, currency: string = DEFAULT_CURRENCY): string {
  const locale = currency === "GBP" ? "en-GB" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInMinorUnits / MINOR_UNITS);
}

export function formatAmount(amountInMinorUnits: number): string {
  return (amountInMinorUnits / MINOR_UNITS).toFixed(2);
}

// =============================================================================
// Number Formatting
// =============================================================================

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// =============================================================================
// String Utilities
// =============================================================================

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// =============================================================================
// Date Utilities
// =============================================================================

export function getDaysRemaining(deadline: Date | string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// Progress Calculation
// =============================================================================

export function getProgressPercentage(raised: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

// =============================================================================
// Class Name Utility (cn)
// =============================================================================

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
