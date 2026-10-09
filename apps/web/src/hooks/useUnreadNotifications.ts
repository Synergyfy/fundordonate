import { useCallback, useEffect, useState } from "react";

const UNREAD_KEY = "fod:notifications:unread";
const UNREAD_EVENT = "fod:notifications:unread-changed";

function readUnread(): number {
  const raw = window.localStorage.getItem(UNREAD_KEY);
  const value = Number(raw ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Persist the unread badge count and notify every mounted consumer of the
 * change (layout rail, bottom nav, You menu).
 */
export function setUnreadCount(count: number): void {
  try {
    window.localStorage.setItem(
      UNREAD_KEY,
      String(Math.max(0, Math.floor(count))),
    );
  } catch {
    /* storage unavailable — event still fires */
  }
  window.dispatchEvent(new Event(UNREAD_EVENT));
}

export function useUnreadNotifications() {
  const [unread, setUnreadState] = useState<number>(readUnread);

  const refresh = useCallback(() => setUnreadState(readUnread()), []);

  useEffect(() => {
    const onChange = () => setUnreadState(readUnread());
    window.addEventListener(UNREAD_EVENT, onChange);
    return () => window.removeEventListener(UNREAD_EVENT, onChange);
  }, []);

  return { unread, refresh };
}
