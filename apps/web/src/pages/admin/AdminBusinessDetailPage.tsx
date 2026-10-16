// =============================================================================
// Admin Business Detail Page
// Detailed view of a business entity for admin management.
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Target, Play, Ban, Users, AlertCircle, Loader2,
} from "lucide-react";
import { adminApi } from "@/services/admin";
import type { AdminBusiness } from "@/services/admin/type";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<AdminBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.getBusiness(id)
      .then((data) => {
        setBusiness(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load business details");
        setLoading(false);
      });
  }, [id]);

  const handleStatusChange = async (newStatus: "ACTIVE" | "SUSPENDED") => {
    if (!id || !business) return;
    setUpdating(true);
    try {
      await adminApi.verifyBusiness(id, newStatus);
      setBusiness({ ...business, status: newStatus as any });
    } catch (err: any) {
      alert(err.message || "Failed to update business status");
    } finally {
      setUpdating(false);
    }
  };

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h3 className="font-semibold text-gray-900 mb-1">Business not found</h3>
        <p className="text-sm text-gray-600 mb-4">{error || "Unable to find the requested business."}</p>
        <Link to="/admin/businesses" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm border hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Back to businesses
        </Link>
      </div>
    );
  }

  const locationText = [business.city, business.localArea, business.highStreet].filter(Boolean).join(" > ") || "N/A";
  const ownerName = business.owner ? `${business.owner.firstName || ""} ${business.owner.lastName || ""}`.trim() : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/businesses" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-sm text-gray-500">{business.businessType || business.category || "Business"} · {ownerName}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[business.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700"}`}>
            {business.status}
          </span>
          {business.status === "ACTIVE" && (
            <button
              onClick={() => handleStatusChange("SUSPENDED")}
              disabled={updating}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Ban className="inline h-3 w-3 mr-1" /> Suspend
            </button>
          )}
          {business.status === "SUSPENDED" && (
            <button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={updating}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              <Play className="inline h-3 w-3 mr-1" /> Reactivate
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{fmt(business.totalRaised || 0)}</div>
          <div className="text-xs text-gray-500">Total Raised</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{business.campaignsCount ?? (business.campaigns?.length || 0)}</div>
          <div className="text-xs text-gray-500">Campaigns</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{business.membershipTier || "None"}</div>
          <div className="text-xs text-gray-500">Tier</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{new Date(business.createdAt).toLocaleDateString("en-GB")}</div>
          <div className="text-xs text-gray-500">Joined</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Business Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="text-gray-900">{ownerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{business.owner?.email || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-gray-900">{locationText}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="text-gray-900">{business.category || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-900">{new Date(business.createdAt).toLocaleDateString("en-GB")}</span></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            {business.owner?.id && (
              <Link to={`/admin/users/${business.owner.id}`} className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
                <Users className="h-4 w-4" /> View Owner Profile
              </Link>
            )}
            <Link to={`/admin/campaigns?businessId=${business.id}`} className="w-full rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
              <Target className="h-4 w-4" /> View Campaigns
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
