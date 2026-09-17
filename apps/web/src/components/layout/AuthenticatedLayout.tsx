// =============================================================================
// Authenticated Layout
// Unified layout for all authenticated roles (admin, fundraiser, consumer).
// Admin sidebar is collapsible on desktop with accordion navigation.
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  Menu, Heart, LogOut, ChevronRight, X, ChevronLeft,
  User, Settings, LogOut as LogOutIcon,
} from "lucide-react";
import { getAdminNavGroups, ADMIN_OVERVIEW_ITEM, type AdminNavGroup } from "@/components/admin/adminNavConfig.tsx";
import { GlobalSeasonSelector } from "@/components/admin/GlobalSeasonSelector";

// =============================================================================
// Non-admin Navigation
// =============================================================================

import { LayoutDashboard, Compass } from "lucide-react";

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
  if (userType === "business" && role === "fundraiser") {
    return [{ items: [
      { label: "Overview", path: "/fundraiser", icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
      { label: "My Campaigns", path: "/fundraiser/campaigns", icon: <span className="text-base">🎯</span> },
      { label: "Earnings", path: "/fundraiser/earnings", icon: <span className="text-base">💰</span> },
      { label: "Withdrawals", path: "/fundraiser/withdrawals", icon: <span className="text-base">🏦</span> },
    ]}];
  }

  return [{ items: [
    { label: "Overview", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
    { label: "Donations", path: "/dashboard/donations", icon: <span className="text-base">💰</span> },
    { label: "Pledges", path: "/dashboard/pledges", icon: <span className="text-base">🤝</span> },
    { label: "Bookmarks", path: "/dashboard/bookmarks", icon: <span className="text-base">🔖</span> },
    { label: "Receipts", path: "/dashboard/receipts", icon: <span className="text-base">🧾</span> },
    { label: "Contributor Status", path: "/profile/contributor", icon: <span className="text-base">⭐</span> },
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
// Admin Sidebar Group (Accordion)
// =============================================================================

function AdminSidebarGroup({
  group,
  pathname,
  expandedGroupId,
  toggleGroup,
  onNavigate,
  collapsed,
}: {
  group: AdminNavGroup;
  pathname: string;
  expandedGroupId: string | null;
  toggleGroup: (id: string) => void;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const isExpanded = expandedGroupId === group.id;
  const hasActiveChild = group.items.some(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  );

  if (collapsed) {
    // Collapsed mode: tooltip-style, no sub-items
    return (
      <Link
        to={group.items[0]?.path || "#"}
        onClick={onNavigate}
        className={`flex items-center justify-center rounded-lg px-2 py-2 mb-0.5 transition-colors ${
          hasActiveChild
            ? "bg-primary-50 text-primary-700"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
        title={group.label}
        aria-label={group.label}
      >
        <span className={hasActiveChild ? "text-primary-500" : "text-gray-400"}>
          {group.icon}
        </span>
      </Link>
    );
  }

  return (
    <div className="mb-0.5">
      <button
        onClick={() => toggleGroup(group.id)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
          hasActiveChild && isExpanded
            ? "bg-primary-50 text-primary-700"
            : hasActiveChild
            ? "text-primary-600"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        aria-expanded={isExpanded}
        aria-haspopup="true"
      >
        <span className={`flex-shrink-0 ${hasActiveChild ? "text-primary-500" : "text-gray-400"}`}>
          {group.icon}
        </span>
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform duration-150 ${
            isExpanded ? "rotate-90" : ""
          } ${hasActiveChild ? "text-primary-400" : "text-gray-300"}`}
        />
      </button>

      {isExpanded && (
        <div className="ml-4 mt-0.5 border-l border-gray-100 pl-3 pb-1" role="menu">
          {group.items.map((item) => {
            const isActive =
              pathname === item.path ||
              (!item.exact && pathname.startsWith(item.path + "/"));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                  isActive
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                role="menuitem"
              >
                <span className={`${isActive ? "text-primary-500" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Admin Avatar Dropdown
// =============================================================================

function AdminAvatarDropdown({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const initials = user?.firstName?.[0] || user?.username?.[0] || "U";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{fullName}</span>
        <ChevronRight className={`hidden sm:block h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Link
              to="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4 text-gray-400" />
              Profile
            </Link>
            <Link
              to="/admin/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              Settings
            </Link>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const userType = user?.userType || "consumer";
  const role = user?.role || "donor";
  const isAdmin = userType === "admin";
  const navGroups = isAdmin ? [] : getNavGroups(userType, role);
  const badge = getBadgeLabel(userType, role);
  const basePath = getBasePath(userType, role);
  const adminGroups = useMemo(() => (isAdmin ? getAdminNavGroups() : []), [isAdmin]);

  // Auto-expand the group containing the active route
  useEffect(() => {
    if (!isAdmin) return;
    const path = location.pathname;
    for (const group of adminGroups) {
      const hasActive = group.items.some(
        (item) => path === item.path || path.startsWith(item.path + "/")
      );
      if (hasActive) {
        setExpandedGroupId(group.id);
        return;
      }
    }
    if (path === "/admin") setExpandedGroupId(null);
  }, [location.pathname]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Escape key closes mobile sidebar
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [sidebarOpen, handleEscape]);

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Accordion: only one group open at a time
  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleNavigate = () => setSidebarOpen(false);

  const sidebarWidth = collapsed ? "w-[68px]" : "w-64";

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transform transition-all duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarWidth}`}
        role="navigation"
        aria-label={isAdmin ? "Admin navigation" : "Dashboard navigation"}
      >
        {/* Sidebar header */}
        <div className={`flex h-14 items-center border-b border-gray-200 flex-shrink-0 ${collapsed ? "justify-center px-2" : "px-4"}`}>
          {!collapsed && (
            <Link to={basePath} className="flex items-center gap-2 flex-1 min-w-0" onClick={handleNavigate}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-primary-600 leading-tight truncate">FundorDonate</span>
                {isAdmin && (
                  <span className="text-[10px] font-medium text-gray-400 leading-tight">Admin Dashboard</span>
                )}
              </div>
            </Link>
          )}
          {collapsed && (
            <Link to={basePath} onClick={handleNavigate} title="FundorDonate Admin">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
            </Link>
          )}
          {/* Close button (mobile) / Collapse button (desktop) */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className={`text-gray-400 hover:text-gray-600 transition-colors ${collapsed ? "mt-2" : "ml-2"}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4 lg:block hidden" />}
            <X className="h-5 w-5 lg:hidden" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {isAdmin ? (
            <>
              {/* Overview — top-level item */}
              <div className="mb-1">
                {(() => {
                  const item = ADMIN_OVERVIEW_ITEM;
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

                  if (collapsed) {
                    return (
                      <Link
                        to={item.path}
                        onClick={handleNavigate}
                        className={`flex items-center justify-center rounded-lg px-2 py-2 mb-0.5 transition-colors ${
                          isActive ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        title={item.label}
                        aria-label={item.label}
                      >
                        <span className={isActive ? "text-primary-500" : "text-gray-400"}>
                          {item.icon}
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      to={item.path}
                      onClick={handleNavigate}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className={isActive ? "text-primary-500" : "text-gray-400"}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })()}
              </div>

              {/* Divider */}
              <div className={`my-2 border-t border-gray-100 ${collapsed ? "mx-1" : ""}`} />

              {/* Expandable groups (accordion) */}
              {adminGroups.map((group) => (
                <AdminSidebarGroup
                  key={group.id}
                  group={group}
                  pathname={location.pathname}
                  expandedGroupId={expandedGroupId}
                  toggleGroup={toggleGroup}
                  onNavigate={handleNavigate}
                  collapsed={collapsed}
                />
              ))}
            </>
          ) : (
            /* Non-admin navigation */
            navGroups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? "mt-3" : ""}>
                {group.heading && !collapsed && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {group.heading}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

                  if (collapsed) {
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleNavigate}
                        className={`flex items-center justify-center rounded-lg px-2 py-2 mb-0.5 transition-colors ${
                          isActive ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        title={item.label}
                      >
                        {item.icon}
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavigate}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        {/* Sidebar footer — Admin profile/account */}
        {!collapsed && (
          <div className="border-t border-gray-200 p-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 flex-shrink-0">
                {user?.firstName?.[0] || user?.username?.[0] || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username}
                </p>
                <p className="text-xs text-gray-400 truncate">{badge.text}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="border-t border-gray-200 p-2 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className={`transition-all duration-200 ease-in-out lg:pl-64 ${collapsed ? "lg:pl-[68px]" : ""}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {isAdmin && (
            <div className="hidden sm:block">
              <GlobalSeasonSelector />
            </div>
          )}
          <div className="flex-1" />
          {isAdmin ? (
            <AdminAvatarDropdown user={user} onLogout={handleLogout} />
          ) : (
            <>
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
            </>
          )}
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
