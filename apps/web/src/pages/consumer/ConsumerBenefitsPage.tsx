// =============================================================================
// Consumer Benefits Page
// Explains what consumers can do + Join as a Consumer CTA.
// =============================================================================

import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Heart, Users, Trophy, Target,
  MapPin, Calendar, Star, TrendingUp, Gift,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import { useCountdown } from "@/hooks/useCountdown";

const CONSUMER_BENEFITS = [
  {
    icon: Heart,
    title: "Support Local Campaigns",
    description: "Donate to or back campaigns that matter to your community.",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    icon: Users,
    title: "Community Participation",
    description: "Participate in the local community and help shape your high street.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Star,
    title: "Become a Founding Member",
    description: "Join as a Founding Member and receive exclusive benefits and recognition.",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Trophy,
    title: "Earn Rewards",
    description: "Earn applicable rewards, badges, and leaderboard points for your contributions.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: TrendingUp,
    title: "Track Community Impact",
    description: "See your contribution to the city, local area, and high street.",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Calendar,
    title: "Seasonal Participation",
    description: "Participate in the current season and earn seasonal rewards.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

export default function ConsumerBenefitsPage() {
  const { citySlug } = useParams<{ citySlug: string }>();

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white">
        <div className="relative mx-auto max-w-4xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <Link
            to={`/uk-hub-activation/${citySlug}`}
            className="inline-flex items-center gap-1.5 text-xs text-green-300 hover:text-white mb-6 transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {cityName}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 mb-4">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">CONSUMER</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-3">
            Join as a Consumer
          </h1>
          <p className="text-green-100 text-sm sm:text-base max-w-2xl">
            Be part of the community driving change on your high street. Support local campaigns,
            earn rewards, and make a real difference in {cityName}.
          </p>

          {/* Season Context */}
          {currentSeason && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <Calendar className="h-4 w-4 text-green-300" />
                <span className="text-xs font-bold sm:text-sm">Current Season: {currentSeason.name}</span>
                {isActive && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-200 tabular-nums">
                    <span className="rounded bg-white/10 px-1 py-0.5">{countdown.days}d</span>
                    <span className="rounded bg-white/10 px-1 py-0.5">{countdown.hours}h</span>
                    <span className="rounded bg-white/10 px-1 py-0.5">{countdown.minutes}m</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
                <MapPin className="h-4 w-4 text-green-300" />
                <span className="text-xs sm:text-sm">{cityName}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Benefits Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">Consumer Benefits</h2>
          <p className="text-sm text-gray-500 mb-6">Here's what you can do as a consumer on FundOrDonate:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONSUMER_BENEFITS.map((benefit) => (
              <div key={benefit.title} className="rounded-xl bg-white border p-5 hover:shadow-md transition-shadow">
                <div className={`h-10 w-10 rounded-lg ${benefit.bg} flex items-center justify-center mb-3`}>
                  <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">How It Works</h2>
          <p className="text-sm text-gray-500 mb-6">Get started in a few simple steps:</p>

          <div className="space-y-4">
            {[
              { step: "1", title: "Choose a Local Area", desc: "Browse local areas/boroughs within your city and find one you want to support." },
              { step: "2", title: "Select a High Street", desc: "Explore high streets in your chosen local area and see what's happening." },
              { step: "3", title: "Find a Campaign", desc: "Browse campaigns on the high street and find one that resonates with you." },
              { step: "4", title: "Contribute", desc: "Back the campaign or become a Founding Member and start making a difference." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 rounded-xl bg-white border p-4">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-green-700">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What You Can Earn */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl mb-2">What You Can Earn</h2>
          <p className="text-sm text-gray-500 mb-6">Rewards and recognition for your participation:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Trophy, title: "Backer Badges", desc: "Earn badges for backing campaigns" },
              { icon: Star, title: "Founding Member Status", desc: "Become a recognised founding member" },
              { icon: TrendingUp, title: "Leaderboard Points", desc: "Climb the community leaderboard" },
              { icon: Gift, title: "Exclusive Rewards", desc: "Unlock rewards based on your contributions" },
              { icon: Target, title: "Impact Tracking", desc: "See the real impact of your support" },
              { icon: Heart, title: "Community Recognition", desc: "Get recognised for supporting your community" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
                <item.icon className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-green-900">{item.title}</div>
                  <div className="text-[10px] text-green-700">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-gradient-to-r from-green-600 to-green-800 p-6 sm:p-8 text-center text-white">
          <h2 className="text-xl font-bold sm:text-2xl mb-2">Ready to Get Started?</h2>
          <p className="text-green-100 text-sm mb-6 max-w-md mx-auto">
            Join as a consumer and start supporting your local community today.
          </p>
          <Link
            to={`/uk-hub-activation/${citySlug}/consumer/local-areas`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-green-700 hover:bg-green-50 transition-colors"
          >
            Join as a Consumer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
