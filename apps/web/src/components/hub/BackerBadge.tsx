// =============================================================================
// UK Hub — Backer Badge Component
// Formal backer recognition: Backer, City Hub Backer, National Backer.
// Awarded through the National Hub funnel (including funnel codes).
// =============================================================================

export type BackerBadgeTier = "BACKER" | "CITY" | "NATIONAL";

const TIER_META: Record<BackerBadgeTier, { label: string; icon: string; ring: string; bg: string; text: string }> = {
  BACKER:   { label: "Backer",           icon: "🤝", ring: "border-amber-300",   bg: "bg-amber-50",   text: "text-amber-700" },
  CITY:     { label: "City Hub Backer",  icon: "🏙️", ring: "border-blue-300",    bg: "bg-blue-50",    text: "text-blue-700" },
  NATIONAL: { label: "National Backer",  icon: "🇬🇧", ring: "border-purple-300", bg: "bg-purple-50",  text: "text-purple-700" },
};

interface BackerBadgeProps {
  tier: BackerBadgeTier;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function BackerBadge({ tier, size = "md", showLabel = true }: BackerBadgeProps) {
  const meta = TIER_META[tier];
  const circle = size === "sm" ? "h-8 w-8 text-base" : "h-12 w-12 text-2xl";
  return (
    <div className="flex items-center gap-2">
      <span className={`flex ${circle} items-center justify-center rounded-full border-2 ${meta.ring} ${meta.bg}`}>
        {meta.icon}
      </span>
      {showLabel && (
        <span className={`text-xs font-bold ${meta.text}`}>
          {meta.label}
        </span>
      )}
    </div>
  );
}
