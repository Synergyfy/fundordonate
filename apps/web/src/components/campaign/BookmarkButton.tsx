import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/services/api";

interface Props {
  campaignId: string;
  initialBookmarked?: boolean;
  initialCount?: number;
}

const BOOKMARKS_KEY = "fod:bookmarks";

/**
 * Bookmarks are persisted on this device. The API has no bookmark endpoint
 * yet, so it is treated as an optional sync target: local state is always the
 * source of truth and the request is best-effort.
 */
function readBookmarks(): Set<string> {
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeBookmarks(ids: Set<string>): void {
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable */
  }
}

export function BookmarkButton({ campaignId, initialBookmarked, initialCount = 0 }: Props) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(
    () => initialBookmarked ?? readBookmarks().has(campaignId),
  );
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialBookmarked !== undefined) {
      setBookmarked(initialBookmarked);
    }
  }, [initialBookmarked]);

  // Check actual bookmark state on mount only when user is logged in and initialBookmarked was not provided
  useEffect(() => {
    if (!user || initialBookmarked !== undefined) return;
    setBookmarked(readBookmarks().has(campaignId));
    api
      .get<{ bookmarked: boolean }>(`/campaigns/${campaignId}/bookmark/check`)
      .then((res) => {
        if (typeof res?.bookmarked === "boolean") setBookmarked(res.bookmarked);
      })
      .catch(() => {
        // No bookmark endpoint — keep the local state.
      });
  }, [campaignId, user, initialBookmarked]);

  const toggle = useCallback(async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (loading) return;

    setLoading(true);
    const next = !bookmarked;
    const ids = readBookmarks();
    if (next) ids.add(campaignId);
    else ids.delete(campaignId);
    writeBookmarks(ids);

    setBookmarked(next);
    setCount((c) => Math.max(0, next ? c + 1 : c - 1));

    try {
      if (next) await api.post(`/campaigns/${campaignId}/bookmark`);
      else await api.delete(`/campaigns/${campaignId}/bookmark`);
    } catch {
      // Saved locally for this device — nothing else to do.
    } finally {
      setLoading(false);
    }
  }, [campaignId, user, bookmarked, loading, navigate]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark campaign"}
      title={bookmarked ? "Remove bookmark" : "Bookmark campaign"}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        bookmarked
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {bookmarked ? (
        <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.766.424L12 18.03l-7.234 4.536A.5.5 0 014 22.143V3a1 1 0 011-1z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
      {bookmarked ? "Saved" : "Save"}
      {count > 0 && <span className="text-xs text-gray-500" aria-hidden="true">({count})</span>}
    </button>
  );
}
