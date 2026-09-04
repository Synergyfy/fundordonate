import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, type User } from "@/stores/auth.store";
import { hasPermission, hasAnyPermission } from "@/lib/roles";
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
  /** Require verified email */
  requireEmailVerification?: boolean;
}

// =============================================================================
// Post-Login Redirect Helper
// =============================================================================

function getDashboardRoute(user: User): string {
  if (user.userType === "admin") return "/admin";
  if (user.userType === "business" && user.role === "fundraiser") return "/fundraiser";
  return "/dashboard";
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
  requireEmailVerification = false,
}: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.authStatus);
  const location = useLocation();

  // State A — Authentication still initializing
  if (authStatus === "initializing") {
    return <LoadingScreen message="Checking your session..." />;
  }

  // State B — User is unauthenticated → redirect to login with return path
  if (authStatus === "unauthenticated" || !user) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // State C — Email verification required
  if (requireEmailVerification && !user.emailVerified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // State D — User is authenticated but lacks authorization (403)
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
