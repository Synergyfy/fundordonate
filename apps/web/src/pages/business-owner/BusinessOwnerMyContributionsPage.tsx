// =============================================================================
// Business Owner — My Contributions Page
// Outgoing contributions: campaigns this signed-in user has backed elsewhere.
// Backed by GET /user/donations (filtered by backerId).
// =============================================================================

import { Fragment, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Hash,
  Heart,
  Megaphone,
  RefreshCw,
  Search,
  Store,
  Target,
  Wallet,
} from "lucide-react";
import { useMyContributions } from "@/services/user-dashboard/hook";
import type { MyContributionItem } from "@/services/user-dashboard/type";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const TYPE_LABELS: Record<MyContributionItem["type"], string> = {
  IN_STORE: "In store",
  ONLINE: "Online",
  FUNDING_SPLIT: "Funding split",
  SELF_FUNDING: "Self funding",
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  PAUSED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const GATEWAY_LABELS: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  mcom_wallet: "MCOM Wallet",
  pos_terminal: "POS terminal",
};

const formatGateway = (gateway: string) =>
  GATEWAY_LABELS[gateway] ?? gateway.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const humanise = (value: string) => value.replace(/_/g, " ").toLowerCase();

const PAGE_SIZE = 20;

export default function BusinessOwnerMyContributionsPage() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useMyContributions({ page, limit: PAGE_SIZE });

  const contributions = data?.items ?? [];
  const totalAmount = data?.summary.totalAmount ?? 0;
  const transactionCount = data?.summary.transactionCount ?? 0;
  const campaignCount = data?.summary.campaignCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Contributions</h1>
          <p className="text-sm text-gray-500">
            Campaigns you have contributed to across FundorDonate — separate from contributions
            received by your own campaigns.
          </p>
        </div>
        <Link to="/campaigns" className="btn-secondary inline-flex items-center gap-1.5 text-sm">
          <Search className="h-4 w-4" aria-hidden="true" />
          Explore campaigns
        </Link>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-primary-100">Total contributed</div>
            <div className="mt-1 text-3xl font-bold">{fmt(totalAmount)}</div>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-primary-100">Campaigns supported</div>
              <div className="mt-1 text-xl font-semibold">{campaignCount}</div>
            </div>
            <div>
              <div className="text-primary-100">Contributions</div>
              <div className="mt-1 text-xl font-semibold">{transactionCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="animate-pulse rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-200" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-600" aria-hidden="true" />
          <p className="font-semibold text-red-900">Failed to load your contributions.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {contributions.length === 0 ? (
            <div className="p-10 text-center">
              <Heart className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-gray-900">No contributions yet</h2>
              <p className="mt-1 text-sm text-gray-500">
                When you back a campaign, it will appear here with its status and receipt.
              </p>
              <Link
                to="/campaigns"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Explore campaigns
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Business</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contributions.map((c) => {
                    const isExpanded = expandedId === c.id;

                    return (
                      <Fragment key={c.id}>
                        <tr
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? "bg-primary-50/40" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          aria-expanded={isExpanded}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {c.campaign.imageUrl ? (
                                  <img
                                    src={c.campaign.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-primary-50">
                                    <Megaphone className="h-4 w-4 text-primary-300" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/campaigns/${c.campaignId}`}
                                  onClick={(event) => event.stopPropagation()}
                                  className="block truncate font-semibold text-gray-900 hover:text-primary-600"
                                >
                                  {c.campaign.title}
                                </Link>
                                <span
                                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                    CAMPAIGN_STATUS_STYLES[c.campaign.status] ?? "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {humanise(c.campaign.status)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {c.business ? (
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 truncate text-gray-900">
                                  <Store className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                                  {c.business.name}
                                </div>
                                {c.business.city && (
                                  <div className="truncate text-xs text-gray-400">{c.business.city}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">FundorDonate platform</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                                STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {humanise(c.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{fmt(c.amount)}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/campaigns/${c.campaignId}`}
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                                aria-label={`View the public page for ${c.campaign.title}`}
                                title="View public campaign"
                              >
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setExpandedId(isExpanded ? null : c.id);
                                }}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                aria-label={isExpanded ? "Hide contribution details" : "Show contribution details"}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 pb-4 pt-0">
                              <div className="rounded-xl border border-gray-200 bg-white p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{c.campaign.title}</p>
                                    <p className="text-xs text-gray-500">
                                      Contribution {c.reference} · {formatDateTime(c.createdAt)}
                                    </p>
                                  </div>
                                  <Link
                                    to={`/campaigns/${c.campaignId}`}
                                    className="btn-secondary inline-flex items-center gap-1.5 text-xs"
                                  >
                                    View public campaign
                                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                  </Link>
                                </div>

                                <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  <DetailItem
                                    label="Contribution ID"
                                    value={c.id}
                                    icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                                    mono
                                  />
                                  <DetailItem
                                    label="Reference"
                                    value={c.reference}
                                    icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                                    mono
                                  />
                                  <DetailItem
                                    label="Channel"
                                    value={TYPE_LABELS[c.type] ?? humanise(c.type)}
                                    icon={<Megaphone className="h-3.5 w-3.5" aria-hidden="true" />}
                                  />
                                  <DetailItem
                                    label="Payment gateway"
                                    value={c.gateway ? formatGateway(c.gateway) : "Not recorded"}
                                    icon={<CreditCard className="h-3.5 w-3.5" aria-hidden="true" />}
                                  />
                                  <DetailItem
                                    label="Payment status"
                                    value={humanise(c.status)}
                                    icon={<Wallet className="h-3.5 w-3.5" aria-hidden="true" />}
                                    badgeClass={STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-600"}
                                  />
                                  <DetailItem
                                    label="Campaign progress"
                                    value={`${fmt(c.campaign.raisedAmount)} of ${fmt(c.campaign.targetAmount)}`}
                                    icon={<Target className="h-3.5 w-3.5" aria-hidden="true" />}
                                  />
                                  <DetailItem
                                    label="Campaign ends"
                                    value={c.campaign.endDate ? formatDate(c.campaign.endDate) : "No end date"}
                                    icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                                  />
                                  <DetailItem
                                    label="Recorded at"
                                    value={formatDateTime(c.createdAt)}
                                    icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                                  />
                                </dl>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
          <p className="text-gray-500">
            Page {currentPage} of {totalPages} · {data?.total ?? 0} contributions
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
  mono = false,
  badgeClass,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  mono?: boolean;
  badgeClass?: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">
        {badgeClass ? (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${badgeClass}`}>
            {value}
          </span>
        ) : (
          <span className={mono ? "break-all font-mono text-xs text-gray-600" : ""}>{value}</span>
        )}
      </dd>
    </div>
  );
}
