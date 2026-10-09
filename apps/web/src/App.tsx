import { Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "@/components/auth/ProtectedRoute";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import ScrollToTop from "@/components/ScrollToTop";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { BusinessOwnerLayout } from "@/components/layout/BusinessOwnerLayout";
import { ConsumerLayout } from "@/components/layout/ConsumerLayout";
import { SessionExpiredMessage } from "@/components/ui/SessionExpiredMessage";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SkipToContent } from "@/components/ui/SkipToContent";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import "@/styles/print.css";

// Lazy-loaded routes for code splitting
import {
  HomePage,
  CampaignsIndexPage,
  CampaignsPage,
  CampaignDetailPage,
  AboutPage,
  NationalFundingPage,
  SeasonalFundingPage,
  DonatePage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  HowItWorksPage,
  FundVsDonatePage,
  NationalHubPage,
  BusinessHubPage,
  ConsumerHubPage,
  FoundingProgrammePage,
  SplitContributionPage,
  CityHubPage,
  CityBusinessHubPage,
  UkHubMapPage,
  BusinessDiscoveryPage,
  FundingExplainerPage,
  ThankYouPage,
  PaymentFailurePage,
  DonationCheckoutPage,
  PledgeCheckoutPage,
  TaxonomyPage,
  TerminalDonationPage,
  MembershipPurchasePage,
  ContributorProfilePage,
  // Consumer Contribution Flow
  CampaignBrowsePage,
  ContributionFlow,
  ContributionConfirmationPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  CentralHubCallbackPage,
  DashboardHome,
  CampaignsManagement,
  DonationsManagement,
  UsersManagement,
  SettingsPage,
  ReportsAnalyticsPage,
  BackersManagementPage,
  BusinessesManagementPage,
  ConsumersManagementPage,
  EventsManagementPage,
  MapManagementPage,
  AdminLocationDetailPage,
  AdminCityManagementPage,
  AdminRollUpConfig,
  AdminHubContentPage,
  AdminTargetCalculationPage,
  // Reward Library
  RewardLibraryPage,
  AssetManagementPage,
  RewardTemplatesPage,
  RewardRulesPage,
  AdminFulfilmentPage,
  // Funding / Participants / Reports
  AdminFundingPage,
  AdminDonorsPage,
  AdminReportsPage,
  ConsumerHomePage,
  ProfilePage,
  ConsumerExplorePage,
  ConsumerActivityPage,
  ContributionDetailPage,
  ConsumerYouPage,
  ConsumerRewardsPage,
  ConsumerRewardDetailPage,
  ConsumerMembershipPage,
  ConsumerFoundingMemberStatusPage,
  ConsumerRecognitionPage,
  ConsumerNotificationsPage,
  ConsumerSettingsPage,
  ConsumerHelpPage,
  QrDonationFlow,
  // Seasons & Programmes
  AllSeasonsPage,
  CurrentSeasonPage,
  SeasonReviewPage,
  SeasonWizardPage,
  // Campaigns
  AllCampaignsPage,
  NewAdminCampaignWizard,
  AdminCampaignDetailPage,
  AdminCampaignTemplatesPage,
  AdminTemplateWizardPage,
  // UK Activation
  AdminNationalHubPage,
  AdminCitiesPage,
  AdminLocalAreasPage,
  AdminHighStreetsPage,
  AdminActivationProgressPage,
  AdminAddCityWizard,
  AdminLocationRecommendationsPage,
  // Business Owners
  BusinessOwnersOverviewPage,
  BusinessOwnersListPage,
  // Consumers
  ConsumerOverviewPage,
  ConsumersListPage,
  // People & Participation
  AdminFoundingMembersPage,
  AdminMembershipPage,
  // Business Owner Journey
  BusinessOnboardingPage,
  AdminBusinessOwnerDetailPage,
  MyBusinessPage,
  BusinessProfilePublicPage,
  AdminBusinessDetailPage,
  // Business Owner Dashboard
  BusinessOwnerOverviewPage,
  BusinessOwnerCampaignsPage,
  BusinessOwnerContributionsPage,
  BusinessOwnerLeaderboardPage,
  BusinessOwnerRewardsPage,
  BusinessOwnerSettingsPage,
  BusinessCampaignCentrePage,
  BusinessCampaignSetupPage,
  BusinessMyCampaignDetailPage,
  // Campaigns & Funding
  SpilloverPage,
  // Businesses & Community
  BusinessCampaignsPage,
  InStoreContributionsPage,
  BusinessContributionsPage,
  BusinessRewardsPage,
  BusinessLeaderboardsPage,
  BusinessRecognitionPage,
  CityActivationPage,
  // Engagement
  RewardsPage,
  LeaderboardsPage,
  RecognitionPage,
  CampaignIncentivesPage,
  // Finance & Operations
  FinancialOverviewPage,
  BalancesPage,
  PayoutsPage,
  RefundsPage,
  // Content & Communication
  ContentCMSPage,
  NotificationsPage,
  SupportPage,
  ModerationPage,
  CampaignCommsPage,
  // Analytics & Reporting
  SeasonalPerformancePage,
  ActivationPerformancePage,
  CampaignPerformancePage,
  ParticipationMembershipPage,
  FinancialReportsPage,
  // Platform & System
  UsersRolesPage,
  IntegrationsPage,
  AuditLogsPage,
  SecurityPage,
  SystemHealthPage,
  // Business Owner Journey
  BusinessCityHubPage,
  BusinessLocalAreaSelectPage,
  BusinessHighStreetSelectPage,
  BusinessSearchPage,
  BusinessClaimPage,
  BusinessAddPage,
  BusinessClaimedPage,
  BusinessOwnerOnboardingPage,
  SeasonContextPage,
  ParticipationChoicePage,
  MembershipSelectionPage,
  // Business Join Flow
  HighStreetPage,
  HighStreetBusinessesPage,
  CentralHubSignInPage,
  CentralHubSignUpPage,
  BusinessConfirmationPage,
  PostcodeValidationPage,
  HighStreetConfirmPage,
  BusinessJoinSuccessPage,
  BusinessSeasonPage,
  BusinessOpportunitiesPage,
  BusinessParticipationChoicePage,
  BackerContributionPage,
  FoundingMemberPage,
  FoundingMemberChoicePage,
  FoundingMemberMonthlyPage,
  HighStreetCampaignPage,
  // Consumer Pages
  ConsumerBenefitsPage,
  ConsumerLocalAreaPage,
  ConsumerHighStreetPage,
  ConsumerOpportunitiesPage,
  ConsumerParticipationChoicePage,
  ConsumerBackerContributionPage,
  ConsumerCampaignDetailPage,
  ConsumerFoundingMemberChoicePage,
  ConsumerFoundingMemberPage,
  ConsumerFoundingMemberMonthlyPage,
  // UK Hub Campaign Discovery
  BusinessCampaignListPage,
  ConsumerCampaignListPage,
  HubCampaignDetailPage,
} from "@/pages/lazyRoutes";

// Non-lazy components (small, used frequently)
import { CampaignBuilder } from "@/components/campaign/CampaignBuilder";

// Wrapper to force CityHubPage re-mount on every navigation
function CityHubPageWrapper() {
  const location = useLocation();
  return <CityHubPage key={location.pathname} />;
}

function App() {
  return (
    <ErrorBoundary>
      <SkipToContent />
      <AuthInitializer />
      <ScrollToTop />
      <main id="main-content">
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
        {/* ─── Public routes with shared layout ─── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/campaigns" element={<CampaignsIndexPage />} />
          <Route path="/campaigns/business" element={<CampaignsPage audience="business" />} />
          <Route path="/campaigns/consumer" element={<CampaignsPage audience="consumer" />} />
          <Route path="/campaigns/:slug" element={<CampaignDetailPage />} />
          <Route path="/discover" element={<CampaignBrowsePage />} />
          <Route
            path="/contribute/:slug"
            element={
              <ProtectedRoute>
                <ContributionFlow />
              </ProtectedRoute>
            }
          />
          <Route path="/contribution/confirmation" element={<ContributionConfirmationPage />} />
          <Route path="/my-activity" element={<Navigate to="/consumer/activity" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/funding" element={<NationalFundingPage />} />
          <Route path="/seasonal-funding" element={<SeasonalFundingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/uk-hub-activation" element={<NationalHubPage />} />
          <Route path="/uk-hub-activation/business" element={<BusinessHubPage />} />
          <Route path="/uk-hub-activation/consumer" element={<ConsumerHubPage />} />
          <Route path="/uk-hub-activation/map" element={<UkHubMapPage />} />
          <Route path="/business-discovery" element={<BusinessDiscoveryPage />} />
          <Route path="/founding/:programmeId" element={<FoundingProgrammePage />} />
          <Route path="/split" element={<SplitContributionPage />} />
          <Route path="/uk-hub-activation/:slug/business" element={<CityBusinessHubPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/local-area" element={<BusinessLocalAreaSelectPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug" element={<BusinessLocalAreaSelectPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/high-streets" element={<BusinessHighStreetSelectPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug" element={<BusinessSearchPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/businesses" element={<HighStreetBusinessesPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/campaign/:campaignSlug" element={<HighStreetCampaignPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/b-campaigns/:campaignSlug" element={<HighStreetCampaignPage />} />
          {/* Business Join Flow (new route pattern) */}
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join" element={<HighStreetPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/signin" element={<CentralHubSignInPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/signup" element={<CentralHubSignUpPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/confirm" element={<BusinessConfirmationPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/validate" element={<PostcodeValidationPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/confirm-location" element={<HighStreetConfirmPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/success" element={<BusinessJoinSuccessPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/season" element={<BusinessSeasonPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/opportunities" element={<BusinessOpportunitiesPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/participation" element={<BusinessParticipationChoicePage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/backer" element={<BackerContributionPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/founding-member" element={<FoundingMemberPage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/founding-member-choice" element={<FoundingMemberChoicePage />} />
          <Route path="/uk-hub-activation/:citySlug/business/:localAreaSlug/:highStreetSlug/join/founding-member-monthly" element={<FoundingMemberMonthlyPage />} />
          <Route path="/uk-hub-activation/:citySlug/:localAreaSlug/:highStreetSlug/campaign/:campaignSlug" element={<HighStreetCampaignPage />} />
          {/* Consumer Flow */}
          <Route path="/uk-hub-activation/:citySlug/consumer" element={<ConsumerBenefitsPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/local-areas" element={<ConsumerLocalAreaPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug" element={<ConsumerHighStreetPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug" element={<HighStreetPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/campaign/:campaignSlug" element={<HighStreetCampaignPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/c-campaigns/:campaignSlug" element={<HighStreetCampaignPage />} />
          {/* Consumer Join Flow */}
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/join/opportunities" element={<ConsumerOpportunitiesPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/join/participation" element={<ConsumerParticipationChoicePage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/join/backer" element={<ConsumerBackerContributionPage />} />
          <Route
          path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/join/founding-member-choice"
          element={
            <ProtectedRoute>
              <ConsumerFoundingMemberChoicePage />
            </ProtectedRoute>
          }
        />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/join/founding-member" element={<ConsumerFoundingMemberPage />} />
          <Route path="/uk-hub-activation/:citySlug/consumer/:localAreaSlug/:highStreetSlug/join/founding-member-monthly" element={<ConsumerFoundingMemberMonthlyPage />} />
          {/* UK Hub Campaign Discovery Flow */}
          <Route path="/uk-hub-activation/:citySlug/:localAreaSlug/:highStreetSlug/business" element={<BusinessCampaignListPage />} />
          <Route path="/uk-hub-activation/:citySlug/:localAreaSlug/:highStreetSlug/consumer" element={<ConsumerCampaignListPage />} />
          <Route path="/uk-hub-activation/:citySlug/:localAreaSlug/:highStreetSlug/:audienceType/campaign/:campaignSlug" element={<HubCampaignDetailPage />} />
          <Route path="/uk-hub-activation/*" element={<CityHubPageWrapper />} />
          <Route path="/fund-vs-donate" element={<FundVsDonatePage />} />
          <Route path="/funding-explainer" element={<FundingExplainerPage />} />
          <Route path="/business/:slug" element={<BusinessProfilePublicPage />} />
          <Route path="/business/:citySlug" element={<BusinessCityHubPage />} />
          <Route path="/business/:citySlug/local-area" element={<BusinessLocalAreaSelectPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug" element={<BusinessLocalAreaSelectPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-streets" element={<BusinessHighStreetSelectPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug" element={<BusinessSearchPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/businesses" element={<HighStreetBusinessesPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/claim/:businessId" element={<BusinessClaimPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/add" element={<BusinessAddPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/claimed/:businessId" element={<BusinessClaimedPage />} />
          {/* Business Join Flow */}
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join" element={<HighStreetPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/signin" element={<CentralHubSignInPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/signup" element={<CentralHubSignUpPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/confirm" element={<BusinessConfirmationPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/validate" element={<PostcodeValidationPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/confirm-location" element={<HighStreetConfirmPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/success" element={<BusinessJoinSuccessPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/season" element={<BusinessSeasonPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/opportunities" element={<BusinessOpportunitiesPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/participation" element={<BusinessParticipationChoicePage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/backer" element={<BackerContributionPage />} />
          <Route path="/business/:citySlug/local-area/:localAreaSlug/high-street/:highStreetSlug/join/founding-member" element={<FoundingMemberPage />} />
          <Route path="/business/:citySlug/onboarding" element={<BusinessOwnerOnboardingPage />} />
          <Route path="/business/:citySlug/season" element={<SeasonContextPage />} />
          <Route path="/business/:citySlug/participation" element={<ParticipationChoicePage />} />
          <Route path="/business/:citySlug/membership" element={<MembershipSelectionPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/donate/checkout" element={<DonationCheckoutPage />} />
          <Route path="/pledge" element={<PledgeCheckoutPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/payment-failed" element={<PaymentFailurePage />} />
        </Route>

        {/* ─── Auth routes ─── */}
        <Route path="/auth/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
        <Route path="/auth/register" element={<GuestRoute><PublicLayout><RegisterPage /></PublicLayout></GuestRoute>} />
        <Route path="/auth/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
        <Route path="/auth/reset-password" element={<PublicLayout><ResetPasswordPage /></PublicLayout>} />
        <Route path="/auth/verify-email" element={<PublicLayout><VerifyEmailPage /></PublicLayout>} />
        <Route path="/auth/central-hub/callback" element={<CentralHubCallbackPage />} />
        <Route path="/auth/session-expired" element={<SessionExpiredMessage />} />

        {/* ─── Protected campaign creation ─── */}
        <Route path="/campaigns/create" element={<ProtectedRoute><PublicLayout><CampaignBuilder /></PublicLayout></ProtectedRoute>} />

        {/* ═══════════════════════════════════════════════════════════════════
            ADMIN DASHBOARD — /admin
            ═══════════════════════════════════════════════════════════════════ */}
        <Route element={<ProtectedRoute requiredUserTypes={["admin"]}><AuthenticatedLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<DashboardHome />} />

          {/* Seasons & Programmes */}
          <Route path="/admin/seasons" element={<AllSeasonsPage />} />
          <Route path="/admin/seasons/new" element={<SeasonWizardPage />} />
          <Route path="/admin/seasons/current" element={<CurrentSeasonPage />} />
          <Route path="/admin/seasons/review" element={<SeasonReviewPage />} />

          {/* UK Activation */}
          <Route path="/admin/hub-locations" element={<AdminNationalHubPage />} />
          <Route path="/admin/hub-locations/:id" element={<AdminLocationDetailPage />} />
          <Route path="/admin/cities" element={<AdminCitiesPage />} />
          <Route path="/admin/cities/new" element={<AdminAddCityWizard />} />
          <Route path="/admin/cities/:id" element={<AdminCityManagementPage />} />
          <Route path="/admin/local-areas" element={<AdminLocalAreasPage />} />
          <Route path="/admin/high-streets" element={<AdminHighStreetsPage />} />
          <Route path="/admin/activation" element={<AdminActivationProgressPage />} />
          <Route path="/admin/locations/recommendations" element={<AdminLocationRecommendationsPage />} />
          <Route path="/admin/map" element={<MapManagementPage />} />
          <Route path="/admin/rollup-config" element={<AdminRollUpConfig />} />

          {/* Business Owners */}
          <Route path="/admin/business-owners" element={<BusinessOwnersOverviewPage />} />
          <Route path="/admin/business-owners/list" element={<BusinessOwnersListPage />} />
          <Route path="/admin/business-owners/:id/detail" element={<AdminBusinessOwnerDetailPage />} />
          <Route path="/admin/business-owners/businesses" element={<BusinessesManagementPage />} />
          <Route path="/admin/business-owners/campaigns" element={<CampaignsManagement />} />
          <Route path="/admin/business-owners/membership" element={<AdminMembershipPage />} />
          <Route path="/admin/business-owners/backers" element={<BackersManagementPage />} />
          <Route path="/admin/business-owners/founding-members" element={<AdminFoundingMembersPage />} />
          <Route path="/admin/business-owners/rewards" element={<BusinessRewardsPage />} />
          <Route path="/admin/business-owners/leaderboards" element={<BusinessLeaderboardsPage />} />
          <Route path="/admin/business-owners/recognition" element={<BusinessRecognitionPage />} />

          {/* Consumers */}
          <Route path="/admin/consumer-overview" element={<ConsumerOverviewPage />} />
          <Route path="/admin/consumers/list" element={<ConsumersListPage />} />
          <Route path="/admin/consumer-overview/:id" element={<ConsumersListPage />} />
          <Route path="/admin/consumer-overview/campaigns" element={<CampaignsManagement />} />
          <Route path="/admin/consumer-overview/membership" element={<AdminMembershipPage />} />
          <Route path="/admin/consumer-overview/backers" element={<BackersManagementPage />} />
          <Route path="/admin/consumer-overview/founding-members" element={<AdminFoundingMembersPage />} />
          <Route path="/admin/consumer-overview/rewards" element={<RewardsPage />} />
          <Route path="/admin/consumer-overview/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/admin/consumer-overview/recognition" element={<RecognitionPage />} />

          {/* Campaigns */}
          <Route path="/admin/campaigns" element={<AllCampaignsPage key="all" />} />
          <Route path="/admin/campaigns/business" element={<AllCampaignsPage audience="business" key="business" />} />
          <Route path="/admin/campaigns/consumer" element={<AllCampaignsPage audience="consumer" key="consumer" />} />
          <Route path="/admin/campaigns/pending-review" element={<AllCampaignsPage forceStatus="pending_review" key="pending" />} />
          <Route path="/admin/campaigns/new" element={<NewAdminCampaignWizard />} />
          <Route path="/admin/campaigns/templates" element={<AdminCampaignTemplatesPage />} />
          <Route path="/admin/campaigns/templates/new" element={<AdminTemplateWizardPage />} />
          <Route path="/admin/campaigns/templates/:id/edit" element={<AdminTemplateWizardPage />} />
          <Route path="/admin/campaigns/:id" element={<AdminCampaignDetailPage />} />
          <Route path="/admin/campaigns/:id/edit" element={<NewAdminCampaignWizard />} />
          <Route path="/admin/campaigns/incentives" element={<CampaignIncentivesPage />} />
          <Route path="/admin/campaigns/targets" element={<AdminTargetCalculationPage />} />
          <Route path="/admin/campaigns/contributions" element={<DonationsManagement />} />
          <Route path="/admin/campaigns/spillover" element={<SpilloverPage />} />

          {/* Reward Library */}
          <Route path="/admin/rewards" element={<RewardLibraryPage />} />
          <Route path="/admin/rewards/library" element={<RewardLibraryPage />} />
          <Route path="/admin/rewards/assets" element={<AssetManagementPage />} />
          <Route path="/admin/rewards/templates" element={<RewardTemplatesPage />} />
          <Route path="/admin/rewards/rules" element={<RewardRulesPage />} />
          <Route path="/admin/rewards/fulfilment" element={<AdminFulfilmentPage />} />

          {/* Funding workspace (one page, four tabs) */}
          <Route path="/admin/funding" element={<AdminFundingPage tab="funds" />} />
          <Route path="/admin/funding/contributions" element={<AdminFundingPage tab="contributions" />} />
          <Route path="/admin/funding/payments" element={<AdminFundingPage tab="payments" />} />
          <Route path="/admin/funding/withdrawals" element={<AdminFundingPage tab="withdrawals" />} />

          {/* Reports (one page, five tabs) */}
          <Route path="/admin/reports" element={<AdminReportsPage tab="business" />} />
          <Route path="/admin/reports/business" element={<AdminReportsPage tab="business" />} />
          <Route path="/admin/reports/consumer" element={<AdminReportsPage tab="consumer" />} />
          <Route path="/admin/reports/funding" element={<AdminReportsPage tab="funding" />} />
          <Route path="/admin/reports/campaigns" element={<AdminReportsPage tab="campaigns" />} />
          <Route path="/admin/reports/rewards" element={<AdminReportsPage tab="rewards" />} />

          {/* People & Participation */}
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/consumers" element={<ConsumersManagementPage />} />
          <Route path="/admin/businesses" element={<BusinessesManagementPage />} />
          <Route path="/admin/backers" element={<BackersManagementPage />} />
          <Route path="/admin/founding-members" element={<AdminFoundingMembersPage />} />
          <Route path="/admin/membership" element={<AdminMembershipPage />} />
          <Route path="/admin/donors" element={<AdminDonorsPage />} />

          {/* Businesses & Community */}
          <Route path="/admin/businesses/directory" element={<BusinessesManagementPage />} />
          <Route path="/admin/businesses/:id" element={<AdminBusinessDetailPage />} />
          <Route path="/admin/businesses/campaigns" element={<BusinessCampaignsPage />} />
          <Route path="/admin/businesses/contributions" element={<BusinessContributionsPage />} />
          <Route path="/admin/in-store-contributions" element={<InStoreContributionsPage />} />
          <Route path="/admin/businesses/activation" element={<CityActivationPage />} />

          {/* Engagement */}
          <Route path="/admin/engagement/rewards" element={<RewardsPage />} />
          <Route path="/admin/engagement/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/admin/engagement/recognition" element={<RecognitionPage />} />
          <Route path="/admin/engagement/incentives" element={<CampaignIncentivesPage />} />

          {/* Finance & Operations */}
          <Route path="/admin/finance" element={<FinancialOverviewPage />} />
          <Route path="/admin/finance/balances" element={<BalancesPage />} />
          <Route path="/admin/finance/payouts" element={<PayoutsPage />} />
          <Route path="/admin/finance/refunds" element={<RefundsPage />} />
          <Route path="/admin/finance/transactions" element={<DonationsManagement />} />
          <Route path="/admin/finance/rules" element={<SettingsPage />} />

          {/* Content & Communication */}
          <Route path="/admin/content" element={<ContentCMSPage />} />
          <Route path="/admin/hub-content" element={<AdminHubContentPage />} />
          <Route path="/admin/categories" element={<TaxonomyPage />} />
          <Route path="/admin/events" element={<EventsManagementPage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/support" element={<SupportPage />} />
          <Route path="/admin/moderation" element={<ModerationPage />} />
          <Route path="/admin/content/campaign-comms" element={<CampaignCommsPage />} />

          {/* Analytics & Reporting */}
          <Route path="/admin/analytics" element={<ReportsAnalyticsPage />} />
          <Route path="/admin/analytics/seasonal" element={<SeasonalPerformancePage />} />
          <Route path="/admin/analytics/activation" element={<ActivationPerformancePage />} />
          <Route path="/admin/analytics/campaigns" element={<CampaignPerformancePage />} />
          <Route path="/admin/analytics/consumers" element={<ParticipationMembershipPage />} />
          <Route path="/admin/analytics/business-owners" element={<ParticipationMembershipPage />} />
          <Route path="/admin/analytics/participation" element={<ParticipationMembershipPage />} />
          <Route path="/admin/analytics/engagement" element={<FinancialReportsPage />} />
          <Route path="/admin/analytics/financial" element={<FinancialReportsPage />} />
          <Route path="/admin/analytics/custom" element={<ReportsAnalyticsPage />} />

          {/* Platform & System */}
          <Route path="/admin/system/users" element={<UsersRolesPage />} />
          <Route path="/admin/system/integrations" element={<IntegrationsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/settings/payments" element={<SettingsPage initialTab="payment" />} />
          <Route path="/admin/system/taxonomy" element={<TaxonomyPage />} />
          <Route path="/admin/system/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/system/security" element={<SecurityPage />} />
          <Route path="/admin/system/health" element={<SystemHealthPage />} />

          {/* Cross-role pages (within admin layout) */}
          <Route path="/membership/:locationId" element={<MembershipPurchasePage />} />
          <Route path="/profile/contributor" element={<ContributorProfilePage />} />
          <Route path="/terminal/:campaignId" element={<TerminalDonationPage />} />
          <Route path="/terminal" element={<TerminalDonationPage />} />
          <Route path="/qr/:campaignId" element={<QrDonationFlow />} />
        </Route>

        {/* ═══════════════════════════════════════════════════════════════════
            BUSINESS OWNER DASHBOARD — /dashboard
            Mobile-first layout with bottom navigation
            ═══════════════════════════════════════════════════════════════════ */}
        <Route element={<ProtectedRoute requiredUserTypes={["business"]}><BusinessOwnerLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<BusinessOwnerOverviewPage />} />
          <Route path="/dashboard/campaign-centre" element={<BusinessCampaignCentrePage />} />
          <Route path="/dashboard/campaign-setup/:templateId" element={<BusinessCampaignSetupPage />} />
          <Route path="/dashboard/my-campaigns/:campaignId" element={<BusinessMyCampaignDetailPage />} />
          <Route path="/dashboard/campaigns" element={<BusinessOwnerCampaignsPage />} />
          <Route path="/dashboard/contributions" element={<BusinessOwnerContributionsPage />} />
          <Route path="/dashboard/leaderboard" element={<BusinessOwnerLeaderboardPage />} />
          <Route path="/dashboard/rewards" element={<BusinessOwnerRewardsPage />} />
          <Route path="/dashboard/my-business" element={<MyBusinessPage />} />
          <Route path="/dashboard/settings" element={<BusinessOwnerSettingsPage />} />
        </Route>

        {/* Business Owner Onboarding (before layout loads) */}
        <Route element={<ProtectedRoute><AuthenticatedLayout /></ProtectedRoute>}>
          <Route path="/dashboard/onboarding" element={<BusinessOnboardingPage />} />
        </Route>

        {/* ═══════════════════════════════════════════════════════════════════
            CONSUMER DASHBOARD — /consumer
            Mobile-first layout with bottom navigation
            ═══════════════════════════════════════════════════════════════════ */}
        <Route element={<ProtectedRoute requiredUserTypes={["consumer"]}><ConsumerLayout /></ProtectedRoute>}>
          <Route path="/consumer" element={<ConsumerHomePage />} />
          <Route path="/consumer/explore" element={<ConsumerExplorePage />} />
          <Route path="/consumer/explore/city/:citySlug" element={<ConsumerExplorePage />} />
          <Route path="/consumer/explore/city/:citySlug/area/:areaSlug" element={<ConsumerExplorePage />} />
          <Route
            path="/consumer/explore/city/:citySlug/area/:areaSlug/street/:streetSlug"
            element={<ConsumerExplorePage />}
          />
          <Route path="/consumer/explore/campaign/:slug" element={<ConsumerCampaignDetailPage />} />
          <Route path="/consumer/activity" element={<ConsumerActivityPage />} />
          <Route path="/consumer/activity/contributions/:id" element={<ContributionDetailPage />} />
          <Route path="/consumer/you" element={<ConsumerYouPage />} />
          <Route path="/consumer/you/profile" element={<ProfilePage />} />
          <Route path="/consumer/you/membership" element={<ConsumerMembershipPage />} />
          <Route path="/consumer/you/founding-member" element={<ConsumerFoundingMemberStatusPage />} />
          <Route path="/consumer/you/recognition" element={<ConsumerRecognitionPage />} />
          <Route path="/consumer/you/notifications" element={<ConsumerNotificationsPage />} />
          <Route path="/consumer/you/settings" element={<ConsumerSettingsPage />} />
          <Route path="/consumer/you/help" element={<ConsumerHelpPage />} />
          <Route path="/consumer/you/rewards" element={<Navigate to="/consumer/rewards" replace />} />
          <Route path="/consumer/rewards" element={<ConsumerRewardsPage />} />
          <Route path="/consumer/rewards/:id" element={<ConsumerRewardDetailPage />} />
          {/* Legacy tabs → new five-area IA */}
          <Route path="/consumer/campaigns" element={<Navigate to="/consumer/explore" replace />} />
          <Route path="/consumer/donations" element={<Navigate to="/consumer/activity?tab=contributions" replace />} />
          <Route path="/consumer/pledges" element={<Navigate to="/consumer/activity?tab=contributions" replace />} />
          <Route path="/consumer/receipts" element={<Navigate to="/consumer/activity?tab=contributions" replace />} />
          <Route path="/consumer/bookmarks" element={<Navigate to="/consumer/explore" replace />} />
          <Route path="/consumer/profile" element={<Navigate to="/consumer/you/profile" replace />} />
        </Route>

        {/* ─── 404 ─── */}
        <Route path="*" element={<PublicLayout><div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><h1 className="text-6xl font-bold text-gray-300">404</h1><p className="mt-4 text-lg text-gray-600">Page not found</p><a href="/" className="btn-primary mt-6 inline-block">Go home</a></div></div></PublicLayout>} />
        </Routes>
        </Suspense>
      </main>
    </ErrorBoundary>
  );
}

export default App;
