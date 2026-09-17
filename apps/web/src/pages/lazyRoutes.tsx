// =============================================================================
// Lazy-loaded Route Components
// Code splitting for better performance.
// =============================================================================

import { lazy } from "react";

// =============================================================================
// Public Pages
// =============================================================================

export const HomePage = lazy(() => import("@/pages/HomePage"));
export const CampaignsPage = lazy(() => import("@/pages/CampaignsPage"));
export const CampaignDetailPage = lazy(() => import("@/pages/CampaignDetailPage").then(m => ({ default: m.CampaignDetailPage })));
export const AboutPage = lazy(() => import("@/pages/AboutPage"));
export const HowItWorksPage = lazy(() => import("@/pages/HowItWorksPage"));
export const FundVsDonatePage = lazy(() => import("@/pages/FundVsDonatePage"));
export const NationalHubPage = lazy(() => import("@/pages/NationalHubPage"));
export const BusinessHubPage = lazy(() => import("@/pages/BusinessHubPage"));
export const ConsumerHubPage = lazy(() => import("@/pages/ConsumerHubPage"));
export const FoundingProgrammePage = lazy(() => import("@/pages/FoundingProgrammePage"));
export const SplitContributionPage = lazy(() => import("@/pages/SplitContributionPage"));
export const CityHubPage = lazy(() => import("@/pages/CityHubPage"));
export const CityBusinessHubPage = lazy(() => import("@/pages/CityBusinessHubPage"));
export const UkHubMapPage = lazy(() => import("@/pages/UkHubMapPage"));
export const BusinessDiscoveryPage = lazy(() => import("@/pages/BusinessDiscoveryPage"));
export const FundingExplainerPage = lazy(() => import("@/pages/FundingExplainerPage"));

// =============================================================================
// Checkout Pages
// =============================================================================

export const ThankYouPage = lazy(() => import("@/pages/ThankYouPage").then(m => ({ default: m.ThankYouPage })));
export const PaymentFailurePage = lazy(() => import("@/pages/PaymentFailurePage").then(m => ({ default: m.PaymentFailurePage })));
export const DonationCheckoutPage = lazy(() => import("@/pages/DonationCheckoutPage").then(m => ({ default: m.DonationCheckoutPage })));
export const PledgeCheckoutPage = lazy(() => import("@/pages/PledgeCheckoutPage").then(m => ({ default: m.PledgeCheckoutPage })));
export const TaxonomyPage = lazy(() => import("@/pages/TaxonomyPage").then(m => ({ default: m.TaxonomyPage })));

// =============================================================================
// Terminal & Physical Pages
// =============================================================================

export const TerminalDonationPage = lazy(() => import("@/pages/TerminalDonationPage"));
export const MembershipPurchasePage = lazy(() => import("@/pages/MembershipPurchasePage"));
export const ContributorProfilePage = lazy(() => import("@/pages/ContributorProfilePage"));

// =============================================================================
// Auth Pages
// =============================================================================

export const LoginPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.LoginPage })));
export const RegisterPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.RegisterPage })));
export const ForgotPasswordPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.ForgotPasswordPage })));
export const ResetPasswordPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.ResetPasswordPage })));
export const VerifyEmailPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.VerifyEmailPage })));
export const CentralHubCallbackPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.CentralHubCallbackPage })));

// =============================================================================
// Admin Pages
// =============================================================================

export const DashboardHome = lazy(() => import("@/pages/admin/DashboardHome").then(m => ({ default: m.DashboardHome })));
export const CampaignsManagement = lazy(() => import("@/pages/admin/CampaignsManagement").then(m => ({ default: m.CampaignsManagement })));
export const DonationsManagement = lazy(() => import("@/pages/admin/DonationsManagement").then(m => ({ default: m.DonationsManagement })));
export const PledgesManagement = lazy(() => import("@/pages/admin/PledgesManagement").then(m => ({ default: m.PledgesManagement })));
export const UsersManagement = lazy(() => import("@/pages/admin/UsersManagement").then(m => ({ default: m.UsersManagement })));
export const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage").then(m => ({ default: m.SettingsPage })));
export const ReportsAnalyticsPage = lazy(() => import("@/pages/admin/ReportsAnalyticsPage").then(m => ({ default: m.ReportsAnalyticsPage })));
export const BackersManagementPage = lazy(() => import("@/pages/admin/BackersManagementPage").then(m => ({ default: m.BackersManagementPage })));
export const BusinessesManagementPage = lazy(() => import("@/pages/admin/BusinessesManagementPage").then(m => ({ default: m.BusinessesManagementPage })));
export const ConsumersManagementPage = lazy(() => import("@/pages/admin/ConsumersManagementPage").then(m => ({ default: m.ConsumersManagementPage })));
export const EventsManagementPage = lazy(() => import("@/pages/admin/EventsManagementPage").then(m => ({ default: m.EventsManagementPage })));
export const CityActivationPage = lazy(() => import("@/pages/admin/CityActivationPage").then(m => ({ default: m.CityActivationPage })));
export const MapManagementPage = lazy(() => import("@/pages/admin/MapManagementPage").then(m => ({ default: m.MapManagementPage })));
export const AdminLocationsPage = lazy(() => import("@/pages/admin/AdminLocationsPage").then(m => ({ default: m.AdminLocationsPage })));
export const AdminLocationDetailPage = lazy(() => import("@/pages/admin/AdminLocationDetailPage").then(m => ({ default: m.AdminLocationDetailPage })));
export const AdminRollUpConfig = lazy(() => import("@/pages/admin/AdminRollUpConfig").then(m => ({ default: m.AdminRollUpConfig })));
export const AdminSeasonManagement = lazy(() => import("@/pages/admin/AdminSeasonManagement").then(m => ({ default: m.AdminSeasonManagement })));
export const AdminFoundingPage = lazy(() => import("@/pages/admin/AdminFoundingPage").then(m => ({ default: m.AdminFoundingPage })));
export const AdminHubContentPage = lazy(() => import("@/pages/admin/AdminHubContentPage").then(m => ({ default: m.AdminHubContentPage })));

// =============================================================================
// Admin Campaigns Pages
// =============================================================================

export const AllCampaignsPage = lazy(() => import("@/pages/admin/campaigns/AllCampaignsPage").then(m => ({ default: m.AllCampaignsPage })));
export const NewAdminCampaignWizard = lazy(() => import("@/components/admin/wizard/AdminCampaignWizard").then(m => ({ default: m.AdminCampaignWizard })));
export const AdminCampaignDetailPage = lazy(() => import("@/pages/admin/campaigns/AdminCampaignDetailPage"));
export const AdminTemplatesPage = lazy(() => import("@/pages/admin/AdminTemplatesPage"));
export const AdminTargetCalculationPage = lazy(() => import("@/pages/admin/AdminTargetCalculationPage"));

// =============================================================================
// Admin UK Activation Pages
// =============================================================================

export const AdminNationalHubPage = lazy(() => import("@/pages/admin/activation/NationalHubPage").then(m => ({ default: m.NationalHubPage })));
export const AdminCitiesPage = lazy(() => import("@/pages/admin/activation/CitiesPage").then(m => ({ default: m.CitiesPage })));
export const AdminLocalAreasPage = lazy(() => import("@/pages/admin/activation/LocalAreasPage").then(m => ({ default: m.LocalAreasPage })));
export const AdminHighStreetsPage = lazy(() => import("@/pages/admin/activation/HighStreetsPage").then(m => ({ default: m.HighStreetsPage })));
export const AdminActivationProgressPage = lazy(() => import("@/pages/admin/activation/ActivationProgressPage").then(m => ({ default: m.ActivationProgressPage })));
export const AdminAddCityWizard = lazy(() => import("@/components/admin/wizard/AddCityWizard").then(m => ({ default: m.AddCityWizard })));
export const AdminCityManagementPage = lazy(() => import("@/pages/admin/activation/CityManagementPage").then(m => ({ default: m.CityManagementPage })));

// =============================================================================
// Admin Business Owners Pages
// =============================================================================

export const BusinessOwnersOverviewPage = lazy(() => import("@/pages/admin/business-owners/BusinessOwnersOverviewPage").then(m => ({ default: m.BusinessOwnersOverviewPage })));
export const BusinessOwnersListPage = lazy(() => import("@/pages/admin/business-owners/BusinessOwnersListPage").then(m => ({ default: m.BusinessOwnersListPage })));

// =============================================================================
// Admin Consumers Pages
// =============================================================================

export const ConsumerOverviewPage = lazy(() => import("@/pages/admin/consumers/ConsumerOverviewPage").then(m => ({ default: m.ConsumerOverviewPage })));
export const ConsumersListPage = lazy(() => import("@/pages/admin/consumers/ConsumersListPage").then(m => ({ default: m.ConsumersListPage })));

// Keep old names for backward compatibility
export const LocalAreasPage = lazy(() => import("@/pages/admin/activation/LocalAreasPage").then(m => ({ default: m.LocalAreasPage })));
export const HighStreetsPage = lazy(() => import("@/pages/admin/activation/HighStreetsPage").then(m => ({ default: m.HighStreetsPage })));
export const BackerDashboardPage = lazy(() => import("@/pages/BackerDashboardPage"));
export const FoundingMemberDashboardPage = lazy(() => import("@/pages/FoundingMemberDashboardPage"));
export const AdminFoundingMembersPage = lazy(() => import("@/pages/admin/AdminFoundingMembersPage"));
export const AdminMembershipPage = lazy(() => import("@/pages/admin/AdminMembershipPage"));
export const BusinessOnboardingPage = lazy(() => import("@/pages/BusinessOnboardingPage"));
export const AdminBusinessOwnerDetailPage = lazy(() => import("@/pages/admin/AdminBusinessOwnerDetailPage"));
export const MyBusinessPage = lazy(() => import("@/pages/MyBusinessPage"));
export const BusinessProfilePublicPage = lazy(() => import("@/pages/BusinessProfilePublicPage"));
export const AdminBusinessDetailPage = lazy(() => import("@/pages/admin/AdminBusinessDetailPage"));

// =============================================================================
// Business Owner Dashboard Pages
// =============================================================================

export const BusinessOwnerOverviewPage = lazy(() => import("@/pages/business-owner/BusinessOwnerOverviewPage"));
export const BusinessOwnerCampaignsPage = lazy(() => import("@/pages/business-owner/BusinessOwnerCampaignsPage"));
export const BusinessOwnerContributionsPage = lazy(() => import("@/pages/business-owner/BusinessOwnerContributionsPage"));
export const BusinessOwnerLeaderboardPage = lazy(() => import("@/pages/business-owner/BusinessOwnerLeaderboardPage"));
export const BusinessOwnerRewardsPage = lazy(() => import("@/pages/business-owner/BusinessOwnerRewardsPage"));
export const BusinessOwnerSettingsPage = lazy(() => import("@/pages/business-owner/BusinessOwnerSettingsPage"));

export const SpilloverPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.SpilloverPage })));
export const FoundingMembersPage = lazy(() => import("@/pages/admin/AdminFoundingMembersPage"));
export const MembershipPage = lazy(() => import("@/pages/admin/AdminMembershipPage"));
export const BusinessCampaignsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.BusinessCampaignsPage })));
export const InStoreContributionsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.InStoreContributionsPage })));
export const RewardsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.RewardsPage })));
export const LeaderboardsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.LeaderboardsPage })));
export const RecognitionPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.RecognitionPage })));
export const CampaignIncentivesPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.CampaignIncentivesPage })));
export const FinancialOverviewPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.FinancialOverviewPage })));
export const BalancesPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.BalancesPage })));
export const PayoutsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.PayoutsPage })));
export const RefundsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.RefundsPage })));
export const ContentCMSPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.ContentCMSPage })));
export const NotificationsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.NotificationsPage })));
export const SupportPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.SupportPage })));
export const ModerationPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.ModerationPage })));
export const SeasonalPerformancePage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.SeasonalPerformancePage })));
export const ActivationPerformancePage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.ActivationPerformancePage })));
export const CampaignPerformancePage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.CampaignPerformancePage })));
export const ParticipationMembershipPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.ParticipationMembershipPage })));
export const FinancialReportsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.FinancialReportsPage })));
export const UsersRolesPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.UsersRolesPage })));
export const IntegrationsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.IntegrationsPage })));
export const AuditLogsPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.AuditLogsPage })));
export const SecurityPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.SecurityPage })));
export const SystemHealthPage = lazy(() => import("@/pages/admin/AdminPlaceholderPages").then(m => ({ default: m.SystemHealthPage })));

// =============================================================================
// Dashboard Pages
// =============================================================================

export const DashboardOverview = lazy(() => import("@/pages/dashboard/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
export const DonationHistory = lazy(() => import("@/pages/dashboard/DonationHistory").then(m => ({ default: m.DonationHistory })));
export const PledgeHistory = lazy(() => import("@/pages/dashboard/PledgeHistory").then(m => ({ default: m.PledgeHistory })));
export const BookmarkedCampaigns = lazy(() => import("@/pages/dashboard/BookmarkedCampaigns").then(m => ({ default: m.BookmarkedCampaigns })));
export const ReceiptsPage = lazy(() => import("@/pages/dashboard/ReceiptsPage").then(m => ({ default: m.ReceiptsPage })));
export const ProfilePage = lazy(() => import("@/pages/dashboard/ProfilePage").then(m => ({ default: m.ProfilePage })));

// =============================================================================
// Fundraiser Pages
// =============================================================================

export const FundraiserOverview = lazy(() => import("@/pages/fundraiser/FundraiserOverview").then(m => ({ default: m.FundraiserOverview })));
export const FundraiserCampaigns = lazy(() => import("@/pages/fundraiser/FundraiserCampaigns").then(m => ({ default: m.FundraiserCampaigns })));
export const FundraiserEarnings = lazy(() => import("@/pages/fundraiser/FundraiserEarnings").then(m => ({ default: m.FundraiserEarnings })));
export const FundraiserWithdrawals = lazy(() => import("@/pages/fundraiser/FundraiserWithdrawals").then(m => ({ default: m.FundraiserWithdrawals })));

// =============================================================================
// Hub Pages
// =============================================================================

export const QrDonationFlow = lazy(() => import("@/components/terminal/QrDonationFlow").then(m => ({ default: m.QrDonationFlow })));

// UK Hub Campaign Discovery Flow
export const BusinessCampaignListPage = lazy(() => import("@/pages/hub/BusinessCampaignListPage"));
export const ConsumerCampaignListPage = lazy(() => import("@/pages/hub/ConsumerCampaignListPage"));
export const HubCampaignDetailPage = lazy(() => import("@/pages/hub/HubCampaignDetailPage"));

// =============================================================================
// Business Owner Journey Pages
// =============================================================================

export const BusinessCityHubPage = lazy(() => import("@/pages/business/BusinessCityHubPage"));
export const BusinessLocalAreaSelectPage = lazy(() => import("@/pages/business/BusinessLocalAreaSelectPage"));
export const BusinessHighStreetSelectPage = lazy(() => import("@/pages/business/BusinessHighStreetSelectPage"));
export const BusinessSearchPage = lazy(() => import("@/pages/business/BusinessSearchPage"));
export const BusinessClaimPage = lazy(() => import("@/pages/business/BusinessClaimPage"));
export const BusinessAddPage = lazy(() => import("@/pages/business/BusinessAddPage"));
export const BusinessClaimedPage = lazy(() => import("@/pages/business/BusinessClaimedPage"));
export const BusinessOwnerOnboardingPage = lazy(() => import("@/pages/business/BusinessOwnerOnboardingPage"));
export const SeasonContextPage = lazy(() => import("@/pages/business/SeasonContextPage"));
export const ParticipationChoicePage = lazy(() => import("@/pages/business/ParticipationChoicePage"));
export const MembershipSelectionPage = lazy(() => import("@/pages/business/MembershipSelectionPage"));
export const HighStreetPage = lazy(() => import("@/pages/business/HighStreetPage"));
export const HighStreetBusinessesPage = lazy(() => import("@/pages/business/HighStreetBusinessesPage"));
export const CentralHubSignInPage = lazy(() => import("@/pages/business/CentralHubSignInPage"));
export const CentralHubSignUpPage = lazy(() => import("@/pages/business/CentralHubSignUpPage"));
export const BusinessConfirmationPage = lazy(() => import("@/pages/business/BusinessConfirmationPage"));
export const PostcodeValidationPage = lazy(() => import("@/pages/business/PostcodeValidationPage"));
export const HighStreetConfirmPage = lazy(() => import("@/pages/business/HighStreetConfirmPage"));
export const BusinessJoinSuccessPage = lazy(() => import("@/pages/business/BusinessJoinSuccessPage"));
export const BusinessSeasonPage = lazy(() => import("@/pages/business/BusinessSeasonPage"));
export const BusinessOpportunitiesPage = lazy(() => import("@/pages/business/BusinessOpportunitiesPage"));
export const BusinessParticipationChoicePage = lazy(() => import("@/pages/business/BusinessParticipationChoicePage"));
export const BackerContributionPage = lazy(() => import("@/pages/business/BackerContributionPage"));
export const FoundingMemberPage = lazy(() => import("@/pages/business/FoundingMemberPage"));
export const FoundingMemberChoicePage = lazy(() => import("@/pages/business/FoundingMemberChoicePage"));
export const FoundingMemberMonthlyPage = lazy(() => import("@/pages/business/FoundingMemberMonthlyPage"));
export const HighStreetCampaignPage = lazy(() => import("@/pages/business/HighStreetCampaignPage"));

// =============================================================================
// Consumer Pages
// =============================================================================

export const ConsumerBenefitsPage = lazy(() => import("@/pages/consumer/ConsumerBenefitsPage"));
export const ConsumerLocalAreaPage = lazy(() => import("@/pages/consumer/ConsumerLocalAreaPage"));
export const ConsumerHighStreetPage = lazy(() => import("@/pages/consumer/ConsumerHighStreetPage"));
export const ConsumerOpportunitiesPage = lazy(() => import("@/pages/consumer/ConsumerOpportunitiesPage"));
export const ConsumerParticipationChoicePage = lazy(() => import("@/pages/consumer/ConsumerParticipationChoicePage"));
export const ConsumerBackerContributionPage = lazy(() => import("@/pages/consumer/ConsumerBackerContributionPage"));
export const ConsumerFoundingMemberChoicePage = lazy(() => import("@/pages/consumer/ConsumerFoundingMemberChoicePage"));
export const ConsumerFoundingMemberPage = lazy(() => import("@/pages/consumer/ConsumerFoundingMemberPage"));
export const ConsumerFoundingMemberMonthlyPage = lazy(() => import("@/pages/consumer/ConsumerFoundingMemberMonthlyPage"));

// =============================================================================
// Season Pages
// =============================================================================

export const AllSeasonsPage = lazy(() => import("@/pages/admin/seasons/AllSeasonsPage"));
export const CurrentSeasonPage = lazy(() => import("@/pages/admin/seasons/CurrentSeasonPage"));
export const SeasonReviewPage = lazy(() => import("@/pages/admin/seasons/SeasonReviewPage"));
export const SeasonWizardPage = lazy(() => import("@/pages/admin/seasons/SeasonWizardPage"));
