import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

/**
 * AuthInitializer
 *
 * Runs once on application mount to:
 * 1. Check Central Hub availability
 * 2. Hydrate the authenticated session from stored tokens
 *
 * This component should be rendered once at the app root.
 * It does NOT render any UI — it only performs initialization.
 */
export function AuthInitializer() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const checkCentralHub = useAuthStore((s) => s.checkCentralHub);

  useEffect(() => {
    checkCentralHub();
    loadUser();
  }, [loadUser, checkCentralHub]);

  return null;
}
