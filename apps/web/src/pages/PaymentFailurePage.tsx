import { useSearchParams, Link } from "react-router-dom";

export function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "Payment could not be processed";
  const campaignSlug = searchParams.get("campaign");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Failed</h1>
        <p className="mt-1.5 text-sm text-gray-500">{reason}</p>
        <div className="mt-6 space-y-2.5">
          {campaignSlug ? (
            <Link to={`/campaigns/${campaignSlug}`} className="btn-primary block w-full text-center">
              Try Again
            </Link>
          ) : (
            <Link to="/campaigns" className="btn-primary block w-full text-center">
              Browse Campaigns
            </Link>
          )}
          <Link to="/" className="btn-secondary block w-full text-center">
            Go Home
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          If the problem persists, try a different payment method or contact support.
        </p>
      </div>
    </div>
  );
}
