import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  Menu, X, Heart,
  Home, Compass, Info, HelpCircle, MapPin,
  LogIn,
  LayoutDashboard, LogOut,
  Facebook, Twitter, Instagram, Mail,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Home", to: "/", icon: Home, exact: true },
  { label: "Explore", to: "/campaigns", icon: Compass, exact: false },
  {
    label: "UK Hub Activation", to: "/uk-hub-activation", icon: MapPin, exact: false,
    children: [
      { label: "Overview", to: "/uk-hub-activation" },
      { label: "Business Founding", to: "/uk-hub-activation/business" },
      { label: "Consumer Founding", to: "/uk-hub-activation/consumer" },
    ],
  },
  { label: "How It Works", to: "/how-it-works", icon: HelpCircle, exact: true },
  { label: "About", to: "/about", icon: Info, exact: true },
];

function isActive(currentPath: string, linkTo: string, exact: boolean): boolean {
  if (exact) return currentPath === linkTo;
  return currentPath === linkTo || currentPath.startsWith(linkTo + "/");
}

const FOOTER_LINKS = {
  discover: [
    { label: "Explore Campaigns", to: "/campaigns" },
    { label: "Fund Campaigns", to: "/campaigns?mode=fund" },
    { label: "Donate Campaigns", to: "/campaigns?mode=donation" },
    { label: "How It Works", to: "/how-it-works" },
  ],
  fund: [
    { label: "Fund vs Donate", to: "/fund-vs-donate" },
    { label: "For Business Owners", to: "/about#business-owners" },
    { label: "For Local Residents", to: "/about#local-residents" },
    { label: "Start a Campaign", to: "/campaigns/create" },
  ],
  support: [
    { label: "Help Centre", to: "/#faq" },
    { label: "Contact Us", to: "/#community" },
    { label: "FundOrDonate", to: "/about" },
    { label: "MCOM Community", to: "/about#mcom-ecosystem" },
  ],
  company: [
    { label: "About FundOrDonate", to: "/about" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Fund vs Donate", to: "/fund-vs-donate" },
    { label: "Local Hubs", to: "/about#local-hubs" },
    { label: "UK Hub Activation", to: "/uk-hub-activation" },
  ],
};

export function PublicLayout({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  const dashboardLink = user?.role === "admin" ? "/admin" : user?.role === "fundraiser" ? "/fundraiser" : "/dashboard";

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
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {NAV_LINKS.map((link) => {
                const hasDropdown = "children" in link && link.children;
                if (hasDropdown) {
                  const children = link.children!;
                  const isHubActive = location.pathname === link.to || location.pathname.startsWith(link.to + "/") || children.some(c => location.pathname === c.to);
                  return (
                    <div key={link.to} className="relative"
                      onMouseEnter={() => setHubDropdownOpen(true)}
                      onMouseLeave={() => setHubDropdownOpen(false)}>
                      <Link
                        to={link.to}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isHubActive ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                        <svg className={`w-3 h-3 transition-transform ${hubDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </Link>
                      {hubDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-52 rounded-xl border bg-white py-1.5 shadow-lg z-50">
                          {children.map(child => (
                            <Link
                              key={child.to}
                              to={child.to}
                              className={`block px-4 py-2 text-sm font-medium transition-colors ${
                                location.pathname === child.to ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(location.pathname, link.to, link.exact) ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to={dashboardLink} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
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
                {NAV_LINKS.map((link) => {
                  const hasDropdown = "children" in link && link.children;
                  if (hasDropdown) {
                    const children = link.children!;
                    const isHubActive = location.pathname === link.to || location.pathname.startsWith(link.to + "/") || children.some(c => location.pathname === c.to);
                    return (
                      <div key={link.to}>
                        <Link
                          to={link.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            isHubActive ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <link.icon className="w-5 h-5" />
                          {link.label}
                        </Link>
                        <div className="ml-8 space-y-0.5">
                          {children.map(child => (
                            <Link
                              key={child.to}
                              to={child.to}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                location.pathname === child.to ? "text-primary-600 bg-primary-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive(location.pathname, link.to, link.exact) ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 my-6" />

              {isAuthenticated ? (
                <div className="space-y-1">
                  <Link
                    to={dashboardLink}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Fund<span className="text-primary-400">Or</span>Donate
                </span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Empowering local high streets through Fund or Donate. Fund what matters.
              </p>
            </div>

            {/* Link Columns */}
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {title === "discover" ? "Discover" : title === "fund" ? "Fund or Donate" : title === "support" ? "Support" : "Learn"}
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
