// =============================================================================
// Business Owner Dashboard Layout
// Mobile-first layout with bottom navigation bar.
// Desktop: sidebar navigation
// Mobile: bottom tab bar (Home, Centre, Campaigns, Rewards, More).
//   "More" opens a bottom popup with the remaining sidebar pages.
// =============================================================================

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home, Target, TrendingUp, BarChart3, Award, Settings, Store, LayoutGrid,
  Ellipsis, X,
} from "lucide-react";

const BOTTOM_NAV = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/dashboard/campaign-centre", label: "Centre", icon: LayoutGrid },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Target },
  { to: "/dashboard/rewards", label: "Rewards", icon: Award },
];

const SIDEBAR_NAV = [
  { to: "/dashboard", label: "Overview", icon: Home, end: true },
  { to: "/dashboard/campaign-centre", label: "Campaign Centre", icon: LayoutGrid },
  { to: "/dashboard/campaigns", label: "My Campaigns", icon: Target },
  { to: "/dashboard/contributions", label: "Contributions", icon: TrendingUp },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { to: "/dashboard/rewards", label: "Rewards", icon: Award },
  { to: "/dashboard/my-business", label: "My Business", icon: Store },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Sidebar pages that are NOT already a bottom tab → surfaced via "More".
const MORE_NAV = SIDEBAR_NAV.filter(
  (item) => !BOTTOM_NAV.some((tab) => tab.to === item.to)
);

export function BusinessOwnerLayout() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the popup whenever the route changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const moreActive = MORE_NAV.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-white hidden lg:block shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-bold text-gray-900">Business Dashboard</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {SIDEBAR_NAV.map((item) => {
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
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-6 bg-gray-50 overflow-auto">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile "More" popup — remaining pages from the side menu */}
      {moreOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-gray-900/40"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="More pages"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-gray-200 bg-white p-4 pb-6 shadow-2xl safe-area-bottom"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close more menu"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary-200 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-primary-600" : "text-gray-400"}`}
                    />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px]"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-primary-600" : "text-gray-400"
                  }`}
                />
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
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px]"
          >
            <Ellipsis
              className={`h-5 w-5 transition-colors ${
                moreOpen || moreActive ? "text-primary-600" : "text-gray-400"
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${
                moreOpen || moreActive ? "text-primary-600" : "text-gray-400"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
