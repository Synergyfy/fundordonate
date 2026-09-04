import { useState } from "react";
import {
  Play, Heart, Building2, Users, Gift, Store,
  BadgePercent, Repeat, HandHeart, Award, Sparkles,
  Camera, ChevronRight,
} from "lucide-react";

/* ──── Slide 1: Video poster ──── */

function VideoSlide() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 shadow-xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold mb-2">How FundOrDonate Local Hubs Work</h3>
        <p className="text-sm text-white/70 max-w-xs">See how Hyper Local National Reward and Loyalty Hubs are set up on UK High Streets.</p>
      </div>

      {/* Play button */}
      <button
        className="absolute inset-0 flex items-center justify-center"
        aria-label="Play video"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-play-ring" />
          <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-transform duration-300 ${hovered ? "scale-110" : ""}`}>
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </div>
        </div>
      </button>

      {/* Duration badge */}
      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-white/80">
        2:30
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

/* ──── Slide 2: Funding graphic ──── */

function FundingSlide() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary-400 to-primary-500 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
      {/* Decorative circles */}
      <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/10 blur-sm" />
      <div className="absolute bottom-12 left-6 w-16 h-16 rounded-full bg-white/5" />

      {/* Top: Badge */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
          <Heart className="w-4 h-4 text-white" fill="white" />
          <span className="text-xs font-semibold text-white">MCOM Community</span>
        </div>
      </div>

      {/* Middle: Funding progress */}
      <div className="relative z-10 space-y-3">
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Camden High Street Hub</div>
              <div className="text-xs text-gray-400">Local Business Fund</div>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full w-[72%] bg-gradient-to-r from-secondary-400 to-primary-500 rounded-full" />
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-secondary-600">£4,250 raised</span>
            <span className="text-gray-400">of £6,000</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
            <Users className="w-5 h-5 text-primary-500 mx-auto mb-1" />
            <div className="text-xs font-bold text-gray-900">247</div>
            <div className="text-[10px] text-gray-400">Backers</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
            <HandHeart className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
            <div className="text-xs font-bold text-gray-900">72%</div>
            <div className="text-[10px] text-gray-400">Funded</div>
          </div>
        </div>
      </div>

      {/* Bottom: CTA hint */}
      <div className="relative z-10 flex items-center gap-1.5 text-white/80">
        <span className="text-xs font-medium">Fund or Donate</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}

/* ──── Slide 3: Membership / Rewards graphic ──── */

function RewardsSlide() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-primary-700 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
      {/* Decorative */}
      <div className="absolute top-6 right-6 w-20 h-20 rounded-full bg-white/5 blur-sm" />

      {/* Top: Membership card */}
      <div className="relative z-10">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-xl p-4 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">Founding Member</div>
              <div className="text-xs opacity-75">MCOM Community</div>
            </div>
          </div>
          <div className="h-px bg-white/20 mb-2" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] opacity-70">Status</div>
              <div className="text-sm font-bold">Active</div>
            </div>
            <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2.5 py-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span className="text-xs font-bold">1,250 pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Reward items */}
      <div className="relative z-10 flex gap-2">
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
          <Camera className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
          <div className="text-[10px] font-bold text-gray-900">E-Cards</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
          <Gift className="w-5 h-5 text-primary-500 mx-auto mb-1" />
          <div className="text-[10px] font-bold text-gray-900">Gift Cards</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-lg">
          <BadgePercent className="w-5 h-5 text-secondary-500 mx-auto mb-1" />
          <div className="text-[10px] font-bold text-gray-900">Vouchers</div>
        </div>
      </div>

      {/* Bottom: Share & Exchange */}
      <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
        <Repeat className="w-4 h-4 text-white" />
        <span className="text-xs font-semibold text-white">Share, Exchange & Redeem Nationally</span>
      </div>
    </div>
  );
}

/* ──── Main export ──── */

export default function HeroVisual({ slideIndex }: { slideIndex: number }) {
  return (
    <div className="relative hidden lg:block w-full max-w-lg">
      {slideIndex % 3 === 0 && <VideoSlide />}
      {slideIndex % 3 === 1 && <FundingSlide />}
      {slideIndex % 3 === 2 && <RewardsSlide />}
    </div>
  );
}
