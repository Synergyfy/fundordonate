// =============================================================================
// Admin Navigation Configuration
// Master sidebar architecture for FundOrDonate Admin Dashboard.
// =============================================================================

import { ReactNode } from "react";
import {
  Calendar, MapPin, Target, Building2, Users, Store,
  Trophy, Wallet, MessageSquare, BarChart3, Settings,
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
    // ─── 2. Seasons & Programmes ──────────────────────────────────────────
    {
      id: "seasons",
      label: "Seasons & Programmes",
      icon: <Calendar className="w-[18px] h-[18px]" />,
      items: [
        { label: "All Seasons", path: "/admin/seasons", icon: <span className="text-xs">📋</span>, implemented: true },
        { label: "Current Season", path: "/admin/seasons/current", icon: <span className="text-xs">🔄</span>, implemented: true },
        { label: "Season Review", path: "/admin/seasons/review", icon: <span className="text-xs">📊</span>, implemented: true },
      ],
    },

    // ─── 3. UK Activation ─────────────────────────────────────────────────
    {
      id: "activation",
      label: "UK Activation",
      icon: <MapPin className="w-[18px] h-[18px]" />,
      items: [
        { label: "National Hub", path: "/admin/hub-locations", icon: <span className="text-xs">🇬🇧</span>, implemented: true },
        { label: "Cities", path: "/admin/cities", icon: <span className="text-xs">🏙️</span>, implemented: true },
        { label: "Local Areas", path: "/admin/local-areas", icon: <span className="text-xs">🏘️</span>, implemented: true },
        { label: "High Streets", path: "/admin/high-streets", icon: <span className="text-xs">🛣️</span>, implemented: true },
        { label: "Activation Progress", path: "/admin/activation", icon: <span className="text-xs">📈</span>, implemented: true },
      ],
    },

    // ─── 4. Campaigns ──────────────────────────────────────────────────────
    {
      id: "campaigns",
      label: "Campaigns",
      icon: <Target className="w-[18px] h-[18px]" />,
      items: [
        { label: "Campaigns", path: "/admin/campaigns", icon: <Target className="w-4 h-4" />, implemented: true },
        { label: "Categories", path: "/admin/categories", icon: <span className="text-xs">📂</span>, implemented: true },
      ],
    },

    // ─── 5. Business Owners ───────────────────────────────────────────────
    {
      id: "business-owners",
      label: "Business Owners",
      icon: <Building2 className="w-[18px] h-[18px]" />,
      items: [
        { label: "Business Owner Overview", path: "/admin/business-owners", icon: <span className="text-xs">📊</span>, implemented: true },
        { label: "Business Owners", path: "/admin/business-owners/list", icon: <span className="text-xs">👤</span>, implemented: true },
        { label: "Business Owner Campaigns", path: "/admin/business-owners/campaigns", icon: <span className="text-xs">🎯</span>, implemented: true },
        { label: "Business Owner Backers", path: "/admin/business-owners/backers", icon: <span className="text-xs">🤝</span>, implemented: false },
        { label: "Business Owner Founding Members", path: "/admin/business-owners/founding-members", icon: <span className="text-xs">⭐</span>, implemented: false },
        { label: "Business Owner Membership", path: "/admin/business-owners/membership", icon: <span className="text-xs">🎫</span>, implemented: false },
        { label: "Business Owner Rewards", path: "/admin/business-owners/rewards", icon: <span className="text-xs">🏆</span>, implemented: false },
        { label: "Business Owner Leaderboards", path: "/admin/business-owners/leaderboards", icon: <span className="text-xs">🥇</span>, implemented: false },
        { label: "Business Owner Recognition", path: "/admin/business-owners/recognition", icon: <span className="text-xs">🎖️</span>, implemented: false },
      ],
    },

    // ─── 6. Consumers ─────────────────────────────────────────────────────
    {
      id: "consumers",
      label: "Consumers",
      icon: <Users className="w-[18px] h-[18px]" />,
      items: [
        { label: "Consumer Overview", path: "/admin/consumer-overview", icon: <span className="text-xs">📊</span>, implemented: true },
        { label: "Consumers", path: "/admin/consumers/list", icon: <span className="text-xs">👤</span>, implemented: true },
        { label: "Consumer Campaigns", path: "/admin/consumer-overview/campaigns", icon: <span className="text-xs">🎯</span>, implemented: true },
        { label: "Consumer Backers", path: "/admin/consumer-overview/backers", icon: <span className="text-xs">🤝</span>, implemented: false },
        { label: "Consumer Founding Members", path: "/admin/consumer-overview/founding-members", icon: <span className="text-xs">⭐</span>, implemented: false },
        { label: "Consumer Membership", path: "/admin/consumer-overview/membership", icon: <span className="text-xs">🎫</span>, implemented: false },
        { label: "Consumer Rewards", path: "/admin/consumer-overview/rewards", icon: <span className="text-xs">🏆</span>, implemented: false },
        { label: "Consumer Leaderboards", path: "/admin/consumer-overview/leaderboards", icon: <span className="text-xs">🥇</span>, implemented: false },
        { label: "Consumer Recognition", path: "/admin/consumer-overview/recognition", icon: <span className="text-xs">🎖️</span>, implemented: false },
      ],
    },

    // ─── 7. Businesses & Community ────────────────────────────────────────
    {
      id: "businesses-community",
      label: "Businesses & Community",
      icon: <Store className="w-[18px] h-[18px]" />,
      items: [
        { label: "Businesses", path: "/admin/businesses/directory", icon: <span className="text-xs">📒</span>, implemented: true },
        { label: "Business Campaigns", path: "/admin/businesses/campaigns", icon: <span className="text-xs">📢</span>, implemented: false },
        { label: "Business Contributions", path: "/admin/businesses/contributions", icon: <span className="text-xs">💰</span>, implemented: false },
        { label: "In-Store & Community", path: "/admin/in-store-contributions", icon: <span className="text-xs">🏬</span>, implemented: false },
        { label: "Business Activation", path: "/admin/businesses/activation", icon: <span className="text-xs">📈</span>, implemented: false },
      ],
    },

    // ─── 8. Engagement ────────────────────────────────────────────────────
    {
      id: "engagement",
      label: "Engagement",
      icon: <Trophy className="w-[18px] h-[18px]" />,
      items: [
        { label: "Rewards", path: "/admin/engagement/rewards", icon: <span className="text-xs">🏆</span>, implemented: false },
        { label: "Leaderboards", path: "/admin/engagement/leaderboards", icon: <span className="text-xs">🥇</span>, implemented: false },
        { label: "Recognition", path: "/admin/engagement/recognition", icon: <span className="text-xs">🎖️</span>, implemented: false },
        { label: "Incentives", path: "/admin/engagement/incentives", icon: <span className="text-xs">🎁</span>, implemented: false },
      ],
    },

    // ─── 9. Finance & Operations ──────────────────────────────────────────
    {
      id: "finance",
      label: "Finance & Operations",
      icon: <Wallet className="w-[18px] h-[18px]" />,
      items: [
        { label: "Financial Overview", path: "/admin/finance", icon: <span className="text-xs">📊</span>, implemented: false },
        { label: "Balances & Allocations", path: "/admin/finance/balances", icon: <span className="text-xs">💳</span>, implemented: false },
        { label: "Payouts", path: "/admin/finance/payouts", icon: <span className="text-xs">💸</span>, implemented: false },
        { label: "Refunds & Adjustments", path: "/admin/finance/refunds", icon: <span className="text-xs">↩️</span>, implemented: false },
        { label: "Contributions & Transactions", path: "/admin/finance/transactions", icon: <span className="text-xs">📋</span>, implemented: false },
        { label: "Funding Rules", path: "/admin/finance/rules", icon: <span className="text-xs">⚙️</span>, implemented: false },
      ],
    },

    // ─── 10. Content & Communication ──────────────────────────────────────
    {
      id: "content",
      label: "Content & Communication",
      icon: <MessageSquare className="w-[18px] h-[18px]" />,
      items: [
        { label: "Content & CMS", path: "/admin/content", icon: <span className="text-xs">📄</span>, implemented: false },
        { label: "Notifications", path: "/admin/notifications", icon: <span className="text-xs">🔔</span>, implemented: false },
        { label: "Support", path: "/admin/support", icon: <span className="text-xs">💬</span>, implemented: false },
        { label: "Moderation", path: "/admin/moderation", icon: <span className="text-xs">🛡️</span>, implemented: false },
        { label: "Campaign Communications", path: "/admin/content/campaign-comms", icon: <span className="text-xs">📨</span>, implemented: false },
      ],
    },

    // ─── 11. Analytics & Reporting ────────────────────────────────────────
    {
      id: "analytics",
      label: "Analytics & Reporting",
      icon: <BarChart3 className="w-[18px] h-[18px]" />,
      items: [
        { label: "Seasonal Performance", path: "/admin/analytics/seasonal", icon: <span className="text-xs">📅</span>, implemented: false },
        { label: "Activation Performance", path: "/admin/analytics/activation", icon: <span className="text-xs">📈</span>, implemented: false },
        { label: "Campaign Performance", path: "/admin/analytics/campaigns", icon: <span className="text-xs">🎯</span>, implemented: false },
        { label: "Consumer Performance", path: "/admin/analytics/consumers", icon: <span className="text-xs">👤</span>, implemented: false },
        { label: "Business Owner Performance", path: "/admin/analytics/business-owners", icon: <span className="text-xs">🏢</span>, implemented: false },
        { label: "Participation & Membership", path: "/admin/analytics/participation", icon: <span className="text-xs">👥</span>, implemented: false },
        { label: "Engagement & Rewards", path: "/admin/analytics/engagement", icon: <span className="text-xs">🏆</span>, implemented: false },
        { label: "Financial Reports", path: "/admin/analytics/financial", icon: <span className="text-xs">💰</span>, implemented: false },
        { label: "Custom Reports", path: "/admin/analytics/custom", icon: <span className="text-xs">📊</span>, implemented: false },
      ],
    },

    // ─── 12. Platform & System ────────────────────────────────────────────
    {
      id: "system",
      label: "Platform & System",
      icon: <Settings className="w-[18px] h-[18px]" />,
      items: [
        { label: "Users & Roles", path: "/admin/system/users", icon: <span className="text-xs">👥</span>, implemented: false },
        { label: "Integrations", path: "/admin/system/integrations", icon: <span className="text-xs">🔗</span>, implemented: false },
        { label: "Platform Settings", path: "/admin/settings", icon: <span className="text-xs">⚙️</span>, implemented: true },
        { label: "Taxonomy & Configuration", path: "/admin/system/taxonomy", icon: <span className="text-xs">🏷️</span>, implemented: false },
        { label: "Audit Logs", path: "/admin/system/audit-logs", icon: <span className="text-xs">📋</span>, implemented: false },
        { label: "Security", path: "/admin/system/security", icon: <span className="text-xs">🔒</span>, implemented: false },
        { label: "System Health", path: "/admin/system/health", icon: <span className="text-xs">💓</span>, implemented: false },
      ],
    },
  ];
}

// =============================================================================
// Overview Item (Top-level, not a group)
// =============================================================================

export const ADMIN_OVERVIEW_ITEM: AdminNavItem = {
  label: "Overview",
  path: "/admin",
  icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  exact: true,
  implemented: true,
};
