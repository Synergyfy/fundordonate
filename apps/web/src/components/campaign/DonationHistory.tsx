import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";

type Tab = "donations" | "pledges";

interface Donation {
  id: string;
  uid: string;
  amount: number;
  status: string;
  createdAt: string;
  campaign: { id: string; title: string; slug: string; featuredImage?: string };
}

interface Pledge {
  id: string;
  uid: string;
  amount: number;
  status: string;
  createdAt: string;
  campaign: { id: string; title: string; slug: string; featuredImage?: string };
  reward?: { title: string; amount: number };
}

export function DonationHistory() {
  const [activeTab, setActiveTab] = useState<Tab>("donations");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [activeTab]);

  const fetchData = async (pageNum: number) => {
    setLoading(true);
    try {
      if (activeTab === "donations") {
        const res = await campaignApi.getUserDonations(pageNum, 10);
        setDonations(res.items);
        setTotalPages(res.totalPages);
      } else {
        const res = await campaignApi.getUserPledges(pageNum, 10);
        setPledges(res.items);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("donations")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "donations"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Donations
        </button>
        <button
          onClick={() => setActiveTab("pledges")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "pledges"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Pledges
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse gap-4 rounded-lg border border-gray-100 p-4">
                <div className="h-12 w-12 rounded bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : activeTab === "donations" ? (
          donations.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="mt-3 text-gray-500">No donations yet</p>
              <Link to="/campaigns" className="btn-primary mt-4 inline-block">
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((d) => (
                <Link
                  key={d.id}
                  to={`/campaigns/${d.campaign.slug}`}
                  className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  {d.campaign.featuredImage ? (
                    <img src={d.campaign.featuredImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{d.campaign.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">${d.amount.toLocaleString()}</p>
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      {d.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : pledges.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <p className="mt-3 text-gray-500">No pledges yet</p>
            <Link to="/campaigns" className="btn-primary mt-4 inline-block">
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pledges.map((p) => (
              <Link
                key={p.id}
                to={`/campaigns/${p.campaign.slug}`}
                className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                {p.campaign.featuredImage ? (
                  <img src={p.campaign.featuredImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.campaign.title}</p>
                  <p className="text-xs text-gray-500">
                    {p.reward ? `Reward: ${p.reward.title}` : "No reward"}
                    {" · "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">${p.amount.toLocaleString()}</p>
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  fetchData(p);
                }}
                className={`h-8 w-8 rounded-lg text-sm font-medium ${
                  page === p
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
