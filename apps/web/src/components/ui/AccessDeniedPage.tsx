import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ShieldOff, ArrowLeft } from "lucide-react";

export function AccessDeniedPage() {
  const user = useAuthStore((s) => s.user);

  const homeRoute = user
    ? user.userType === "admin"
      ? "/admin"
      : user.userType === "business" && user.role === "fundraiser"
        ? "/fundraiser"
        : "/dashboard"
    : "/";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldOff className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-gray-600">
          You don't have permission to access this page.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to={homeRoute}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
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
