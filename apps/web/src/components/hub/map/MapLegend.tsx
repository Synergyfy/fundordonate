// =============================================================================
// UK Hub Map — Legend Component
// Shows status color legend for the map.
// =============================================================================

interface MapLegendProps {
  className?: string;
}

const LEGEND_ITEMS = [
  { color: "#22c55e", label: "Active" },
  { color: "#3b82f6", label: "Making Progress" },
  { color: "#eab308", label: "Needs Activation" },
];

export function MapLegend({ className }: MapLegendProps) {
  return (
    <div className={`flex items-center gap-4 rounded-lg border bg-white px-3 py-2 text-xs text-gray-600 ${className || ""}`}>
      {LEGEND_ITEMS.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
