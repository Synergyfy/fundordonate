// =============================================================================
// UK Hub — Founding Member Badge Component
// Visual badge for Founding Member status: Business, Consumer, Original, Monthly.
// =============================================================================

export type FoundingBadgeType = "BUSINESS" | "CONSUMER" | "ORIGINAL_BUSINESS" | "ORIGINAL_CONSUMER" | "MONTHLY_BUSINESS" | "MONTHLY_CONSUMER";

const BADGE_META: Record<FoundingBadgeType, { label: string; icon: string; ring: string; bg: string; text: string; description: string }> = {
  BUSINESS: {
    label: "Founding Business",
    icon: "🏢",
    ring: "border-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-700",
    description: "Founding Business Member",
  },
  CONSUMER: {
    label: "Founding Consumer",
    icon: "👤",
    ring: "border-green-300",
    bg: "bg-green-50",
    text: "text-green-700",
    description: "Founding Consumer Member",
  },
  ORIGINAL_BUSINESS: {
    label: "Original Founding Business",
    icon: "⭐",
    ring: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-700",
    description: "Original Founding Business Member — among the first to join",
  },
  ORIGINAL_CONSUMER: {
    label: "Original Founding Consumer",
    icon: "⭐",
    ring: "border-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-700",
    description: "Original Founding Consumer Member — among the first to join",
  },
  MONTHLY_BUSINESS: {
    label: "Monthly Founding Business",
    icon: "🏢",
    ring: "border-indigo-300",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    description: "Monthly Founding Business Member — recurring subscription",
  },
  MONTHLY_CONSUMER: {
    label: "Monthly Founding Consumer",
    icon: "👤",
    ring: "border-teal-300",
    bg: "bg-teal-50",
    text: "text-teal-700",
    description: "Monthly Founding Consumer Member — recurring subscription",
  },
};

interface FoundingMemberBadgeProps {
  /** The type of founding membership */
  type: FoundingBadgeType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show the text label */
  showLabel?: boolean;
  /** Whether to show a tooltip on hover */
  showTooltip?: boolean;
  /** Location name to display */
  locationName?: string;
}

export function FoundingMemberBadge({
  type,
  size = "md",
  showLabel = true,
  showTooltip = true,
  locationName,
}: FoundingMemberBadgeProps) {
  const meta = BADGE_META[type];
  const isOriginal = type.startsWith("ORIGINAL");
  const isMonthly = type.startsWith("MONTHLY");

  const circleSize = size === "sm" ? "h-8 w-8 text-base" : size === "lg" ? "h-14 w-14 text-3xl" : "h-12 w-12 text-2xl";
  const labelSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="group relative inline-flex items-center gap-2">
      <span className={`flex ${circleSize} items-center justify-center rounded-full border-2 ${meta.ring} ${meta.bg} ${isOriginal ? "shadow-sm shadow-amber-200" : ""}`}>
        {meta.icon}
      </span>
      {showLabel && (
        <span className={`${labelSize} font-bold ${meta.text}`}>
          {meta.label}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg whitespace-nowrap">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{meta.icon}</span>
              <span className={`font-bold ${meta.text}`}>{meta.label}</span>
            </div>
            <p className="text-xs text-gray-500">{meta.description}</p>
            {locationName && (
              <p className="mt-1 text-xs text-gray-400">📍 {locationName}</p>
            )}
            {isOriginal && (
              <p className="mt-1 text-xs font-medium text-amber-600">
                ✨ Among the first founding members of this hub
              </p>
            )}
            {isMonthly && (
              <p className="mt-1 text-xs font-medium text-indigo-600">
                🔄 Recurring monthly subscription
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to determine badge type from membership record
export function getFoundingBadgeType(
  audience: "BUSINESS" | "CONSUMER",
  isOriginal: boolean,
  isMonthly: boolean,
): FoundingBadgeType {
  if (isOriginal) return audience === "BUSINESS" ? "ORIGINAL_BUSINESS" : "ORIGINAL_CONSUMER";
  if (isMonthly) return audience === "BUSINESS" ? "MONTHLY_BUSINESS" : "MONTHLY_CONSUMER";
  return audience === "BUSINESS" ? "BUSINESS" : "CONSUMER";
}
