import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export default function CentralHubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleCentralHubCallback = useAuthStore((s) => s.handleCentralHubCallback);
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setStatus("error");
      setError(searchParams.get("error_description") || "Central Hub authentication was cancelled");
      return;
    }

    if (!code) {
      setStatus("error");
      setError("No authorization code received from Central Hub");
      return;
    }

    handleCentralHubCallback(code).then((result) => {
      if (result.success) {
        navigate(result.returnPath, { replace: true });
      } else {
        setStatus("error");
        setError(result.error || "Authentication failed");
      }
    });
  }, [searchParams, handleCentralHubCallback, navigate]);

  if (status === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            FundorDonate
          </Link>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-sm text-gray-600">
              Connecting to Central Hub...
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Completing authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <Link to="/" className="text-2xl font-bold text-primary-600">
          FundorDonate
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Authentication failed</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
        <div className="space-y-2">
          <Link
            to="/auth/login"
            className="block text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Back to sign in
          </Link>
          <Link to="/" className="block text-sm text-gray-500 hover:text-gray-700">
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
