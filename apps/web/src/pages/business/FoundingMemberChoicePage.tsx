// =============================================================================
// Founding Member Choice Page
// Choose between Founding Member (one-time) or Founding Member Monthly.
// =============================================================================

import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle, Calendar, Clock,
  Star, CreditCard, Repeat,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { seasonApi, type Season } from "@/services/season.service";
import { useCountdown } from "@/hooks/useCountdown";

const fmtDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

type Choice = "one-time" | "monthly" | null;

export default function FoundingMemberChoicePage() {
  const { citySlug, localAreaSlug, highStreetSlug } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsumerContext = location.pathname.includes("/consumer/");
  const ctx = isConsumerContext ? "consumer" : "business";
  const [selectedChoice, setSelectedChoice] = useState<Choice>(null);

  const { data: seasonResponse } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => seasonApi.list(),
    placeholderData: undefined,
  });

  const seasons = seasonResponse?.seasons ?? [];
  const currentSeason = seasons.find((s: Season) => s.status === "ACTIVE") || seasons[0] || null;

  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Manchester";
  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const handleContinue = () => {
    if (selectedChoice === "one-time") {
      navigate(`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/founding-member`);
    } else if (selectedChoice === "monthly") {
      navigate(`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/founding-member-monthly`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <Link
          to={`/uk-hub-activation/${citySlug}/${ctx}/${localAreaSlug}/${highStreetSlug}/join/participation`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6 transition-colors sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-xl bg-white border p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 mb-3">
              <Star className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-xs font-bold text-yellow-700">FOUNDING MEMBER</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">
              Become a Founding Member
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Choose how you'd like to participate as a Founding Member for {streetName}, {cityName}.
            </p>
          </div>

          {/* Season Context */}
          {currentSeason && (
            <div className="rounded-lg bg-gray-50 border p-3 mb-6 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Current Season: <span className="font-bold text-gray-700">{currentSeason.name}</span></div>
                <div className="text-xs text-gray-600 break-words">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</div>
                {isActive && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-700 tabular-nums">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.days}d</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.hours}h</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.minutes}m</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5">{countdown.seconds}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instruction */}
          <p className="text-sm text-gray-600 mb-4 text-center">
            Select one of the options below to continue:
          </p>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Founding Member (One-Time) */}
            <button
              onClick={() => setSelectedChoice("one-time")}
              className={`rounded-xl border-2 p-5 text-left transition-all cursor-pointer h-full ${
                selectedChoice === "one-time"
                  ? "border-yellow-400 bg-yellow-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedChoice === "one-time"
                    ? "border-yellow-500 bg-yellow-500"
                    : "border-gray-300"
                }`}>
                  {selectedChoice === "one-time" && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-bold text-gray-900">Founding Member</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    A one-time contribution for a fixed membership period. Choose a tier (Bronze, Silver, Gold, or Platinum) and access level (Standard 90 days, Pro 180 days, or Pro+ Annual).
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 border border-yellow-200 px-2 py-0.5 text-[10px] font-bold text-yellow-700">90 / 180 / 365 days</span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">One-time payment</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Founding Member Monthly */}
            <button
              onClick={() => setSelectedChoice("monthly")}
              className={`rounded-xl border-2 p-5 text-left transition-all cursor-pointer h-full ${
                selectedChoice === "monthly"
                  ? "border-purple-400 bg-purple-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedChoice === "monthly"
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-300"
                }`}>
                  {selectedChoice === "monthly" && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Founding Member Monthly</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    An ongoing monthly contribution. Choose a monthly amount and continue your participation month after month with continuous benefits.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-purple-100 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">Monthly billing</span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">Cancel anytime</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedChoice}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              {selectedChoice === "one-time" && "Choose Your Membership"}
              {selectedChoice === "monthly" && "Set Up Monthly Contribution"}
              {!selectedChoice && "Select an option above"}
              {selectedChoice && <ArrowRight className="h-4 w-4" />}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
