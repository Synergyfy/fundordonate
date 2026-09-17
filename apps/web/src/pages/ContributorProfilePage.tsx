// =============================================================================
// Contributor Profile Page
// Shows the user's complete contribution profile: backer status, founding
// memberships, badges, and contribution history.
// =============================================================================

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { foundingApi } from "@/services/founding.service";
import { backerApi } from "@/services/backer.service";
import { ContributorStatus } from "@/components/profile/ContributorStatus";
import { VCardRecognitionDisplay } from "@/components/terminal/VCardRecognitionDisplay";
import { LifetimeStatsDisplay } from "@/components/profile/LifetimeStatsDisplay";
import type { BackerBadgeTier } from "@/components/hub/BackerBadge";
import { Link } from "react-router-dom";
import { Heart, Award, ArrowLeft, Building2, User } from "lucide-react";

interface ContributionProfile {
  backerTier: BackerBadgeTier | null;
  totalCampaignsBacked: number;
  totalContributed: number;
  citiesBacked: string[];
  foundingMemberships: {
    id: string;
    programmeId: string;
    locationId: string;
    locationName?: string;
    audience: "BUSINESS" | "CONSUMER";
    status: string;
    contributionAmount: number;
    isOriginal: boolean;
    isMonthly: boolean;
    grantedAt: string;
    benefits: string[];
  }[];
  badges: {
    id: string;
    type: string;
    tier?: string;
    locationName?: string;
    isOriginal?: boolean;
    awardedAt: string;
  }[];
  isOriginalFoundingMember: boolean;
}

export default function ContributorProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ContributionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      foundingApi.getContributorProfile(user.id),
      backerApi.getMyBackerStatus(),
    ]).then(([foundingProfile, backerStatus]) => {
      // Merge the data
      const mergedProfile: ContributionProfile = {
        backerTier: (backerStatus?.statusType || foundingProfile?.backerTier || null) as BackerBadgeTier | null,
        totalCampaignsBacked: foundingProfile?.totalCampaignsBacked || 0,
        totalContributed: foundingProfile?.totalContributed || 0,
        citiesBacked: foundingProfile?.citiesBacked || [],
        foundingMemberships: (foundingProfile?.foundingMemberships || []).map((fm) => ({
          ...fm,
          locationName: fm.locationName || "Unknown Location",
        })),
        badges: foundingProfile?.badges || [],
        isOriginalFoundingMember: foundingProfile?.isOriginalFoundingMember || false,
      };
      setProfile(mergedProfile);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Sign In Required</h2>
          <p className="mt-2 text-gray-600">Please sign in to view your contributor profile.</p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Your Contributor Profile</h1>
          <p className="mt-1 text-gray-600">Track your contributions, memberships, and recognition across all hubs.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <ContributorStatus data={profile} />
            <LifetimeStatsDisplay userId={user.id} />
            <VCardRecognitionDisplay userId={user.id} />
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-bold text-gray-900">Get Started</h3>
            <p className="mt-2 text-gray-600 max-w-sm mx-auto">
              Back campaigns or join founding programmes to earn your first badges and recognition.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/campaigns" className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">
                Browse Campaigns
              </Link>
              <Link to="/uk-hub-activation" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Join a Hub
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {profile && profile.foundingMemberships.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Founding Hubs</h2>
            <div className="grid grid-cols-1 gap-3">
              {profile.foundingMemberships.map((fm) => (
                <Link
                  key={fm.id}
                  to={`/hub/${fm.locationId}`}
                  className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    fm.audience === "BUSINESS" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  }`}>
                    {fm.audience === "BUSINESS" ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{fm.locationName}</div>
                    <div className="text-sm text-gray-500">
                      {fm.audience} Member
                      {fm.isOriginal && " · ⭐ Original"}
                      {fm.isMonthly && " · Monthly"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      £{(fm.contributionAmount / 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(fm.grantedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
