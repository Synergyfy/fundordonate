import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, setUser } = useAuthStore();

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "form">(
    token ? "verifying" : "form"
  );
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      authApi
        .verifyEmail(token)
        .then(() => {
          setStatus("success");
          if (user) {
            setUser({ ...user, emailVerified: true });
          }
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error
              ? err.message
              : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Verification failed";
          setError(message);
          setStatus("error");
        });
    }
  }, [token, user, setUser]);

  const handleResend = async () => {
    setIsResending(true);
    setError("");

    try {
      await authApi.resendVerification();
      setResendSuccess(true);
      setError("");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to resend verification email";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  // Verifying state
  if (status === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            FundorDonate
          </Link>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-sm text-gray-600">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            FundorDonate
          </Link>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Email verified!</h1>
            <p className="mt-2 text-sm text-gray-600">Your email has been verified successfully.</p>
          </div>
          <Link to="/" className="block text-sm font-medium text-primary-600 hover:text-primary-500">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Error state (bad token) or form state (resend)
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            FundorDonate
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="mt-2 text-sm text-gray-600">
            {status === "error"
              ? "The verification link is invalid or has expired."
              : `We sent a verification link to ${user?.email || "your email"}.`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {resendSuccess ? (
            <p className="text-center text-sm text-green-700">Verification email resent!</p>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                Click below to resend the verification email.
              </p>
              <button
                onClick={handleResend}
                disabled={isResending}
                className="btn-primary w-full"
              >
                {isResending ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-center">
          <Link to="/" className="block text-sm font-medium text-primary-600 hover:text-primary-500">
            Go to dashboard
          </Link>
          <Link to="/auth/login" className="block text-sm text-gray-500 hover:text-gray-700">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
