import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { campaignApi } from "@/services/campaign.service";
import api from "@/lib/api";

interface Transaction {
  uid: string;
  amount: number;
  status: string;
  createdAt: string;
  campaign: { id: string; title: string; slug: string; featuredImage?: string };
  reward?: { title: string; amount: number };
  tributeType?: string;
  tributeTo?: string;
}

export function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const type = searchParams.get("type") || "donation";
  const method = searchParams.get("method");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eCardMessage, setECardMessage] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setError("No transaction found");
      setLoading(false);
      return;
    }
    const fetchTransaction = async () => {
      try {
        const data = type === "pledge"
          ? await campaignApi.getPledge(uid)
          : await campaignApi.getDonation(uid);
        setTransaction(data);
      } catch {
        setError("Transaction not found");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [uid, type]);

  const handleDownloadReceipt = async () => {
    if (!uid) return;
    setDownloading(true);
    try {
      const res = await api.get(`/receipts/${uid}/pdf`, { params: { type }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${uid}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadECard = async () => {
    if (!uid) return;
    try {
      const params: Record<string, string> = {};
      if (eCardMessage) params.message = eCardMessage;
      const res = await api.get(`/ecards/${uid}/download`, { params });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ecard-${uid}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to generate e-card:", err);
    }
  };

  const handleViewECard = async () => {
    if (!uid) return;
    try {
      const params: Record<string, string> = {};
      if (eCardMessage) params.message = eCardMessage;
      const res = await api.get(`/ecards/${uid}`, { params });
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(res.data);
        w.document.close();
      }
    } catch (err) {
      console.error("Failed to view e-card:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-200">404</h1>
          <p className="mt-3 text-gray-600">{error || "Transaction not found"}</p>
          <Link to="/campaigns" className="btn-primary mt-5 inline-block">
            Browse Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const isPending = transaction.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {/* Icon */}
        <div className="text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isPending ? "bg-amber-100" : "bg-green-100"}`}>
            {isPending ? (
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {isPending ? "Payment Pending" : "Thank You!"}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {isPending
              ? "Your payment is being processed. We'll update you once confirmed."
              : `Your ${type === "pledge" ? "pledge" : "donation"} has been received.`}
          </p>
        </div>

        {/* Offline Notice */}
        {method === "offline" && isPending && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-xs font-medium text-amber-800">Bank Transfer Instructions</p>
            <p className="mt-1 text-xs text-amber-700">
              Please complete your transfer within 7 days. Verification takes 1-3 business days.
            </p>
          </div>
        )}

        {/* Details Card */}
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Transaction Details</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-xs text-gray-900">{transaction.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-gray-900">${transaction.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                isPending ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
              }`}>
                {transaction.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-900">
                {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
            {transaction.reward && (
              <div className="flex justify-between">
                <span className="text-gray-500">Reward</span>
                <span className="text-gray-900">{transaction.reward.title}</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              {transaction.campaign.featuredImage ? (
                <img src={transaction.campaign.featuredImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">{type === "pledge" ? "You pledged to" : "You donated to"}</p>
                <Link to={`/campaigns/${transaction.campaign.slug}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">
                  {transaction.campaign.title}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt & E-Card */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Receipt & E-Card</h3>
          <div className="mt-3 space-y-3">
            <button onClick={handleDownloadReceipt} disabled={downloading} className="btn-secondary w-full justify-center text-sm">
              {downloading ? "Downloading..." : "Download Receipt"}
            </button>
            {type === "donation" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">or</span></div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">E-Card Message</label>
                  <textarea
                    value={eCardMessage}
                    onChange={(e) => setECardMessage(e.target.value)}
                    rows={2}
                    placeholder="Personal message for the e-card..."
                    className="input-field text-sm resize-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={handleViewECard} className="btn-secondary flex-1 text-sm">Preview</button>
                    <button onClick={handleDownloadECard} className="btn-primary flex-1 text-sm">Download E-Card</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <Link to={`/campaigns/${transaction.campaign.slug}`} className="btn-primary flex-1 text-center text-sm">
            View Campaign
          </Link>
          <Link to="/campaigns" className="btn-secondary flex-1 text-center text-sm">
            Browse More
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          A receipt has been sent to your email.
        </p>
      </div>
    </div>
  );
}
