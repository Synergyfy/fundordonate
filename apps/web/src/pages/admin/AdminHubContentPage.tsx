// =============================================================================
// Admin — Hub Content Management Page
// Manage national hub hero content, announcements, featured cities, and events.
// =============================================================================

import { useState } from "react";
import { Megaphone, Star, Image, Calendar } from "lucide-react";
import { NATIONAL_HUB, getFeaturedCities, DEMO_HUB_EVENTS, ALL_LOCATIONS } from "@/data/ukHubData";

interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  date: string;
}

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "UK Hub Activation Reaches 15 Cities", content: "The programme now spans 15 cities with 3 active.", published: true, date: "2026-09-01" },
  { id: "a2", title: "New Founding Member Benefits Announced", content: "Business members now receive priority product access.", published: true, date: "2026-08-28" },
  { id: "a3", title: "Manchester Launch Event Recap", content: "Over 200 attendees at the Manchester launch.", published: false, date: "2026-08-25" },
];

type Tab = "hero" | "announcements" | "featured" | "events";

export function AdminHubContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("hero");
  const [announcements] = useState(DEMO_ANNOUNCEMENTS);

  // Hero form state
  const [heroHeadline, setHeroHeadline] = useState(NATIONAL_HUB.heroHeadline || "");
  const [heroSupporting, setHeroSupporting] = useState(NATIONAL_HUB.heroSupportingText || "");
  const [heroImage, setHeroImage] = useState(NATIONAL_HUB.primaryImage || "");

  const featuredCities = getFeaturedCities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">National Hub Content</h1>
        <p className="text-sm text-gray-500">Manage the national hub hero, announcements, featured cities, and events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
        {([
          ["hero", "Hero Content"],
          ["announcements", "Announcements"],
          ["featured", "Featured Cities"],
          ["events", "Events"],
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

      {/* Hero Content */}
      {activeTab === "hero" && (
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Hero Section</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Headline</label>
              <input
                type="text"
                value={heroHeadline}
                onChange={e => setHeroHeadline(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supporting Text</label>
              <textarea
                rows={2}
                value={heroSupporting}
                onChange={e => setHeroSupporting(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Background Image URL</label>
              <input
                type="url"
                value={heroImage}
                onChange={e => setHeroImage(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              Save Hero Content
            </button>
          </div>
        </div>
      )}

      {/* Announcements */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
            </div>
            <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              Add Announcement
            </button>
          </div>
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{a.content}</p>
                    <span className="mt-2 inline-block text-xs text-gray-400">{a.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {a.published ? "Published" : "Draft"}
                    </span>
                    <button className="text-xs text-primary-600 hover:text-primary-700">Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Cities */}
      {activeTab === "featured" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Featured Cities</h2>
          </div>
          <p className="text-sm text-gray-500">Featured cities are shown on the national hub page. Reorder by changing priority.</p>
          <div className="space-y-3">
            {featuredCities.map((city, i) => {
              // Compute activation progress from ALL_LOCATIONS seed data
              const seedCity = ALL_LOCATIONS.find((l) => l.id === city.id);
              const seedData = seedCity as unknown as Record<string, unknown> | undefined;
              const activationProgress = (seedData?.activationProgress as number) || 0;
              const region = (seedData?.region as string) || "";

              return (
                <div key={city.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{city.name}</h3>
                    <p className="text-xs text-gray-500">{activationProgress}% activation · {region}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      defaultValue={city.featuredPriority || i}
                      className="w-16 rounded-lg border px-2 py-1 text-center text-sm"
                    />
                    <button className="rounded-lg border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      Update
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-bold text-gray-900">Hub Events</h2>
            </div>
            <a href="/admin/events" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              Manage Events →
            </a>
          </div>
          <p className="text-sm text-gray-500">National hub events and launch events. Manage all events from the Events page.</p>
          <div className="space-y-3">
            {DEMO_HUB_EVENTS.map((e) => {
              const isPast = e.eventDate ? new Date(e.eventDate) < new Date() : false;
              return (
                <div key={e.id} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {e.status}
                        </span>
                        {isPast && <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">Past</span>}
                      </div>
                      <h3 className="mt-1 font-semibold text-gray-900">{e.title}</h3>
                      {e.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{e.description}</p>}
                      <span className="mt-2 inline-block text-xs text-gray-400">
                        {e.eventDate ? new Date(e.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
