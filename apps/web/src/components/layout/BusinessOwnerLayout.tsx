// =============================================================================
// Business Owner Dashboard Layout
// Mobile-first layout with bottom navigation bar.
// Desktop: sidebar navigation
// Mobile: bottom tab bar (Home, Centre, Campaigns, Rewards, More).
//   "More" opens a bottom popup with the remaining sidebar pages.
// =============================================================================

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { useBusinessProfile } from "@/services/business/hook";
import {
  Home, Target, TrendingUp, BarChart3, Award, Settings, Store, LayoutGrid,
  Ellipsis, X, LogOut, Heart, CreditCard,
} from "lucide-react";
import { TrialBanner } from "@/components/trial/TrialBanner";
import { useAuthStore } from "@/stores/auth.store";
import { WalletBalanceBadge } from "@/components/wallet/WalletBalanceBadge";

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
  { to: "/dashboard/my-contributions", label: "My Contributions", icon: Heart },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { to: "/dashboard/plan", label: "Plan & Access", icon: CreditCard },
  { to: "/dashboard/rewards", label: "Rewards", icon: Award },
  { to: "/dashboard/my-business", label: "My Business", icon: Store },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/plans", label: "Plans & Access", icon: CreditCard },
];

// Sidebar pages that are NOT already a bottom tab → surfaced via "More".
const MORE_NAV = SIDEBAR_NAV.filter(
  (item) => !BOTTOM_NAV.some((tab) => tab.to === item.to)
);

export function BusinessOwnerLayout() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { data: profile, error: profileError } = useBusinessProfile();
  const profileStatus = (profileError as any)?.response?.status ?? (profileError as any)?.status;
  const isMissingProfile = profileStatus === 404;

  // Close the popup whenever the route changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const moreActive = MORE_NAV.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-bold text-primary-600 hover:text-primary-700">
              FundorDonate
            </Link>
            <span className="hidden sm:inline-block rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              Business Portal
            </span>
            {profile?.name && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                <Store className="h-3 w-3 text-gray-500" />
                {profile.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <WalletBalanceBadge />

            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "B"}
              </div>
              <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
                {user?.firstName || user?.email?.split("@")[0] || "Account"}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r bg-white hidden lg:flex lg:flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] self-start z-20">
        <div className="flex-1 overflow-y-auto">
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
        </div>

        {/* User profile & Logout footer */}
        <div className="border-t border-gray-200 p-3 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "B"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Business Owner"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Log out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-6 bg-gray-50 overflow-auto">
        <div className="p-4 lg:p-6">
          {location.pathname !== "/dashboard/plan" && <TrialBanner />}
          {isMissingProfile && (
            <div className="mb-6 rounded-2xl border-2 border-primary-500 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Business Profile Incomplete
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Please finish your business onboarding to create campaigns, view settings, and unlock full dashboard features.
                    </p>
                  </div>
                </div>
                <Link
                  to="/dashboard/onboarding"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                >
                  Complete Onboarding →
                </Link>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>
      </div>

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

            {/* Mobile User & Logout footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Business Owner"}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </button>
            </div>
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
