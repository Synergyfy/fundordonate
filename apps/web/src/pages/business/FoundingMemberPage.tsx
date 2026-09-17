// =============================================================================
// Founding Member Page
// Explain → Membership Selection (Bronze/Silver/Gold/Platinum × Standard/Pro/Pro+)
// =============================================================================

import { useParams, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import {
  ArrowLeft, ArrowRight, CheckCircle, Star, Trophy,
  Calendar, Clock, Heart, Sparkles,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { MEMBERSHIP_TIERS, type MembershipVariant, type AccessLevel } from "@/data/membershipTiers";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p);

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type Step = "explain" | "select" | "review" | "complete";

export default function FoundingMemberPage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const location = useLocation();
  const isConsumerContext = location.pathname.includes("/consumer/");
  const ctx = isConsumerContext ? "consumer" : "business";

  const [step, setStep] = useState<Step>("explain");
  const [selectedVariant, setSelectedVariant] = useState<MembershipVariant | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const handleSelectVariant = (variant: MembershipVariant) => {
    setSelectedVariant(variant);
    setStep("review");
  };

  const handleConfirm = () => {
    setStep("complete");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <Link
          to={`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/participation`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* ═══════════════ STEP 1: EXPLAIN ═══════════════ */}
          {step === "explain" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 mb-3">
                  <Star className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="text-xs font-bold text-yellow-700">FOUNDING MEMBER</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">Founding Member</h1>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Become one of the first businesses to shape {streetName}, {cityName}.
                </p>
              </div>

              {/* Season Context */}
              {currentSeason && (
                <div className="rounded-lg bg-gray-50 border p-3 mb-6 flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Current Season: <span className="font-bold text-gray-700">{currentSeason.name}</span></div>
                    <div className="text-xs text-gray-600 break-words">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</div>
                    {isActive && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-700 tabular-nums">
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.days}d</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.hours}h</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.minutes}m</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.seconds}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* What Founding Member Means */}
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-4">
                <h3 className="font-bold text-yellow-900 mb-2">What Founding Member Means</h3>
                <p className="text-sm text-yellow-800">
                  As a Founding Member, you are among the first businesses to join {streetName} in FundOrDonate.
                  You help shape the community, influence campaign decisions, and receive exclusive recognition
                  for your early contribution to the hub network.
                </p>
              </div>

              {/* What They Receive */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                <h3 className="font-bold text-blue-900 mb-3">What You Receive</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Founding Member badge on your business profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Priority participation in seasonal campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Voting rights on high street campaign decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Exclusive community events and networking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Recognition on the Founding Members wall</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Enhanced leaderboard positioning</span>
                  </li>
                </ul>
              </div>

              {/* Contribution Requirement */}
              <div className="rounded-lg bg-gray-50 border p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-2">Contribution Requirement</h3>
                <p className="text-sm text-gray-600">
                  Founding Member status requires a contribution starting from <strong>£50</strong>.
                  Choose the membership tier that suits your business. Higher tiers unlock additional benefits and recognition.
                </p>
              </div>

              {/* Available Options */}
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 mb-4">
                <h3 className="font-bold text-purple-900 mb-3">Available Membership Tiers</h3>
                <p className="text-sm text-purple-800 mb-3">
                  Each tier comes in Standard, Pro, and Pro+ variants with different access levels, durations, and benefits:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {MEMBERSHIP_TIERS.map((tier) => (
                    <div key={tier.id} className={`rounded-lg border p-2 text-center ${tier.borderColor} ${tier.bgColor}`}>
                      <div className={`text-xs font-bold ${tier.color}`}>{tier.name}</div>
                      <div className="text-[10px] text-gray-500">From {fmt(tier.variants[0]?.price ?? 0)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicable Rewards */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                <h3 className="font-bold text-green-900 mb-2">Rewards & Recognition</h3>
                <ul className="space-y-1.5 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Founding Member badge (Bronze/Silver/Gold/Platinum)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Leaderboard points based on tier level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Exclusive events and community recognition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Founding Members wall recognition</span>
                  </li>
                </ul>
              </div>

              {/* Difference: Backer vs Founding Member */}
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 mb-6">
                <h3 className="font-bold text-orange-900 mb-3">Backer vs Founding Member</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white border p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="font-bold text-gray-900">Backer</span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Campaign-specific contribution</li>
                      <li>• Backer recognition</li>
                      <li>• Basic rewards</li>
                      <li>• No membership required</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-white border p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-gray-900">Founding Member</span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• High street founding status</li>
                      <li>• Voting rights & priority access</li>
                      <li>• Exclusive rewards & events</li>
                      <li>• Membership tier with benefits</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep("select")}
                className="w-full rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-white hover:bg-yellow-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </>
          )}

          {/* ═══════════════ STEP 2: SELECT MEMBERSHIP ═══════════════ */}
          {step === "select" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Choose Your Membership</h1>
                <p className="text-sm text-gray-500">Select the tier and access level that suits your business</p>
              </div>

              {/* Season Context */}
              {currentSeason && (
                <div className="rounded-lg bg-gray-50 border p-3 mb-6 flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">Current Season: <span className="font-bold text-gray-700">{currentSeason.name}</span></div>
                    <div className="text-xs text-gray-600 break-words">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</div>
                    {isActive && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-700 tabular-nums">
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.days}d</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.hours}h</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.minutes}m</span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.seconds}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tier Selection — Mobile: Accordion | Desktop: Table */}
              <div className="mb-6">
                {/* Mobile: Accordion */}
                <div className="md:hidden space-y-3">
                  {MEMBERSHIP_TIERS.map((tier) => {
                    const isExpanded = expandedTier === tier.id;
                    return (
                      <div key={tier.id} className={`rounded-xl border-2 ${tier.borderColor} ${tier.bgColor} overflow-hidden`}>
                        <button
                          onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                          className="w-full p-4 text-left transition-all hover:shadow-sm cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tier.bgColor}`}>
                              <Star className={`h-5 w-5 ${tier.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-gray-900">{tier.name}</h3>
                              <p className="text-xs text-gray-600">{tier.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">From {fmt(tier.variants[0]?.price ?? 0)}</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-4 space-y-3">
                            {tier.variants.map((variant) => (
                              <button
                                key={variant.id}
                                onClick={() => handleSelectVariant(variant)}
                                className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-sm cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-gray-900">{variant.label}</h4>
                                      {variant.accessLevel === "pro_plus" && (
                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700">ANNUAL</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">{variant.duration}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">{fmt(variant.price)}</div>
                                    <div className="text-[10px] text-gray-500">{variant.accessLevel === "pro_plus" ? "per year" : "per 180 days"}</div>
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Access</div>
                                  <div className="flex flex-wrap gap-1">
                                    {variant.access.map((a) => (
                                      <span key={a} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-600">{a}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Benefits</div>
                                  <div className="flex flex-wrap gap-1">
                                    {variant.benefits.map((b) => (
                                      <span key={b} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-medium text-green-700">
                                        <CheckCircle className="h-2.5 w-2.5" />{b}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Rewards</div>
                                  <div className="flex flex-wrap gap-1">
                                    {variant.rewards.map((r) => (
                                      <span key={r} className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-[9px] font-medium text-yellow-700">
                                        <Trophy className="h-2.5 w-2.5" />{r}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: Dropdown + Comparison Table */}
                <div className="hidden md:block">
                  {/* Access Level Dropdown */}
                  <div className="flex items-center gap-3 mb-4">
                    <label className="text-sm font-bold text-gray-700">Access Level:</label>
                    <select
                      value={expandedTier || "standard"}
                      onChange={(e) => setExpandedTier(e.target.value as any)}
                      className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-blue-400 focus:outline-none cursor-pointer"
                    >
                      <option value="standard">Standard</option>
                      <option value="pro">Pro</option>
                      <option value="pro_plus">Pro+ (Annual)</option>
                    </select>
                    <span className="text-xs text-gray-500">
                      {(expandedTier || "standard") === "pro_plus" ? "365 days access" : "180 days access"}
                    </span>
                  </div>

                  {/* Comparison Table */}
                  {(() => {
                    const level = (expandedTier || "standard") as AccessLevel;
                    const variants = MEMBERSHIP_TIERS.map(t => ({
                      tier: t,
                      variant: t.variants.find(v => v.accessLevel === level),
                    })).filter(v => v.variant);

                    // Collect all unique access items
                    const allAccess = [...new Set(variants.flatMap(v => v.variant!.access))];
                    // Collect all unique benefits items
                    const allBenefits = [...new Set(variants.flatMap(v => v.variant!.benefits))];

                    return (
                      <div className="rounded-xl border overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase w-40"></th>
                              {variants.map(({ tier, variant }) => (
                                <th key={tier.id} className="px-4 py-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tier.bgColor}`}>
                                      <Star className={`h-4 w-4 ${tier.color}`} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{tier.name}</span>
                                    <span className="text-[10px] text-gray-500">{variant!.label}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* ACCESS Section Header */}
                            <tr className="bg-blue-50 border-b">
                              <td colSpan={variants.length + 1} className="px-4 py-2">
                                <span className="text-xs font-bold text-blue-700 uppercase">Access</span>
                              </td>
                            </tr>
                            {/* Access Items */}
                            {allAccess.map((item, i) => (
                              <tr key={`access-${i}`} className="border-b last:border-b-0">
                                <td className="px-4 py-2.5 text-sm text-gray-700">{item}</td>
                                {variants.map(({ tier, variant }) => (
                                  <td key={tier.id} className="px-4 py-2.5 text-center">
                                    {variant!.access.includes(item) ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}

                            {/* BENEFITS Section Header */}
                            <tr className="bg-green-50 border-b">
                              <td colSpan={variants.length + 1} className="px-4 py-2">
                                <span className="text-xs font-bold text-green-700 uppercase">Benefits</span>
                              </td>
                            </tr>
                            {/* Benefits Items */}
                            {allBenefits.map((item, i) => (
                              <tr key={`benefit-${i}`} className="border-b last:border-b-0">
                                <td className="px-4 py-2.5 text-sm text-gray-700">{item}</td>
                                {variants.map(({ tier, variant }) => (
                                  <td key={tier.id} className="px-4 py-2.5 text-center">
                                    {variant!.benefits.includes(item) ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}

                            {/* Price Row */}
                            <tr className="bg-gray-50 border-b">
                              <td className="px-4 py-3 text-sm font-bold text-gray-700">Price</td>
                              {variants.map(({ tier, variant }) => (
                                <td key={tier.id} className="px-4 py-3 text-center">
                                  <div className="text-lg font-bold text-gray-900">{fmt(variant!.price)}</div>
                                  <div className="text-[10px] text-gray-500">{variant!.accessLevel === "pro_plus" ? "per year" : "per 180 days"}</div>
                                </td>
                              ))}
                            </tr>

                            {/* Select Row */}
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3"></td>
                              {variants.map(({ tier, variant }) => (
                                <td key={tier.id} className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleSelectVariant(variant!)}
                                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors cursor-pointer"
                                  >
                                    Select {tier.name}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/* ═══════════════ STEP 3: REVIEW ═══════════════ */}
          {step === "review" && selectedVariant && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-1">Review</h1>
                <p className="text-sm text-gray-500">Confirm your Founding Member contribution</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Membership</div>
                  <div className="text-sm font-bold text-gray-900">{selectedVariant.label}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="text-sm font-bold text-gray-900">{selectedVariant.duration}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Business</div>
                  <div className="text-sm font-bold text-gray-900">ABC Foods Ltd</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Season</div>
                  <div className="text-sm font-bold text-gray-900">{currentSeason?.name || "N/A"}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">High Street</div>
                  <div className="text-sm font-bold text-gray-900">{streetName}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border p-3">
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="text-sm font-bold text-gray-900">{localAreaName}, {cityName}</div>
                </div>

                {/* Access */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <div className="text-xs font-bold text-blue-900 mb-1">Access</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedVariant.access.map((a) => (
                      <span key={a} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="text-xs font-bold text-green-900 mb-1">Benefits</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedVariant.benefits.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        <CheckCircle className="h-2.5 w-2.5" />
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rewards */}
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                  <div className="text-xs font-bold text-yellow-900 mb-1">Rewards</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedVariant.rewards.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                        <Trophy className="h-2.5 w-2.5" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Contribution</span>
                    <span className="text-xl font-bold text-green-600">{fmt(selectedVariant.price)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  Confirm {fmt(selectedVariant.price)} Contribution
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </>
          )}

          {/* ═══════════════ STEP 4: COMPLETE ═══════════════ */}
          {step === "complete" && selectedVariant && (
            <>
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Welcome, Founding Member!</h1>
                <p className="text-sm text-gray-500">
                  You are now a <strong>{selectedVariant.label}</strong> of {streetName}, {cityName}.
                </p>
              </div>

              {/* Hierarchy */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase mb-2">Your founding status</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>Membership: {selectedVariant.label}</div>
                  <div>Duration: {selectedVariant.duration}</div>
                  <div>Season: {currentSeason?.name}</div>
                  <div>Business: ABC Foods Ltd</div>
                  <div>High Street: {streetName}</div>
                  <div>Local Area: {localAreaName}</div>
                  <div>City: {cityName}</div>
                </div>
              </div>

              {/* Benefits Achieved */}
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-bold text-yellow-900">Your Founding Benefits</h3>
                </div>
                <ul className="space-y-2 text-sm text-yellow-800">
                  {selectedVariant.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={`/dashboard`}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
              >
                Go to Business Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
