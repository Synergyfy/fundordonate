import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { centralHubService } from "@/services/central-hub";

/**
 * Handles both MCOM Central Hub flows:
 *  - OAuth code callback  → `/auth/callback?code=…&state=…`
 *  - Direct handshake      → `/auth/callback?sso_token=…`
 */
export default function CentralHubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleCentralHubCallback = useAuthStore((s) => s.handleCentralHubCallback);
  const handleDirectSsoToken = useAuthStore((s) => s.handleDirectSsoToken);
  const getPostLoginRedirect = useAuthStore((s) => s.getPostLoginRedirect);
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const errorParam = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const directToken = searchParams.get("sso_token") || searchParams.get("token");

    const fail = (message: string) => {
      setStatus("error");
      setError(message);
    };

    if (errorParam) {
      fail(searchParams.get("error_description") || "Central Hub authentication was cancelled");
      return;
    }

    if (directToken) {
      handleDirectSsoToken(directToken).then((result) => {
        if (result.success) {
          const dest =
            result.returnPath &&
            result.returnPath !== "/" &&
            result.returnPath !== "/auth/login" &&
            result.returnPath !== "/login"
              ? result.returnPath
              : getPostLoginRedirect();
          navigate(dest, { replace: true });
        } else {
          fail(result.error || "Authentication failed");
        }
      });
      return;
    }

    if (!code) {
      fail("No authorization code received from Central Hub");
      return;
    }

    // Client-side CSRF check (the backend also validates state server-side).
    if (state && sessionStorage.getItem("fd_mcom_oauth_state") && !centralHubService.validateState(state)) {
      fail("Security check failed (state mismatch). Please sign in again.");
      return;
    }

    if (!state) {
      fail("Missing state parameter from Central Hub");
      return;
    }

    handleCentralHubCallback(code, state).then((result) => {
      centralHubService.clearState();

      if (result.success) {
        const dest =
          result.returnPath &&
          result.returnPath !== "/" &&
          result.returnPath !== "/auth/login" &&
          result.returnPath !== "/login"
            ? result.returnPath
            : getPostLoginRedirect();
        navigate(dest, { replace: true });
        return;
      }

      if (result.reason) {
        const params = new URLSearchParams({ reason: result.reason });
        if (result.upgradeUrl) params.set("upgradeUrl", result.upgradeUrl);
        navigate(`/upgrade?${params.toString()}`, { replace: true });
        return;
      }

      fail(result.error || "Authentication failed");
    });
  }, [
    searchParams,
    navigate,
    handleCentralHubCallback,
    handleDirectSsoToken,
    getPostLoginRedirect,
  ]);

  if (status === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            FundorDonate
          </Link>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-sm text-gray-600">Connecting to MCOM Central Hub…</p>
            <p className="mt-2 text-xs text-gray-400">Completing authentication</p>
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
