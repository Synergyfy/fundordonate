import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { validateDemoModeSafety } from "@/lib/demo";

/**
 * AuthInitializer
 *
 * Runs once on application mount to:
 * 1. Validate demo mode safety (disable if in production, clear any fabricated session)
 * 2. Check Central Hub availability
 * 3. Hydrate the authenticated session from stored tokens
 *
 * IMPORTANT: validateDemoModeSafety() MUST run before loadUser() to prevent
 * demo mode from bypassing server authentication in production.
 *
 * This component should be rendered once at the app root.
 * It does NOT render any UI — it only performs initialization.
 */
export function AuthInitializer() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const checkCentralHub = useAuthStore((s) => s.checkCentralHub);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    // Step 1: Validate demo mode FIRST — if it was active in production, disable it
    // and clear any fabricated client-side session before loadUser() can read it.
    const demoDisabled = validateDemoModeSafety();
    if (demoDisabled) {
      clearAuth("Demo mode is not available in production.");
    }

    // Step 2: Check Central Hub availability
    checkCentralHub();

    // Step 3: Hydrate session from stored tokens (or demo mode if still valid)
    loadUser();
  }, [loadUser, checkCentralHub, clearAuth]);

  return null;
}
