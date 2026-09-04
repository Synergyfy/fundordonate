import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export function SessionExpiredMessage() {
  const [searchParams] = useSearchParams();
  const sessionError = useAuthStore((s) => s.sessionError);
  const reason = searchParams.get("reason");

  const message = sessionError || (reason === "session-expired"
    ? "Your session has expired. Please sign in again."
    : "Your session could not be restored. Please sign in again.");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Session Expired</h1>
        <p className="mt-3 text-gray-600">{message}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/auth/login"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign In
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
