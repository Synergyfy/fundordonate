// =============================================================================
// Admin Navigation Configuration
// Master sidebar architecture for FundOrDonate Admin Dashboard.
// =============================================================================

import { ReactNode } from "react";
import {
  Calendar, Target, Wallet, Gift, MapPin, Users, BarChart3, Settings,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface AdminNavItem {
  label: string;
  path: string;
  icon: ReactNode;
  exact?: boolean;
  implemented?: boolean;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  icon: ReactNode;
  items: AdminNavItem[];
}

// =============================================================================
// Admin Navigation Definition
// =============================================================================

export function getAdminNavGroups(): AdminNavGroup[] {
  return [
    // ─── Seasons & Programmes ─────────────────────────────────────────────
    {
      id: "seasons",
      label: "Seasons & Programmes",
      icon: <Calendar className="w-[18px] h-[18px]" />,
      items: [
        { label: "All Seasons", path: "/admin/seasons", icon: <span className="text-xs">📋</span>, exact: true, implemented: true },
        { label: "Current Season", path: "/admin/seasons/current", icon: <span className="text-xs">🔄</span>, implemented: true },
        { label: "Season Review", path: "/admin/seasons/review", icon: <span className="text-xs">📊</span>, implemented: true },
        { label: "Membership", path: "/admin/membership", icon: <span className="text-xs">🎫</span>, implemented: true },
      ],
    },

    // ─── Campaigns ────────────────────────────────────────────────────────
    {
      id: "campaigns",
      label: "Campaigns",
      icon: <Target className="w-[18px] h-[18px]" />,
      items: [
        { label: "All Campaigns", path: "/admin/campaigns", icon: <span className="text-xs">🎯</span>, exact: true, implemented: true },
        { label: "Business Campaigns", path: "/admin/campaigns/business", icon: <span className="text-xs">🏢</span>, implemented: true },
        { label: "Consumer Campaigns", path: "/admin/campaigns/consumer", icon: <span className="text-xs">👥</span>, implemented: true },
        { label: "Pending Review", path: "/admin/campaigns/pending-review", icon: <span className="text-xs">⏳</span>, implemented: true },
        { label: "Campaign Templates", path: "/admin/campaigns/templates", icon: <span className="text-xs">📋</span>, implemented: true },
        { label: "Categories", path: "/admin/categories", icon: <span className="text-xs">📂</span>, implemented: true },
      ],
    },

    // ─── Funding ──────────────────────────────────────────────────────────
    {
      id: "funding",
      label: "Funding",
      icon: <Wallet className="w-[18px] h-[18px]" />,
      items: [
        { label: "Funds", path: "/admin/funding", icon: <span className="text-xs">🏦</span>, exact: true, implemented: true },
        { label: "Contributions", path: "/admin/funding/contributions", icon: <span className="text-xs">❤️</span>, implemented: true },
        { label: "Payments", path: "/admin/funding/payments", icon: <span className="text-xs">💳</span>, implemented: true },
        { label: "Withdrawals", path: "/admin/funding/withdrawals", icon: <span className="text-xs">💸</span>, implemented: true },
      ],
    },

    // ─── Rewards & Assets ─────────────────────────────────────────────────
    {
      id: "rewards",
      label: "Rewards & Assets",
      icon: <Gift className="w-[18px] h-[18px]" />,
      items: [
        { label: "Rewards", path: "/admin/rewards/library", icon: <span className="text-xs">🏆</span>, implemented: true },
        { label: "Reward Templates", path: "/admin/rewards/templates", icon: <span className="text-xs">🎁</span>, implemented: true },
        { label: "Asset Management", path: "/admin/rewards/assets", icon: <span className="text-xs">📦</span>, implemented: true },
        { label: "Reward Rules", path: "/admin/rewards/rules", icon: <span className="text-xs">⚙️</span>, implemented: true },
        { label: "Fulfilment", path: "/admin/rewards/fulfilment", icon: <span className="text-xs">🚚</span>, implemented: true },
      ],
    },

    // ─── UK Activation ────────────────────────────────────────────────────
    {
      id: "activation",
      label: "UK Activation",
      icon: <MapPin className="w-[18px] h-[18px]" />,
      items: [
        { label: "Activation Hub", path: "/admin/hub-locations", icon: <span className="text-xs">🇬🇧</span>, implemented: true },
        { label: "Activation Progress", path: "/admin/activation", icon: <span className="text-xs">📈</span>, implemented: true },
        { label: "Cities", path: "/admin/cities", icon: <span className="text-xs">🏙️</span>, implemented: true },
        { label: "Local Areas", path: "/admin/local-areas", icon: <span className="text-xs">🗺️</span>, implemented: true },
        { label: "High Streets", path: "/admin/high-streets", icon: <span className="text-xs">🏬</span>, implemented: true },
        { label: "Recommendations", path: "/admin/locations/recommendations", icon: <span className="text-xs">📣</span>, implemented: true },
      ],
    },

    // ─── Participants ─────────────────────────────────────────────────────
    {
      id: "participants",
      label: "Participants",
      icon: <Users className="w-[18px] h-[18px]" />,
      items: [
        { label: "Businesses", path: "/admin/businesses/directory", icon: <span className="text-xs">📒</span>, implemented: true },
        { label: "Consumers", path: "/admin/consumers/list", icon: <span className="text-xs">👤</span>, implemented: true },
        { label: "Founding Members", path: "/admin/founding-members", icon: <span className="text-xs">⭐</span>, implemented: true },
        { label: "Backers", path: "/admin/backers", icon: <span className="text-xs">🤝</span>, implemented: true },
        { label: "Donors", path: "/admin/donors", icon: <span className="text-xs">❤️</span>, implemented: true },
      ],
    },

    // ─── Reports ──────────────────────────────────────────────────────────
    {
      id: "reports",
      label: "Reports",
      icon: <BarChart3 className="w-[18px] h-[18px]" />,
      items: [
        { label: "Business Reports", path: "/admin/reports/business", icon: <span className="text-xs">🏢</span>, exact: true, implemented: true },
        { label: "Consumer Reports", path: "/admin/reports/consumer", icon: <span className="text-xs">👥</span>, implemented: true },
        { label: "Funding Reports", path: "/admin/reports/funding", icon: <span className="text-xs">💰</span>, implemented: true },
        { label: "Campaign Reports", path: "/admin/reports/campaigns", icon: <span className="text-xs">🎯</span>, implemented: true },
        { label: "Reward Reports", path: "/admin/reports/rewards", icon: <span className="text-xs">🎁</span>, implemented: true },
      ],
    },

    // ─── Settings & Integrations ──────────────────────────────────────────
    {
      id: "settings",
      label: "Settings & Integrations",
      icon: <Settings className="w-[18px] h-[18px]" />,
      items: [
        { label: "General Settings", path: "/admin/settings", icon: <span className="text-xs">⚙️</span>, exact: true, implemented: true },
        { label: "Payment Rules", path: "/admin/settings/payments", icon: <span className="text-xs">💳</span>, implemented: true },
        { label: "Integrations", path: "/admin/system/integrations", icon: <span className="text-xs">🔗</span>, implemented: false },
        { label: "Users & Roles", path: "/admin/system/users", icon: <span className="text-xs">👥</span>, implemented: false },
        { label: "Audit Logs", path: "/admin/system/audit-logs", icon: <span className="text-xs">📋</span>, implemented: false },
        { label: "System Health", path: "/admin/system/health", icon: <span className="text-xs">💓</span>, implemented: false },
      ],
    },
  ];
}

// =============================================================================
// Overview Item (Top-level, not a group)
// =============================================================================

export const ADMIN_OVERVIEW_ITEM: AdminNavItem = {
  label: "Dashboard",
  path: "/admin",
  icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  exact: true,
  implemented: true,
};
