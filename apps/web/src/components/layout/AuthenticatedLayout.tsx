import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  Menu, Heart, LogOut,
  LayoutDashboard, Compass,
  MapPin, Award, LayoutGrid, BarChart3, Users as UsersIcon, Shield,
} from "lucide-react";

// =============================================================================
// Navigation Configuration
// =============================================================================

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

function getNavGroups(userType: string, role: string): NavGroup[] {
  if (userType === "admin") {
    return [
      { items: [
        { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      ]},
      { heading: "Commerce", items: [
        { label: "Campaigns", path: "/admin/campaigns", icon: <span className="text-base">🎯</span> },
        { label: "Donations", path: "/admin/donations", icon: <span className="text-base">💰</span> },
        { label: "Pledges", path: "/admin/pledges", icon: <span className="text-base">🤝</span> },
      ]},
      { heading: "People", items: [
        { label: "Users", path: "/admin/users", icon: <UsersIcon className="w-5 h-5" /> },
        { label: "Backers", path: "/admin/backers", icon: <Shield className="w-5 h-5" /> },
        { label: "Businesses", path: "/admin/businesses", icon: <span className="text-base">🏢</span> },
        { label: "Consumers", path: "/admin/consumers", icon: <span className="text-base">👤</span> },
      ]},
      { heading: "Content", items: [
        { label: "Categories", path: "/admin/categories", icon: <span className="text-base">📂</span> },
        { label: "Hub Content", path: "/admin/hub-content", icon: <LayoutGrid className="w-5 h-5" /> },
        { label: "Events", path: "/admin/events", icon: <span className="text-base">📅</span> },
      ]},
      { heading: "UK Hub", items: [
        { label: "Hub Locations", path: "/admin/hub-locations", icon: <MapPin className="w-5 h-5" /> },
        { label: "City Activation", path: "/admin/activation", icon: <span className="text-base">🏙️</span> },
        { label: "UK Map", path: "/admin/map", icon: <span className="text-base">🗺️</span> },
        { label: "Founding Programmes", path: "/admin/founding", icon: <Award className="w-5 h-5" /> },
      ]},
      { heading: "System", items: [
        { label: "Reports", path: "/admin/reports", icon: <BarChart3 className="w-5 h-5" /> },
        { label: "Settings", path: "/admin/settings", icon: <span className="text-base">⚙️</span> },
      ]},
    ];
  }

  if (userType === "business" && role === "fundraiser") {
    return [{ items: [
      { label: "Overview", path: "/fundraiser", icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      { label: "My Campaigns", path: "/fundraiser/campaigns", icon: <span className="text-base">🎯</span> },
      { label: "Earnings", path: "/fundraiser/earnings", icon: <span className="text-base">💰</span> },
      { label: "Withdrawals", path: "/fundraiser/withdrawals", icon: <span className="text-base">🏦</span> },
    ]}];
  }

  // Consumer / default
  return [{ items: [
    { label: "Overview", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
    { label: "Donations", path: "/dashboard/donations", icon: <span className="text-base">💰</span> },
    { label: "Pledges", path: "/dashboard/pledges", icon: <span className="text-base">🤝</span> },
    { label: "Bookmarks", path: "/dashboard/bookmarks", icon: <span className="text-base">🔖</span> },
    { label: "Receipts", path: "/dashboard/receipts", icon: <span className="text-base">🧾</span> },
    { label: "Profile", path: "/dashboard/profile", icon: <span className="text-base">👤</span> },
  ]}];
}

function getBadgeLabel(userType: string, role: string): { text: string; color: string } {
  if (userType === "admin") return { text: "Admin", color: "bg-purple-100 text-purple-700" };
  if (userType === "business" && role === "fundraiser") return { text: "Fundraiser", color: "bg-blue-100 text-blue-700" };
  if (role === "collaborator") return { text: "Collaborator", color: "bg-teal-100 text-teal-700" };
  if (role === "backer") return { text: "Backer", color: "bg-green-100 text-green-700" };
  return { text: "Donor", color: "bg-gray-100 text-gray-700" };
}

function getBasePath(userType: string, role: string): string {
  if (userType === "admin") return "/admin";
  if (userType === "business" && role === "fundraiser") return "/fundraiser";
  return "/dashboard";
}

// =============================================================================
// Component
// =============================================================================

export function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const userType = user?.userType || "consumer";
  const role = user?.role || "donor";
  const navGroups = getNavGroups(userType, role);
  const badge = getBadgeLabel(userType, role);
  const basePath = getBasePath(userType, role);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [sidebarOpen, handleEscape]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const initials = user?.firstName?.[0] || user?.username?.[0] || "U";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <Link to={basePath} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-primary-600">FundorDonate</span>
          </Link>
          <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-2.5 pb-16" role="navigation" aria-label="Dashboard navigation">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {group.heading && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {group.heading}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer — user info + logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link
            to="/campaigns"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Compass className="h-4 w-4" />
            Browse Campaigns
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            View Site
          </Link>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
