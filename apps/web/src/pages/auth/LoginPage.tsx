import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const [error, setError] = useState("");
  const loginWithCentralHub = useAuthStore((s) => s.loginWithCentralHub);
  const getPostLoginRedirect = useAuthStore((s) => s.getPostLoginRedirect);
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const sessionError = useAuthStore((s) => s.sessionError);
  const clearSessionError = useAuthStore((s) => s.clearSessionError);
  const centralHubEnabled = useAuthStore((s) => s.centralHubEnabled);
  const centralHubLoading = useAuthStore((s) => s.centralHubLoading);
  const checkCentralHub = useAuthStore((s) => s.checkCentralHub);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || undefined;
  const isLoggedIn = authStatus === "authenticated" && user;

  // If already authenticated, redirect straight to the user's dashboard (or requested page)
  useEffect(() => {
    if (isLoggedIn) {
      const dest =
        from && from !== "/" && from !== "/auth/login" && from !== "/login"
          ? from
          : getPostLoginRedirect();
      navigate(dest, { replace: true });
    }
  }, [isLoggedIn, from, getPostLoginRedirect, navigate]);

  useEffect(() => {
    checkCentralHub();
  }, [checkCentralHub]);

  useEffect(() => {
    if (searchParams.get("reason") === "session-expired") {
      setError("Your session has expired. Please sign in again.");
    }
  }, [searchParams]);

  useEffect(() => {
    return () => clearSessionError();
  }, [clearSessionError]);

  const handleCentralHubLogin = async () => {
    setError("");
    try {
      const targetPath =
        from && from !== "/" && from !== "/auth/login" && from !== "/login"
          ? from
          : "";
      await loginWithCentralHub(targetPath);
    } catch {
      setError("Unable to reach MCOM Central Hub. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Sign in */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="text-2xl font-bold text-primary-600">
              FundorDonate
            </Link>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Accounts are managed by MCOM Solutions. Continue with your Central
              Hub account — no separate FundorDonate password required.
            </p>
          </div>

          {isLoggedIn && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-800">
                    Signed in as {user.firstName || user.username || user.email}
                  </p>
                  <p className="mt-0.5 text-xs text-primary-600">
                    {user.userType === "admin"
                      ? "Administrator"
                      : user.userType === "business"
                        ? "Business"
                        : "Member"}
                  </p>
                </div>
                <button
                  onClick={() => navigate(getPostLoginRedirect(), { replace: true })}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {(error || sessionError) && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error || sessionError}
            </div>
          )}

          {centralHubEnabled ? (
            <button
              onClick={handleCentralHubLogin}
              disabled={centralHubLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  fill="currentColor"
                />
              </svg>
              {centralHubLoading ? "Connecting to Central Hub…" : "Login with Central Hub Solution"}
            </button>
          ) : (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
              Central Hub sign-in is currently unavailable. Please try again later.
            </div>
          )}

          <p className="text-center text-xs text-gray-500">
            By continuing you agree to our{" "}
            <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="border-t border-gray-200 pt-6 text-center">
            <Link
              to="/admin/login"
              className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              Administrator sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 lg:flex lg:items-center lg:justify-center">
        <div className="px-12 text-center">
          <h2 className="text-3xl font-bold text-white">Start making a difference today</h2>
          <p className="mt-4 text-lg text-primary-100">
            Join thousands of people fundraising for causes they care about.
          </p>
        </div>
      </div>
    </div>
  );
}
