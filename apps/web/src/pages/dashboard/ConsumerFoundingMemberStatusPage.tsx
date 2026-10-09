import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, MapPin, Star } from "lucide-react";
import {
  listContributions,
  type ConsumerContribution,
} from "@/data/consumerActivityData";
import { getConsumerCommunity } from "@/data/consumerHomeData";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const PARTICIPATION_LABELS: Record<string, string> = {
  founding_member: "Founding Member",
  founding_monthly: "Founding Member Monthly",
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

export function ConsumerFoundingMemberStatusPage() {
  const [record, setRecord] = useState<ConsumerContribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listContributions()
      .then((items) => {
        if (cancelled) return;
        const fm =
          items.find(
            (c) =>
              c.participationType === "founding_member" ||
              c.participationType === "founding_monthly",
          ) ?? null;
        setRecord(fm);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRecord(null);
        setLoading(false);
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

      {record ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {PARTICIPATION_LABELS[record.participationType] ?? "Founding Member"}
                </p>
                <p className="text-xs text-gray-500">Founding member since{" "}
                  {formatDate(record.createdAt)}</p>
              </div>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              Active
            </span>
          </div>

          <div className="mt-3 border-t border-gray-100">
            <DetailRow label="Type">
              <p className="font-medium text-gray-900">
                {PARTICIPATION_LABELS[record.participationType] ?? "Founding Member"}
              </p>
            </DetailRow>

            <DetailRow label="Associated Campaign">
              <p className="font-medium text-gray-900">{record.campaignTitle}</p>
              {record.campaignLocation ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {record.campaignLocation}
                </p>
              ) : null}
              <Link
                to={`/consumer/explore/campaign/${record.campaignSlug}`}
                className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View Campaign
                <ArrowRight className="h-4 w-4" />
              </Link>
            </DetailRow>

            <DetailRow label="Start Date">
              <p className="font-medium text-gray-900">{formatDate(record.createdAt)}</p>
            </DetailRow>

            <DetailRow label="Status">
              <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Active
              </span>
            </DetailRow>
          </div>
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
