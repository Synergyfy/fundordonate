// =============================================================================
// Admin Placeholder Pages
// Wrapper components for each unimplemented admin section.
// =============================================================================

import { AdminPlaceholderPage } from "./AdminPlaceholderPage";

// ─── Seasons & Programmes ───────────────────────────────────────────────────

export function AllSeasonsPage() {
  return <AdminPlaceholderPage title="All Seasons" description="View and manage all FundOrDonate seasons." groupName="Seasons & Programmes" />;
}

export function CurrentSeasonPage() {
  return <AdminPlaceholderPage title="Current Season" description="Monitor and configure the active season." groupName="Seasons & Programmes" />;
}

export function SeasonReviewPage() {
  return <AdminPlaceholderPage title="Season Review" description="Review season performance and metrics." groupName="Seasons & Programmes" />;
}

// ─── UK Activation ──────────────────────────────────────────────────────────

export function LocalAreasPage() {
  return <AdminPlaceholderPage title="Local Areas" description="Manage boroughs, districts, and local authority areas." groupName="UK Activation" />;
}

export function HighStreetsPage() {
  return <AdminPlaceholderPage title="High Streets" description="Manage high streets and commercial districts." groupName="UK Activation" />;
}

// ─── Campaigns & Funding ────────────────────────────────────────────────────

export function SpilloverPage() {
  return <AdminPlaceholderPage title="Spillover & Surplus" description="Configure spillover rules and manage surplus funds." groupName="Campaigns & Funding" />;
}

// ─── People & Participation ─────────────────────────────────────────────────

export function FoundingMembersPage() {
  return <AdminPlaceholderPage title="Founding Members" description="Manage founding member tiers, benefits, and recognition." groupName="People & Participation" />;
}

export function MembershipPage() {
  return <AdminPlaceholderPage title="Membership" description="Manage membership programmes and subscriptions." groupName="People & Participation" />;
}

// ─── Businesses & Community ─────────────────────────────────────────────────

export function BusinessCampaignsPage() {
  return <AdminPlaceholderPage title="Business Campaigns" description="Manage campaigns created by businesses." groupName="Businesses & Community" />;
}

export function InStoreContributionsPage() {
  return <AdminPlaceholderPage title="In-Store & Community" description="Track in-store donations and community contributions." groupName="Businesses & Community" />;
}

// ─── Engagement ─────────────────────────────────────────────────────────────

export function RewardsPage() {
  return <AdminPlaceholderPage title="Rewards" description="Configure city, borough, and national rewards." groupName="Engagement" />;
}

export function LeaderboardsPage() {
  return <AdminPlaceholderPage title="Leaderboards" description="Manage leaderboard configurations and scopes." groupName="Engagement" />;
}

export function RecognitionPage() {
  return <AdminPlaceholderPage title="Recognition" description="Manage recognition tiers and badges." groupName="Engagement" />;
}

export function CampaignIncentivesPage() {
  return <AdminPlaceholderPage title="Campaign Incentives" description="Configure campaign incentives and bonus structures." groupName="Engagement" />;
}

// ─── Finance & Operations ───────────────────────────────────────────────────

export function FinancialOverviewPage() {
  return <AdminPlaceholderPage title="Financial Overview" description="View platform financial metrics and summaries." groupName="Finance & Operations" />;
}

export function BalancesPage() {
  return <AdminPlaceholderPage title="Balances & Allocations" description="Manage fund balances and allocation rules." groupName="Finance & Operations" />;
}

export function PayoutsPage() {
  return <AdminPlaceholderPage title="Payouts" description="Process and manage payouts to campaigns." groupName="Finance & Operations" />;
}

export function RefundsPage() {
  return <AdminPlaceholderPage title="Refunds & Adjustments" description="Handle refunds and manual adjustments." groupName="Finance & Operations" />;
}

// ─── Content & Communication ────────────────────────────────────────────────

export function ContentCMSPage() {
  return <AdminPlaceholderPage title="Content & CMS" description="Manage static content, pages, and CMS assets." groupName="Content & Communication" />;
}

export function NotificationsPage() {
  return <AdminPlaceholderPage title="Notifications" description="Configure and manage platform notifications." groupName="Content & Communication" />;
}

export function SupportPage() {
  return <AdminPlaceholderPage title="Support" description="Manage support tickets and enquiries." groupName="Content & Communication" />;
}

export function ModerationPage() {
  return <AdminPlaceholderPage title="Moderation" description="Review flagged content and manage moderation." groupName="Content & Communication" />;
}

// ─── Analytics & Reporting ──────────────────────────────────────────────────

export function SeasonalPerformancePage() {
  return <AdminPlaceholderPage title="Seasonal Performance" description="Analyse performance across seasons." groupName="Analytics & Reporting" />;
}

export function ActivationPerformancePage() {
  return <AdminPlaceholderPage title="Activation Performance" description="Track UK activation metrics by location." groupName="Analytics & Reporting" />;
}

export function CampaignPerformancePage() {
  return <AdminPlaceholderPage title="Campaign Performance" description="Analyse campaign success and funding metrics." groupName="Analytics & Reporting" />;
}

export function ParticipationMembershipPage() {
  return <AdminPlaceholderPage title="Participation & Membership" description="Track user participation and membership trends." groupName="Analytics & Reporting" />;
}

export function FinancialReportsPage() {
  return <AdminPlaceholderPage title="Financial Reports" description="Generate and view financial reports." groupName="Analytics & Reporting" />;
}

// ─── Platform & System ──────────────────────────────────────────────────────

export function UsersRolesPage() {
  return <AdminPlaceholderPage title="Users & Roles" description="Manage user roles, permissions, and access." groupName="Platform & System" />;
}

export function IntegrationsPage() {
  return <AdminPlaceholderPage title="Integrations" description="Configure third-party integrations." groupName="Platform & System" />;
}

export function AuditLogsPage() {
  return <AdminPlaceholderPage title="Audit Logs" description="View system audit trails and activity logs." groupName="Platform & System" />;
}

export function SecurityPage() {
  return <AdminPlaceholderPage title="Security" description="Manage security settings and policies." groupName="Platform & System" />;
}

export function SystemHealthPage() {
  return <AdminPlaceholderPage title="System Health" description="Monitor system health and performance." groupName="Platform & System" />;
}
