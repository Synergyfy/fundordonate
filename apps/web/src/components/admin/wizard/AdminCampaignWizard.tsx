// =============================================================================
// AdminCampaignWizard — Campaign Creation/Editing Wizard
// Orchestrates the 11-step guided wizard for creating and editing campaigns.
// Uses WizardShell for navigation and delegates to individual step components.
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocationTree } from "@/hooks/useLocationTree";
import {
  WIZARD_STEPS,
  createDefaultWizardData,
  validateStep,
  type CampaignWizardData,
  type CampaignReward,
  type CampaignRewardItem,
  type LocationCoverage,
  type StepId,
  type StepDef,
} from "@/types/campaign-wizard";
import {
  Search,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Building2,
  Image,
  Video,
  Gift,
  X,
  Clock,
  Shield,
  Users,
  ArrowLeft,
  Edit3,
  Copy,
  GripVertical,
  Tag,
  Calendar,
} from "lucide-react";
import { WizardShell } from "./WizardShell";

// ── Shared Types ──

interface StepProps {
  formData: CampaignWizardData;
  onUpdate: (updates: Partial<CampaignWizardData>) => void;
  onNavigateToStep?: (stepId: StepId) => void;
  onSubmit?: () => void;
}

// ── Demo Cities ──

const DEMO_CITIES = [
  { id: "city-birmingham", name: "Birmingham", slug: "birmingham" },
  { id: "city-manchester", name: "Manchester", slug: "manchester" },
  { id: "city-london", name: "London", slug: "london" },
  { id: "city-leeds", name: "Leeds", slug: "leeds" },
  { id: "city-liverpool", name: "Liverpool", slug: "liverpool" },
  { id: "city-bristol", name: "Bristol", slug: "bristol" },
  { id: "city-sheffield", name: "Sheffield", slug: "sheffield" },
  { id: "city-newcastle", name: "Newcastle", slug: "newcastle" },
  { id: "city-nottingham", name: "Nottingham", slug: "nottingham" },
  { id: "city-coventry", name: "Coventry", slug: "coventry" },
];

// ── Scope Options ──

const SCOPE_OPTIONS = [
  {
    value: "city" as const,
    icon: Building2,
    label: "City Campaign",
    description: "Campaign operates within a specific city and its local areas.",
  },
  {
    value: "independent" as const,
    icon: MapPin,
    label: "Independent Campaign",
    description: "Campaign operates independently, not tied to a specific city.",
  },
];

// ── Category & Season Options ──

const CATEGORIES = [
  { value: "community", label: "Community" },
  { value: "environment", label: "Environment" },
  { value: "education", label: "Education" },
  { value: "arts", label: "Arts & Culture" },
  { value: "health", label: "Health & Wellbeing" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business & Enterprise" },
  { value: "youth", label: "Youth" },
];

const SEASONS = [
  { value: "summer-2026", label: "Summer 2026", startDate: "2026-06-01", endDate: "2026-08-31" },
  { value: "autumn-2026", label: "Autumn 2026", startDate: "2026-09-01", endDate: "2026-11-30" },
  { value: "winter-2026", label: "Winter 2026", startDate: "2026-12-01", endDate: "2027-02-28" },
  { value: "spring-2027", label: "Spring 2027", startDate: "2027-03-01", endDate: "2027-05-31" },
];

// ── Demo Campaigns (for duplicate flow) ──

interface DemoCampaign {
  id: string;
  title: string;
  scope: "city" | "independent";
  citySlug: string;
  cityName: string;
  audience: "business" | "consumer" | "both";
  status: string;

  // Step 2 — Location Coverage
  locationCoverage: LocationCoverage;

  // Step 3 — Details
  shortDescription: string;
  description: string;
  categoryId: string;
  seasonIds: string[];

  // Step 5 — Participation
  participation: {
    backCampaign: boolean;
    foundingMember: boolean;
    foundingMemberMonthly: boolean;
  };

  // Step 6 — Funding
  funding: {
    hasTarget: boolean;
    targetAmount: string;
    startingAmount: string;
    stretchTarget: string;
    minContribution: string;
    maxContribution: string;
    suggestedAmounts: string[];
    allowCustomAmount: boolean;
  };

  // Step 7 — Period
  period: {
    periodMode: "season" | "custom";
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };

  // Step 8 — Rules
  rules: {
    contributionLimit: string;
    participationLimit: string;
    campaignCapacity: string;
    multipleContributions: boolean;
    multipleRewards: boolean;
  };

  // Step 9 — Rewards
  rewards: CampaignReward[];
  qualificationMode: "highest" | "cumulative";
  hasRewards: boolean;
}

const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    id: "c1",
    title: "Manchester Tech Hub Launch",
    scope: "city",
    citySlug: "manchester",
    cityName: "Manchester",
    audience: "business",
    status: "active",
    locationCoverage: {
      mode: "selected",
      selectedLocalAreas: ["la-ancoats", "la-northern-quarter"],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "Launching a co-working tech hub to support Manchester's growing digital sector.",
    description: "Manchester Tech Hub is a community-driven initiative to create a state-of-the-art co-working space in the heart of the city, supporting startups and freelancers with affordable workspace and mentorship.",
    categoryId: "technology",
    seasonIds: ["summer-2026"],
    participation: { backCampaign: true, foundingMember: true, foundingMemberMonthly: true },
    funding: {
      hasTarget: true,
      targetAmount: "50000",
      startingAmount: "12000",
      stretchTarget: "75000",
      minContribution: "10",
      maxContribution: "1000",
      suggestedAmounts: ["25", "50", "100", "250", "500"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "200",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [
      {
        id: "r1",
        title: "Early Supporter",
        description: "Thank-you email and name on the supporters wall.",
        order: 0,
        audience: "consumer",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 10 },
        quantityType: "unlimited",
        quantityLimit: null,
        claimDeadlineDays: 30,
        fulfilmentType: "digital",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 90,
        items: [
          { id: "ri1", title: "Digital Thank-You Card", description: "Personalised thank-you card", physicalType: "digital", value: "0", currency: "GBP", assetType: "", assetUrl: "", order: 0, fulfilmentType: "email", fulfilmentConfig: {} },
        ],
      },
    ],
    qualificationMode: "highest",
    hasRewards: true,
  },
  {
    id: "c2",
    title: "Birmingham Green Initiative",
    scope: "city",
    citySlug: "birmingham",
    cityName: "Birmingham",
    audience: "both",
    status: "active",
    locationCoverage: {
      mode: "all",
      selectedLocalAreas: [],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "Transforming Birmingham's public spaces with community-led green projects.",
    description: "The Birmingham Green Initiative funds local environmental projects including urban gardens, tree planting, and renewable energy installations across the city's neighbourhoods.",
    categoryId: "environment",
    seasonIds: ["spring-2027"],
    participation: { backCampaign: true, foundingMember: false, foundingMemberMonthly: false },
    funding: {
      hasTarget: true,
      targetAmount: "30000",
      startingAmount: "5000",
      stretchTarget: "45000",
      minContribution: "5",
      maxContribution: "500",
      suggestedAmounts: ["10", "25", "50", "100"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [],
    qualificationMode: "highest",
    hasRewards: false,
  },
  {
    id: "c3",
    title: "London Community Garden",
    scope: "city",
    citySlug: "london",
    cityName: "London",
    audience: "consumer",
    status: "active",
    locationCoverage: {
      mode: "selected",
      selectedLocalAreas: ["la-camden", "la-islington"],
      excludedLocalAreas: [],
      highStreetMode: "selected",
      selectedHighStreets: ["hs-kingly-st"],
      excludedHighStreets: [],
    },
    shortDescription: "Creating accessible community gardens across central London boroughs.",
    description: "This campaign will establish three new community gardens in underserved London boroughs, providing green space for residents and educational programmes for local schools.",
    categoryId: "community",
    seasonIds: ["summer-2026"],
    participation: { backCampaign: true, foundingMember: false, foundingMemberMonthly: false },
    funding: {
      hasTarget: true,
      targetAmount: "25000",
      startingAmount: "3000",
      stretchTarget: "35000",
      minContribution: "5",
      maxContribution: "200",
      suggestedAmounts: ["10", "20", "50", "100"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "150",
      multipleContributions: true,
      multipleRewards: false,
    },
    rewards: [
      {
        id: "r2",
        title: "Garden Member",
        description: "Seed pack and quarterly newsletter updates.",
        order: 0,
        audience: "consumer",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 20 },
        quantityType: "limited",
        quantityLimit: 100,
        claimDeadlineDays: 60,
        fulfilmentType: "physical",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 120,
        items: [
          { id: "ri2", title: "Herb Seed Pack", description: "Selection of herb seeds", physicalType: "physical", value: "5", currency: "GBP", assetType: "", assetUrl: "", order: 0, fulfilmentType: "post", fulfilmentConfig: {} },
        ],
      },
    ],
    qualificationMode: "highest",
    hasRewards: true,
  },
  {
    id: "c4",
    title: "Leeds Digital Skills Programme",
    scope: "city",
    citySlug: "leeds",
    cityName: "Leeds",
    audience: "both",
    status: "draft",
    locationCoverage: {
      mode: "all",
      selectedLocalAreas: [],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "Free digital skills workshops for Leeds residents and small businesses.",
    description: "A city-wide programme offering free digital skills training including coding, digital marketing, and e-commerce for residents and small business owners across Leeds.",
    categoryId: "education",
    seasonIds: ["autumn-2026", "winter-2026"],
    participation: { backCampaign: true, foundingMember: true, foundingMemberMonthly: false },
    funding: {
      hasTarget: true,
      targetAmount: "40000",
      startingAmount: "8000",
      stretchTarget: "55000",
      minContribution: "10",
      maxContribution: "500",
      suggestedAmounts: ["25", "50", "100", "250"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "300",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [
      {
        id: "r3",
        title: "Workshop Pass",
        description: "Access to one digital skills workshop of your choice.",
        order: 0,
        audience: "both",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 25 },
        quantityType: "limited",
        quantityLimit: 50,
        claimDeadlineDays: 45,
        fulfilmentType: "digital",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 90,
        items: [
          { id: "ri3", title: "Workshop Voucher", description: "Digital voucher for one workshop", physicalType: "digital", value: "0", currency: "GBP", assetType: "url", assetUrl: "", order: 0, fulfilmentType: "email", fulfilmentConfig: {} },
        ],
      },
      {
        id: "r4",
        title: "Business Founding Member",
        description: "Premium 1-year business membership with priority booking.",
        order: 1,
        audience: "business",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 100 },
        quantityType: "limited",
        quantityLimit: 25,
        claimDeadlineDays: 90,
        fulfilmentType: "digital",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 365,
        items: [
          { id: "ri4", title: "Business Membership Card", description: "Digital membership card", physicalType: "digital", value: "0", currency: "GBP", assetType: "", assetUrl: "", order: 0, fulfilmentType: "email", fulfilmentConfig: {} },
        ],
      },
    ],
    qualificationMode: "cumulative",
    hasRewards: true,
  },
  {
    id: "c5",
    title: "Liverpool Youth Fund",
    scope: "city",
    citySlug: "liverpool",
    cityName: "Liverpool",
    audience: "consumer",
    status: "pending_review",
    locationCoverage: {
      mode: "selected",
      selectedLocalAreas: ["la-toxteth", "la-bootle"],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "Supporting young people in Liverpool through sports, arts and mentorship.",
    description: "The Liverpool Youth Fund will provide grants to youth clubs, sports teams, and arts programmes across the city's most underserved communities.",
    categoryId: "youth",
    seasonIds: ["autumn-2026"],
    participation: { backCampaign: true, foundingMember: false, foundingMemberMonthly: false },
    funding: {
      hasTarget: true,
      targetAmount: "20000",
      startingAmount: "2500",
      stretchTarget: "30000",
      minContribution: "5",
      maxContribution: "200",
      suggestedAmounts: ["5", "10", "25", "50"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [],
    qualificationMode: "highest",
    hasRewards: false,
  },
  {
    id: "c6",
    title: "Bristol Arts Centre",
    scope: "city",
    citySlug: "bristol",
    cityName: "Bristol",
    audience: "consumer",
    status: "completed",
    locationCoverage: {
      mode: "all",
      selectedLocalAreas: [],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "A new community arts centre for Bristol's vibrant creative scene.",
    description: "Fundraising to establish a multi-purpose arts centre in Bristol featuring exhibition spaces, studio hire, and community arts programmes for all ages.",
    categoryId: "arts",
    seasonIds: ["summer-2026"],
    participation: { backCampaign: true, foundingMember: true, foundingMemberMonthly: true },
    funding: {
      hasTarget: true,
      targetAmount: "60000",
      startingAmount: "15000",
      stretchTarget: "80000",
      minContribution: "10",
      maxContribution: "500",
      suggestedAmounts: ["25", "50", "100", "250"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "100",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [
      {
        id: "r5",
        title: "Art Lover",
        description: "Opening night invitation and limited-edition print.",
        order: 0,
        audience: "consumer",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 50 },
        quantityType: "limited",
        quantityLimit: 75,
        claimDeadlineDays: 30,
        fulfilmentType: "physical",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 180,
        items: [
          { id: "ri5", title: "Opening Night Invite", description: "Invitation to grand opening event", physicalType: "digital", value: "0", currency: "GBP", assetType: "", assetUrl: "", order: 0, fulfilmentType: "email", fulfilmentConfig: {} },
          { id: "ri6", title: "Limited Print", description: "Signed Bristol artists print", physicalType: "physical", value: "15", currency: "GBP", assetType: "", assetUrl: "", order: 1, fulfilmentType: "post", fulfilmentConfig: {} },
        ],
      },
    ],
    qualificationMode: "highest",
    hasRewards: true,
  },
  {
    id: "c7",
    title: "Birmingham Food Bank Network",
    scope: "city",
    citySlug: "birmingham",
    cityName: "Birmingham",
    audience: "both",
    status: "scheduled",
    locationCoverage: {
      mode: "selected",
      selectedLocalAreas: ["la-sparkbrook", "la-nechells"],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "Strengthening Birmingham's food bank network with permanent facilities.",
    description: "This campaign builds on emergency food provision by funding permanent food bank facilities, cold storage, and delivery vehicles across Birmingham.",
    categoryId: "community",
    seasonIds: ["winter-2026"],
    participation: { backCampaign: true, foundingMember: false, foundingMemberMonthly: false },
    funding: {
      hasTarget: true,
      targetAmount: "35000",
      startingAmount: "10000",
      stretchTarget: "50000",
      minContribution: "5",
      maxContribution: "250",
      suggestedAmounts: ["10", "20", "50", "100"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "",
      multipleContributions: true,
      multipleRewards: false,
    },
    rewards: [],
    qualificationMode: "highest",
    hasRewards: false,
  },
  {
    id: "c8",
    title: "London Tech Startup Fund",
    scope: "city",
    citySlug: "london",
    cityName: "London",
    audience: "business",
    status: "active",
    locationCoverage: {
      mode: "selected",
      selectedLocalAreas: ["la-shoreditch", "la-canary-wharf"],
      excludedLocalAreas: [],
      highStreetMode: "selected",
      selectedHighStreets: ["hs-broadgate"],
      excludedHighStreets: [],
    },
    shortDescription: "Venture fund backing early-stage London tech startups.",
    description: "A community-backed venture fund providing seed capital, workspace, and mentorship to early-stage technology startups based in London.",
    categoryId: "business",
    seasonIds: ["spring-2027"],
    participation: { backCampaign: true, foundingMember: true, foundingMemberMonthly: true },
    funding: {
      hasTarget: true,
      targetAmount: "100000",
      startingAmount: "20000",
      stretchTarget: "150000",
      minContribution: "50",
      maxContribution: "5000",
      suggestedAmounts: ["100", "250", "500", "1000", "2500"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "5000",
      participationLimit: "",
      campaignCapacity: "50",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [
      {
        id: "r6",
        title: "Investor Circle",
        description: "Quarterly investor newsletter and invite to demo day.",
        order: 0,
        audience: "business",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 250 },
        quantityType: "unlimited",
        quantityLimit: null,
        claimDeadlineDays: 60,
        fulfilmentType: "digital",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 365,
        items: [
          { id: "ri7", title: "Investor Newsletter", description: "Quarterly digital newsletter", physicalType: "digital", value: "0", currency: "GBP", assetType: "url", assetUrl: "", order: 0, fulfilmentType: "email", fulfilmentConfig: {} },
        ],
      },
    ],
    qualificationMode: "highest",
    hasRewards: true,
  },
  {
    id: "c9",
    title: "Independent Bristol Makers",
    scope: "independent",
    citySlug: "bristol",
    cityName: "Bristol",
    audience: "consumer",
    status: "archived",
    locationCoverage: {
      mode: "all",
      selectedLocalAreas: [],
      excludedLocalAreas: [],
      highStreetMode: "all",
      selectedHighStreets: [],
      excludedHighStreets: [],
    },
    shortDescription: "Supporting Bristol's independent makers and artisans.",
    description: "A collective campaign to promote and fund Bristol's independent makers, providing shared marketing, market stalls, and studio space.",
    categoryId: "arts",
    seasonIds: ["autumn-2026"],
    participation: { backCampaign: true, foundingMember: false, foundingMemberMonthly: false },
    funding: {
      hasTarget: true,
      targetAmount: "15000",
      startingAmount: "4000",
      stretchTarget: "20000",
      minContribution: "5",
      maxContribution: "100",
      suggestedAmounts: ["10", "20", "50"],
      allowCustomAmount: true,
    },
    period: { periodMode: "season", startDate: "", startTime: "", endDate: "", endTime: "" },
    rules: {
      contributionLimit: "",
      participationLimit: "",
      campaignCapacity: "",
      multipleContributions: true,
      multipleRewards: true,
    },
    rewards: [
      {
        id: "r7",
        title: "Maker Supporter",
        description: "Makers market discount card and thank-you postcard.",
        order: 0,
        audience: "consumer",
        triggerType: "contribution",
        triggerConfig: { mode: "min", min: 10 },
        quantityType: "unlimited",
        quantityLimit: null,
        claimDeadlineDays: 30,
        fulfilmentType: "physical",
        fulfilmentConfig: {},
        qualificationPeriod: "campaign",
        expiryDays: 90,
        items: [
          { id: "ri8", title: "Discount Card", description: "10% off at participating makers", physicalType: "physical", value: "0", currency: "GBP", assetType: "", assetUrl: "", order: 0, fulfilmentType: "post", fulfilmentConfig: {} },
        ],
      },
    ],
    qualificationMode: "highest",
    hasRewards: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1 — Campaign Scope
// ═══════════════════════════════════════════════════════════════════════════

function StepScope({ formData, onUpdate }: StepProps) {
  const [citySearch, setCitySearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const filteredCities = DEMO_CITIES.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );

  const handleCitySelect = (city: (typeof DEMO_CITIES)[number]) => {
    onUpdate({
      cityName: city.name,
      citySlug: city.slug,
      cityId: city.id,
    });
    setCityDropdownOpen(false);
    setCitySearch("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Scope</h2>
        <p className="mt-1 text-sm text-gray-500">Where does this campaign belong?</p>
      </div>

      {/* Scope Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SCOPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = formData.scope === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ scope: opt.value })}
              className={`flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all ${
                selected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                <span className="mt-1 block text-xs text-gray-500">{opt.description}</span>
              </div>
              {selected && (
                <CheckCircle className="ml-auto h-5 w-5 text-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* City Selector — shown only when scope = city */}
      {formData.scope === "city" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select City</label>

          {/* Dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left transition-colors hover:border-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              {formData.cityName ? (
                <span className="text-gray-900 font-medium">{formData.cityName}</span>
              ) : (
                <span className="text-gray-400">Select a city...</span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  cityDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                {/* Search input */}
                <div className="border-b border-gray-100 p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search cities..."
                      className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* City list */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredCities.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      No cities found
                    </div>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          formData.citySlug === city.slug
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {formData.citySlug === city.slug && (
                          <CheckCircle className="h-4 w-4 text-primary-500" />
                        )}
                        {city.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirmation message */}
          {formData.cityName && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p className="text-sm text-green-700">
                This campaign will operate within{" "}
                <strong>{formData.cityName}</strong>. You can choose which
                Local Areas, Boroughs and High Streets currently have access to
                the campaign in the next step.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2 — Location Coverage
// ═══════════════════════════════════════════════════════════════════════════

function StepLocations({ formData, onUpdate }: StepProps) {
  const loc = useLocationTree(formData.locationCoverage);

  useEffect(() => {
    onUpdate({ locationCoverage: loc.coverage });
  }, [loc.coverage, onUpdate]);

  // Non-city scope — info message
  if (formData.scope !== "city") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
          <p className="mt-1 text-sm text-gray-500">
            Where should this campaign be available?
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-blue-700">
            This is an independent campaign. It is not tied to any specific city or location hierarchy. Location coverage will be managed separately.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loc.loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
          <p className="mt-1 text-sm text-gray-500">Loading location data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (loc.error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
          <p className="mt-1 text-sm text-gray-500">Where should this campaign be available?</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{loc.error}</p>
          <button
            type="button"
            onClick={loc.refresh}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedCity = loc.selectedCity;
  const activeAreas = selectedCity?.localAreas ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Location Coverage</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose which Local Areas and High Streets this campaign covers.
        </p>

        {/* Breadcrumb */}
        <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
          <Building2 className="h-4 w-4" />
          <span className="font-medium text-gray-700">{formData.cityName}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Local Areas</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>High Streets</span>
        </div>
      </div>

      {/* ── 2A: Local Area Coverage ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Local Area Coverage</h3>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => loc.setAllLocalAreas(true)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                loc.coverage.mode === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => loc.setAllLocalAreas(false)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                loc.coverage.mode === "selected"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Selected
            </button>
          </div>
        </div>

        {loc.coverage.mode === "all" ? (
          <div>
            <p className="mb-3 text-xs text-gray-500">
              All local areas are included. Click an area to exclude it from the campaign.
            </p>
            <div className="flex flex-wrap gap-2">
              {activeAreas.map((area) => {
                const excluded = loc.coverage.excludedLocalAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => loc.toggleLocalArea(area)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      excluded
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {excluded ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  const allIds = activeAreas.map((a) => a.id);
                  onUpdate({
                    locationCoverage: {
                      ...loc.coverage,
                      selectedLocalAreas: allIds,
                    },
                  });
                }}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => {
                  onUpdate({
                    locationCoverage: {
                      ...loc.coverage,
                      selectedLocalAreas: [],
                    },
                  });
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-1.5">
              {activeAreas.map((area) => {
                const selected = loc.coverage.selectedLocalAreas.includes(area.id);
                return (
                  <label
                    key={area.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? "border-primary-200 bg-primary-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => loc.toggleLocalArea(area)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{area.name}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {area.highStreets.length} street{area.highStreets.length !== 1 && "s"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 2B: High Street Coverage ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">High Street Coverage</h3>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => loc.setAllHighStreets(true)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                loc.coverage.highStreetMode === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => loc.setAllHighStreets(false)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                loc.coverage.highStreetMode === "selected"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Selected
            </button>
          </div>
        </div>

        {/* Only show streets from active areas */}
        <div className="space-y-4">
          {activeAreas
            .filter((area) => {
              if (loc.coverage.mode === "all") {
                return !loc.coverage.excludedLocalAreas.includes(area.id);
              }
              return loc.coverage.selectedLocalAreas.includes(area.id);
            })
            .map((area) => (
              <div key={area.id}>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {area.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.highStreets.map((street) => {
                    const excluded = loc.coverage.excludedHighStreets.includes(street.id);
                    const selected = loc.coverage.selectedHighStreets.includes(street.id);
                    const isActive =
                      loc.coverage.highStreetMode === "all" ? !excluded : selected;

                    return (
                      <button
                        key={street.id}
                        type="button"
                        onClick={() => loc.toggleHighStreet(street)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {isActive ? (
                          <CheckCircle className="h-3.5 w-3.5 text-primary-500" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-gray-400" />
                        )}
                        {street.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── 2C: Summary ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Coverage Summary</h3>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <div className="text-2xl font-bold text-primary-700">1</div>
            <div className="text-xs text-primary-600">City</div>
          </div>
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <div className="text-2xl font-bold text-primary-700">
              {loc.selectedLocalAreaCount}
            </div>
            <div className="text-xs text-primary-600">Local Areas</div>
          </div>
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <div className="text-2xl font-bold text-primary-700">
              {loc.selectedHighStreetCount}
            </div>
            <div className="text-xs text-primary-600">High Streets</div>
          </div>
        </div>

        {/* Visual tree */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Building2 className="h-4 w-4" />
            {formData.cityName}
          </div>
          <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
            {activeAreas.map((area) => {
              const areaActive =
                loc.coverage.mode === "all"
                  ? !loc.coverage.excludedLocalAreas.includes(area.id)
                  : loc.coverage.selectedLocalAreas.includes(area.id);
              return (
                <div key={area.id}>
                  <div className="flex items-center gap-2 py-1">
                    {areaActive ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span
                      className={`text-sm ${
                        areaActive ? "text-gray-700" : "text-gray-400 line-through"
                      }`}
                    >
                      {area.name}
                    </span>
                  </div>
                  <div className="ml-5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                    {area.highStreets.map((street) => {
                      const streetActive =
                        loc.coverage.highStreetMode === "all"
                          ? !loc.coverage.excludedHighStreets.includes(street.id)
                          : loc.coverage.selectedHighStreets.includes(street.id);
                      return (
                        <div key={street.id} className="flex items-center gap-2 py-0.5">
                          {streetActive ? (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          ) : (
                            <X className="h-3 w-3 text-red-300" />
                          )}
                          <span
                            className={`text-xs ${
                              streetActive ? "text-gray-600" : "text-gray-400 line-through"
                            }`}
                          >
                            {street.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2D: Future Locations Note (when All mode) ── */}
      {loc.coverage.mode === "all" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            <strong>Note:</strong> When using "All" mode, new Local Areas or High Streets added to{" "}
            {formData.cityName} in the future will automatically be included in this campaign.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 — Campaign Details
// ═══════════════════════════════════════════════════════════════════════════

function StepDetails({ formData, onUpdate }: StepProps) {
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [mediaMode, setMediaMode] = useState<"upload" | "link">("upload");
  const [mainMediaType, setMainMediaType] = useState<"image" | "video" | "gif">("image");

  const filteredCategories = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onUpdate({ categoryId: newCategoryName.trim().toLowerCase().replace(/\s+/g, "-") });
      setNewCategoryName("");
      setShowCategoryInput(false);
      setCategorySearch("");
    }
  };

  const generateCampaignCode = (citySlug: string) => {
    const cityAbbrev = citySlug ? citySlug.toUpperCase().slice(0, 3) : "GEN";
    const num = String(Math.floor(Math.random() * 900) + 100);
    return `UK-${cityAbbrev}-${num}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Details</h2>
        <p className="mt-1 text-sm text-gray-500">Set up the campaign's core information.</p>
      </div>

      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            const title = e.target.value;
            const updates: Partial<CampaignWizardData> = { title };
            if (title && !formData.campaignCode) {
              updates.campaignCode = generateCampaignCode(formData.citySlug);
            }
            onUpdate(updates);
          }}
          placeholder={
            formData.cityName
              ? `e.g. ${formData.cityName} Community Fund 2026`
              : "e.g. My Campaign 2026"
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Campaign Code — Auto-generated, non-editable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Code
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-600">
            {formData.campaignCode ? (
              <span className="font-semibold">{formData.campaignCode}</span>
            ) : (
              <span className="text-gray-400">Start typing campaign name to generate code...</span>
            )}
          </div>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            System Generated
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Format: UK-CITY-NNN (e.g. UK-BHM-001). Unique identifier for this campaign.
        </p>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Short Description <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={formData.shortDescription}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                onUpdate({ shortDescription: e.target.value });
              }
            }}
            rows={2}
            placeholder="Brief summary for campaign cards"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <span
            className={`absolute bottom-2 right-3 text-xs ${
              formData.shortDescription.length >= 180
                ? "text-red-500"
                : "text-gray-400"
            }`}
          >
            {formData.shortDescription.length}/200
          </span>
        </div>
      </div>

      {/* Full Description with formatting toolbar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Description
        </label>
        <div className="rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5">
          <div className="flex items-center gap-1">
            {["B", "I", "U", "H1", "H2", "List"].map((btn) => (
              <button
                key={btn}
                type="button"
                className="rounded px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={8}
          placeholder="Detailed campaign description. Use formatting to make it engaging."
          className="w-full rounded-b-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Category — with search + add */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Category
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              if (e.target.value) onUpdate({ categoryId: "" });
            }}
            onFocus={() => {}}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
        {categorySearch && !formData.categoryId && (
          <div className="mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-48 overflow-y-auto py-1">
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
              ) : (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      onUpdate({ categoryId: cat.value });
                      setCategorySearch(cat.label);
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {cat.label}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryInput(true);
                  setNewCategoryName(categorySearch);
                }}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                + Add "{categorySearch}" as new category
              </button>
            </div>
          </div>
        )}
        {showCategoryInput && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="New category name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCategoryInput(false);
                setNewCategoryName("");
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
        {formData.categoryId && !categorySearch && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
              {CATEGORIES.find((c) => c.value === formData.categoryId)?.label || formData.categoryId}
            </span>
            <button
              type="button"
              onClick={() => onUpdate({ categoryId: "" })}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Campaign Media — Main gallery with type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Media
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Choose the main media type for the campaign gallery. Other media can follow.
        </p>

        {/* Media Type Selector */}
        <div className="flex items-center gap-2 mb-4">
          {(["image", "video", "gif"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMainMediaType(type)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                mainMediaType === type
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {type === "image" && <Image className="h-4 w-4" />}
              {type === "video" && <Video className="h-4 w-4" />}
              {type === "gif" && <span className="text-xs">GIF</span>}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Upload / Link Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 mb-3">
          <button
            type="button"
            onClick={() => setMediaMode("upload")}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mediaMode === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMediaMode("link")}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mediaMode === "link" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Use Link
          </button>
        </div>

        {mediaMode === "upload" ? (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-primary-400 hover:bg-primary-50 cursor-pointer">
            <div className="text-center">
              {mainMediaType === "image" && <Image className="mx-auto h-10 w-10 text-gray-400" />}
              {mainMediaType === "video" && <Video className="mx-auto h-10 w-10 text-gray-400" />}
              {mainMediaType === "gif" && <span className="mx-auto text-2xl text-gray-400">GIF</span>}
              <p className="mt-2 text-sm font-medium text-gray-600">
                Click to upload {mainMediaType}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {mainMediaType === "image" && "PNG, JPG or WebP. Recommended: 1200x630px"}
                {mainMediaType === "video" && "MP4, WebM. Max 100MB"}
                {mainMediaType === "gif" && "GIF. Max 10MB"}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or https://media.example.com/video.mp4"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      {/* Additional Media */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Media
        </label>
        <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-primary-400 hover:bg-primary-50 cursor-pointer">
          <div className="text-center">
            <Plus className="mx-auto h-6 w-6 text-gray-400" />
            <p className="mt-1 text-sm text-gray-500">Add more images, videos, or GIFs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4 — Audience
// ═══════════════════════════════════════════════════════════════════════════

function StepAudience({ formData, onUpdate }: StepProps) {
  const AUDIENCE_OPTIONS = [
    {
      value: "both" as const,
      label: "Both",
      description: "Business Owners and Consumers can participate in this campaign.",
    },
    {
      value: "business" as const,
      label: "Business Owner",
      description: "Only Business Owners can participate in this campaign.",
    },
    {
      value: "consumer" as const,
      label: "Consumer",
      description: "Only Consumers can participate in this campaign.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Audience</h2>
        <p className="mt-1 text-sm text-gray-500">Who can participate in this campaign?</p>
      </div>

      <div className="space-y-3">
        {AUDIENCE_OPTIONS.map((opt) => {
          const selected = formData.audience === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ audience: opt.value })}
              className={`flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                selected
                  ? "border-primary-500 bg-primary-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary-500 bg-primary-500" : "border-gray-300"
                }`}
              >
                {selected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-900">
                  {opt.label}
                </span>
                {selected && (
                  <p className="mt-1 text-sm text-gray-600">{opt.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5 — Participation Methods
// ═══════════════════════════════════════════════════════════════════════════

function StepParticipation({ formData, onUpdate }: StepProps) {
  const p = formData.participation;

  const toggle = (key: keyof typeof p) =>
    onUpdate({ participation: { ...p, [key]: !p[key] } });

  const methods = [
    {
      key: "backCampaign" as const,
      label: "Back This Campaign",
      desc: "Allow participants to make contributions",
      defaultOn: true,
    },
    {
      key: "foundingMember" as const,
      label: "Become a Founding Member",
      desc: "One-time membership purchase",
      defaultOn: false,
    },
    {
      key: "foundingMemberMonthly" as const,
      label: "Founding Member Monthly",
      desc: "Monthly recurring membership",
      defaultOn: false,
    },
  ];

  const enabledCount = [p.backCampaign, p.foundingMember, p.foundingMemberMonthly].filter(
    Boolean,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Participation Methods</h2>
        <p className="mt-1 text-sm text-gray-500">
          How can the selected audience participate?
        </p>
      </div>

      <div className="space-y-3">
        {methods.map((item) => {
          const isOn = p[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className={`flex w-full items-center justify-between rounded-xl border-2 p-5 text-left transition-all ${
                isOn
                  ? "border-primary-200 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div>
                <span className="block text-sm font-semibold text-gray-900">
                  {item.label}
                </span>
                <p className="mt-0.5 text-sm text-gray-500">{item.desc}</p>
              </div>
              {/* Toggle switch */}
              <div
                className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  isOn ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    isOn ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Participation Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">
          Participation Summary
        </h4>
        <div className="space-y-1.5">
          {methods.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              {p[item.key] ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-gray-300" />
              )}
              <span
                className={
                  p[item.key] ? "text-gray-700 font-medium" : "text-gray-400"
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        {enabledCount === 0 && (
          <p className="mt-2 text-xs text-red-500">
            At least one participation method must be enabled.
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6 — Funding & Contributions
// ═══════════════════════════════════════════════════════════════════════════

function StepFunding({ formData, onUpdate }: StepProps) {
  const f = formData.funding;

  const updateFunding = (updates: Partial<typeof f>) =>
    onUpdate({ funding: { ...f, ...updates } });

  const [newSuggestedAmount, setNewSuggestedAmount] = useState("");

  const addSuggestedAmount = () => {
    if (newSuggestedAmount && !f.suggestedAmounts.includes(newSuggestedAmount)) {
      updateFunding({
        suggestedAmounts: [...f.suggestedAmounts, newSuggestedAmount].sort(
          (a, b) => Number(a) - Number(b),
        ),
      });
      setNewSuggestedAmount("");
    }
  };

  const removeSuggestedAmount = (amount: string) => {
    updateFunding({
      suggestedAmounts: f.suggestedAmounts.filter((a) => a !== amount),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Funding & Contributions</h2>
        <p className="mt-1 text-sm text-gray-500">Configure the financial side of the campaign.</p>
      </div>

      {/* Funding Target Question */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Does this campaign have a funding target?
        </p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hasTarget"
              checked={f.hasTarget}
              onChange={() => updateFunding({ hasTarget: true })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hasTarget"
              checked={!f.hasTarget}
              onChange={() => updateFunding({ hasTarget: false })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">No</span>
          </label>
        </div>

        {f.hasTarget && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Funding Target <span className="text-gray-400">()</span>
              </label>
              <input
                type="number"
                value={f.targetAmount}
                onChange={(e) => updateFunding({ targetAmount: e.target.value })}
                placeholder="e.g. 10000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Amount <span className="text-gray-400">()</span>
              </label>
              <input
                type="number"
                value={f.startingAmount}
                onChange={(e) => updateFunding({ startingAmount: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stretch Target <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                value={f.stretchTarget}
                onChange={(e) => updateFunding({ stretchTarget: e.target.value })}
                placeholder="e.g. 15000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contribution Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Contribution Settings
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Contribution <span className="text-gray-400">()</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={f.minContribution}
              onChange={(e) => updateFunding({ minContribution: e.target.value })}
              placeholder="e.g. 5"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Contribution <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              value={f.maxContribution}
              onChange={(e) => updateFunding({ maxContribution: e.target.value })}
              placeholder="Leave blank for no limit"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Suggested Contributions */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suggested Contributions
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {f.suggestedAmounts.map((amount) => (
              <div
                key={amount}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1"
              >
                <span className="text-sm font-medium text-primary-700">
                  {amount}
                </span>
                <button
                  type="button"
                  onClick={() => removeSuggestedAmount(amount)}
                  className="rounded-full p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={newSuggestedAmount}
                onChange={(e) => setNewSuggestedAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSuggestedAmount()}
                placeholder="Add amount"
                className="w-24 rounded-full border border-gray-300 px-3 py-1 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addSuggestedAmount}
                className="inline-flex items-center gap-1 rounded-full border border-primary-300 px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Allow Custom Amount */}
        <div className="mt-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${
                f.allowCustomAmount ? "bg-blue-600" : "bg-gray-300"
              }`}
              onClick={() => updateFunding({ allowCustomAmount: !f.allowCustomAmount })}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  f.allowCustomAmount ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm text-gray-700">Allow custom amount</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7 — Campaign Period
// ═══════════════════════════════════════════════════════════════════════════

function StepPeriod({ formData, onUpdate }: StepProps) {
  const p = formData.period;
  const useSeason = p.periodMode === "season";

  const getDuration = () => {
    if (!p.startDate || !p.endDate) return null;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return null;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days;
  };

  const duration = getDuration();

  const toggleSeason = (seasonValue: string) => {
    const current = formData.seasonIds || [];
    const updated = current.includes(seasonValue)
      ? current.filter((s) => s !== seasonValue)
      : [...current, seasonValue];
    onUpdate({ seasonIds: updated });

    // Auto-fill dates from first selected season if in season mode
    if (useSeason && updated.length > 0) {
      const season = SEASONS.find((s) => s.value === updated[0]);
      if (season) {
        onUpdate({
          seasonIds: updated,
          period: { ...p, startDate: season.startDate, endDate: season.endDate, startTime: "00:00", endTime: "23:59" },
        });
      }
    }
  };

  const setPeriodMode = (mode: "season" | "custom") => {
    if (mode === "season" && (formData.seasonIds || []).length > 0) {
      // Auto-fill from first selected season
      const season = SEASONS.find((s) => s.value === formData.seasonIds![0]);
      if (season) {
        onUpdate({ period: { ...p, periodMode: "season", startDate: season.startDate, endDate: season.endDate, startTime: "00:00", endTime: "23:59" } });
        return;
      }
    }
    onUpdate({ period: { ...p, periodMode: mode } });
  };

  const today = new Date();
  const getSeasonStatus = (season: { value: string; label: string; startDate: string; endDate: string }) => {
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    if (today < start) {
      const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { status: "upcoming", text: `Starts in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`, color: "text-blue-600 bg-blue-50" };
    }
    if (today > end) {
      return { status: "ended", text: "Ended", color: "text-gray-500 bg-gray-100" };
    }
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { status: "active", text: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`, color: "text-green-600 bg-green-50" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Period</h2>
        <p className="mt-1 text-sm text-gray-500">When does this campaign run?</p>
      </div>

      {/* Period Mode Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">How do you want to set the campaign dates?</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPeriodMode("season")}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              useSeason
                ? "border-primary-500 bg-primary-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              useSeason ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Use Season</span>
              <span className="mt-0.5 block text-xs text-gray-500">Campaign dates follow a season</span>
            </div>
            {useSeason && <CheckCircle className="ml-auto h-5 w-5 text-primary-500" />}
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode("custom")}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              !useSeason
                ? "border-primary-500 bg-primary-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              !useSeason ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
            }`}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-900">Campaign Schedule</span>
              <span className="mt-0.5 block text-xs text-gray-500">Set custom start and end dates</span>
            </div>
            {!useSeason && <CheckCircle className="ml-auto h-5 w-5 text-primary-500" />}
          </button>
        </div>
      </div>

      {/* Season Selection — faded out when Campaign Schedule is active */}
      <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all ${
        !useSeason ? "opacity-50 pointer-events-none" : ""
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Season</h3>
          {!useSeason && (
            <span className="text-xs text-gray-400 italic">Enable "Use Season" above to select</span>
          )}
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Select a season for this campaign. The campaign dates will be set to the season period.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SEASONS.map((season) => {
            const selected = (formData.seasonIds || []).includes(season.value);
            const status = getSeasonStatus(season);
            const isEnded = status.status === "ended";
            return (
              <button
                key={season.value}
                type="button"
                onClick={() => toggleSeason(season.value)}
                disabled={isEnded}
                className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                  isEnded ? "opacity-50 cursor-not-allowed " : ""
                }${
                  selected
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div>
                  <span className="block text-sm font-semibold text-gray-900">{season.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {season.startDate} to {season.endDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                  {selected && <CheckCircle className="h-5 w-5 text-primary-500" />}
                </div>
              </button>
            );
          })}
        </div>
        {(formData.seasonIds || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(formData.seasonIds || []).map((sid) => {
              const season = SEASONS.find((s) => s.value === sid);
              return season ? (
                <span key={sid} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                  {season.label}
                  <button type="button" onClick={() => toggleSeason(sid)} className="hover:text-primary-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Campaign Schedule — faded out when Season is active */}
      <div className={`rounded-xl border border-gray-200 bg-white p-5 space-y-5 transition-all ${
        useSeason ? "opacity-50 pointer-events-none" : ""
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-600" />
            Campaign Schedule
          </h3>
          {useSeason && (
            <span className="text-xs text-gray-400 italic">Enable "Campaign Schedule" above to edit</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={p.startDate}
              onChange={(e) => onUpdate({ period: { ...p, startDate: e.target.value } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">Start Time</label>
            <input
              type="time"
              value={p.startTime}
              onChange={(e) => onUpdate({ period: { ...p, startTime: e.target.value } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={p.endDate}
              onChange={(e) => onUpdate({ period: { ...p, endDate: e.target.value } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">End Time</label>
            <input
              type="time"
              value={p.endTime}
              onChange={(e) => onUpdate({ period: { ...p, endTime: e.target.value } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {duration !== null && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Campaign runs for <strong>{duration} day{duration !== 1 ? "s" : ""}</strong>
              {p.startDate && p.endDate && (
                <> from <strong>{p.startDate}</strong> to <strong>{p.endDate}</strong></>
              )}
            </span>
          </div>
        )}

        {p.startDate && p.endDate && new Date(`${p.endDate}T${p.endTime}`) <= new Date(`${p.startDate}T${p.startTime}`) && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">End date/time must be after start date/time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8 — Campaign Limits & Rules
// ═══════════════════════════════════════════════════════════════════════════

function StepRules({ formData, onUpdate }: StepProps) {
  const r = formData.rules;

  const toggleRules = (key: keyof typeof r, value?: unknown) => {
    onUpdate({
      rules: {
        ...r,
        [key]: value !== undefined ? value : !(r[key] as boolean),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Limits & Rules</h2>
        <p className="mt-1 text-sm text-gray-500">Set limits and constraints for this campaign.</p>
      </div>

      {/* Contribution Limits */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary-600" />
          Contribution Limits
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">
              Max Contribution Per Participant
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
              <input
                type="number"
                value={r.contributionLimit}
                onChange={(e) => toggleRules("contributionLimit", e.target.value)}
                placeholder="No limit"
                className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-gray-400">Maximum amount a single participant can contribute</p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">
              Max Total Participants
            </label>
            <input
              type="number"
              value={r.participationLimit}
              onChange={(e) => toggleRules("participationLimit", e.target.value)}
              placeholder="No limit"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400">Maximum number of unique participants</p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">
              Campaign Capacity
            </label>
            <input
              type="number"
              value={r.campaignCapacity}
              onChange={(e) => toggleRules("campaignCapacity", e.target.value)}
              placeholder="No limit"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400">Maximum total contributions/participations</p>
          </div>
        </div>
      </div>

      {/* Participation Rules */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-600" />
          Participation Rules
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">Multiple Contributions</span>
              <p className="text-xs text-gray-500 mt-0.5">Allow the same participant to contribute more than once</p>
            </div>
            <button
              type="button"
              onClick={() => toggleRules("multipleContributions")}
              className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${
                r.multipleContributions ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  r.multipleContributions ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <span className="text-sm font-semibold text-gray-900">Multiple Rewards</span>
              <p className="text-xs text-gray-500 mt-0.5">Allow the reward engine to evaluate and grant multiple rewards per participant</p>
            </div>
            <button
              type="button"
              onClick={() => toggleRules("multipleRewards")}
              className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${
                r.multipleRewards ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  r.multipleRewards ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Campaign status (Active, Paused, Completed) is managed after publication from the campaign dashboard, not during creation.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 9 — Reward Editor (Inline)
// ═══════════════════════════════════════════════════════════════════════════

interface RewardEditorProps {
  reward: CampaignReward | null;
  onSave: (reward: CampaignReward) => void;
  onCancel: () => void;
  campaignAudience?: "business" | "consumer" | "both";
}

const REWARD_EDITOR_STEPS = [
  { key: "R1", label: "Details" },
  { key: "R2", label: "Trigger" },
  { key: "R3", label: "Config" },
  { key: "R4", label: "Items" },
  { key: "R5", label: "Availability" },
  { key: "R6", label: "Summary" },
];

const FULFILMENT_OPTIONS = [
  { value: "internal", label: "Internal FundOrDonate", desc: "Managed within the platform" },
  { value: "mcom", label: "MCOM Service", desc: "Configured MCOM services/products" },
  { value: "external_platform", label: "External Platform", desc: "Third-party provider integration" },
  { value: "external_link", label: "External Link", desc: "Link to external destination" },
  { value: "api_webhook", label: "API/Webhook", desc: "Automated via API call" },
  { value: "manual", label: "Manual Fulfilment", desc: "Admin/team issues reward manually" },
];

const REWARD_TYPE_OPTIONS = [
  { value: "standard", label: "Standard Reward" },
  { value: "ecard", label: "E-Card" },
  { value: "cashback", label: "Cashback" },
  { value: "points", label: "Points" },
  { value: "discount", label: "Discount" },
];

const TRIGGER_TYPE_OPTIONS = [
  { value: "contribution", label: "Contribution", desc: "Triggered by a qualifying contribution amount" },
  { value: "membership", label: "Membership", desc: "Triggered by becoming a founding member" },
  { value: "founding_monthly", label: "Founding Monthly", desc: "Triggered by subscribing to monthly membership" },
  { value: "first_n", label: "First N Participants", desc: "Awarded to the first N participants" },
  { value: "top_n", label: "Top N Contributors", desc: "Awarded to the top contributors by amount" },
];

function RewardEditor({ reward, onSave, onCancel, campaignAudience = "both" }: RewardEditorProps) {
  const [editorStep, setEditorStep] = useState(0);
  const [data, setData] = useState<CampaignReward>(
    reward ?? {
      id: `reward-${Date.now()}`,
      title: "",
      description: "",
      order: 0,
      audience: "both",
      triggerType: "contribution",
      triggerConfig: { mode: "min" },
      quantityType: "unlimited",
      quantityLimit: null,
      claimDeadlineDays: 30,
      fulfilmentType: "manual",
      fulfilmentConfig: {},
      qualificationPeriod: "",
      expiryDays: 90,
      items: [],
    },
  );

  const updateReward = (updates: Partial<CampaignReward>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setEditorStep((s) => Math.min(s + 1, REWARD_EDITOR_STEPS.length - 1));
  const prevStep = () => setEditorStep((s) => Math.max(s - 1, 0));
  const isLast = editorStep === REWARD_EDITOR_STEPS.length - 1;

  const getTriggerLabel = (t: CampaignReward["triggerType"]) => {
    return TRIGGER_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
  };

  // R1 — Reward Details
  const renderR1 = () => (
    <div className="space-y-5">
      <div>
        <h4 className="font-bold text-gray-900">Reward Details</h4>
        <p className="text-xs text-gray-500 mt-0.5">Name, description and audience for this reward</p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Reward Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateReward({ title: e.target.value })}
          placeholder="e.g. Early Bird Badge"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => updateReward({ description: e.target.value })}
          rows={3}
          placeholder="What does this reward include?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Audience</label>
        <div className="flex gap-3">
          {(["business", "consumer", "both"] as const)
            .filter((a) => {
              if (campaignAudience === "business") return a === "business";
              if (campaignAudience === "consumer") return a === "consumer";
              return true;
            })
            .map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => updateReward({ audience: a })}
                className={`flex-1 rounded-lg border-2 p-3 text-center text-sm font-semibold transition-colors ${
                  data.audience === a
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {a === "both" ? "Both" : a === "business" ? "Business" : "Consumer"}
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Reward Type</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REWARD_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateReward({ fulfilmentType: opt.value })}
              className={`rounded-lg border-2 p-2.5 text-center text-xs font-semibold transition-colors ${
                data.fulfilmentType === opt.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // R2 — Trigger Type
  const renderR2 = () => (
    <div className="space-y-5">
      <div>
        <h4 className="font-bold text-gray-900">Reward Trigger</h4>
        <p className="text-xs text-gray-500 mt-0.5">What action triggers this reward?</p>
      </div>

      <div className="space-y-2">
        {TRIGGER_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => updateReward({ triggerType: opt.value as CampaignReward["triggerType"] })}
            className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              data.triggerType === opt.value
                ? "border-primary-500 bg-primary-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div
              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                data.triggerType === opt.value ? "border-primary-500 bg-primary-500" : "border-gray-300"
              }`}
            >
              {data.triggerType === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
              <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // R3 — Trigger Config
  const renderR3 = () => {
    const tc = data.triggerConfig;

    return (
      <div className="space-y-5">
        <div>
          <h4 className="font-bold text-gray-900">Trigger Configuration</h4>
          <p className="text-xs text-gray-500 mt-0.5">Configure the specific trigger criteria for <strong>{getTriggerLabel(data.triggerType)}</strong></p>
        </div>

        {data.triggerType === "contribution" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Qualification Method</label>
              <div className="flex gap-2">
                {(["min", "range", "exact"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateReward({ triggerConfig: { ...tc, mode: m } })}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                      tc.mode === m
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {m === "min" ? "Minimum" : m === "range" ? "Range" : "Exact Amount"}
                  </button>
                ))}
              </div>
            </div>

            {(tc.mode === "min" || tc.mode === "range") && (
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Minimum Amount (£)</label>
                <input
                  type="number"
                  value={tc.min ?? ""}
                  onChange={(e) => updateReward({ triggerConfig: { ...tc, min: Number(e.target.value) || undefined } })}
                  placeholder="e.g. 25"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {tc.mode === "range" && (
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Maximum Amount (£)</label>
                <input
                  type="number"
                  value={tc.max ?? ""}
                  onChange={(e) => updateReward({ triggerConfig: { ...tc, max: Number(e.target.value) || undefined } })}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {tc.mode === "exact" && (
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Exact Amount (£)</label>
                <input
                  type="number"
                  value={tc.exact ?? ""}
                  onChange={(e) => updateReward({ triggerConfig: { ...tc, exact: Number(e.target.value) || undefined } })}
                  placeholder="e.g. 50"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Preview */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Preview</p>
              <p className="text-sm text-gray-800">
                {tc.mode === "min" && tc.min
                  ? `Participants who contribute £${tc.min} or more qualify for this reward.`
                  : tc.mode === "range" && tc.min && tc.max
                    ? `Participants who contribute between £${tc.min} and £${tc.max} qualify for this reward.`
                    : tc.mode === "exact" && tc.exact
                      ? `Participants who contribute exactly £${tc.exact} qualify for this reward.`
                      : "Configure the amount criteria above to see a preview."}
              </p>
            </div>
          </div>
        )}

        {data.triggerType === "first_n" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Number of Participants</label>
              <input
                type="number"
                value={tc.count ?? ""}
                onChange={(e) => updateReward({ triggerConfig: { ...tc, count: Number(e.target.value) || undefined } })}
                placeholder="e.g. 50"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400">How many participants receive this reward</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Minimum Qualification Amount (£)</label>
              <input
                type="number"
                value={tc.minQualification ?? ""}
                onChange={(e) => updateReward({ triggerConfig: { ...tc, minQualification: Number(e.target.value) || undefined } })}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400">Minimum contribution to qualify (leave blank for any amount)</p>
            </div>
          </div>
        )}

        {data.triggerType === "top_n" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Number of Contributors</label>
              <input
                type="number"
                value={tc.count ?? ""}
                onChange={(e) => updateReward({ triggerConfig: { ...tc, count: Number(e.target.value) || undefined } })}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400">How many top contributors receive this reward</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">Ranking is by total contribution amount (highest to lowest).</p>
            </div>
          </div>
        )}

        {(data.triggerType === "membership" || data.triggerType === "founding_monthly") && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">
              This reward is automatically triggered when a participant{" "}
              {data.triggerType === "membership" ? "becomes a founding member" : "subscribes to founding member monthly"}.
              No additional configuration needed.
            </p>
          </div>
        )}
      </div>
    );
  };

  // R4 — Reward Items with Fulfilment
  const renderR4 = () => {
    const addItem = () => {
      const newItem: CampaignRewardItem = {
        id: `item-${Date.now()}`,
        title: "",
        description: "",
        physicalType: "digital",
        value: "",
        currency: "GBP",
        assetType: "",
        assetUrl: "",
        order: data.items.length,
        fulfilmentType: "internal",
        fulfilmentConfig: {},
      };
      updateReward({ items: [...data.items, newItem] });
    };

    const updateItem = (idx: number, updates: Partial<CampaignRewardItem>) => {
      const updated = data.items.map((item, i) => (i === idx ? { ...item, ...updates } : item));
      updateReward({ items: updated });
    };

    const removeItem = (idx: number) => {
      updateReward({ items: data.items.filter((_, i) => i !== idx) });
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900">Reward Items & Fulfilment</h4>
            <p className="text-xs text-gray-500 mt-0.5">Add items and configure how each is fulfilled</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>

        {data.items.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Tag className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No items added yet. Click "Add Item" to get started.</p>
          </div>
        )}

        <div className="space-y-4">
          {data.items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              {/* Item header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-400">Item {idx + 1}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.physicalType === "digital" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {item.physicalType}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700">
                    {FULFILMENT_OPTIONS.find((f) => f.value === item.fulfilmentType)?.label ?? item.fulfilmentType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 12A: Title, Description, Type, Value, Currency */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Item Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                    placeholder="e.g. Discount Voucher"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Item Type</label>
                  <div className="flex gap-2">
                    {(["digital", "physical"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateItem(idx, { physicalType: t })}
                        className={`flex-1 rounded-lg border-2 px-2 py-1.5 text-xs font-semibold capitalize transition-colors ${
                          item.physicalType === t
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="Brief description of this item"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Value (£)</label>
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => updateItem(idx, { value: e.target.value })}
                    placeholder="e.g. 25.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Currency</label>
                  <select
                    value={item.currency}
                    onChange={(e) => updateItem(idx, { currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* 12B: Fulfilment selector */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500">Fulfilment Method</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FULFILMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateItem(idx, { fulfilmentType: opt.value })}
                      className={`flex items-start gap-2 rounded-lg border-2 p-2.5 text-left transition-all ${
                        item.fulfilmentType === opt.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          item.fulfilmentType === opt.value ? "border-primary-500 bg-primary-500" : "border-gray-300"
                        }`}
                      >
                        {item.fulfilmentType === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">{opt.label}</span>
                        <p className="text-[10px] text-gray-500 leading-tight">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 12C-F: Conditional fulfilment content */}
              {item.fulfilmentType === "mcom" && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-semibold text-green-800 mb-1">MCOM VCard</p>
                  <p className="text-[11px] text-green-700">
                    This item will be fulfilled via the configured MCOM service. A VCard or digital asset will be delivered to the participant upon qualification.
                  </p>
                </div>
              )}

              {item.fulfilmentType === "external_platform" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Select Provider</label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option value="">Choose a provider...</option>
                    <option value="stripe">Stripe</option>
                    <option value="shopify">Shopify</option>
                    <option value="woocommerce">WooCommerce</option>
                    <option value="custom">Custom Integration</option>
                  </select>
                </div>
              )}

              {item.fulfilmentType === "external_link" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Destination URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/reward-destination"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}

              {item.fulfilmentType === "manual" && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500">Fulfilment Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Contact the participant via email within 7 days. Verify their identity and arrange delivery/collection of the reward item."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-400">Instructions for the admin/team on how to manually fulfil this reward.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // R5 — Availability
  const renderR5 = () => (
    <div className="space-y-5">
      <div>
        <h4 className="font-bold text-gray-900">Reward Availability</h4>
        <p className="text-xs text-gray-500 mt-0.5">Configure quantity limits, qualification period, and expiry</p>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700">Quantity</label>
        <div className="flex gap-3">
          {(["unlimited", "limited"] as const).map((qt) => (
            <button
              key={qt}
              type="button"
              onClick={() => updateReward({ quantityType: qt, quantityLimit: qt === "limited" ? (data.quantityLimit ?? 1) : null })}
              className={`flex-1 rounded-lg border-2 p-3 text-center text-sm font-semibold capitalize transition-colors ${
                data.quantityType === qt
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {qt === "unlimited" ? "Unlimited" : "Limited"}
            </button>
          ))}
        </div>
        {data.quantityType === "limited" && (
          <div className="space-y-1 mt-2">
            <label className="block text-[11px] font-bold text-gray-500">Maximum Quantity</label>
            <input
              type="number"
              min={1}
              value={data.quantityLimit ?? ""}
              onChange={(e) => updateReward({ quantityLimit: Number(e.target.value) || null })}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      {/* Qualification Period */}
      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Qualification Period <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="text"
          value={data.qualificationPeriod}
          onChange={(e) => updateReward({ qualificationPeriod: e.target.value })}
          placeholder="e.g. First 7 days of campaign"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <p className="text-[11px] text-gray-400">When participants must qualify for this reward (leave blank for entire campaign duration)</p>
      </div>

      {/* Claim Deadline */}
      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Claim Deadline</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={data.claimDeadlineDays}
            onChange={(e) => updateReward({ claimDeadlineDays: Number(e.target.value) || 1 })}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">days after reward is issued</span>
        </div>
      </div>

      {/* Expiry */}
      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-700">Expiry</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={data.expiryDays}
            onChange={(e) => updateReward({ expiryDays: Number(e.target.value) || 1 })}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">days after issue</span>
        </div>
      </div>
    </div>
  );

  // R6 — Summary
  const renderR6 = () => {
    const warnings: string[] = [];
    if (!data.title.trim()) warnings.push("Reward name is missing");
    if (data.items.length === 0) warnings.push("No items added to this reward");
    data.items.forEach((item, i) => {
      if (!item.title.trim()) warnings.push(`Item ${i + 1} name is missing`);
      if (!item.value) warnings.push(`Item ${i + 1} has no value set`);
    });

    return (
      <div className="space-y-5">
        <div>
          <h4 className="font-bold text-gray-900">Reward Summary</h4>
          <p className="text-xs text-gray-500 mt-0.5">Review your reward configuration before saving</p>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
            <p className="text-xs font-bold text-amber-800">Validation Warnings</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-700">• {w}</p>
            ))}
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Name</span>
            <span className="text-sm font-semibold text-gray-900">{data.title || "(unnamed)"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Audience</span>
            <span className="text-sm text-gray-700 capitalize">{data.audience === "both" ? "Both" : data.audience}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Trigger</span>
            <span className="text-sm text-gray-700">{getTriggerLabel(data.triggerType)}</span>
          </div>
          {data.triggerType === "contribution" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase">Criteria</span>
              <span className="text-sm text-gray-700">
                {data.triggerConfig.mode === "min" && data.triggerConfig.min
                  ? `Min £${data.triggerConfig.min}`
                  : data.triggerConfig.mode === "range" && data.triggerConfig.min && data.triggerConfig.max
                    ? `£${data.triggerConfig.min} – £${data.triggerConfig.max}`
                    : data.triggerConfig.mode === "exact" && data.triggerConfig.exact
                      ? `Exact £${data.triggerConfig.exact}`
                      : "Not configured"}
              </span>
            </div>
          )}
          {(data.triggerType === "first_n" || data.triggerType === "top_n") && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase">Count</span>
              <span className="text-sm text-gray-700">{data.triggerConfig.count ?? "Not set"}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Items</span>
            <span className="text-sm text-gray-700">{data.items.length} item{data.items.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Quantity</span>
            <span className="text-sm text-gray-700">{data.quantityType === "unlimited" ? "Unlimited" : `Limited to ${data.quantityLimit}`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Claim Deadline</span>
            <span className="text-sm text-gray-700">{data.claimDeadlineDays} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Expiry</span>
            <span className="text-sm text-gray-700">{data.expiryDays} days after issue</span>
          </div>
          {data.qualificationPeriod && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase">Qualification Period</span>
              <span className="text-sm text-gray-700">{data.qualificationPeriod}</span>
            </div>
          )}
        </div>

        {data.items.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-gray-500 uppercase">Items Included</h5>
            {data.items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title || "(untitled)"}</p>
                  <p className="text-xs text-gray-500 truncate">{item.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.physicalType === "digital" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {item.physicalType}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700">
                    {FULFILMENT_OPTIONS.find((f) => f.value === item.fulfilmentType)?.label ?? item.fulfilmentType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const steps = [renderR1, renderR2, renderR3, renderR4, renderR5, renderR6];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {reward ? "Edit Reward" : "New Reward"}
          </h3>
          <p className="text-xs text-gray-500">
            {reward ? "Update the reward configuration" : "Configure a new reward for this campaign"}
          </p>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="flex items-center gap-1">
        {REWARD_EDITOR_STEPS.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-1 flex-1">
            <div
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                idx === editorStep
                  ? "bg-primary-100 text-primary-700"
                  : idx < editorStep
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {idx < editorStep ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <span>{s.key}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < REWARD_EDITOR_STEPS.length - 1 && (
              <div className={`h-px flex-1 ${idx < editorStep ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {steps[editorStep]?.()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={editorStep === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={() => onSave(data)}
            disabled={!data.title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Save Reward
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 9 — Campaign Rewards
// ═══════════════════════════════════════════════════════════════════════════

function StepRewards({ formData, onUpdate }: StepProps) {
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);

  const rewards = formData.rewards;

  const handleSaveReward = (reward: CampaignReward) => {
    const existing = rewards.find((r) => r.id === reward.id);
    let updated: CampaignReward[];
    if (existing) {
      updated = rewards.map((r) => (r.id === reward.id ? reward : r));
    } else {
      updated = [...rewards, reward];
    }
    onUpdate({ rewards: updated });
    setEditingRewardId(null);
  };

  const handleDeleteReward = (id: string) => {
    onUpdate({ rewards: rewards.filter((r) => r.id !== id) });
  };

  const handleDuplicateReward = (reward: CampaignReward) => {
    const dup: CampaignReward = {
      ...reward,
      id: `reward-${Date.now()}`,
      title: `${reward.title} (Copy)`,
      order: rewards.length,
    };
    onUpdate({ rewards: [...rewards, dup] });
  };

  const getTriggerLabel = (t: CampaignReward["triggerType"]) => {
    return TRIGGER_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
  };

  const getAudienceLabel = (a: CampaignReward["audience"]) => {
    if (a === "both") return "All";
    if (a === "business") return "Business";
    return "Consumer";
  };

  // Editing mode — render RewardEditor instead of list
  if (editingRewardId !== null) {
    const rewardToEdit = editingRewardId === "new" ? null : rewards.find((r) => r.id === editingRewardId) ?? null;
    return (
      <RewardEditor
        reward={rewardToEdit}
        onSave={handleSaveReward}
        onCancel={() => setEditingRewardId(null)}
        campaignAudience={formData.audience}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Rewards</h2>
        <p className="mt-1 text-sm text-gray-500">Does this campaign offer rewards?</p>
      </div>

      {/* Has Rewards toggle */}
      <div className="space-y-3">
        {([false, true] as const).map((val) => (
          <label
            key={String(val)}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
              formData.hasRewards === val
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="hasRewards"
              checked={formData.hasRewards === val}
              onChange={() => onUpdate({ hasRewards: val })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-semibold text-gray-900">{val ? "Yes" : "No"}</span>
          </label>
        ))}
      </div>

      {formData.hasRewards && (
        <>
          {/* Qualification Mode — Step 11 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary-600" />
              How should rewards be awarded?
            </h3>
            <p className="text-xs text-gray-500">This controls how the system evaluates multiple rewards per participant.</p>
            <div className="flex gap-3">
              {(["highest", "cumulative"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdate({ qualificationMode: m })}
                  className={`flex-1 rounded-lg border-2 p-3 text-center text-sm font-semibold transition-colors ${
                    formData.qualificationMode === m
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {m === "highest" ? "Highest Qualifying Reward" : "All Qualifying Rewards"}
                </button>
              ))}
            </div>

            {/* Explanation */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
              {formData.qualificationMode === "highest" ? (
                <>
                  <p className="text-sm font-medium text-gray-700">Highest Qualifying Reward (Recommended)</p>
                  <p className="text-xs text-gray-500">Each participant receives only the single highest reward they qualify for.</p>
                  <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Example:</p>
                    <p className="text-xs text-gray-500">£10–£49.99 → Reward A</p>
                    <p className="text-xs text-gray-500">£50–£99.99 → Reward B</p>
                    <p className="text-xs text-gray-500">£100–£199.99 → Reward C</p>
                    <p className="text-xs text-gray-500">£200+ → Reward D</p>
                    <p className="text-xs text-gray-700 font-medium mt-2">A £150 contribution receives <strong>Reward C</strong>.</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">All Qualifying Rewards</p>
                  <p className="text-xs text-gray-500">A participant receives every reward they qualify for.</p>
                  <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Example:</p>
                    <p className="text-xs text-gray-500">£10+ → Reward A</p>
                    <p className="text-xs text-gray-500">£50+ → Reward B</p>
                    <p className="text-xs text-gray-500">£100+ → Reward C</p>
                    <p className="text-xs text-gray-700 font-medium mt-2">A £150 contribution receives <strong>Reward A + B + C</strong>.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reward Structure View — Step 16 */}
          {rewards.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary-600" />
                Campaign Rewards
              </h3>
              <p className="text-xs text-gray-500">Overview of all reward tiers and their items.</p>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 font-mono text-sm">
                {rewards.map((reward, idx) => (
                  <div key={reward.id} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{idx === rewards.length - 1 ? "└──" : "├──"}</span>
                      <span className="font-bold text-gray-900">Reward {idx + 1}</span>
                      <span className="text-gray-500 text-xs">
                        {reward.triggerType === "contribution" && reward.triggerConfig.mode === "range" && reward.triggerConfig.min && reward.triggerConfig.max
                          ? `£${reward.triggerConfig.min}–£${reward.triggerConfig.max}`
                          : reward.triggerType === "contribution" && reward.triggerConfig.mode === "min" && reward.triggerConfig.min
                            ? `£${reward.triggerConfig.min}+`
                            : reward.triggerType === "contribution" && reward.triggerConfig.mode === "exact" && reward.triggerConfig.exact
                              ? `£${reward.triggerConfig.exact}`
                              : getTriggerLabel(reward.triggerType)}
                      </span>
                    </div>
                    <div className="ml-5 space-y-0.5">
                      {reward.items.map((item, iIdx) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">
                            {iIdx === reward.items.length - 1 ? "└──" : "├──"}
                          </span>
                          <span className="text-gray-600 text-xs">{item.title || "(untitled)"}</span>
                          <span className={`text-[10px] px-1 rounded ${
                            item.physicalType === "digital" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                          }`}>
                            {item.physicalType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reward Validation — Step 17 */}
          {rewards.length > 0 && (() => {
            const warnings: string[] = [];

            // Check for missing required fields
            rewards.forEach((r, idx) => {
              if (!r.title.trim()) warnings.push(`Reward ${idx + 1}: Name is required`);
              if (!r.audience) warnings.push(`Reward ${idx + 1}: Audience is required`);
              if (!r.triggerType) warnings.push(`Reward ${idx + 1}: Trigger type is required`);
              if (r.items.length === 0) warnings.push(`Reward ${idx + 1}: At least one item is required`);
              r.items.forEach((item, iIdx) => {
                if (!item.title.trim()) warnings.push(`Reward ${idx + 1}, Item ${iIdx + 1}: Name is required`);
              });
            });

            // Check for trigger overlaps (contribution ranges)
            const contribRewards = rewards
              .filter((r) => r.triggerType === "contribution" && r.triggerConfig.mode === "range")
              .sort((a, b) => (a.triggerConfig.min ?? 0) - (b.triggerConfig.min ?? 0));

            for (let i = 0; i < contribRewards.length - 1; i++) {
              const current = contribRewards[i];
              const next = contribRewards[i + 1];
              if (!current || !next) continue;
              if (current.triggerConfig.max && next.triggerConfig.min && current.triggerConfig.max > next.triggerConfig.min) {
                warnings.push(
                  `Trigger overlap: Reward "${current.title}" (£${current.triggerConfig.min}–£${current.triggerConfig.max}) overlaps with "${next.title}" (£${next.triggerConfig.min}–£${next.triggerConfig.max})`
                );
              }
            }

            // Recommend range mode for contribution tiers
            const minOnlyRewards = rewards.filter(
              (r) => r.triggerType === "contribution" && r.triggerConfig.mode === "min"
            );
            if (minOnlyRewards.length > 1) {
              warnings.push(
                `Consider using range mode instead of minimum for contribution tiers to avoid overlap. Use "Highest Qualifying" mode for best results.`
              );
            }

            if (warnings.length === 0) return null;

            return (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                <h3 className="font-bold text-amber-800 flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Reward Validation
                </h3>
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                    <span className="mt-0.5">⚠</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Reward List */}
          <div className="space-y-3">
            {rewards.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Gift className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No rewards added yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Reward" to configure your first reward.</p>
              </div>
            )}

            {rewards.map((reward, idx) => (
              <div
                key={reward.id}
                className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{reward.title || "(unnamed)"}</h4>
                      <p className="text-xs text-gray-500">{getTriggerLabel(reward.triggerType)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingRewardId(reward.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateReward(reward)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReward(reward.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Delete"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase">
                    {reward.items.length} item{reward.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 uppercase">
                    {getAudienceLabel(reward.audience)}
                  </span>
                  {reward.triggerType !== "contribution" && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                      {getTriggerLabel(reward.triggerType)}
                    </span>
                  )}
                  {reward.triggerType === "contribution" && reward.triggerConfig.mode && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                      {reward.triggerConfig.mode === "min"
                        ? `Min £${reward.triggerConfig.min ?? "?"}`
                        : reward.triggerConfig.mode === "range"
                          ? `£${reward.triggerConfig.min ?? "?"}–£${reward.triggerConfig.max ?? "?"}`
                          : `Exact £${reward.triggerConfig.exact ?? "?"}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Reward button */}
          <button
            type="button"
            onClick={() => setEditingRewardId("new")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 p-4 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-100"
          >
            <Plus className="h-4 w-4" />
            Add Reward
          </button>
        </>
      )}
    </div>
  );
}

function StepPreview({ formData }: StepProps) {
  const [previewMode, setPreviewMode] = useState<"campaign" | "participant" | "reward-logic">("campaign");

  const getTriggerLabel = (t: CampaignReward["triggerType"]) => {
    const labels: Record<string, string> = {
      contribution: "Contribution",
      membership: "Membership",
      founding_monthly: "Founding Monthly",
      first_n: "First N Backers",
      top_n: "Top N Backers",
    };
    return labels[t] || t;
  };

  const getTriggerRange = (reward: CampaignReward) => {
    if (reward.triggerType === "contribution") {
      const { mode, min, max, exact } = reward.triggerConfig;
      if (mode === "min") return `Min £${min ?? "?"}`;
      if (mode === "range") return `£${min ?? "?"} – £${max ?? "?"}`;
      if (mode === "exact") return `£${exact ?? "?"}`;
    }
    if (reward.triggerType === "first_n") return `First ${reward.triggerConfig.count ?? "?"} backers`;
    if (reward.triggerType === "top_n") return `Top ${reward.triggerConfig.count ?? "?"} backers`;
    return getTriggerLabel(reward.triggerType);
  };

  const getFulfilmentLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: "Email Delivery",
      manual: "Manual Fulfilment",
      api: "API Integration",
      third_party: "Third-Party Provider",
      voucher: "Voucher Code",
    };
    return labels[type] || type || "Not set";
  };

  const categoryLabel = CATEGORIES.find((c) => c.value === formData.categoryId)?.label || "—";
  const seasonLabels = (formData.seasonIds || [])
    .map((sid) => SEASONS.find((s) => s.value === sid)?.label)
    .filter(Boolean);

  const TABS: { key: typeof previewMode; label: string }[] = [
    { key: "campaign", label: "Campaign Review" },
    { key: "participant", label: "Participant Preview" },
    { key: "reward-logic", label: "Reward Logic" },
  ];

  // ── Tab 1: Campaign Review ──
  const renderCampaignReview = () => (
    <div className="space-y-6">
      {/* Section 1: Scope */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Scope</h4>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 uppercase">
            {formData.scope === "city" ? "City Campaign" : "Independent"}
          </span>
          {formData.scope === "city" && formData.cityName && (
            <span className="text-sm font-medium text-gray-700">{formData.cityName}</span>
          )}
        </div>
      </div>

      {/* Section 2: Location Coverage */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Location Coverage</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Local Areas:</span>
            <span className="font-medium text-gray-900">
              {formData.locationCoverage.mode === "all"
                ? "All areas"
                : `${formData.locationCoverage.selectedLocalAreas.length} selected`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">High Streets:</span>
            <span className="font-medium text-gray-900">
              {formData.locationCoverage.highStreetMode === "all"
                ? "All streets"
                : `${formData.locationCoverage.selectedHighStreets.length} selected`}
            </span>
          </div>
          {formData.scope === "city" && formData.locationCoverage.mode === "selected" && formData.locationCoverage.selectedLocalAreas.length > 0 && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">Selected Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {formData.locationCoverage.selectedLocalAreas.map((laId) => (
                  <span key={laId} className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    {laId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Campaign */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Campaign</h4>
        <div className="space-y-3">
          <div>
            <div className="text-lg font-bold text-gray-900">{formData.title || "Untitled Campaign"}</div>
            {formData.shortDescription && (
              <p className="mt-1 text-sm text-gray-600">{formData.shortDescription}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-gray-500">Category: <span className="font-medium text-gray-900">{categoryLabel}</span></span>
            {seasonLabels.length > 0 && (
              <span className="text-gray-500">Season(s): <span className="font-medium text-gray-900">{seasonLabels.join(", ")}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Audience */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Audience</h4>
        <span className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700">
          {formData.audience === "both" ? "Business + Consumer" : formData.audience === "business" ? "Business" : "Consumer"}
        </span>
      </div>

      {/* Section 5: Participation */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Participation</h4>
        <div className="flex flex-wrap gap-2">
          {formData.participation.backCampaign && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Back Campaign</span>
          )}
          {formData.participation.foundingMember && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Founding Member</span>
          )}
          {formData.participation.foundingMemberMonthly && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Founding Monthly</span>
          )}
        </div>
      </div>

      {/* Section 6: Funding */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Funding</h4>
        <div className="space-y-2 text-sm">
          {formData.funding.hasTarget && formData.funding.targetAmount ? (
            <div className="rounded-lg bg-primary-50 p-3">
              <span className="text-xs text-primary-600">Target Amount</span>
              <div className="text-xl font-bold text-primary-700">
                £{Number(formData.funding.targetAmount).toLocaleString()}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">No funding target set (open funding)</span>
          )}
          {formData.funding.minContribution && (
            <div className="text-gray-600">Min Contribution: <span className="font-medium">£{formData.funding.minContribution}</span></div>
          )}
          {formData.funding.maxContribution && (
            <div className="text-gray-600">Max Contribution: <span className="font-medium">£{formData.funding.maxContribution}</span></div>
          )}
        </div>
      </div>

      {/* Section 7: Period */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Period</h4>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" />
          {formData.period.startDate ? (
            <span className="font-medium">
              {formData.period.startDate}
              {formData.period.startTime ? ` ${formData.period.startTime}` : ""}
              {" → "}
              {formData.period.endDate || "TBD"}
              {formData.period.endTime ? ` ${formData.period.endTime}` : ""}
            </span>
          ) : (
            <span className="text-gray-400">Dates not set</span>
          )}
        </div>
      </div>

      {/* Section 8: Rewards */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Rewards</h4>
        {formData.hasRewards && formData.rewards.length > 0 ? (
          <div className="space-y-3">
            {formData.rewards.map((reward, idx) => (
              <div key={reward.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      R{idx + 1}. {reward.title}
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                      {getTriggerLabel(reward.triggerType)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{reward.items.length} item(s)</span>
                </div>
                {reward.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reward.items.map((item) => (
                      <span key={item.id} className="rounded bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {item.title} ({item.physicalType})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No rewards configured</p>
        )}
      </div>
    </div>
  );

  // ── Tab 2: Participant Preview ──
  const renderParticipantPreview = () => (
    <div className="space-y-6">
      {/* Campaign Card */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {formData.featuredImage ? (
          <div className="h-40 bg-gray-200">
            <img src={formData.featuredImage} alt={formData.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-primary-400 text-sm font-medium">Campaign Image</span>
          </div>
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-bold text-primary-700 uppercase">
              {formData.scope === "city" ? "City Campaign" : "Independent"}
            </span>
            {formData.cityName && (
              <span className="text-xs text-gray-500">{formData.cityName}</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{formData.title || "Campaign Title"}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {formData.shortDescription || "Campaign description will appear here."}
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-bold text-pink-700">
              {formData.audience === "both" ? "For Everyone" : formData.audience === "business" ? "Business" : "Consumers"}
            </span>
          </div>
        </div>
      </div>

      {/* Location Info */}
      {formData.scope === "city" && formData.cityName && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{formData.cityName}</span>
            {formData.locationCoverage.mode === "all" ? (
              <span className="text-gray-400">— All areas</span>
            ) : (
              <span className="text-gray-400">— {formData.locationCoverage.selectedLocalAreas.length} area(s)</span>
            )}
          </div>
        </div>
      )}

      {/* Contribution Options */}
      {formData.funding.hasTarget && formData.funding.targetAmount && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-900">Support this campaign</h4>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="text-xs text-gray-500">Target</div>
            <div className="text-2xl font-bold text-gray-900">
              £{Number(formData.funding.targetAmount).toLocaleString()}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(formData.funding.suggestedAmounts || []).slice(0, 4).map((amt) => (
              <button key={amt} type="button" className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100">
                £{amt}
              </button>
            ))}
            {formData.funding.allowCustomAmount && (
              <button type="button" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Custom
              </button>
            )}
          </div>
        </div>
      )}

      {/* Participation Buttons */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h4 className="text-sm font-bold text-gray-900">How to participate</h4>
        <div className="flex flex-wrap gap-2">
          {formData.participation.backCampaign && (
            <button type="button" className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700">
              Back This Campaign
            </button>
          )}
          {formData.participation.foundingMember && (
            <button type="button" className="rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 hover:bg-primary-50">
              Become a Founding Member
            </button>
          )}
          {formData.participation.foundingMemberMonthly && (
            <button type="button" className="rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 hover:bg-primary-50">
              Monthly Membership
            </button>
          )}
        </div>
      </div>

      {/* Reward Tiers */}
      {formData.hasRewards && formData.rewards.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 px-1">Reward Tiers</h4>
          {formData.rewards.map((reward, idx) => (
            <div key={reward.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs text-gray-400 font-bold">TIER {idx + 1}</span>
                  <h5 className="text-base font-bold text-gray-900">{reward.title}</h5>
                </div>
                {reward.quantityType === "limited" && reward.quantityLimit && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {reward.quantityLimit} left
                  </span>
                )}
              </div>
              {reward.description && (
                <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
              )}
              <div className="rounded-lg bg-gray-50 p-3 mb-3">
                <span className="text-sm font-bold text-primary-700">
                  {getTriggerRange(reward)}
                </span>
                {reward.triggerType === "contribution" && (
                  <span className="text-sm text-gray-500"> → Receive:</span>
                )}
              </div>
              {reward.items.length > 0 && (
                <div className="space-y-1.5">
                  {reward.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      <span className="font-medium text-gray-900">{item.title}</span>
                      <span className="text-gray-400">({item.physicalType === "digital" ? "Digital" : "Physical"})</span>
                      {item.value && <span className="text-gray-400">— £{item.value}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Period */}
      {formData.period.startDate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Campaign runs {formData.period.startDate} → {formData.period.endDate || "TBD"}</span>
          </div>
        </div>
      )}
    </div>
  );

  // ── Tab 3: Reward Logic Preview ──
  const renderRewardLogicPreview = () => (
    <div className="space-y-6">
      {formData.hasRewards && formData.rewards.length > 0 ? (
        formData.rewards.map((reward, idx) => (
          <div key={reward.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
                R{idx + 1}
              </span>
              <h4 className="text-base font-bold text-gray-900">{reward.title}</h4>
            </div>

            {/* Flow diagram */}
            <div className="space-y-0 rounded-lg bg-gray-50 p-4 font-mono text-sm">
              {/* Trigger */}
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">TRIGGER</span>
                <span className="text-gray-700">{getTriggerLabel(reward.triggerType)}</span>
              </div>
              <div className="pl-6 text-gray-400">↓</div>

              {/* Amount range */}
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">AMOUNT</span>
                <span className="text-gray-700">{getTriggerRange(reward)}</span>
              </div>
              <div className="pl-6 text-gray-400">↓</div>

              {/* Reward name */}
              <div className="flex items-center gap-2">
                <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">REWARD</span>
                <span className="text-gray-700">{reward.title}</span>
              </div>
              <div className="pl-6 text-gray-400">↓</div>

              {/* Items */}
              <div className="flex items-start gap-2">
                <span className="rounded bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">ITEMS</span>
                <div className="space-y-1">
                  {reward.items.length > 0 ? (
                    reward.items.map((item) => (
                      <div key={item.id} className="text-gray-700">
                        • {item.title} ({item.physicalType}, £{item.value || "0"})
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No items configured</span>
                  )}
                </div>
              </div>
              <div className="pl-6 text-gray-400">↓</div>

              {/* Fulfilment */}
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-200 px-2 py-1 text-xs font-bold text-gray-700">FULFIL</span>
                <span className="text-gray-700">{getFulfilmentLabel(reward.fulfilmentType)}</span>
              </div>
            </div>

            {/* Config details */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-gray-50 p-2">
                <span className="text-gray-400">Audience: </span>
                <span className="font-medium text-gray-700">
                  {reward.audience === "both" ? "All" : reward.audience === "business" ? "Business" : "Consumer"}
                </span>
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="text-gray-400">Quantity: </span>
                <span className="font-medium text-gray-700">
                  {reward.quantityType === "unlimited" ? "Unlimited" : `${reward.quantityLimit ?? "—"} limited`}
                </span>
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="text-gray-400">Expiry: </span>
                <span className="font-medium text-gray-700">{reward.expiryDays} days</span>
              </div>
              <div className="rounded bg-gray-50 p-2">
                <span className="text-gray-400">Claim deadline: </span>
                <span className="font-medium text-gray-700">{reward.claimDeadlineDays} days</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Gift className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No rewards configured yet.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Preview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review your campaign from different perspectives before submitting.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPreviewMode(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
              previewMode === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {previewMode === "campaign" && renderCampaignReview()}
      {previewMode === "participant" && renderParticipantPreview()}
      {previewMode === "reward-logic" && renderRewardLogicPreview()}
    </div>
  );
}

function StepReview({ formData, onNavigateToStep, onSubmit }: StepProps) {
  type CheckId =
    | "scope" | "locations" | "details" | "audience"
    | "participation" | "funding" | "period" | "rules"
    | "rewards" | "reward-triggers" | "reward-items" | "fulfilment" | "preview";

  interface CheckItem {
    id: CheckId;
    label: string;
    stepId: StepId;
    pass: boolean;
    message?: string;
  }

  const checks: CheckItem[] = useMemo(() => {
    const result: CheckItem[] = [];

    // Basic step validations
    const stepChecks: { id: CheckId; label: string; stepId: StepId }[] = [
      { id: "scope", label: "Campaign Scope", stepId: "scope" },
      { id: "locations", label: "Location Coverage", stepId: "locations" },
      { id: "details", label: "Campaign Details", stepId: "details" },
      { id: "audience", label: "Audience", stepId: "audience" },
      { id: "participation", label: "Participation", stepId: "participation" },
      { id: "funding", label: "Funding", stepId: "funding" },
      { id: "period", label: "Campaign Period", stepId: "period" },
      { id: "rules", label: "Campaign Rules", stepId: "rules" },
      { id: "rewards", label: "Rewards", stepId: "rewards" },
      { id: "preview", label: "Preview", stepId: "preview" },
    ];

    for (const sc of stepChecks) {
      const vr = validateStep(sc.stepId, formData);
      result.push({
        id: sc.id,
        label: sc.label,
        stepId: sc.stepId,
        pass: vr.valid,
        message: vr.errors.length > 0 ? vr.errors[0] : undefined,
      });
    }

    // Reward-specific checks
    if (formData.hasRewards) {
      const rewardsWithNoTrigger = formData.rewards.filter(
        (r) => !r.triggerType || (r.triggerType === "contribution" && !r.triggerConfig.mode)
      );
      result.push({
        id: "reward-triggers",
        label: "Reward Triggers",
        stepId: "rewards",
        pass: rewardsWithNoTrigger.length === 0,
        message: rewardsWithNoTrigger.length > 0
          ? `${rewardsWithNoTrigger.length} reward(s) missing trigger configuration`
          : undefined,
      });

      const rewardsWithNoItems = formData.rewards.filter((r) => r.items.length === 0);
      result.push({
        id: "reward-items",
        label: "Reward Items",
        stepId: "rewards",
        pass: rewardsWithNoItems.length === 0,
        message: rewardsWithNoItems.length > 0
          ? `${rewardsWithNoItems.length} reward(s) have no items`
          : undefined,
      });

      const itemsWithNoFulfilment = formData.rewards.flatMap((r) =>
        r.items.filter((item) => !item.fulfilmentType).map((item) => `${r.title} → ${item.title}`)
      );
      result.push({
        id: "fulfilment",
        label: "Fulfilment",
        stepId: "rewards",
        pass: itemsWithNoFulfilment.length === 0,
        message: itemsWithNoFulfilment.length > 0
          ? `${itemsWithNoFulfilment.length} item(s) missing fulfilment: ${itemsWithNoFulfilment.slice(0, 2).join(", ")}${itemsWithNoFulfilment.length > 2 ? "…" : ""}`
          : undefined,
      });
    } else {
      result.push(
        { id: "reward-triggers", label: "Reward Triggers", stepId: "rewards", pass: true },
        { id: "reward-items", label: "Reward Items", stepId: "rewards", pass: true },
        { id: "fulfilment", label: "Fulfilment", stepId: "rewards", pass: true },
      );
    }

    return result;
  }, [formData]);

  const allPassing = checks.every((c) => c.pass);
  const failingChecks = checks.filter((c) => !c.pass);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Campaign Review</h2>
        <p className="mt-1 text-sm text-gray-500">
          Final validation before submitting your campaign.
        </p>
      </div>

      {/* Readiness Checklist */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Campaign Readiness</h4>
        <div className="space-y-2">
          {checks.map((check) => (
            <button
              key={check.id}
              type="button"
              onClick={() => onNavigateToStep?.(check.stepId)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:opacity-80 ${
                check.pass
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  check.pass
                    ? "bg-green-200 text-green-700"
                    : "bg-red-200 text-red-700"
                }`}
              >
                {check.pass ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="text-sm font-medium text-gray-900">{check.label}</span>
              {check.message && (
                <span className="ml-auto text-xs text-red-600">{check.message}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Status */}
      {allPassing ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
          <p className="text-sm font-bold text-green-700">All checks passed</p>
          <p className="text-xs text-green-600">Your campaign is ready to publish.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">⚠</span>
            <span className="text-sm font-bold text-amber-800">Action Required</span>
          </div>
          <div className="space-y-1.5">
            {failingChecks.map((check) => (
              <button
                key={check.id}
                type="button"
                onClick={() => onNavigateToStep?.(check.stepId)}
                className="flex w-full items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-left text-sm text-amber-900 transition-colors hover:bg-white"
              >
                <span className="text-amber-500">—</span>
                <span>{check.message || `${check.label} failed`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {allPassing && (
        <button
          onClick={() => onSubmit?.()}
          className="w-full rounded-xl bg-green-600 px-6 py-4 text-base font-bold text-white hover:bg-green-700 transition-colors"
        >
          Publish Campaign
        </button>
      )}
    </div>
  );
}

// ── Step Component Map ──

const STEP_COMPONENTS: Record<StepId, React.FC<StepProps>> = {
  scope: StepScope,
  locations: StepLocations,
  details: StepDetails,
  audience: StepAudience,
  participation: StepParticipation,
  funding: StepFunding,
  period: StepPeriod,
  rules: StepRules,
  rewards: StepRewards,
  preview: StepPreview,
  review: StepReview,
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Wizard Component
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  campaignId?: string;
  onClose?: () => void;
  onSaved?: () => void;
}

export function AdminCampaignWizard({ campaignId, onClose: _onClose, onSaved }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<CampaignWizardData>(createDefaultWizardData());
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string[]>>>({});
  const [saving, setSaving] = useState(false);

  // Read initial status from URL
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setFormData((prev) => ({ ...prev, status: status as CampaignWizardData["status"] }));
    }

    // Duplicate flow — pre-fill from source campaign
    const duplicateFrom = searchParams.get("duplicateFrom");
    if (duplicateFrom) {
      // Find source campaign in demo data
      const sourceCampaign = DEMO_CAMPAIGNS.find((c) => c.id === duplicateFrom);
      if (sourceCampaign) {
        setFormData((prev) => ({
          ...prev,
          // Scope
          scope: sourceCampaign.scope,
          cityName: sourceCampaign.cityName || prev.cityName,
          citySlug: sourceCampaign.citySlug || prev.citySlug,
          // Location coverage (copy but admin should review for new city)
          locationCoverage: { ...sourceCampaign.locationCoverage },
          // Details (prepend "Copy of" to title)
          title: `Copy of ${sourceCampaign.title}`,
          shortDescription: sourceCampaign.shortDescription,
          description: sourceCampaign.description,
          categoryId: sourceCampaign.categoryId,
          seasonIds: [...sourceCampaign.seasonIds],
          // Audience
          audience: sourceCampaign.audience,
          // Participation
          participation: { ...sourceCampaign.participation },
          // Funding (keep amounts — admin adjusts target for new city)
          funding: { ...sourceCampaign.funding },
          // Period (copy mode but clear dates — new campaign needs fresh dates)
          period: {
            ...sourceCampaign.period,
            startDate: "",
            startTime: "",
            endDate: "",
            endTime: "",
          },
          // Rules
          rules: { ...sourceCampaign.rules },
          // Rewards (deep copy items so each duplicate gets its own references)
          rewards: sourceCampaign.rewards.map((reward) => ({
            ...reward,
            id: `${reward.id}-copy-${Date.now()}`,
            items: reward.items.map((item) => ({
              ...item,
              id: `${item.id}-copy-${Date.now()}`,
            })),
          })),
          qualificationMode: sourceCampaign.qualificationMode,
          hasRewards: sourceCampaign.hasRewards,
          // Always start as draft
          status: "draft",
        }));
      }
    }
  }, [searchParams]);

  const currentStep: StepDef = WIZARD_STEPS[currentStepIdx] ?? WIZARD_STEPS[0]!;
  const isFirstStep = currentStepIdx === 0;
  const isLastStep = currentStepIdx === WIZARD_STEPS.length - 1;
  const mode = campaignId ? "edit" : "create";

  // Update form data
  const handleUpdate = useCallback((updates: Partial<CampaignWizardData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate current step
  const currentValidation = useMemo(
    () => validateStep(currentStep.id, formData),
    [currentStep.id, formData],
  );

  // Navigate to step
  const goToStep = useCallback((stepId: StepId) => {
    const idx = WIZARD_STEPS.findIndex((s) => s.id === stepId);
    if (idx >= 0) setCurrentStepIdx(idx);
  }, []);

  // Back
  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  }, [isFirstStep]);

  // Next
  const handleNext = useCallback(() => {
    if (isLastStep) return;

    const validation = validateStep(currentStep.id, formData);
    if (!validation.valid) {
      setStepErrors((prev) => ({ ...prev, [currentStep.id]: validation.errors }));
      return;
    }

    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[currentStep.id];
      return next;
    });
    setCompletedSteps((prev) => new Set([...prev, currentStep.id]));
    setCurrentStepIdx((prev) => prev + 1);
  }, [isLastStep, currentStep.id, formData]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSaved?.();
      navigate("/admin/campaigns");
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }, [navigate, onSaved]);

  // Load existing campaign data if editing
  useEffect(() => {
    if (campaignId) {
      // TODO: Fetch campaign data and populate form
    }
  }, [campaignId]);

  const StepComponent = STEP_COMPONENTS[currentStep.id];

  return (
    <WizardShell
      steps={WIZARD_STEPS}
      currentStep={currentStep.id}
      completedSteps={completedSteps}
      stepErrors={stepErrors}
      onStepClick={goToStep}
      onBack={handleBack}
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      nextDisabled={!currentValidation.valid && currentStep.id !== "preview"}
      saving={saving}
      mode={mode}
    >
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <StepComponent
          formData={formData}
          onUpdate={handleUpdate}
          onNavigateToStep={goToStep}
          onSubmit={() => {
            const today = new Date();
            const startDate = formData.period.startDate ? new Date(formData.period.startDate) : null;
            const newStatus = startDate && startDate > today ? "scheduled" : "active";
            setFormData((prev) => ({ ...prev, status: newStatus }));
            navigate("/admin/campaigns");
          }}
        />
      </div>
    </WizardShell>
  );
}
