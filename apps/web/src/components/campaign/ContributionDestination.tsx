// =============================================================================
// FundOrDonate — Contribution Destination Transparency Component
// Shows exactly where the user's money is going in the hierarchy.
// =============================================================================

interface HierarchyNode {
  label: string;
  icon: string;
  name: string;
}

interface ContributionDestinationProps {
  campaignTitle: string;
  hierarchyLevel?: string | null;
  locationName?: string;
  hierarchy?: HierarchyNode[];
  amount?: number;
  showBeforePayment?: boolean;
}

const LEVEL_META: Record<string, { icon: string; label: string }> = {
  national: { icon: "🇬🇧", label: "National" },
  city: { icon: "🏙️", label: "City" },
  borough: { icon: "🏘️", label: "Borough" },
  high_street: { icon: "🛒", label: "High Street" },
  business: { icon: "🏢", label: "Business" },
};

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function ContributionDestination({
  campaignTitle,
  hierarchyLevel,
  locationName,
  hierarchy,
  amount,
  showBeforePayment = true,
}: ContributionDestinationProps) {
  const levelMeta = hierarchyLevel ? LEVEL_META[hierarchyLevel] : null;

  return (
    <div className={`rounded-xl border ${showBeforePayment ? "border-primary-200 bg-primary-50" : "border-gray-200 bg-gray-50"} p-4`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">📍</span>
        <h3 className={`text-sm font-bold ${showBeforePayment ? "text-primary-800" : "text-gray-800"}`}>
          Where is your money going?
        </h3>
      </div>

      {/* Hierarchy Breadcrumb */}
      {hierarchy && hierarchy.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {hierarchy.map((node, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">→</span>}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                showBeforePayment ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"
              }`}>
                <span>{node.icon}</span>
                <span>{node.name}</span>
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Simple level + location display (when no full hierarchy provided) */}
      {!hierarchy && levelMeta && (
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-200">
            <span>{levelMeta.icon}</span>
            <span>{levelMeta.label} Campaign</span>
          </span>
          {locationName && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-600">{locationName}</span>
            </>
          )}
        </div>
      )}

      {/* Campaign Destination */}
      <div className={`mt-3 rounded-lg ${showBeforePayment ? "bg-white" : "bg-white"} p-3 border border-gray-100`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Campaign</p>
            <p className="text-sm font-semibold text-gray-900">{campaignTitle}</p>
          </div>
          {amount !== undefined && amount > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Your contribution</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transparency Message */}
      {showBeforePayment && (
        <p className="mt-2 text-xs text-primary-600">
          ✓ Your contribution is attributed to this {levelMeta?.label || "campaign"} campaign
          {locationName && <> in {locationName}</>}. The exact destination is recorded and visible in your contribution history.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Helper: Build hierarchy breadcrumb from campaign data
// =============================================================================

export function buildHierarchyBreadcrumb(
  hierarchyLevel?: string | null,
  locationName?: string,
  parentLocationName?: string,
  nationalName: string = "United Kingdom"
): HierarchyNode[] {
  const hierarchy: HierarchyNode[] = [];

  // Always start with national
  hierarchy.push({ label: "national", icon: "🇬🇧", name: nationalName });

  if (hierarchyLevel === "city" && locationName) {
    hierarchy.push({ label: "city", icon: "🏙️", name: locationName });
  } else if (hierarchyLevel === "borough" && locationName) {
    if (parentLocationName) {
      hierarchy.push({ label: "city", icon: "🏙️", name: parentLocationName });
    }
    hierarchy.push({ label: "borough", icon: "🏘️", name: locationName });
  } else if (hierarchyLevel === "high_street" && locationName) {
    if (parentLocationName) {
      hierarchy.push({ label: "borough", icon: "🏘️", name: parentLocationName });
    }
    hierarchy.push({ label: "high_street", icon: "🛒", name: locationName });
  } else if (hierarchyLevel === "business" && locationName) {
    if (parentLocationName) {
      hierarchy.push({ label: "high_street", icon: "🛒", name: parentLocationName });
    }
    hierarchy.push({ label: "business", icon: "🏢", name: locationName });
  } else if (hierarchyLevel === "national") {
    // National only — already added
  }

  return hierarchy;
}
