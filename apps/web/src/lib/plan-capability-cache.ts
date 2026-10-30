import type { CapabilityMap } from "@/services/plans/type";

const PREFIX = "fd_plan_capabilities:";

export interface CapabilitySnapshot {
  userId: string;
  version: string;
  source: "plan" | "access_pass" | "mcom" | "default";
  kind: string | null;
  planName: string | null;
  expiresAt: string | null;
  capabilities: CapabilityMap;
  fetchedAt: number;
}

/**
 * The cached capability snapshot is a UX accelerator only. The API remains
 * authoritative and re-checks every gate server-side.
 */
export function readCapabilitySnapshot(
  userId?: string | null,
): CapabilitySnapshot | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CapabilitySnapshot;
    if (!parsed?.capabilities || parsed.userId !== userId) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(`${PREFIX}${userId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCapabilitySnapshot(snapshot: CapabilitySnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${PREFIX}${snapshot.userId}`,
      JSON.stringify(snapshot),
    );
  } catch {
    // Storage can be full or disabled; the server fetch still works.
  }
}

export function clearCapabilitySnapshot(userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      window.localStorage.removeItem(`${PREFIX}${userId}`);
      return;
    }
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }
}
