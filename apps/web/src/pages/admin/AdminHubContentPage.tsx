// =============================================================================
// Admin — Hub Content Management Page
// Manage national hub hero content, announcements, featured cities, and events.
// =============================================================================

import { useState } from "react";
import { Megaphone, Star, Calendar, Save, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";

type Tab = "hero" | "announcements" | "featured";

export function AdminHubContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("hero");

  const { data: settingsData } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi.getSettings(),
  });

  const { data: citiesData, isLoading: loadingCities } = useQuery({
    queryKey: ["admin-cities-list"],
    queryFn: () => adminApi.getLocations({ type: "CITY", limit: 20 }),
  });

  const cities = citiesData?.items || [];

  // Hero form state
  const [heroHeadline, setHeroHeadline] = useState("UK High Street Funding & Activation");
  const [heroSupporting, setHeroSupporting] = useState("Empowering businesses, consumers and communities across the UK.");
  const [saving, setSaving] = useState(false);

  const handleSaveHero = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings({
        heroHeadline,
        heroSupporting,
      });
      alert("Hub content updated successfully.");
    } catch (e: any) {
      alert(e.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">National Hub Content</h1>
        <p className="text-sm text-gray-500">Manage the national hub hero, announcements, and featured cities.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
        {([
          ["hero", "Hero Content"],
          ["featured", "Cities & Coverage"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "hero" && (
        <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Text</label>
            <textarea
              rows={3}
              value={heroSupporting}
              onChange={(e) => setHeroSupporting(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleSaveHero}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Hero Content
          </button>
        </div>
      )}

      {activeTab === "featured" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Cities in Hub Activation</h3>
          {loadingCities ? (
            <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cities.map((city) => (
                <div key={city.id} className="p-3 rounded-lg border bg-gray-50">
                  <div className="font-semibold text-gray-900">{city.name}</div>
                  <div className="text-xs text-gray-500">Status: {city.activationStatus || "DRAFT"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
