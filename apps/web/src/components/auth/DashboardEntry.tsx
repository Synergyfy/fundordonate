import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { getDashboardRoute } from "@/lib/roles";
import { BusinessOwnerLayout } from "@/components/layout/BusinessOwnerLayout";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/**
 * Role-aware entry point for `/dashboard`.
 *
 * `/dashboard` is the business owner portal. A signed-in user of another role
 * (e.g. a consumer or admin) who lands here directly is redirected to the
 * dashboard for their role instead of seeing an access-denied page.
 *
 * Unauthenticated visitors are normally handled by `ProtectedRoute`, but the
 * guard is repeated here so this component is safe to use on its own.
 */
export function DashboardEntry() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);

  if (authStatus === "initializing") {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (authStatus === "unauthenticated" || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const destination = getDashboardRoute(user);

  // Business owners (and fundraisers) stay on the business portal. The layout
  // renders the matched child route (the dashboard overview) through <Outlet />.
  if (destination === "/dashboard") {
    return <BusinessOwnerLayout />;
  }

  return <Navigate to={destination} replace />;
}
