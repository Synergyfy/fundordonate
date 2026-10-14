import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Self-service registration is handled by MCOM Central Hub onboarding.
 * This page simply routes the visitor into the Central Hub sign-up flow.
 */
export default function RegisterPage() {
  const loginWithCentralHub = useAuthStore((s) => s.loginWithCentralHub);
  const checkCentralHub = useAuthStore((s) => s.checkCentralHub);
  const centralHubLoading = useAuthStore((s) => s.centralHubLoading);
  const [error, setError] = useState("");

  useEffect(() => {
    checkCentralHub();
  }, [checkCentralHub]);

  const handleContinue = async () => {
    setError("");
    try {
      await loginWithCentralHub("");
    } catch {
      setError("Unable to reach MCOM Central Hub. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <Link to="/" className="text-2xl font-bold text-primary-600">
          FundorDonate
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-3 text-sm text-gray-600">
            FundorDonate accounts are created and managed through MCOM Solutions.
            Continue to the Central Hub to sign up or complete your business
            onboarding — you'll be returned here automatically.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={handleContinue}
            disabled={centralHubLoading}
            className="btn-primary mt-6 w-full"
          >
            {centralHubLoading ? "Connecting…" : "Continue with MCOM Central Hub"}
          </button>
        </div>

        <Link
          to="/auth/login"
          className="block text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
