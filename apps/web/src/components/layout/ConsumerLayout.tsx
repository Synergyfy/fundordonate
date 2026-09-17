// =============================================================================
// Consumer Dashboard Layout
// Mobile-first layout with bottom navigation bar.
// Desktop: sidebar navigation
// Mobile: bottom tab bar with icons
// =============================================================================

import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home, Heart, Receipt, User,
  LayoutDashboard, Target, BookOpen, FileText,
} from "lucide-react";

const BOTTOM_NAV = [
  { to: "/consumer", label: "Home", icon: Home, end: true },
  { to: "/consumer/donations", label: "Donations", icon: Heart },
  { to: "/consumer/receipts", label: "Receipts", icon: Receipt },
  { to: "/consumer/profile", label: "Profile", icon: User },
];

const SIDEBAR_NAV = [
  { to: "/consumer", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/consumer/donations", label: "My Donations", icon: Heart },
  { to: "/consumer/pledges", label: "My Pledges", icon: Target },
  { to: "/consumer/bookmarks", label: "Bookmarks", icon: BookOpen },
  { to: "/consumer/receipts", label: "Receipts", icon: FileText },
  { to: "/consumer/profile", label: "Profile", icon: User },
];

export function ConsumerLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-white hidden lg:block shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-bold text-gray-900">Consumer Dashboard</span>
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
        </div>
      </nav>
    </div>
  );
}
