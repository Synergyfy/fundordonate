import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, MapPin, Star } from "lucide-react";
import { foundingService } from "@/services/founding";
import type { FoundingMembership } from "@/services/founding/type";
import { getConsumerCommunity } from "@/services/community";
import { formatCurrency } from "@/utils/formatters";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function MembershipCard({ membership }: { membership: FoundingMembership }) {
  const status = String(membership.status || "").toUpperCase();
  const title = membership.isMonthly
    ? "Founding Member Monthly"
    : "Founding Member";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">
              Founding member since {formatDate(membership.grantedAt)}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="mt-3 border-t border-gray-100">
        <DetailRow label="Type">
          <p className="font-medium text-gray-900">{title}</p>
        </DetailRow>

        <DetailRow label="Location">
          <p className="flex items-center gap-1 font-medium text-gray-900">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {membership.locationName ?? "Community Hub"}
          </p>
        </DetailRow>

        <DetailRow label="Contribution">
          <p className="font-medium text-gray-900">
            {formatCurrency(membership.contributionAmount)}
            {membership.isMonthly ? " / month" : " one-off"}
          </p>
        </DetailRow>

        <DetailRow label="Start Date">
          <p className="font-medium text-gray-900">{formatDate(membership.grantedAt)}</p>
        </DetailRow>

        {membership.expiresAt ? (
          <DetailRow label={membership.isMonthly ? "Renews" : "Expires"}>
            <p className="font-medium text-gray-900">
              {formatDate(membership.expiresAt)}
            </p>
          </DetailRow>
        ) : null}

        {membership.benefits.length > 0 ? (
          <DetailRow label="Benefits">
            <ul className="space-y-1">
              {membership.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-1.5 text-sm text-gray-600"
                >
                  <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </DetailRow>
        ) : null}
      </div>
    </div>
  );
}

export function ConsumerFoundingMemberStatusPage() {
  const [memberships, setMemberships] = useState<FoundingMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    foundingService
      .getMyMemberships()
      .then((all) => {
        if (cancelled) return;
        setMemberships(
          all.filter(
            (membership) => String(membership.audience).toUpperCase() === "CONSUMER",
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const community = getConsumerCommunity();
  const joinUrl = `/uk-hub-activation/${community.citySlug}/consumer/${community.areaSlug}/${community.streetSlug}/join/founding-member-choice`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          You
        </Link>
        <span className="text-xs text-gray-400">Founding Member</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Founding Member</h1>

      {memberships.length > 0 ? (
        <div className="space-y-4">
          {memberships.map((membership) => (
            <MembershipCard key={membership.id} membership={membership} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Award className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            You are not a Founding Member yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            Founding Members help launch hubs in their community and receive
            founding recognition in return. Choose between a one-off or monthly
            founding membership.
          </p>
          <Link
            to={joinUrl}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Become a Founding Member
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
