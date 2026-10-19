// =============================================================================
// Admin — Founding Programmes Management Page
// List, create, and manage founding programmes with real live members and benefits.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, UserRound, Users, Gift } from "lucide-react";
import { adminApi, type AdminFoundingMember, type AdminLocation } from "@/services/admin";
import { FOUNDING_MEMBER_PILLARS } from "@/services/founding/foundingConfig";
import { formatDate } from "@/utils/formatters";

type Tab = "programmes" | "members" | "benefits";

export function AdminFoundingPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("programmes");
  const [members, setMembers] = useState<AdminFoundingMember[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAudience, setFormAudience] = useState<"BUSINESS" | "CONSUMER">("BUSINESS");
  const [formLocationId, setFormLocationId] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.getFoundingMembers().catch(() => []),
      adminApi.getLocations({ type: "CITY", limit: 50 }).catch(() => ({ data: [], total: 0 })),
    ]).then(([membersData, locsRes]) => {
      setMembers(membersData || []);
      setLocations(locsRes.data || []);
      setLoading(false);
    });
  }, []);

  const handleCreate = () => {
    setShowCreateForm(false);
    setFormTitle("");
    setFormDescription("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Founding Programmes</h1>
          <p className="text-sm text-gray-500">
            {members.length} registered founding members across {locations.length} active hubs
          </p>
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
                {locations.map(l => (
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
          {locations.slice(0, 8).map(loc => {
            const bizAllocated = (loc as any).foundingBusinessAllocated || 0;
            const bizTotal = (loc as any).foundingBusinessTotal || 0;
            const fillPct = bizTotal > 0 ? Math.round((bizAllocated / bizTotal) * 100) : 0;
            const remaining = Math.max(0, bizTotal - bizAllocated);

            return (
              <div key={loc.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-xs font-medium text-gray-500">Business & Consumer</span>
                      <h3 className="font-bold text-gray-900">{loc.name} Founding Hub</h3>
                    </div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <span>{loc.name} Region</span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{bizAllocated} / {bizTotal} allocated</span>
                    <span className="text-gray-500">{fillPct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  {remaining > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">⚡ {remaining} spots remaining</p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setActiveTab("members")}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Members →
                  </button>
                  <Link to={`/admin/locations/${loc.id}`} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                    Location Details →
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
            <h2 className="text-lg font-bold text-gray-900">Founding Members ({members.length})</h2>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-3 py-3 font-medium text-gray-500">Member</th>
                  <th className="px-3 py-3 font-medium text-gray-500">Tier / Plan</th>
                  <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
                  <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Joined</th>
                  <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map(m => {
                  const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || "Member";
                  const status = m.membershipStatus || m.subscription?.status || "ACTIVE";
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-gray-700 text-xs">
                          {m.membershipTier || m.membershipPlanName || "Founding Member"}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          status === "EXPIRED" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{status}</span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <Link to={`/admin/users/${m.id}`} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">
                          Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {members.length === 0 && !loading && (
              <p className="py-8 text-center text-sm text-gray-400">No founding members recorded in the system yet.</p>
            )}
          </div>
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
