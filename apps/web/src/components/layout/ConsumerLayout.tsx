// =============================================================================
// Consumer Dashboard Layout
// Mobile-first layout with bottom navigation bar.
// Desktop: compact rail with the same five areas (no multi-item sidebar).
// Tabs: Home | Explore | Rewards | Activity | You
// =============================================================================

import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, Compass, Gift, Home, LogOut, User } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { syncUnreadBadge } from "@/services/consumer";
import { TrialBanner } from "@/components/trial/TrialBanner";
import { useAuthStore } from "@/stores/auth.store";

const NAV_ITEMS = [
  { to: "/consumer", label: "Home", icon: Home, end: true },
  { to: "/consumer/explore", label: "Explore", icon: Compass, end: false },
  { to: "/consumer/rewards", label: "Rewards", icon: Gift, end: false },
  { to: "/consumer/activity", label: "Activity", icon: Activity, end: false },
  { to: "/consumer/you", label: "You", icon: User, end: false },
];

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function ConsumerLayout() {
  const location = useLocation();
  const { unread } = useUnreadNotifications();
  const { user, logout } = useAuthStore();
  const displayName =
    user?.firstName || user?.username?.split("@")[0] || user?.email?.split("@")[0] || "Account";
  const initial = (
    user?.firstName?.[0] ||
    user?.username?.[0] ||
    user?.email?.[0] ||
    "C"
  ).toUpperCase();

  useEffect(() => {
    syncUnreadBadge();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/consumer" className="text-lg font-bold text-primary-600 hover:text-primary-700">
              FundorDonate
            </Link>
            <span className="hidden sm:inline-block rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              Consumer Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {initial}
              </div>
              <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
                {displayName}
              </span>
            </div>

            <button
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop compact rail — same five areas as the bottom nav */}
        <aside className="hidden w-48 shrink-0 border-r border-gray-200 bg-white lg:block sticky top-16 h-[calc(100vh-4rem)] self-start overflow-y-auto">
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <span className="relative">
                    <Icon className="h-4 w-4" />
                    {item.label === "You" && <UnreadBadge count={unread} />}
                  </span>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 pb-24 lg:pb-6">
          <div className="p-4 lg:p-6">
            <TrialBanner />
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex min-w-[56px] flex-col items-center gap-0.5 px-1 py-2"
              >
                <span className="relative">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-primary-600" : "text-gray-400"
                    }`}
                  />
                  {item.label === "You" && <UnreadBadge count={unread} />}
                </span>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary-600" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
