import { useState } from "react";
import { PostList } from "./PostList";
import { PostComposer } from "./PostComposer";
import { Leaderboard } from "./Leaderboard";
import { Gift, Clock, CheckCircle } from "lucide-react";
import type { DemoReward } from "@/data/demoRewards";

interface Faq {
  question: string;
  answer: string;
}

interface Props {
  description?: string;
  shortDescription?: string;
  rewards: DemoReward[];
  faqs: Faq[];
  campaignId: string;
  isAuthor?: boolean;
  mode?: string;
  goalAmount?: number;
  raisedAmount?: number;
  deadline?: string;
}

type Tab = "story" | "rewards" | "leaderboard" | "updates" | "terms";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

function getTriggerLabel(reward: DemoReward): string {
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

export function CampaignTabs({
  description,
  shortDescription,
  rewards,
  faqs,
  campaignId,
  isAuthor,
  mode,
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
          <div className="space-y-4">
            {rewards.length === 0 ? (
              <p className="text-gray-500 italic">No rewards available for this campaign.</p>
            ) : (
              rewards
                .sort((a, b) => a.order - b.order)
                .map((reward) => {
                  const isSoldOut = reward.quantityType === "limited" &&
                    reward.quantityLimit !== null &&
                    reward.quantityClaimed >= reward.quantityLimit;

                  return (
                    <div key={reward.id} className={`rounded-xl border p-5 ${isSoldOut ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-primary-600" />
                            <h4 className="text-lg font-bold text-gray-900">{reward.title}</h4>
                            {isSoldOut && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                Sold Out
                              </span>
                            )}
                          </div>
                          {/* Trigger Label */}
                          <p className="mt-1 text-sm font-semibold text-primary-600">
                            {getTriggerLabel(reward)}
                          </p>
                        </div>
                        {reward.quantityType === "limited" && reward.quantityLimit !== null && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            {reward.quantityClaimed}/{reward.quantityLimit} claimed
                          </span>
                        )}
                      </div>

                      {reward.description && (
                        <p className="mt-3 text-sm text-gray-600">{reward.description}</p>
                      )}

                      {reward.items && reward.items.length > 0 && (
                        <div className="mt-4 border-t border-gray-100 pt-3">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Includes</p>
                          <ul className="space-y-1">
                            {reward.items.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{item.title}</span>
                                <span className="text-[10px] text-gray-400 uppercase">({item.physicalType})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                        {reward.claimDeadlineDays > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Claim within {reward.claimDeadlineDays} days
                          </span>
                        )}
                        {reward.audience !== "both" && (
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                            {reward.audience === "business" ? "Business Only" : "Consumer Only"}
                          </span>
                        )}
                      </div>

                      {!isSoldOut && (
                        <button className="btn-primary mt-4 w-full">
                          {mode === "fund" ? "Select This Reward" : mode === "sponsor" ? "Become a Partner" : "Select This Reward"}
                        </button>
                      )}
                    </div>
                  );
                })
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
