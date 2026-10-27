import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { hasPermission, hasAnyPermission, getDashboardRoute } from "@/lib/roles";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AccessDeniedPage } from "@/components/ui/AccessDeniedPage";
import type { Permission, Role } from "@fundordonate/types";

// =============================================================================
// Types
// =============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles (capability roles like admin, fundraiser, donor) */
  requiredRoles?: string[];
  /** Required account types (userType like admin, business, consumer) */
  requiredUserTypes?: string[];
  /** Required single permission */
  requiredPermission?: Permission;
  /** Required at least one of these permissions */
  requiredAnyPermission?: Permission[];
}

// =============================================================================
// ProtectedRoute
// =============================================================================

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredUserTypes,
  requiredPermission,
  requiredAnyPermission,
}: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const location = useLocation();

  // State A — Authentication still initializing
  if (authStatus === "initializing") {
    return <LoadingScreen message="Checking your session..." />;
  }

  // State B — User is unauthenticated → redirect to the matching login with
  // a return path. The admin area has its own local-password sign-in page.
  if (authStatus === "unauthenticated" || !user) {
    const loginPath = location.pathname.startsWith("/admin")
      ? "/admin/login"
      : "/auth/login";
    return (
      <Navigate
        to={loginPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // State C — User is authenticated but lacks authorization (403)
  // Check userType authorization
  if (requiredUserTypes && !requiredUserTypes.includes(user.userType)) {
    return <AccessDeniedPage />;
  }

  // Check role authorization
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <AccessDeniedPage />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(user.role as Role, requiredPermission)) {
    return <AccessDeniedPage />;
  }

  // Check any permission
  if (requiredAnyPermission && !hasAnyPermission(user.role as Role, requiredAnyPermission)) {
    return <AccessDeniedPage />;
  }

  // State E — Authorized, render children
  return <>{children}</>;
}

// =============================================================================
// GuestRoute — Redirects authenticated users to their dashboard
// =============================================================================

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);

  if (authStatus === "initializing") {
    return <LoadingScreen message="Restoring your session..." />;
  }

  if (authStatus === "authenticated" && user) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  return <>{children}</>;
}
