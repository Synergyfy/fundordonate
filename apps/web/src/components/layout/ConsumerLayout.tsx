// =============================================================================
// Consumer Dashboard Layout
// Mobile-first layout with bottom navigation bar.
// Desktop: compact rail with the same five areas (no multi-item sidebar).
// Tabs: Home | Explore | Rewards | Activity | You
// =============================================================================

import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, Compass, Gift, Home, User } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { syncUnreadBadge } from "@/data/consumerNotificationsData";

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

  useEffect(() => {
    syncUnreadBadge();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop compact rail — same five areas as the bottom nav */}
      <aside className="hidden w-48 shrink-0 border-r border-gray-200 bg-white lg:block">
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
          <Outlet />
        </div>
      </main>

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
