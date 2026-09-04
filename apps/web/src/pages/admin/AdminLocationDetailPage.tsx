// =============================================================================
// Admin — Location Detail Page
// Edit a single location's details, activation, funding, campaigns, and resources.
// =============================================================================

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ALL_LOCATIONS, DEMO_FOUNDING_PROGRAMMES } from "@/data/ukHubData";
import { LOCATION_PUBLIC_STATUS_META } from "@/types/uk-hub";
import { CampaignLocationManager } from "@/components/admin/CampaignLocationManager";

type Tab = "details" | "activation" | "funding" | "campaigns" | "resources";

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

export function AdminLocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = ALL_LOCATIONS.find(l => l.id === id);

  const [activeTab, setActiveTab] = useState<Tab>("details");

  // Details form state
  const [name, setName] = useState(location?.name || "");
  const [description, setDescription] = useState(location?.description || "");
  const [heroHeadline, setHeroHeadline] = useState(location?.heroHeadline || "");
  const [heroSupporting, setHeroSupporting] = useState(location?.heroSupportingText || "");
  const [primaryImage, setPrimaryImage] = useState(location?.primaryImage || "");
  const [isPublic, setIsPublic] = useState(location?.isPublic ?? true);
  const [isFeatured, setIsFeatured] = useState(location?.isFeaturedNationally ?? false);

  // Activation state
  const seedData = location ? (location as unknown as Record<string, unknown>) : null;
  const lifecycle = (seedData?.lifecycle as string) || location?.internalLifecycle || "IDENTIFIED";
  const activationProgress = (seedData?.activationProgress as number) || 0;
  const activationThreshold = location?.activationThreshold || 0;
  const [newThreshold, setNewThreshold] = useState(activationThreshold);

  // Funding state
  const fundingTarget = location?.fundingTarget || 0;
  const fundingRaised = location?.fundingRaised || 0;
  const foundingBizAllocated = location?.foundingBusinessAllocated || 0;
  const foundingBizTotal = location?.foundingBusinessTotal || 0;
  const foundingConsAllocated = location?.foundingConsumerAllocated || 0;
  const foundingConsTotal = location?.foundingConsumerTotal || 0;

  // Campaigns
  const demoCampaigns = [
    { id: "dc1", title: "London City Activation", slug: "london-city-activation", status: "active", mode: "crowdfunding" },
    { id: "dc2", title: "Birmingham Community Fund", slug: "birmingham-community-fund", status: "published", mode: "donation" },
    { id: "dc3", title: "Manchester Business Hub", slug: "manchester-business-hub", status: "draft", mode: "fund" },
  ];
  const attachedCampaigns = demoCampaigns.slice(0, 2);

  // Founding programmes at this location
  const locationProgrammes = DEMO_FOUNDING_PROGRAMMES.filter(p => p.locationId === id);

  if (!location) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">Location not found</h2>
        <Link to="/admin/hub-locations" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          ← Back to locations
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    console.log("Save location:", id, { name, description, heroHeadline, heroSupporting, primaryImage, isPublic, isFeatured });
    navigate("/admin/hub-locations");
  };

  const fundingPct = fundingTarget > 0 ? Math.round((fundingRaised / fundingTarget) * 100) : 0;
  const atThreshold = activationProgress >= newThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/hub-locations" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Back to locations
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit: {location.name}</h1>
        <p className="text-sm text-gray-500">{location.type} · ID: {location.id}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1 overflow-x-auto">
        {([
          ["details", "Details"],
          ["activation", "Activation"],
          ["funding", "Funding"],
          ["campaigns", "Campaigns"],
          ["resources", "Resources"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero Headline</label>
            <input type="text" value={heroHeadline} onChange={e => setHeroHeadline(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero Supporting Text</label>
            <textarea rows={2} value={heroSupporting} onChange={e => setHeroSupporting(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Image URL</label>
            <input type="url" value={primaryImage} onChange={e => setPrimaryImage(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Public</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Featured Nationally</span>
            </label>
          </div>
          <button onClick={handleSave} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Save Changes
          </button>
        </div>
      )}

      {/* Activation Tab */}
      {activeTab === "activation" && (
        <div className="rounded-xl border bg-white p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Activation Lifecycle</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <span className="text-xs text-gray-500">Current Lifecycle</span>
              <p className="mt-1 text-lg font-bold text-gray-900">{lifecycle.replace(/_/g, " ")}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <span className="text-xs text-gray-500">Public Status</span>
              <p className="mt-1 text-lg font-bold text-gray-900">{LOCATION_PUBLIC_STATUS_META[location.publicStatus]?.label || location.publicStatus}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Activation Progress</span>
              <span className="font-medium text-gray-900">{activationProgress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className={`h-3 rounded-full ${atThreshold ? "bg-green-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(activationProgress, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Activation Threshold (%)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="number"
                min="0"
                max="100"
                value={newThreshold}
                onChange={e => setNewThreshold(Number(e.target.value))}
                className="w-24 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              />
              <span className={`text-sm font-medium ${atThreshold ? "text-green-600" : "text-amber-600"}`}>
                {atThreshold ? "✓ At threshold" : "Below threshold"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Funding Tab */}
      {activeTab === "funding" && (
        <div className="rounded-xl border bg-white p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Funding & Founding</h2>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Funding Progress</span>
              <span className="font-medium text-gray-900">{formatCurrency(fundingRaised)} / {formatCurrency(fundingTarget)}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div className="h-3 rounded-full bg-primary-500" style={{ width: `${Math.min(fundingPct, 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-400">{fundingPct}% raised</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <span className="text-xs text-gray-500">Business Founding Slots</span>
              <p className="mt-1 text-lg font-bold text-gray-900">{foundingBizAllocated} / {foundingBizTotal}</p>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${foundingBizTotal > 0 ? (foundingBizAllocated / foundingBizTotal) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <span className="text-xs text-gray-500">Consumer Founding Slots</span>
              <p className="mt-1 text-lg font-bold text-gray-900">{foundingConsAllocated} / {foundingConsTotal}</p>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${foundingConsTotal > 0 ? (foundingConsAllocated / foundingConsTotal) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {locationProgrammes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Founding Programmes</h3>
              <div className="space-y-2">
                {locationProgrammes.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <span className="text-xs text-gray-500">{p.audience}</span>
                      <p className="text-sm font-medium text-gray-800">{p.title}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <CampaignLocationManager
          locationId={location.id}
          locationName={location.name}
          attachedCampaigns={attachedCampaigns}
          allCampaigns={demoCampaigns}
          onAttach={(cid) => console.log("Attach:", cid)}
          onDetach={(cid) => console.log("Detach:", cid)}
        />
      )}

      {/* Resources Tab */}
      {activeTab === "resources" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Location Resources</h2>

          {location.primaryImage && (
            <div>
              <span className="text-xs text-gray-500">Primary Image</span>
              <img src={location.primaryImage} alt={location.name} className="mt-1 w-full h-48 object-cover rounded-lg" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created</span>
              <p className="text-gray-800">{new Date(location.createdAt).toLocaleDateString("en-GB")}</p>
            </div>
            <div>
              <span className="text-gray-500">Updated</span>
              <p className="text-gray-800">{new Date(location.updatedAt).toLocaleDateString("en-GB")}</p>
            </div>
            <div>
              <span className="text-gray-500">Slug</span>
              <p className="text-gray-800 font-mono text-xs">{location.slug}</p>
            </div>
            <div>
              <span className="text-gray-500">Map Zoom</span>
              <p className="text-gray-800">{location.mapZoomLevel || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
