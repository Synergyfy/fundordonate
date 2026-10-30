import { useState } from "react";
import { PostList } from "./PostList";
import { PostComposer } from "./PostComposer";
import { Leaderboard } from "./Leaderboard";
import { Gift, Clock, CheckCircle, Tag, Info } from "lucide-react";
import {
  REWARD_CATEGORY_META,
  fulfilmentKindLabel,
  fulfilmentSummary,
  type RewardCategory,
  type RewardItem,
} from "@/types/rewards";

interface Faq {
  question: string;
  answer: string;
}

interface Props {
  description?: string;
  shortDescription?: string;
  rewards: RewardItem[];
  faqs: Faq[];
  terms?: string | Record<string, unknown>;
  campaignId: string;
  isAuthor?: boolean;
  goalAmount?: number;
  raisedAmount?: number;
  deadline?: string;
  canContribute?: boolean;
  onSelectReward?: (rewardId: string) => void;
}

function humanizeTermKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

type Tab = "story" | "rewards" | "leaderboard" | "updates" | "terms";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

function getTriggerLabel(reward: RewardItem): string {
  const tc = reward.triggerConfig;
  switch (tc.mode) {
    case "min":
      return `Contribute ${formatCurrency(tc.min ?? 0)}+`;
    case "range":
      return `Contribute ${formatCurrency(tc.min ?? 0)}–${formatCurrency(tc.max ?? 0)}`;
    case "exact":
      return `Contribute exactly ${formatCurrency(tc.exact ?? 0)}`;
    default:
      return "Any contribution";
  }
}

/** Reward categories stored by the wizard use `snake_case`; MCOM may send `"gift card"`. */
const REWARD_TYPE_ALIASES: Record<string, RewardCategory> = {
  "gift card": "gift_card",
  "gift-card": "gift_card",
  giftcard: "gift_card",
  "e-gift card": "egift_card",
  "e gift card": "egift_card",
  egift: "egift_card",
  ecard: "egift_card",
  "e-card": "egift_card",
  discount: "deal",
  membership_access: "membership",
  access: "membership",
};

function getRewardTypeMeta(reward: RewardItem): { label: string; color: string } | null {
  const raw = (reward.rewardType ?? "").trim().toLowerCase();
  const normalized = raw.replace(/[\s-]+/g, "_");
  const category = (Object.prototype.hasOwnProperty.call(REWARD_CATEGORY_META, normalized)
    ? normalized
    : REWARD_TYPE_ALIASES[raw]) as RewardCategory | undefined;

  if (category && REWARD_CATEGORY_META[category]) {
    return REWARD_CATEGORY_META[category];
  }

  // Fall back to the provider fulfilment descriptor when no category is set.
  const kindLabel = fulfilmentKindLabel(reward.fulfilmentKind);
  if (kindLabel !== "Reward") {
    return { label: kindLabel, color: "bg-teal-100 text-teal-700" };
  }

  return null;
}

/** `valueGbp` is stored in pounds (not pence). */
function formatRewardValue(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function physicalTypeLabel(physicalType?: string): string | null {
  if (!physicalType) return null;
  switch (physicalType.toLowerCase()) {
    case "physical":
      return "Physical";
    case "digital":
      return "Digital";
    default:
      return physicalType.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  }
}

export function CampaignTabs({
  description,
  shortDescription,
  rewards,
  faqs,
  terms,
  campaignId,
  isAuthor,
  canContribute = true,
  onSelectReward,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("story");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: "story", label: "Story" },
    { id: "rewards", label: "Rewards" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "updates", label: "Campaign Updates" },
    { id: "terms", label: "Terms & Conditions" },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {/* ═══════════════ STORY TAB ═══════════════ */}
        {activeTab === "story" && (
          <div className="space-y-8">
            {/* Campaign Purpose */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Campaign Purpose</h3>
              {shortDescription ? (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">{shortDescription}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No campaign purpose provided.</p>
              )}
            </div>

            {/* Full Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Full Description</h3>
              {description ? (
                <div className="prose prose-gray max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: description }} />
                </div>
              ) : (
                <p className="text-gray-500 italic">No full description provided.</p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ REWARDS TAB ═══════════════ */}
        {activeTab === "rewards" && (
          <div>
            {rewards.length === 0 ? (
              <p className="text-gray-500 italic">No rewards available for this campaign.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rewards
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((reward) => {
                    const claimed = reward.quantityClaimed ?? 0;
                    const isLimited =
                      reward.quantityType === "limited" &&
                      reward.quantityLimit !== null &&
                      reward.quantityLimit !== undefined;
                    const limit = reward.quantityLimit ?? 0;
                    const isSoldOut =
                      Boolean(reward.soldOut) || (isLimited && claimed >= limit);

                    const typeMeta = getRewardTypeMeta(reward);
                    const valueLabel =
                      reward.valueGbp !== null &&
                      reward.valueGbp !== undefined &&
                      Number.isFinite(reward.valueGbp) &&
                      reward.valueGbp > 0
                        ? formatRewardValue(reward.valueGbp)
                        : null;
                    const fulfilmentNote = reward.fulfilmentKind
                      ? fulfilmentSummary(reward.fulfilmentKind)
                      : null;
                    const items = reward.items ?? [];
                    const hasDetails =
                      items.length > 0 || Boolean(valueLabel) || Boolean(fulfilmentNote);
                    const showTypeOnly = !hasDetails && Boolean(typeMeta);

                    return (
                      <article
                        key={reward.id}
                        className={`flex h-full flex-col rounded-xl border bg-white p-5 ${
                          isSoldOut ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200"
                        }`}
                      >
                        {/* Type + availability */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {typeMeta && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeMeta.color}`}
                              >
                                {typeMeta.label}
                              </span>
                            )}
                            {isSoldOut && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                Sold Out
                              </span>
                            )}
                          </div>
                          {isLimited && (
                            <span className="whitespace-nowrap rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-medium text-yellow-700">
                              {claimed}/{limit} claimed
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-start gap-2">
                          <Gift className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                          <h4 className="text-base font-bold leading-snug text-gray-900">
                            {reward.title}
                          </h4>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-primary-600">
                          {getTriggerLabel(reward)}
                        </p>

                        {reward.description && (
                          <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                            {reward.description}
                          </p>
                        )}

                        {(hasDetails || showTypeOnly) && (
                          <div className="mt-3 rounded-lg bg-gray-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                              What you get
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {showTypeOnly && typeMeta && (
                                <li className="flex items-start gap-2 text-sm text-gray-700">
                                  <Gift className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-600" />
                                  <span>{typeMeta.label}</span>
                                </li>
                              )}
                              {items.map((item, i) => {
                                const physicalType = physicalTypeLabel(item.physicalType);
                                return (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-gray-700"
                                  >
                                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                    <span>
                                      {item.title}
                                      {physicalType && (
                                        <span className="ml-1 text-[10px] uppercase text-gray-400">
                                          ({physicalType})
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                              {valueLabel && (
                                <li className="flex items-start gap-2 text-sm text-gray-700">
                                  <Tag className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-600" />
                                  <span>{valueLabel} reward value</span>
                                </li>
                              )}
                              {fulfilmentNote && (
                                <li className="flex items-start gap-2 text-sm text-gray-700">
                                  <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-600" />
                                  <span>{fulfilmentNote}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="mt-auto pt-3">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                            {Boolean(reward.claimDeadlineDays && reward.claimDeadlineDays > 0) && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Claim within {reward.claimDeadlineDays} days
                              </span>
                            )}
                            {reward.audience && reward.audience !== "both" && (
                              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                                {reward.audience === "business"
                                  ? "Business Only"
                                  : "Consumer Only"}
                              </span>
                            )}
                          </div>

                          {!isSoldOut && canContribute && onSelectReward && (
                            <button
                              type="button"
                              onClick={() => onSelectReward(reward.id)}
                              className="btn-primary mt-3 w-full"
                            >
                              Select This Reward
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ LEADERBOARD TAB ═══════════════ */}
        {activeTab === "leaderboard" && (
          <div>
            <Leaderboard level="campaign" scopeId={campaignId} size={50} variant="full" />
          </div>
        )}

        {/* ═══════════════ CAMPAIGN UPDATES TAB ═══════════════ */}
        {activeTab === "updates" && (
          <div className="space-y-6">
            {isAuthor && (
              <PostComposer
                campaignId={campaignId}
                onCreated={() => setRefreshKey((k) => k + 1)}
              />
            )}
            <PostList campaignId={campaignId} refreshKey={refreshKey} />
          </div>
        )}

        {/* ═══════════════ TERMS & CONDITIONS TAB ═══════════════ */}
        {activeTab === "terms" && (
          <div className="prose prose-gray max-w-none">
            <h2>Terms & Conditions</h2>

            {terms ? (
              typeof terms === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: terms }} />
              ) : (
                Object.entries(terms)
                  .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
                  .map(([key, value]) => (
                    <div key={key} className="mt-4">
                      <h3>{humanizeTermKey(key)}</h3>
                      <p className="whitespace-pre-line">{value as string}</p>
                    </div>
                  ))
              )
            ) : (
              <>
                <h3>1. Campaign Overview</h3>
                <p>
                  This campaign is hosted on FundorDonate, a platform for community-driven fundraising.
                  By contributing to this campaign, you agree to the following terms and conditions.
                </p>

                <h3>2. Contributions</h3>
                <p>
                  All contributions are final and non-refundable once the campaign reaches its funding goal.
                  If the campaign does not reach its goal, contributors will receive a full refund of their
                  contribution amount.
                </p>

                <h3>3. Platform Fee</h3>
                <p>
                  A 5% platform fee is applied to all contributions to cover payment processing and
                  platform maintenance costs. This fee is clearly displayed before you confirm your
                  contribution.
                </p>

                <h3>4. Rewards</h3>
                <p>
                  Rewards are provided by the campaign creator and are subject to the delivery timelines
                  specified in the reward details. FundorDonate is not responsible for reward fulfillment.
                </p>

                <h3>5. Campaign Updates</h3>
                <p>
                  Campaign creators are encouraged to provide regular updates to their contributors.
                  FundorDonate does not guarantee the frequency or quality of campaign updates.
                </p>

                <h3>6. Privacy</h3>
                <p>
                  Your contribution information is kept confidential and will only be shared with the
                  campaign creator for the purpose of reward fulfillment and campaign communication.
                </p>

                <h3>7. Contact</h3>
                <p>
                  For any questions or concerns about a campaign, please contact the campaign creator
                  directly through the platform or reach out to FundorDonate support.
                </p>
              </>
            )}

            {faqs.length > 0 && (
              <>
                <h2>Frequently Asked Questions</h2>
                {faqs.map((faq, index) => (
                  <div key={index} className="mt-4">
                    <h4 className="font-medium text-gray-900">{faq.question}</h4>
                    <p className="mt-1 text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
