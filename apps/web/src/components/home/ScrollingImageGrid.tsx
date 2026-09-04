import { useMemo } from "react";
import {
  Heart, Building2, Users, Gift, HandCoins, Store,
  BadgePercent, Repeat, Landmark, MapPin, HandHeart, Banknote,
  Smartphone, QrCode, ShoppingBag, Coffee, BookOpen, Leaf,
} from "lucide-react";

/* ──── Card data ──── */

interface GridCard {
  icon: React.ElementType;
  label: string;
  gradient: string;
  iconColor: string;
  size: "sm" | "md" | "lg";
}

const COLUMN_A: GridCard[] = [
  { icon: Store, label: "Camden High Street Hub", gradient: "from-primary-500 to-primary-700", iconColor: "text-white", size: "lg" },
  { icon: Heart, label: "Fund or Donate", gradient: "from-secondary-400 to-secondary-600", iconColor: "text-white", size: "md" },
  { icon: Users, label: "Business Owners", gradient: "from-primary-600 to-primary-800", iconColor: "text-white", size: "sm" },
  { icon: Gift, label: "Founding Membership", gradient: "from-gray-700 to-gray-900", iconColor: "text-white", size: "md" },
  { icon: HandCoins, label: "Community Funding", gradient: "from-secondary-500 to-primary-600", iconColor: "text-white", size: "lg" },
  { icon: BadgePercent, label: "Reward Points", gradient: "from-primary-500 to-secondary-500", iconColor: "text-white", size: "sm" },
  { icon: Building2, label: "Islington Local Hub", gradient: "from-primary-700 to-primary-900", iconColor: "text-white", size: "md" },
  { icon: Repeat, label: "Share & Exchange", gradient: "from-secondary-600 to-secondary-800", iconColor: "text-white", size: "sm" },
  { icon: MapPin, label: "Hackney High Street", gradient: "from-primary-600 to-secondary-600", iconColor: "text-white", size: "lg" },
  { icon: HandHeart, label: "Donate Locally", gradient: "from-secondary-400 to-primary-500", iconColor: "text-white", size: "md" },
];

const COLUMN_B: GridCard[] = [
  { icon: Landmark, label: "Westminster Hub", gradient: "from-gray-800 to-primary-800", iconColor: "text-white", size: "md" },
  { icon: Banknote, label: "Fund Your Hub", gradient: "from-secondary-500 to-secondary-700", iconColor: "text-white", size: "lg" },
  { icon: Smartphone, label: "Mobile VCard", gradient: "from-primary-600 to-primary-800", iconColor: "text-white", size: "sm" },
  { icon: QrCode, label: "QR Code Discovery", gradient: "from-gray-700 to-primary-700", iconColor: "text-white", size: "md" },
  { icon: ShoppingBag, label: "Local Shopping", gradient: "from-secondary-600 to-primary-600", iconColor: "text-white", size: "lg" },
  { icon: Coffee, label: "Southwark Hub", gradient: "from-primary-500 to-primary-700", iconColor: "text-white", size: "sm" },
  { icon: BookOpen, label: "Lambeth Community", gradient: "from-primary-700 to-secondary-700", iconColor: "text-white", size: "md" },
  { icon: Leaf, label: "Cost-Neutral Funding", gradient: "from-secondary-500 to-secondary-700", iconColor: "text-white", size: "sm" },
  { icon: Store, label: "Greenwich Hub", gradient: "from-primary-600 to-gray-800", iconColor: "text-white", size: "md" },
  { icon: Heart, label: "MCOM Rewards", gradient: "from-secondary-400 to-primary-500", iconColor: "text-white", size: "lg" },
];

/* ──── Single card ──── */

function ArtCard({ card, compact }: { card: GridCard; compact?: boolean }) {
  const Icon = card.icon;
  const sizeClass = compact
    ? card.size === "lg"
      ? "h-24 sm:h-28"
      : card.size === "md"
      ? "h-20 sm:h-24"
      : "h-16 sm:h-20"
    : card.size === "lg"
    ? "h-44 sm:h-52"
    : card.size === "md"
    ? "h-36 sm:h-44"
    : "h-28 sm:h-36";

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${card.gradient} ${sizeClass} flex items-end p-3 sm:p-4 group cursor-default`}
    >
      {/* Decorative circles */}
      <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/10 blur-sm" />
      <div className="absolute bottom-6 left-3 w-6 h-6 rounded-full bg-white/5" />

      {/* Icon */}
      <div className={`absolute top-3 left-3 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center ${compact ? "w-7 h-7" : "w-9 h-9 sm:w-10 sm:h-10"}`}>
        <Icon className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4 sm:w-5 sm:h-5"} ${card.iconColor}`} />
      </div>

      {/* Label */}
      <span className={`relative z-10 font-semibold text-white drop-shadow-sm leading-tight ${compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}>
        {card.label}
      </span>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
}

/* ──── Scrolling column ──── */

function ScrollColumn({
  cards,
  direction,
  speed = 40,
  compact,
}: {
  cards: GridCard[];
  direction: "up" | "down";
  speed?: number;
  compact?: boolean;
}) {
  const duplicated = useMemo(() => [...cards, ...cards], [cards]);
  const animDir = direction === "up" ? "scroll-up" : "scroll-down";
  const heightClass = compact ? "h-[280px] sm:h-[340px] lg:h-[400px]" : "h-[420px] sm:h-[520px] lg:h-[620px]";

  return (
    <div className={`relative overflow-hidden ${heightClass}`} aria-hidden="true">
      {/* Top/bottom fade masks */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/90 to-transparent z-10 pointer-events-none" />

      <div
        className={`flex flex-col gap-3 animate-${animDir} group-hover:[animation-play-state:paused]`}
        style={{ animationDuration: `${speed}s` }}
      >
        {duplicated.map((card, i) => (
          <ArtCard key={`${card.label}-${i}`} card={card} compact={compact} />
        ))}
      </div>
    </div>
  );
}

/* ──── Main export ──── */

export default function ScrollingImageGrid({ compact }: { compact?: boolean } = {}) {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${compact ? "" : "sm:gap-4"}`}>
        <ScrollColumn cards={COLUMN_A} direction="up" speed={compact ? 50 : 45} compact={compact} />
        <ScrollColumn cards={COLUMN_B} direction="down" speed={compact ? 55 : 50} compact={compact} />
      </div>
    </div>
  );
}
