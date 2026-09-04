import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/api";

interface Props {
  campaignId: string;
  initialBookmarked?: boolean;
  initialCount?: number;
}

export function BookmarkButton({ campaignId, initialBookmarked = false, initialCount = 0 }: Props) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Check actual bookmark state on mount when user is logged in
  useEffect(() => {
    if (!user) return;
    api
      .get(`/campaigns/${campaignId}/bookmark/check`)
      .then((res) => {
        setBookmarked(res.data.data.bookmarked);
      })
      .catch(() => {
        // Ignore check errors — use initial state
      });
  }, [campaignId, user]);

  const toggle = useCallback(async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`/campaigns/${campaignId}/bookmark`);
        setBookmarked(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        await api.post(`/campaigns/${campaignId}/bookmark`);
        setBookmarked(true);
        setCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
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
