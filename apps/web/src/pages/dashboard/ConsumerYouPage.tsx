import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  ChevronRight,
  Crown,
  Gift,
  HelpCircle,
  LogOut,
  Medal,
  Settings,
  User,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { seasonApi, type Season } from "@/services/season.service";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { NATIONAL_HUB } from "@/data/ukHubData";

interface MenuEntry {
  label: string;
  icon: typeof User;
  to?: string;
  danger?: boolean;
  badge?: boolean;
  action?: "signout";
}

const MENU: MenuEntry[] = [
  { label: "Profile", icon: User, to: "/consumer/you/profile" },
  { label: "Membership", icon: Crown, to: "/consumer/you/membership" },
  { label: "Founding Member", icon: Award, to: "/consumer/you/founding-member" },
  { label: "Rewards", icon: Gift, to: "/consumer/rewards" },
  { label: "Recognition", icon: Medal, to: "/consumer/you/recognition" },
  { label: "Notifications", icon: Bell, to: "/consumer/you/notifications", badge: true },
  { label: "Settings", icon: Settings, to: "/consumer/you/settings" },
  { label: "Help & Support", icon: HelpCircle, to: "/consumer/you/help" },
  { label: "Sign Out", icon: LogOut, danger: true, action: "signout" },
];

export function ConsumerYouPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { unread } = useUnreadNotifications();
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    seasonApi
      .getCurrent()
      .then((s) => {
        if (!cancelled) setSeason(s);
      })
      .catch(() => {
        /* header shows without season */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await useAuthStore.getState().logout();
      navigate("/");
    } catch {
      navigate("/");
    } finally {
      setSigningOut(false);
      setConfirmSignOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const displayName =
    user?.firstName || user?.username?.split("@")[0] || "there";
  const initials = (user?.firstName?.[0] ?? user?.username?.[0] ?? "U").toUpperCase();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-gray-900">{displayName}</p>
            <span className="mt-0.5 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              Consumer
            </span>
          </div>
        </div>
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">Current Season</span>
            <span className="font-semibold text-gray-900">
              {season?.name ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">UK Hub</span>
            <span className="font-semibold text-gray-900">{NATIONAL_HUB.name}</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {MENU.map((entry, i) => {
          const Icon = entry.icon;
          const content = (
            <>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  entry.danger
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={`flex-1 text-sm font-medium ${
                  entry.danger ? "text-red-600" : "text-gray-800"
                }`}
              >
                {entry.label}
              </span>
              {entry.badge && unread > 0 && (
                <span className="mr-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {!entry.danger && <ChevronRight className="h-4 w-4 text-gray-300" />}
            </>
          );

          const className = `flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
            i > 0 ? "border-t border-gray-50" : ""
          } ${entry.danger ? "hover:bg-red-50" : "hover:bg-gray-50"}`;

          if (entry.to) {
            return (
              <Link key={entry.label} to={entry.to} className={className}>
                {content}
              </Link>
            );
          }
          return (
            <button
              key={entry.label}
              type="button"
              onClick={() => setConfirmSignOut(true)}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* Sign-out confirm */}
      {confirmSignOut && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmSignOut(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">Sign out?</h2>
            <p className="mt-1 text-sm text-gray-500">
              You will need to sign in again to access your dashboard.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSignOut(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
