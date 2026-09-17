// =============================================================================
// Admin — Campaign Location Manager Component
// Attach and detach campaigns from locations.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, ArrowRight } from "lucide-react";

interface CampaignSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  mode: string;
}

interface CampaignLocationManagerProps {
  locationId: string;
  locationName: string;
  attachedCampaigns: CampaignSummary[];
  allCampaigns: CampaignSummary[];
  onAttach: (campaignId: string) => void;
  onDetach: (campaignId: string) => void;
}

export function CampaignLocationManager({
  locationName,
  attachedCampaigns,
  allCampaigns,
  onAttach,
  onDetach,
}: CampaignLocationManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const availableCampaigns = allCampaigns.filter(
    c => !attachedCampaigns.some(a => a.id === c.id) &&
      (searchQuery === "" || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900">Campaigns</h3>
      <p className="text-sm text-gray-500">Campaigns attached to {locationName}</p>

      {/* Attached campaigns */}
      <div className="mt-4 space-y-2">
        {attachedCampaigns.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-500">
            No campaigns attached yet.
          </p>
        )}
        {attachedCampaigns.map(c => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <Link to={`/campaigns/${c.slug}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">
                {c.title}
              </Link>
              <span className="text-xs text-gray-400">{c.mode} · {c.status}</span>
            </div>
            <button
              onClick={() => onDetach(c.id)}
              className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add campaign */}
      <div className="mt-4 relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search campaigns to attach…"
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {showDropdown && availableCampaigns.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
            {availableCampaigns.slice(0, 10).map(c => (
              <button
                key={c.id}
                onClick={() => { onAttach(c.id); setSearchQuery(""); setShowDropdown(false); }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{c.title}</span>
                  <span className="text-xs text-gray-500">{c.mode} · {c.status}</span>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
