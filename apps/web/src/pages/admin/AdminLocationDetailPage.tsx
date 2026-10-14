// =============================================================================
// Admin — Location Detail Page
// Edit a single location's details, activation, funding, campaigns, and resources.
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Loader2, Save } from "lucide-react";
import { adminApi } from "@/services/admin";
import type { AdminLocation } from "@/services/admin/type";

type Tab = "details" | "activation" | "funding";

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

export function AdminLocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<AdminLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("details");

  // Details form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [targetAmount, setTargetAmount] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.getLocation(id)
      .then((data) => {
        setLocation(data);
        setName(data.name || "");
        setDescription(data.description || "");
        setHeroHeadline(data.heroHeadline || "");
        setIsPublic(data.isActive ?? true);
        setTargetAmount(data.targetAmount || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load location details");
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!id || !location) return;
    setSaving(true);
    try {
      await adminApi.updateLocation(id, {
        name,
        description,
        heroHeadline,
        targetAmount: Number(targetAmount),
      });
      alert("Location details saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h3 className="font-semibold text-gray-900 mb-1">Location not found</h3>
        <p className="text-sm text-gray-600 mb-4">{error || "Unable to find the requested location."}</p>
        <Link to="/admin/locations" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm border hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Back to locations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/locations" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {location.type}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                location.activationStatus === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}>
                {location.activationStatus}
              </span>
            </div>
            <p className="text-sm text-gray-500">Slug: {location.slug}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {(["details", "activation", "funding"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Headline</label>
            <input
              type="text"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="e.g. Empowering Manchester's local high streets"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {activeTab === "activation" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Activation Status & Milestones</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 border">
              <div className="text-xs text-gray-500">Current Status</div>
              <div className="text-lg font-bold text-gray-900">{location.activationStatus}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border">
              <div className="text-xs text-gray-500">Active High Streets</div>
              <div className="text-lg font-bold text-gray-900">{location.children?.length || 0}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "funding" && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Funding Targets & Raised</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (in pence)</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <span className="text-xs text-gray-500 mt-1 block">Formatted: {formatCurrency(targetAmount)}</span>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border flex flex-col justify-center">
              <div className="text-xs text-gray-500">Total Raised to Date</div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(location.raisedAmount || 0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
