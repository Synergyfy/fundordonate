import { useState } from "react";
import { PostList } from "./PostList";
import { CommentSection } from "./CommentSection";
import { PostComposer } from "./PostComposer";

interface Reward {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deliveryDate?: string;
  limit?: number;
  status: string;
  order: number;
  items?: { title: string; description?: string; quantity: number }[];
}

interface Faq {
  question: string;
  answer: string;
}

interface Props {
  description?: string;
  rewards: Reward[];
  faqs: Faq[];
  campaignId: string;
  isAuthor?: boolean;
  mode?: string;
}

type Tab = "content" | "rewards" | "updates" | "comments" | "faq";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

export function CampaignTabs({ description, rewards, faqs, campaignId, isAuthor, mode }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: "content", label: "Story" },
    { id: "rewards", label: "Rewards" },
    { id: "updates", label: "Updates" },
    { id: "comments", label: "Comments" },
    { id: "faq", label: "FAQ" },
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
        {activeTab === "content" && (
          <div className="prose prose-gray max-w-none">
            {description ? (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p className="text-gray-500 italic">No description provided.</p>
            )}
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-4">
            {rewards.length === 0 ? (
              <p className="text-gray-500 italic">No rewards available for this campaign.</p>
            ) : (
              rewards
                .filter((r) => r.status === "active")
                .sort((a, b) => a.order - b.order)
                .map((reward) => (
                  <div key={reward.id} className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{reward.title}</h4>
                        <p className="mt-1 text-2xl font-bold text-primary-600">
                          {formatCurrency(reward.amount)}+
                        </p>
                      </div>
                      {reward.limit && (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                          Limited: {reward.limit} left
                        </span>
                      )}
                    </div>
                    {reward.description && (
                      <p className="mt-3 text-gray-600">{reward.description}</p>
                    )}
                    {reward.deliveryDate && (
                      <p className="mt-3 text-sm text-gray-500">
                        Est. delivery:{" "}
                        {new Date(reward.deliveryDate).toLocaleDateString("en-GB", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {reward.items && reward.items.length > 0 && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <p className="text-sm font-medium text-gray-700">Includes:</p>
                        <ul className="mt-2 space-y-1">
                          {reward.items.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <svg
                                className="h-4 w-4 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {item.title} {item.quantity > 1 && `(x${item.quantity})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button className="btn-primary mt-4 w-full">
                      {mode === "fund" ? "Select This Reward" : mode === "sponsor" ? "Become a Partner" : "Select This Reward"}
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

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

        {activeTab === "comments" && (
          <CommentSection campaignId={campaignId} refreshKey={refreshKey} />
        )}

        {activeTab === "faq" && (
          <div className="space-y-4">
            {faqs.length === 0 ? (
              <p className="text-gray-500 italic">No frequently asked questions yet.</p>
            ) : (
              faqs.map((faq, index) => (
                <div key={index} className="rounded-xl border border-gray-200 p-5">
                  <h4 className="font-medium text-gray-900">{faq.question}</h4>
                  <p className="mt-2 text-gray-600">{faq.answer}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
