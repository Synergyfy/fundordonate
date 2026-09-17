// =============================================================================
// Business Claimed Page
// Shown after a business is successfully claimed or created.
// =============================================================================

import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { seasonApi } from "@/services/season.service";
import {
  Store, MapPin, CheckCircle, ArrowRight,
  Clock, Users, Target, TrendingUp, Calendar,
} from "lucide-react";

const DEMO_BUSINESSES: Record<string, { id: string; name: string; category: string; location: string }> = {
  b1: { id: "b1", name: "Vinyl Records Ltd", category: "Music & Entertainment", location: "142 Oldham Street" },
  b2: { id: "b2", name: "Retro Revival", category: "Vintage Clothing", location: "78 Oldham Street" },
  b3: { id: "b3", name: "The Coffee House", category: "Café & Food", location: "55 Oldham Street" },
  b4: { id: "b4", name: "Craft Beer Co", category: "Bar & Drinks", location: "23 Oldham Street" },
  b5: { id: "b5", name: "Northern Quarter Books", category: "Books & Stationery", location: "91 Oldham Street" },
  b6: { id: "b6", name: "Tib Street Deli", category: "Food & Groceries", location: "12 Tib Street" },
  b7: { id: "b7", name: "Urban Cuts", category: "Hair & Beauty", location: "45 Tib Street" },
  b8: { id: "b8", name: "Tech Repair Hub", category: "Electronics", location: "78 Tib Street" },
  b9: { id: "b9", name: "Square Gallery", category: "Art & Culture", location: "4 Stevenson Square" },
  b10: { id: "b10", name: "Creative Space", category: "Co-working", location: "12 Stevenson Square" },
  b11: { id: "b11", name: "Ancoats Bakehouse", category: "Bakery & Food", location: "8 Ancoats Row" },
  b12: { id: "b12", name: "Pizza Express", category: "Restaurant", location: "22 Ancoats Row" },
  b13: { id: "b13", name: "The Vine", category: "Bar & Drinks", location: "35 Ancoats Row" },
  b14: { id: "b14", name: "Cutting Room Café", category: "Café & Food", location: "2 Cutting Room Square" },
  b15: { id: "b15", name: "Artisan Coffee", category: "Coffee Shop", location: "15 Cutting Room Square" },
  b16: { id: "b16", name: "Waterside Restaurant", category: "Restaurant", location: "42 Deansgate" },
  b17: { id: "b17", name: "Castlefield Bar", category: "Bar & Drinks", location: "78 Deansgate" },
  b18: { id: "b18", name: "Hotel & Spa", category: "Hospitality", location: "100 Deansgate" },
  b19: { id: "b19", name: "Whitworth Gym", category: "Health & Fitness", location: "15 Whitworth Street" },
  b20: { id: "b20", name: "Office Supplies Co", category: "Office & Business", location: "45 Whitworth Street" },
  b21: { id: "b21", name: "Chapel Street Pharmacy", category: "Health & Pharmacy", location: "12 Chapel Street" },
  b22: { id: "b22", name: "Salford Electronics", category: "Electronics", location: "56 Chapel Street" },
  b23: { id: "b23", name: "Pendleton Corner Shop", category: "Convenience Store", location: "8 Pendleton Road" },
  b24: { id: "b24", name: "Pendleton Dental", category: "Health & Dental", location: "22 Pendleton Road" },
  b25: { id: "b25", name: "Stockport Antiques", category: "Antiques & Collectables", location: "5 Great Underbank" },
  b26: { id: "b26", name: "The Cheese Shop", category: "Food & Groceries", location: "18 Great Underbank" },
  b27: { id: "b27", name: "Merseyway Fashion", category: "Fashion & Clothing", location: "3 Merseyway" },
  b28: { id: "b28", name: "Sport & Outdoor", category: "Sports & Leisure", location: "25 Merseyway" },
  b29: { id: "b29", name: "Bolton Library Café", category: "Café & Food", location: "2 Le Mans Crescent" },
  b30: { id: "b30", name: "Civic Office Supplies", category: "Office & Business", location: "15 Le Mans Crescent" },
  b31: { id: "b31", name: "Bradshawgate Retail", category: "Retail", location: "8 Bradshawgate" },
  b32: { id: "b32", name: "Bolton Electronics", category: "Electronics", location: "32 Bradshawgate" },
};

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function BusinessClaimedPage() {
  const { citySlug, localAreaSlug, highStreetSlug, businessId } = useParams<{
    citySlug: string;
    localAreaSlug: string;
    highStreetSlug: string;
    businessId: string;
  }>();

  const business = businessId === "new"
    ? { id: "new", name: "Your New Business", category: "Business", location: "Your Location" }
    : DEMO_BUSINESSES[businessId || "b4"];

  const { data: currentSeason } = useQuery({
    queryKey: ["currentSeason"],
    queryFn: () => seasonApi.getCurrent(),
    placeholderData: null,
  });

  const countdown = useCountdown(currentSeason?.endDate || new Date().toISOString());
  const isActive = currentSeason?.status === "ACTIVE" && new Date(currentSeason.endDate) > new Date();

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const streetName = highStreetSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "High Street";
  const localAreaName = localAreaSlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Local Area";
  const cityName = citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "City";

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-2 text-lg font-bold text-gray-900">Business not found</h2>
          <Link to={`/business/${citySlug}`} className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-500">
            Back to {cityName} Business Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-green-600 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-white/20 p-2">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-green-100">Success</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Business Claimed!</h1>
            </div>
          </div>
          <p className="text-green-100 max-w-2xl">
            Your business has been successfully claimed. You can now start participating in your local community.
          </p>

          {/* Season Info */}
          {currentSeason && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2">
                <Calendar className="h-4 w-4 text-green-100" />
                <span className="text-sm font-bold">{currentSeason.name}</span>
                <span className="text-xs text-green-100">{fmtDate(currentSeason.startDate)} — {fmtDate(currentSeason.endDate)}</span>
              </div>
              {isActive && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-100" />
                  <div className="flex gap-1">
                    {[
                      { value: countdown.days, label: "d" },
                      { value: countdown.hours, label: "h" },
                      { value: countdown.minutes, label: "m" },
                    ].map((item) => (
                      <span key={item.label} className="rounded bg-white/20 px-2 py-1 text-xs font-bold tabular-nums">
                        {String(item.value).padStart(2, "0")}{item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Business Info Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Store className="h-4 w-4" /> {business.category}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {business.location}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {cityName} → {localAreaName} → {streetName}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
              <CheckCircle className="h-4 w-4" /> Claimed
            </span>
          </div>
        </div>

        {/* What's Next */}
        <div className="rounded-xl bg-white p-6 shadow-sm border mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What's next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Create a Campaign</h4>
                <p className="text-xs text-gray-500">Start a campaign for your business or community.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Connect with Neighbours</h4>
                <p className="text-xs text-gray-500">Join your local business community.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Track Your Impact</h4>
                <p className="text-xs text-gray-500">See how your contributions help your community.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/dashboard`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/business/${citySlug}/local-area/${localAreaSlug}/high-street/${highStreetSlug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to {streetName}
          </Link>
        </div>
      </div>
    </div>
  );
}
