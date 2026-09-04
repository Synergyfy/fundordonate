// =============================================================================
// FundOrDonate — Demo Content
// Isolated presentation data for homepage visual evaluation.
// This file is REPLACABLE when real API data is integrated.
//
// Demo campaigns are set across UK cities and High Streets to establish the
// FundOrDonate / MCOM / 247GBS Local Hub proposition (76 National UK City Hubs).
// These are DEMO / PRESENTATION campaigns only — not real production data.
// =============================================================================

export interface DemoBanner {
  id: string;
  eyebrow: string;
  headline: string;
  headlineAccent?: string;
  copy: string;
  primaryCta: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
  /** Gradient class for slide background */
  bg: string;
  /** Accent colour class */
  accent: string;
  /** Visual theme identifier for artwork rendering */
  visualTheme: "local-hub" | "funding" | "rewards";
}

export interface DemoCampaign {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  mode: "donation" | "fund" | "sponsor";
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  featuredImage?: string;
  category: { name: string; slug: string };
  author: { firstName: string; lastName: string };
  location?: string;
  tags?: string[];
  membership?: boolean;
  evergreen?: boolean;
  // Campaign Hierarchy
  parentId?: string;
  parentSlug?: string;
  parentTitle?: string;
  // Campaign Context
  campaignType?: string;
  participationTypes?: string[];
  backerTiersEnabled?: boolean;
  recurringEnabled?: boolean;
  // Self-Funding
  isSelfFunding?: boolean;
  selfFundingLevel?: string;
  ownerContribution?: number;
  campaignTarget?: number;
  _count?: { donations: number; pledges: number };
}

export interface DemoVideo {
  id: string;
  title: string;
  description: string;
  posterGradient: string;
  duration: string;
}

export interface DemoTestimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

// ───────────────────── Banners ─────────────────────

export const DEMO_BANNERS: DemoBanner[] = [
  {
    id: "b1",
    eyebrow: "MCOM Community Cost-Neutral Funding",
    headline: "Fund or Donate to Build",
    headlineAccent: "Stronger Local Communities",
    copy: "We set up Hyper Local National Reward and Loyalty Fund or Donate Hubs on UK High Streets so Business Owners and Local Residents can Fund or Donate to their Local Hub without the cost to their community.",
    primaryCta: { label: "Explore Campaigns", to: "/campaigns" },
    secondaryCta: { label: "Find Out What You Can Fund or Donate To", to: "/#funding" },
    bg: "from-primary-50/60 via-white to-secondary-50/30",
    accent: "from-primary-600 to-secondary-500",
    visualTheme: "local-hub",
  },
  {
    id: "b2",
    eyebrow: "Hyper Local National Reward & Loyalty Hub",
    headline: "Your Local High Street,",
    headlineAccent: "Fund or Donate",
    copy: "Individual Hyper Local National Reward and Loyalty Fund or Donate Hubs on Local High Streets. Business Owners and Local Residents fund and donate to their Local Hub when shopping locally.",
    primaryCta: { label: "Find Your Local Hub", to: "/campaigns" },
    secondaryCta: { label: "How It Works", to: "/#how-it-works" },
    bg: "from-secondary-50/40 via-white to-primary-50/30",
    accent: "from-secondary-500 to-primary-600",
    visualTheme: "funding",
  },
  {
    id: "b3",
    eyebrow: "Founding Membership & Rewards",
    headline: "Fund, Donate &",
    headlineAccent: "Receive Rewards",
    copy: "Consumer Receive A Founding Membership. Fund or Donate and receive a free Gift or MCOM Reward point. Share Exchange and Redeem Nationally — Gift Card, Vouchers, Coupons, Deals.",
    primaryCta: { label: "Join MCOM Community", to: "/auth/register" },
    secondaryCta: { label: "See Rewards", to: "/#rewards" },
    bg: "from-primary-50/30 via-white to-secondary-50/40",
    accent: "from-primary-500 to-secondary-500",
    visualTheme: "rewards",
  },
];

// ───────────────────── Demo Campaigns ─────────────────────
// All campaigns are London-borough specific for initial demo geography.

const NOW = Date.now();
const DAY = 86400000;

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
  // ── PARENT CAMPAIGN ──
  {
    id: "dc0",
    slug: "mcom-community-cost-neutral-funding",
    title: "MCOM Community Cost-Neutral Funding Programme",
    shortDescription: "The national MCOM Community Cost-Neutral Funding initiative. Supporting Local Hubs, Cities, Boroughs and Communities across the UK through Fund or Donate participation.",
    mode: "fund",
    goalAmount: 5000000,
    raisedAmount: 3250000,
    deadline: new Date(NOW + 365 * DAY).toISOString(),
    category: { name: "MCOM Programme", slug: "mcom-programme" },
    author: { firstName: "FundOrDonate", lastName: "Admin" },
    location: "United Kingdom",
    tags: ["mcom", "national", "cost-neutral", "programme"],
    evergreen: true,
    campaignType: "MCOM Programme",
    participationTypes: ["fund", "donate"],
    _count: { donations: 1240, pledges: 0 },
  },
  // ── CHILD CAMPAIGNS (under MCOM Community Cost-Neutral Funding) ──
  {
    id: "dc1",
    slug: "camden-high-street-mcom-hub",
    title: "Camden High Street MCOM Community Hub",
    shortDescription: "Establishing a Hyper Local National Reward and Loyalty Fund or Donate Hub on Camden High Street. Local businesses and residents connecting through MCOM.",
    mode: "fund",
    goalAmount: 600000,
    raisedAmount: 425000,
    deadline: new Date(NOW + 24 * DAY).toISOString(),
    category: { name: "Local Hub", slug: "local-hub" },
    author: { firstName: "Sarah", lastName: "Thompson" },
    location: "Camden",
    tags: ["local-hub", "high-street", "mcom"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Local Hub",
    participationTypes: ["fund", "donate"],
    _count: { donations: 112, pledges: 0 },
  },
  {
    id: "dc2",
    slug: "islington-local-business-fund",
    title: "Islington Local Business Fund & Donate Hub",
    shortDescription: "Supporting Islington local business owners to fund their High Street Hub. Business Contributors receive Backer Status and national reward exchange.",
    mode: "fund",
    goalAmount: 800000,
    raisedAmount: 608000,
    deadline: new Date(NOW + 18 * DAY).toISOString(),
    category: { name: "Business", slug: "business" },
    author: { firstName: "James", lastName: "Okafor" },
    location: "Islington",
    tags: ["business", "high-street", "backer-status"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Business",
    participationTypes: ["fund", "donate", "sponsor"],
    backerTiersEnabled: true,
    _count: { donations: 0, pledges: 187 },
  },
  {
    id: "dc3",
    slug: "southwark-reward-loyalty-hub",
    title: "Southwark High Street Reward & Loyalty Hub",
    shortDescription: "Setting up a Hyper Local National Reward and Loyalty Hub on Southwark High Street. Share, exchange and redeem gift cards, vouchers, and deals locally.",
    mode: "donation",
    goalAmount: 550000,
    raisedAmount: 357500,
    deadline: new Date(NOW + 30 * DAY).toISOString(),
    category: { name: "Local Hub", slug: "local-hub" },
    author: { firstName: "Priya", lastName: "Sharma" },
    location: "Southwark",
    tags: ["local-hub", "rewards", "loyalty"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Local Hub",
    participationTypes: ["fund", "donate"],
    _count: { donations: 94, pledges: 0 },
  },
  {
    id: "dc4",
    slug: "hackney-business-partner-hub",
    title: "Hackney Local Business Partner Hub",
    shortDescription: "Supporting Hackney's co-branded business partner hub. Local businesses contribute and receive Backer Status with MCOM reward integration.",
    mode: "fund",
    goalAmount: 450000,
    raisedAmount: 337500,
    deadline: new Date(NOW + 21 * DAY).toISOString(),
    category: { name: "Business", slug: "business" },
    author: { firstName: "Marcus", lastName: "Williams" },
    location: "Hackney",
    tags: ["business", "partner-hub", "backer-status"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Business",
    participationTypes: ["fund", "donate"],
    backerTiersEnabled: true,
    _count: { donations: 78, pledges: 0 },
  },
  {
    id: "dc5",
    slug: "lambeth-founding-membership",
    title: "Lambeth MCOM Founding Membership Programme",
    shortDescription: "Consumer Founding Membership drive for Lambeth. Fund or Donate and receive MCOM reward points, gift cards, vouchers, and deals.",
    mode: "donation",
    goalAmount: 700000,
    raisedAmount: 525000,
    deadline: new Date(NOW + 26 * DAY).toISOString(),
    category: { name: "Founding Membership", slug: "founding-membership" },
    author: { firstName: "Amira", lastName: "Patel" },
    location: "Lambeth",
    tags: ["founding-membership", "rewards", "mcom"],
    membership: true,
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Founding Membership",
    participationTypes: ["fund", "donate"],
    _count: { donations: 156, pledges: 0 },
  },
  {
    id: "dc6",
    slug: "westminster-business-contributors",
    title: "Westminster Business Contributors Community Hub",
    shortDescription: "Establishing a Westminster community hub with co-branded business partners. Business Contributors receive Backer Status and national reward exchange.",
    mode: "fund",
    goalAmount: 900000,
    raisedAmount: 675000,
    deadline: new Date(NOW + 35 * DAY).toISOString(),
    category: { name: "Business", slug: "business" },
    author: { firstName: "David", lastName: "Chen" },
    location: "Westminster",
    tags: ["business", "community", "backer-status"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Business",
    participationTypes: ["fund", "donate", "sponsor"],
    backerTiersEnabled: true,
    _count: { donations: 203, pledges: 0 },
  },
  {
    id: "dc7",
    slug: "greenwich-high-street-fund",
    title: "Greenwich Local High Street Fund or Donate",
    shortDescription: "Supporting the Greenwich Local Hub connecting Business Owners and Local Residents through MCOM Fund or Donate, Reward and Loyalty services.",
    mode: "donation",
    goalAmount: 500000,
    raisedAmount: 390000,
    deadline: new Date(NOW + 20 * DAY).toISOString(),
    category: { name: "Local Hub", slug: "local-hub" },
    author: { firstName: "Fatima", lastName: "Al-Hassan" },
    location: "Greenwich",
    tags: ["local-hub", "high-street", "loyalty"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Local Hub",
    participationTypes: ["fund", "donate"],
    _count: { donations: 87, pledges: 0 },
  },
  {
    id: "dc8",
    slug: "tower-hamlets-community-hub",
    title: "Tower Hamlets MCOM Community Hub",
    shortDescription: "Establishing an MCOM community hub in Tower Hamlets. Local businesses and residents fund and donate to create a local reward and loyalty ecosystem.",
    mode: "fund",
    goalAmount: 650000,
    raisedAmount: 227500,
    deadline: new Date(NOW + 40 * DAY).toISOString(),
    category: { name: "Community", slug: "community" },
    author: { firstName: "Oliver", lastName: "Taylor" },
    location: "Tower Hamlets",
    tags: ["community", "mcom", "local-hub"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Community",
    participationTypes: ["fund", "donate"],
    _count: { donations: 45, pledges: 0 },
  },
  {
    id: "dc9",
    slug: "wandsworth-mcom-hub-launch",
    title: "Wandsworth MCOM Hub Launch",
    shortDescription: "Part of the 76 National UK City Hubs initiative (The 247GBS). Establishing a Hyper Local Fund or Donate Hub on Wandsworth High Street for local businesses and residents.",
    mode: "donation",
    goalAmount: 350000,
    raisedAmount: 192500,
    deadline: new Date(NOW + 28 * DAY).toISOString(),
    category: { name: "Community", slug: "community" },
    author: { firstName: "Sophie", lastName: "Barnes" },
    location: "Wandsworth",
    tags: ["community", "local-hub", "76-city-hubs", "247gbs"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Community",
    participationTypes: ["fund", "donate"],
    _count: { donations: 63, pledges: 0 },
  },
  {
    id: "dc10",
    slug: "brent-high-street-reward-hub",
    title: "Brent High Street Reward & Loyalty Hub",
    shortDescription: "Launching a Hyper Local National Reward and Loyalty Hub on Brent High Street. Share, exchange and redeem gift cards, vouchers and deals across local shops.",
    mode: "fund",
    goalAmount: 480000,
    raisedAmount: 460800,
    deadline: new Date(NOW + 5 * DAY).toISOString(),
    category: { name: "High Street", slug: "high-street" },
    author: { firstName: "Daniel", lastName: "Okonkwo" },
    location: "Brent",
    tags: ["high-street", "rewards", "loyalty"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "High Street",
    participationTypes: ["fund", "donate"],
    _count: { donations: 0, pledges: 201 },
  },
  {
    id: "dc11",
    slug: "croydon-community-fund",
    title: "Croydon Community Fund & Donate Programme",
    shortDescription: "A community-driven fund to establish MCOM cost-neutral funding in Croydon. Local businesses and residents contributing together.",
    mode: "donation",
    goalAmount: 300000,
    raisedAmount: 285000,
    deadline: new Date(NOW + 3 * DAY).toISOString(),
    category: { name: "Community", slug: "community" },
    author: { firstName: "Emma", lastName: "Richards" },
    location: "Croydon",
    tags: ["community", "cost-neutral", "mcom"],
    evergreen: true,
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Community",
    participationTypes: ["fund", "donate"],
    _count: { donations: 178, pledges: 0 },
  },
  {
    id: "dc12",
    slug: "hammersmith-business-partner-launch",
    title: "Hammersmith & Fulham Business Partner Launch",
    shortDescription: "Co-branded business partner hub launching in Hammersmith & Fulham. Business Contributors receive Backer Status with national reward exchange benefits.",
    mode: "fund",
    goalAmount: 750000,
    raisedAmount: 112500,
    deadline: new Date(NOW + 45 * DAY).toISOString(),
    category: { name: "Business", slug: "business" },
    author: { firstName: "Lucas", lastName: "Mitchell" },
    location: "Hammersmith & Fulham",
    tags: ["business", "partner-hub", "backer-status"],
    parentId: "dc0",
    parentSlug: "mcom-community-cost-neutral-funding",
    parentTitle: "MCOM Community Cost-Neutral Funding Programme",
    campaignType: "Business",
    participationTypes: ["fund", "donate", "sponsor"],
    backerTiersEnabled: true,
    _count: { donations: 0, pledges: 34 },
  },
  // ── SELF-FUNDING CAMPAIGN ──
  {
    id: "dc13",
    slug: "merry-hill-platinum-self-fund",
    title: "Merry Hill Platinum Self-Funding Campaign",
    shortDescription: "A Platinum-level self-funding campaign. The campaign owner has contributed 10% and uses the platform to invite supporters to fund the remaining 90% through standard contributions.",
    mode: "fund",
    goalAmount: 300000,
    raisedAmount: 45000,
    deadline: new Date(NOW + 90 * DAY).toISOString(),
    category: { name: "Self-Funding", slug: "self-funding" },
    author: { firstName: "Henry", lastName: "Fundor" },
    location: "Merry Hill",
    tags: ["self-funding", "platinum", "business-owner"],
    isSelfFunding: true,
    selfFundingLevel: "platinum",
    ownerContribution: 30000,
    campaignTarget: 300000,
    campaignType: "Self-Funding",
    participationTypes: ["fund", "donate"],
    recurringEnabled: true,
    _count: { donations: 15, pledges: 0 },
  },
  // ── SEASONAL CAMPAIGN (247GBS Programme) ──
  {
    id: "dc14",
    slug: "247gbs-spring-2026-city-hubs",
    title: "247GBS Spring 2026 City Hub Launch",
    shortDescription: "Seasonal campaign for the 247GBS Spring 2026 City Hub Launch. Supporting 76 UK City Hubs through cost-neutral MCOM community funding.",
    mode: "fund",
    goalAmount: 2000000,
    raisedAmount: 800000,
    deadline: new Date(NOW + 60 * DAY).toISOString(),
    category: { name: "247GBS Programme", slug: "247gbs" },
    author: { firstName: "FundOrDonate", lastName: "Admin" },
    location: "United Kingdom",
    tags: ["247gbs", "seasonal", "76-city-hubs", "spring-2026"],
    evergreen: false,
    campaignType: "247GBS Programme",
    participationTypes: ["fund", "donate", "sponsor"],
    _count: { donations: 320, pledges: 0 },
  },
  // ── SPONSOR CAMPAIGN ──
  {
    id: "dc15",
    slug: "national-mcom-sponsor-network",
    title: "National MCOM Sponsor Network",
    shortDescription: "Sponsor-level partnerships for national MCOM reward and loyalty network. Businesses sponsor specific city hubs and receive brand visibility across the 247GBS network.",
    mode: "sponsor",
    goalAmount: 1500000,
    raisedAmount: 675000,
    deadline: new Date(NOW + 120 * DAY).toISOString(),
    category: { name: "Sponsorship", slug: "sponsorship" },
    author: { firstName: "FundOrDonate", lastName: "Admin" },
    location: "United Kingdom",
    tags: ["sponsorship", "national", "mcom", "247gbs"],
    evergreen: true,
    campaignType: "Sponsorship",
    participationTypes: ["sponsor"],
    _count: { donations: 0, pledges: 45 },
  },
];

// ───────────────────── Demo Videos ─────────────────────

export const DEMO_VIDEOS: DemoVideo[] = [
  {
    id: "v1",
    title: "How FundOrDonate Local Hubs Work",
    description: "See how Hyper Local National Reward and Loyalty Fund or Donate Hubs are set up on London High Streets for business owners and local residents.",
    posterGradient: "from-primary-700 to-primary-900",
    duration: "2:30",
  },
  {
    id: "v2",
    title: "How London Businesses & Local Residents Fund or Donate",
    description: "Business Contributors and Local Residents in Camden, Islington, and Hackney share, exchange and redeem reward points through their local MCOM community hub.",
    posterGradient: "from-secondary-600 to-primary-600",
    duration: "1:45",
  },
  {
    id: "v3",
    title: "MCOM Rewards, Membership & Share Exchange Redeem",
    description: "Consumer Founding Memberships, MCOM reward points, gift cards, vouchers, coupons and deals — share exchange and redeem nationally across 76 UK City Hubs (The 247GBS).",
    posterGradient: "from-gray-800 to-primary-700",
    duration: "3:10",
  },
];

// ───────────────────── Demo Testimonials ─────────────────────

export const DEMO_TESTIMONIALS: DemoTestimonial[] = [
  {
    quote: "FundOrDonate made it incredibly easy to set up our Camden High Street Hub. Within weeks, local businesses were contributing and residents were joining as Founding Members. The transparency built real trust.",
    name: "Sarah Thompson",
    role: "Hub Coordinator, Camden",
    initials: "ST",
  },
  {
    quote: "As a local business owner on Islington High Street, joining the MCOM community was the best decision. Our customers love the reward points and the ability to share, exchange and redeem vouchers locally.",
    name: "James Okafor",
    role: "Business Owner, Islington",
    initials: "JO",
  },
  {
    quote: "The cost-neutral funding model is brilliant. Our Southwark community hub reached its target through local business contributors and residents — no external funding needed. Fund or Donate really works.",
    name: "Priya Sharma",
    role: "Community Hub Manager, Southwark",
    initials: "PS",
  },
  {
    quote: "We raised £12,000 for our Hackney hub in under a month. The VCard integration meant business owners could share our campaign with a single scan. The Founding Membership drive exceeded expectations.",
    name: "Marcus Williams",
    role: "Local Hub Lead, Hackney",
    initials: "MW",
  },
  {
    quote: "As a business contributor in Westminster, I received Backer Status and now my customers can earn reward points through our shop. Share, exchange and redeem nationally — it's exactly what our High Street needed.",
    name: "David Chen",
    role: "Business Contributor, Westminster",
    initials: "DC",
  },
  {
    quote: "Our Greenwich Local Hub launched with 14 local businesses in the first week. The platform's ease of use meant we could focus on our community, not the technology.",
    name: "Fatima Al-Hassan",
    role: "Hub Partner, Greenwich",
    initials: "FA",
  },
];

// ───────────────────── Demo FAQ ─────────────────────

export const DEMO_FAQ = [
  {
    q: "What is FundOrDonate?",
    a: "FundOrDonate is a platform that supports Hyper Local National Reward and Loyalty Fund or Donate Hubs on UK High Streets. Business Owners and Local Residents can Fund or Donate to their Local Hub, with support for donation, fund, and sponsor modes.",
  },
  {
    q: "How do I start a Local Hub campaign?",
    a: "Click 'Start a Campaign' and follow the guided setup. You'll choose a campaign mode, set a goal, add a description, and publish when ready. It takes just a few minutes. Local Hubs are established across London with co-branded business partners.",
  },
  {
    q: "What are the fees?",
    a: "FundOrDonate charges a platform fee on successful campaigns. The exact fee depends on your membership plan — Business Contributors receive Backer Status, and Consumer Founding Members receive MCOM reward points.",
  },
  {
    q: "How do I receive funds?",
    a: "Funds are collected in your FundOrDonate wallet. You can request a withdrawal to your bank account through the dashboard. Withdrawals are processed within a few business days.",
  },
  {
    q: "What is a Founding Membership?",
    a: "Consumer Founding Members receive a free Gift or MCOM Reward point when they Fund or Donate. Members can share, exchange and redeem nationally — Gift Cards, Vouchers, Coupons, and Deals across the MCOM community network.",
  },
  {
    q: "How does cost-neutral community funding work?",
    a: "Join MCOM community's cost-neutral funding — Local Business Owners and Local Residents fund and donate to their local communities. Business Contributors receive Backer Status and national reward exchange benefits.",
  },
  {
    q: "What is the Mobile VCard integration?",
    a: "FundOrDonate integrates with Mobile VCard, allowing you to share Local Hub campaign details via digital business cards and QR codes for easy mobile discovery. Share, exchange and redeem across London and the UK.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach our support team through the contact form on this page or by emailing support@fundordonate.com. We aim to respond within 24 hours.",
  },
];

// ───────────────────── Demo Categories ─────────────────────

export const DEMO_CATEGORIES = [
  { id: "cat1", name: "Community", slug: "community", _count: { campaigns: 24 } },
  { id: "cat2", name: "Local Hub", slug: "local-hub", _count: { campaigns: 18 } },
  { id: "cat3", name: "Business", slug: "business", _count: { campaigns: 31 } },
  { id: "cat4", name: "High Street", slug: "high-street", _count: { campaigns: 12 } },
  { id: "cat5", name: "MCOM Rewards", slug: "mcom-rewards", _count: { campaigns: 15 } },
  { id: "cat6", name: "Founding Membership", slug: "founding-membership", _count: { campaigns: 22 } },
  { id: "cat7", name: "Reward & Loyalty", slug: "reward-loyalty", _count: { campaigns: 9 } },
  { id: "cat8", name: "Business Partners", slug: "business-partners", _count: { campaigns: 14 } },
];

// ───────────────────── Demo Locations ─────────────────────
// UK High Street / City locations for demo filtering. Production locations must come from API/admin config.

export const DEMO_LOCATIONS = [
  { id: "loc1", name: "Camden", slug: "camden" },
  { id: "loc2", name: "Islington", slug: "islington" },
  { id: "loc3", name: "Southwark", slug: "southwark" },
  { id: "loc4", name: "Hackney", slug: "hackney" },
  { id: "loc5", name: "Lambeth", slug: "lambeth" },
  { id: "loc6", name: "Westminster", slug: "westminster" },
  { id: "loc7", name: "Greenwich", slug: "greenwich" },
  { id: "loc8", name: "Tower Hamlets", slug: "tower-hamlets" },
  { id: "loc9", name: "Wandsworth", slug: "wandsworth" },
  { id: "loc10", name: "Brent", slug: "brent" },
  { id: "loc11", name: "Croydon", slug: "croydon" },
  { id: "loc12", name: "Hammersmith & Fulham", slug: "hammersmith-fulham" },
  { id: "loc13", name: "Birmingham", slug: "birmingham" },
  { id: "loc14", name: "Manchester", slug: "manchester" },
  { id: "loc15", name: "Leeds", slug: "leeds" },
  { id: "loc16", name: "Glasgow", slug: "glasgow" },
  { id: "loc17", name: "Liverpool", slug: "liverpool" },
  { id: "loc18", name: "Bristol", slug: "bristol" },
  { id: "loc19", name: "Sheffield", slug: "sheffield" },
  { id: "loc20", name: "Cardiff", slug: "cardiff" },
];

// ───────────────────── Demo Tags ─────────────────────
// Demo tags for frontend filtering. Production tags come from the Tag/CampaignTag models.

export const DEMO_TAGS = [
  { id: "t1", name: "Local Hub", slug: "local-hub" },
  { id: "t2", name: "High Street", slug: "high-street" },
  { id: "t3", name: "Business", slug: "business" },
  { id: "t4", name: "Community", slug: "community" },
  { id: "t5", name: "MCOM", slug: "mcom" },
  { id: "t6", name: "Rewards", slug: "rewards" },
  { id: "t7", name: "Loyalty", slug: "loyalty" },
  { id: "t8", name: "Backer Status", slug: "backer-status" },
  { id: "t9", name: "Founding Membership", slug: "founding-membership" },
  { id: "t10", name: "Partner Hub", slug: "partner-hub" },
  { id: "t11", name: "76 City Hubs", slug: "76-city-hubs" },
  { id: "t12", name: "Cost-Neutral", slug: "cost-neutral" },
  { id: "t13", name: "247GBS", slug: "247gbs" },
  { id: "t14", name: "UK National", slug: "uk-national" },
];

// ───────────────────── Data accessor ─────────────────────
// This boundary allows future replacement with real API calls.

export function getDemoFeatured(): DemoCampaign[] {
  return DEMO_CAMPAIGNS.filter((c) => c.raisedAmount / c.goalAmount > 0.5).slice(0, 6);
}

export function getDemoRecent(): DemoCampaign[] {
  return [...DEMO_CAMPAIGNS].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).slice(0, 6);
}

export function getDemoEnding(): DemoCampaign[] {
  return [...DEMO_CAMPAIGNS]
    .filter((c) => new Date(c.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);
}

export function getDemoTrending(): DemoCampaign[] {
  return [...DEMO_CAMPAIGNS].sort((a, b) => b.raisedAmount - a.raisedAmount).slice(0, 6);
}

export function getDemoPopular(): DemoCampaign[] {
  return [...DEMO_CAMPAIGNS]
    .sort((a, b) => ((b._count?.donations || 0) + (b._count?.pledges || 0)) - ((a._count?.donations || 0) + (a._count?.pledges || 0)))
    .slice(0, 6);
}

export function getDemoMostFunded(): DemoCampaign[] {
  return [...DEMO_CAMPAIGNS].sort((a, b) => b.raisedAmount - a.raisedAmount).slice(0, 6);
}

export function getDemoNewest(): DemoCampaign[] {
  return [...DEMO_CAMPAIGNS].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).slice(0, 6);
}

export function getDemoMembership(): DemoCampaign[] {
  return DEMO_CAMPAIGNS.filter((c) => c.membership || c.category.slug === "founding-membership");
}

export function getDemoEvergreen(): DemoCampaign[] {
  return DEMO_CAMPAIGNS.filter((c) => c.evergreen);
}
