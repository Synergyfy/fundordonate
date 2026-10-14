// =============================================================================
// Admin Business Owner Detail Page
// Detailed view of a single business owner for admin management.
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Edit3, Target, AlertCircle, Loader2,
} from "lucide-react";
import { adminApi } from "@/services/admin";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export default function AdminBusinessOwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi.getUser(id)
      .then((data) => {
        setOwner(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load business owner");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h3 className="font-semibold text-gray-900 mb-1">Business owner not found</h3>
        <p className="text-sm text-gray-600 mb-4">{error || "Unable to find the requested account."}</p>
        <Link to="/admin/business-owners" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm border hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Back to business owners
        </Link>
      </div>
    );
  }

  const fullName = `${owner.firstName || ""} ${owner.lastName || ""}`.trim() || owner.username || "Business Owner";
  const primaryBusiness = owner.businesses?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/business-owners" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500">{primaryBusiness?.name || "Business Owner"} · {owner.email}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{owner.role?.toUpperCase() || "OWNER"}</div>
          <div className="text-xs text-gray-500">Platform Role</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{owner.businesses?.length || 0}</div>
          <div className="text-xs text-gray-500">Businesses Owned</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{owner._count?.contributions ?? owner.contributions?.length ?? 0}</div>
          <div className="text-xs text-gray-500">Contributions</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border text-center">
          <div className="text-lg font-bold text-gray-900">{new Date(owner.createdAt).toLocaleDateString("en-GB")}</div>
          <div className="text-xs text-gray-500">Joined</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Owner Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{fullName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{owner.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Username</span><span className="text-gray-900">{owner.username || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email Verified</span><span className="text-gray-900">{owner.emailVerified ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Registered</span><span className="text-gray-900">{new Date(owner.createdAt).toLocaleDateString("en-GB")}</span></div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Associated Businesses</h3>
          {owner.businesses && owner.businesses.length > 0 ? (
            <div className="space-y-2">
              {owner.businesses.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.city} · {b.membershipTier || "Standard"}</div>
                  </div>
                  <Link to={`/admin/businesses/${b.id}`} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    View Business &rarr;
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No businesses currently registered for this owner.</p>
          )}
        </div>
      </div>
    </div>
  );
}
