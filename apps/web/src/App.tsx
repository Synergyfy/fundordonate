import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "@/components/auth/ProtectedRoute";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { CampaignBuilder } from "@/components/campaign/CampaignBuilder";
import { SessionExpiredMessage } from "@/components/ui/SessionExpiredMessage";
import HomePage from "@/pages/HomePage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { CampaignDetailPage } from "@/pages/CampaignDetailPage";
import AboutPage from "@/pages/AboutPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import FundVsDonatePage from "@/pages/FundVsDonatePage";
import NationalHubPage from "@/pages/NationalHubPage";
import BusinessHubPage from "@/pages/BusinessHubPage";
import ConsumerHubPage from "@/pages/ConsumerHubPage";
import FoundingProgrammePage from "@/pages/FoundingProgrammePage";
import SplitContributionPage from "@/pages/SplitContributionPage";
import CityHubPage from "@/pages/CityHubPage";
import UkHubMapPage from "@/pages/UkHubMapPage";

import { ThankYouPage } from "@/pages/ThankYouPage";
import { PaymentFailurePage } from "@/pages/PaymentFailurePage";
import { DonationCheckoutPage } from "@/pages/DonationCheckoutPage";
import { PledgeCheckoutPage } from "@/pages/PledgeCheckoutPage";
import { TaxonomyPage } from "@/pages/TaxonomyPage";
import { DashboardHome } from "@/pages/admin/DashboardHome";
import { CampaignsManagement } from "@/pages/admin/CampaignsManagement";
import { DonationsManagement } from "@/pages/admin/DonationsManagement";
import { PledgesManagement } from "@/pages/admin/PledgesManagement";
import { UsersManagement } from "@/pages/admin/UsersManagement";
import { SettingsPage } from "@/pages/admin/SettingsPage";
import { ReportsAnalyticsPage } from "@/pages/admin/ReportsAnalyticsPage";
import { BackersManagementPage } from "@/pages/admin/BackersManagementPage";
import { BusinessesManagementPage } from "@/pages/admin/BusinessesManagementPage";
import { ConsumersManagementPage } from "@/pages/admin/ConsumersManagementPage";
import { EventsManagementPage } from "@/pages/admin/EventsManagementPage";
import { CityActivationPage } from "@/pages/admin/CityActivationPage";
import { MapManagementPage } from "@/pages/admin/MapManagementPage";
import { AdminLocationsPage } from "@/pages/admin/AdminLocationsPage";
import { AdminLocationDetailPage } from "@/pages/admin/AdminLocationDetailPage";
import { AdminFoundingPage } from "@/pages/admin/AdminFoundingPage";
import { AdminHubContentPage } from "@/pages/admin/AdminHubContentPage";
import { AdminCampaignWizard } from "@/components/admin/AdminCampaignWizard";
import { FundraiserOverview } from "@/pages/fundraiser/FundraiserOverview";
import { FundraiserCampaigns } from "@/pages/fundraiser/FundraiserCampaigns";
import { FundraiserEarnings } from "@/pages/fundraiser/FundraiserEarnings";
import { FundraiserWithdrawals } from "@/pages/fundraiser/FundraiserWithdrawals";
import { DashboardOverview } from "@/pages/dashboard/DashboardOverview";
import { DonationHistory } from "@/pages/dashboard/DonationHistory";
import { PledgeHistory } from "@/pages/dashboard/PledgeHistory";
import { BookmarkedCampaigns } from "@/pages/dashboard/BookmarkedCampaigns";
import { ReceiptsPage } from "@/pages/dashboard/ReceiptsPage";
import { ProfilePage } from "@/pages/dashboard/ProfilePage";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  CentralHubCallbackPage,
} from "@/pages/auth";

function App() {
  return (
    <>
      <AuthInitializer />
      <Routes>
        {/* ─── Public routes with shared layout ─── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:slug" element={<CampaignDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/uk-hub-activation" element={<NationalHubPage />} />
          <Route path="/uk-hub-activation/business" element={<BusinessHubPage />} />
          <Route path="/uk-hub-activation/consumer" element={<ConsumerHubPage />} />
          <Route path="/uk-hub-activation/map" element={<UkHubMapPage />} />
          <Route path="/founding/:programmeId" element={<FoundingProgrammePage />} />
          <Route path="/split" element={<SplitContributionPage />} />
          <Route path="/uk-hub-activation/*" element={<CityHubPage />} />
          <Route path="/fund-vs-donate" element={<FundVsDonatePage />} />
          <Route path="/donate" element={<DonationCheckoutPage />} />
          <Route path="/pledge" element={<PledgeCheckoutPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/payment-failed" element={<PaymentFailurePage />} />
        </Route>

        {/* ─── Guest routes (redirect if authenticated) ─── */}
        <Route
          path="/auth/login"
          element={
            <GuestRoute>
              <PublicLayout><LoginPage /></PublicLayout>
            </GuestRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <GuestRoute>
              <PublicLayout><RegisterPage /></PublicLayout>
            </GuestRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={<PublicLayout><ForgotPasswordPage /></PublicLayout>}
        />
        <Route
          path="/auth/reset-password"
          element={<PublicLayout><ResetPasswordPage /></PublicLayout>}
        />
        <Route
          path="/auth/verify-email"
          element={<PublicLayout><VerifyEmailPage /></PublicLayout>}
        />
        <Route
          path="/auth/central-hub/callback"
          element={<CentralHubCallbackPage />}
        />

        {/* ─── Session expired ─── */}
        <Route
          path="/auth/session-expired"
          element={<SessionExpiredMessage />}
        />

        {/* ─── Protected campaign creation ─── */}
        <Route
          path="/campaigns/create"
          element={
            <ProtectedRoute>
              <PublicLayout><CampaignBuilder /></PublicLayout>
            </ProtectedRoute>
          }
        />

        {/* ─── Authenticated Dashboard Routes ───
            All authenticated routes share the AuthenticatedLayout shell.
            The layout uses the user's userType/role to render the correct navigation.
            Authorization is enforced by ProtectedRoute + requiredUserTypes/requiredRoles.
        */}

        {/* Admin Routes — userType: admin */}
        <Route
          element={
            <ProtectedRoute requiredUserTypes={["admin"]}>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<DashboardHome />} />
          <Route path="/admin/campaigns" element={<CampaignsManagement />} />
          <Route path="/admin/campaigns/new" element={<AdminCampaignWizard />} />
          <Route path="/admin/campaigns/:id/edit" element={<AdminCampaignWizard />} />
          <Route path="/admin/donations" element={<DonationsManagement />} />
          <Route path="/admin/pledges" element={<PledgesManagement />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/categories" element={<TaxonomyPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/hub-locations" element={<AdminLocationsPage />} />
          <Route path="/admin/hub-locations/:id" element={<AdminLocationDetailPage />} />
          <Route path="/admin/founding" element={<AdminFoundingPage />} />
          <Route path="/admin/hub-content" element={<AdminHubContentPage />} />
          <Route path="/admin/reports" element={<ReportsAnalyticsPage />} />
          <Route path="/admin/backers" element={<BackersManagementPage />} />
          <Route path="/admin/businesses" element={<BusinessesManagementPage />} />
          <Route path="/admin/consumers" element={<ConsumersManagementPage />} />
          <Route path="/admin/events" element={<EventsManagementPage />} />
          <Route path="/admin/activation" element={<CityActivationPage />} />
          <Route path="/admin/map" element={<MapManagementPage />} />
        </Route>

        {/* Fundraiser Routes — userType: business, role: fundraiser */}
        <Route
          element={
            <ProtectedRoute requiredUserTypes={["business"]} requiredRoles={["fundraiser"]}>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/fundraiser" element={<FundraiserOverview />} />
          <Route path="/fundraiser/campaigns" element={<FundraiserCampaigns />} />
          <Route path="/fundraiser/earnings" element={<FundraiserEarnings />} />
          <Route path="/fundraiser/withdrawals" element={<FundraiserWithdrawals />} />
        </Route>

        {/* Consumer / Default Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/donations" element={<DonationHistory />} />
          <Route path="/dashboard/pledges" element={<PledgeHistory />} />
          <Route path="/dashboard/bookmarks" element={<BookmarkedCampaigns />} />
          <Route path="/dashboard/receipts" element={<ReceiptsPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
        </Route>

        {/* ─── 404 ─── */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300">404</h1>
                  <p className="mt-4 text-lg text-gray-600">Page not found</p>
                  <a href="/" className="btn-primary mt-6 inline-block">
                    Go home
                  </a>
                </div>
              </div>
            </PublicLayout>
          }
        />
      </Routes>
    </>
  );
}

export default App;
