import { HUB_STATUS_META, type HubStatus } from "@/data/hubActivation";
import { LOCATION_PUBLIC_STATUS_META, type LocationPublicStatus } from "@/types/uk-hub";

type Size = "sm" | "md";

export function HubStatusBadge({ status, size = "sm" }: { status: HubStatus; size?: Size }) {
  const meta = HUB_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        meta.bgClass
      } ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} aria-hidden="true" />
      <span className={meta.textClass}>{meta.label}</span>
    </span>
  );
}

export function LocationStatusBadge({ status, size = "sm" }: { status: LocationPublicStatus; size?: Size }) {
  const meta = LOCATION_PUBLIC_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        meta.bgColor
      } ${meta.borderColor} ${meta.color} ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.mapColor }}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </span>
  );
}
