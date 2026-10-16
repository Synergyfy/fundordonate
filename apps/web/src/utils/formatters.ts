// =============================================================================
// Formatting Utilities
// =============================================================================

export const formatCurrency = (pence: number = 0): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format((pence || 0) / 100);

export const formatCurrencyDecimal = (pence: number = 0): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((pence || 0) / 100);

export const formatNumber = (n: number = 0): string =>
  new Intl.NumberFormat("en-GB").format(n || 0);

export const formatDate = (date: string | Date | number | undefined | null): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
};
