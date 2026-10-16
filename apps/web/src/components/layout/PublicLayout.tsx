import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuthStore, type User } from "@/stores/auth.store";
import {
  Menu, X, Heart,
  Home, Info, Mail, MapPin, Target, ChevronDown,
  LogIn,
  LayoutDashboard, LogOut,
  User as UserIcon, Settings, Building2, Activity,
  Facebook, Twitter, Instagram,
} from "lucide-react";

const NAV_LINKS: {
  label: string;
  to: string;
  icon: typeof Home;
  exact: boolean;
  children?: { label: string; to: string }[];
}[] = [
  { label: "Home", to: "/", icon: Home, exact: true },
  { label: "UK Hubs", to: "/uk-hub-activation", icon: MapPin, exact: false },
  {
    label: "Campaigns",
    to: "/campaigns",
    icon: Target,
    exact: false,
    children: [
      { label: "For Businesses", to: "/campaigns/business" },
      { label: "For Consumers", to: "/campaigns/consumer" },
    ],
  },
  { label: "About", to: "/about", icon: Info, exact: false },
  { label: "Contact", to: "/contact", icon: Mail, exact: false },
];

function isActive(currentPath: string, linkTo: string, exact: boolean): boolean {
  if (exact) return currentPath === linkTo;
  return currentPath === linkTo || currentPath.startsWith(linkTo + "/");
}

/** Dropdown child active state — exact path + query match (e.g. ?mode=fund). */
function isChildActive(pathname: string, search: string, to: string): boolean {
  const qIndex = to.indexOf("?");
  const childPath = qIndex === -1 ? to : to.slice(0, qIndex);
  const childQuery = qIndex === -1 ? "" : to.slice(qIndex);
  return pathname === childPath && search === childQuery;
}

/** Resolves the authenticated home ("dashboard") route for a given user. */
function resolveDashboardLink(user: User | null): string {
  if (!user) return "/";
  if (user.userType === "admin" || user.role === "admin") return "/admin";
  if (user.userType === "business" || user.role === "business" || user.role === "fundraiser") return "/dashboard";
  return "/consumer";
}

function getUserDisplayName(user: User | null): string {
  if (!user) return "Account";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.username || user.email || "Account";
}

function getUserInitials(user: User | null): string {
  if (!user) return "U";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (user.username || user.email || "U").charAt(0).toUpperCase();
}

interface UserMenuLink {
  label: string;
  to: string;
  icon: React.ReactNode;
}

/** Secondary dashboard pages shown in the account dropdown, per role. */
function getUserMenuLinks(user: User | null): UserMenuLink[] {
  if (!user) return [];
  if (user.userType === "admin" || user.role === "admin") {
    return [
      { label: "Admin Settings", to: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
    ];
  }
  if (user.userType === "business" || user.role === "business" || user.role === "fundraiser") {
    return [
      { label: "My Business", to: "/dashboard/my-business", icon: <Building2 className="h-4 w-4" /> },
      { label: "Settings", to: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
    ];
  }
  return [
    { label: "My Activity", to: "/consumer/activity", icon: <Activity className="h-4 w-4" /> },
    { label: "Profile", to: "/consumer/you/profile", icon: <UserIcon className="h-4 w-4" /> },
    { label: "Settings", to: "/consumer/you/settings", icon: <Settings className="h-4 w-4" /> },
  ];
}

/** Primary label for the account's dashboard entry point. */
function getDashboardLabel(user: User | null): string {
  if (!user) return "Dashboard";
  if (user.userType === "admin" || user.role === "admin") return "Dashboard";
  if (user.userType === "business" || user.role === "business" || user.role === "fundraiser") return "Dashboard";
  return "Home";
}

/** Avatar + name trigger with an account dropdown (name, email, dashboard pages, sign out). */
function UserMenu({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const name = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const dashboardLink = resolveDashboardLink(user);
  const menuLinks = getUserMenuLinks(user);

  const avatar = user?.avatar ? (
    <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
  ) : (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-xs font-semibold text-white">
      {initials}
    </span>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-2.5 hover:bg-gray-50 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {avatar}
        <span className="hidden xl:block max-w-[120px] truncate text-sm font-medium text-gray-700">{name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3">
              {avatar}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="py-1">
              <Link
                to={dashboardLink}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LayoutDashboard className="h-4 w-4 text-gray-400" />
                {getDashboardLabel(user)}
              </Link>
              {menuLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-gray-400">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onLogout(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const FOOTER_LINKS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "National Funding", to: "/funding" },
      { label: "Seasonal Funding", to: "/seasonal-funding" },
      { label: "Donate", to: "/donate" },
      { label: "UK Hub Activation", to: "/uk-hub-activation" },
      { label: "Campaigns", to: "/campaigns" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "How It Works", to: "/how-it-works" },
      { label: "Start a Campaign", to: "/campaigns/create" },
    ],
  },
  {
    title: "Support & Legal",
    links: [
      { label: "FAQ", to: "/about#faq" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Fund vs Donate", to: "/fund-vs-donate" },
    ],
  },
];

export function PublicLayout({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { user, authStatus, logout } = useAuthStore();
  const isAuthenticated = authStatus === "authenticated" && !!user;
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileOpen, handleEscape]);

  const handleLogout = useCallback(() => { void logout(); }, [logout]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip to content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to main content
      </a>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white border-b border-transparent"
        }`}
        role="banner"
      >
        <div className="container-page">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="FundOrDonate Home">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
                Fund<span className="text-primary-600">Or</span>Donate
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Main navigation">
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <div key={link.to} className="relative">
                    {openMenu === link.label && (
                      <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setOpenMenu(null)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenMenu(openMenu === link.label ? null : link.label)}
                      aria-haspopup="menu"
                      aria-expanded={openMenu === link.label}
                      className={`flex items-center gap-1 px-2.5 xl:px-3 py-2 rounded-lg text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive(location.pathname, link.to, link.exact)
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${openMenu === link.label ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    {openMenu === link.label && (
                      <div
                        role="menu"
                        className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            role="menuitem"
                            onClick={() => setOpenMenu(null)}
                            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isChildActive(location.pathname, location.search, child.to)
                                ? "bg-primary-50 text-primary-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-2.5 xl:px-3 py-2 rounded-lg text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive(location.pathname, link.to, link.exact) ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <UserMenu user={user} onLogout={handleLogout} />
              ) : (
                <>
                  <Link to="/auth/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link to="/auth/register" className="btn-primary !py-2 !px-5 text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav id="mobile-nav-panel" className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" fill="white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">FundOrDonate</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <div key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive(location.pathname, link.to, link.exact)
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                      {link.children && (
                        <ChevronDown className="ml-auto h-4 w-4 text-gray-400" aria-hidden="true" />
                      )}
                    </Link>
                    {link.children && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-gray-100 pl-3">
                        {link.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isChildActive(location.pathname, location.search, child.to)
                                ? "bg-primary-50 text-primary-700"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 my-6" />

              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-semibold text-white">
                        {getUserInitials(user)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{getUserDisplayName(user)}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to={resolveDashboardLink(user)}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    {getDashboardLabel(user)}
                  </Link>
                  {getUserMenuLinks(user).map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <span className="text-gray-400 [&>svg]:h-5 [&>svg]:w-5">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full justify-center">
                    Sign In
                  </Link>
                  <Link to="/auth/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300" role="contentinfo">
        <div className="container-page py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Fund<span className="text-primary-400">Or</span>Donate
                </span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Funding, campaigns and donation opportunities for communities across the UK.
              </p>
            </div>

            {/* Link Columns */}
            {FOOTER_LINKS.map(({ title, links }) => (
              <div key={title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {title}
                </h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} FundOrDonate. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="mailto:hello@fundordonate.com" className="text-gray-500 hover:text-white transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
