// =============================================================================
// Admin — Founding Programmes Management Page
// List, create, and manage all founding programmes with members and benefits.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, UserRound, Users, Gift } from "lucide-react";
import { ALL_LOCATIONS, DEMO_FOUNDING_PROGRAMMES } from "@/data/ukHubData";
import { FOUNDING_STATUS_META } from "@/types/uk-hub";
import type { FoundingProgramme } from "@/types/uk-hub";
import { FOUNDING_MEMBER_PILLARS } from "@/data/ukHubData";

interface FoundingMember {
  id: string;
  name: string;
  email: string;
  programmeId: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  grantedAt: string;
}

function generateMembers(programmeId: string, count: number): FoundingMember[] {
  const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason"];
  const lastNames = ["Wilson", "Johnson", "Brown", "Davis", "Taylor", "Anderson", "Thomas", "Jackson"];
  return Array.from({ length: count }, (_, i) => ({
    id: `fm-${programmeId}-${i + 1}`,
    name: `${firstNames[i % firstNames.length]!} ${lastNames[i % lastNames.length]!}`,
    email: `${firstNames[i % firstNames.length]!.toLowerCase()}.${lastNames[i % lastNames.length]!.toLowerCase()}@example.com`,
    programmeId,
    status: i < count - 1 ? "ACTIVE" : (i % 3 === 0 ? "EXPIRED" : "ACTIVE"),
    grantedAt: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  }));
}

type Tab = "programmes" | "members" | "benefits";

export function AdminFoundingPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("programmes");
  const [selectedProgramme, setSelectedProgramme] = useState<FoundingProgramme | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAudience, setFormAudience] = useState<"BUSINESS" | "CONSUMER">("BUSINESS");
  const [formLocationId, setFormLocationId] = useState("");

  const handleCreate = () => {
    console.log("Create programme:", { title: formTitle, description: formDescription, audience: formAudience, locationId: formLocationId });
    setShowCreateForm(false);
    setFormTitle("");
    setFormDescription("");
  };

  const members = selectedProgramme
    ? generateMembers(selectedProgramme.id, selectedProgramme.allocatedCount)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Founding Programmes</h1>
          <p className="text-sm text-gray-500">{DEMO_FOUNDING_PROGRAMMES.length} programmes across {ALL_LOCATIONS.length} locations</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Cancel" : "Add Programme"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-100 p-1">
        {([
          ["programmes", "Programmes"],
          ["members", "Members"],
          ["benefits", "Benefits"],
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

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">New Founding Programme</h2>
          <div>
            <label className="label">Title</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="input-field w-full" placeholder="Programme title" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)} className="input-field w-full" placeholder="Description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Audience</label>
              <select value={formAudience} onChange={e => setFormAudience(e.target.value as "BUSINESS" | "CONSUMER")} className="input-field w-full">
                <option value="BUSINESS">Business</option>
                <option value="CONSUMER">Consumer</option>
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <select value={formLocationId} onChange={e => setFormLocationId(e.target.value)} className="input-field w-full">
                <option value="">Select location</option>
                {ALL_LOCATIONS.filter(l => l.type === "CITY").map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleCreate} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Create Programme
          </button>
        </div>
      )}

      {/* Programmes Tab */}
      {activeTab === "programmes" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_FOUNDING_PROGRAMMES.map(p => {
            const meta = FOUNDING_STATUS_META[p.status];
            const location = ALL_LOCATIONS.find(l => l.id === p.locationId);
            const remaining = Math.max(0, p.totalAllocation - p.allocatedCount);
            const fillPct = p.totalAllocation > 0 ? Math.round((p.allocatedCount / p.totalAllocation) * 100) : 0;

            return (
              <div key={p.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {p.audience === "BUSINESS" ? (
                      <Building2 className="h-5 w-5 text-blue-600" />
                    ) : (
                      <UserRound className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <span className="text-xs font-medium text-gray-500">{p.audience} Programme</span>
                      <h3 className="font-bold text-gray-900">{p.title}</h3>
                    </div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <span>{location?.name || "Unknown"}</span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{p.allocatedCount} / {p.totalAllocation} allocated</span>
                    <span className="text-gray-500">{fillPct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  {remaining > 0 && remaining <= 20 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">⚡ {remaining} spots remaining</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  {p.opensAt && <span>Opens: {new Date(p.opensAt).toLocaleDateString("en-GB")}</span>}
                  {p.closesAt && <span>Closes: {new Date(p.closesAt).toLocaleDateString("en-GB")}</span>}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setSelectedProgramme(p); setActiveTab("members"); }}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Members →
                  </button>
                  <Link to={`/admin/founding/${p.id}`} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                    Edit →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Founding Members</h2>
          </div>

          <select
            value={selectedProgramme?.id || ""}
            onChange={e => {
              const p = DEMO_FOUNDING_PROGRAMMES.find(x => x.id === e.target.value);
              setSelectedProgramme(p || null);
            }}
            className="input-field w-full sm:w-64"
          >
            <option value="">Select a programme</option>
            {DEMO_FOUNDING_PROGRAMMES.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.audience})</option>
            ))}
          </select>

          {selectedProgramme ? (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 font-medium text-gray-500">Member</th>
                    <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
                    <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Granted</th>
                    <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          m.status === "EXPIRED" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{m.status}</span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400">
                        {new Date(m.grantedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-3 py-3">
                        <button className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">No members in this programme.</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              Select a programme to view its members.
            </div>
          )}
        </div>
      )}

      {/* Benefits Tab */}
      {activeTab === "benefits" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900">Founding Member Benefits</h2>
          </div>
          <p className="text-sm text-gray-500">Configure the benefits that founding members receive across all programmes.</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDING_MEMBER_PILLARS.map((pillar) => (
              <div key={pillar.key} className="rounded-xl border bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pillar.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pillar.title}</h3>
                    <p className="text-xs text-gray-500">{pillar.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-gray-700">Enabled</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Save Benefits Configuration
          </button>
        </div>
      )}
    </div>
  );
}
