// =============================================================================
// Reward Library — Admin
// Create and manage reusable rewards that can be attached to campaigns.
// =============================================================================

import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Plus,
  Search,
  Gift,
  Package,
  Edit3,
  Copy,
  Archive,
  Trash2,
  X,
  ChevronLeft,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Upload,
  LinkIcon,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  DIGITAL_TYPE_ORDER, DIGITAL_TYPE_META, AVAILABILITY_META,
  getDigitalAssets, getPhysicalAssets, physicalInStock,
  type DigitalAssetType, type PhysicalAsset,
} from "@/data/assetStore";
import {
  getMcomPlatforms, MCOM_GROUP_META,
} from "@/data/mcomAssetCatalogue";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RewardType = "standard" | "ecard" | "cashback" | "points" | "discount" | "loyalty" | "coupon" | "course_access";
type Audience = "business" | "consumer" | "both";
type RewardStatus = "active" | "draft" | "archived";
type PhysicalType = "digital" | "physical";
type AssetType = "file" | "url";
type TriggerMode = "minimum" | "range" | "exact";
type QuantityMode = "unlimited" | "limited";
type FulfilmentType = "manual" | "instruction" | "external_link" | "internal" | "mcom_vcard" | "webhook";

interface RewardItem {
  id: string;
  title: string;
  description: string;
  physicalType: PhysicalType;
  assetType: AssetType;
  assetUrl: string;
  quantity: number;
}

/** An asset attached to a reward — Digital/Physical from Asset Management, or an Internal Asset (access to a connected MCOM/247GBS platform). */
interface RewardAsset {
  key: string;
  assetId: string;
  name: string;
  source: "digital" | "physical" | "internal";
  sourceLabel: string;
  statusLabel: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  audience: Audience;
  status: RewardStatus;
  items: RewardItem[];
  triggerMode: TriggerMode;
  triggerMin: number;
  triggerMax: number;
  triggerExact: number;
  quantityMode: QuantityMode;
  maxQuantity: number;
  availableFrom: string;
  availableUntil: string;
  claimDeadlineDays: number;
  fulfilmentType: FulfilmentType;
  createdAt: string;
  assets?: RewardAsset[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string; color: string }[] = [
  { value: "standard", label: "Standard", color: "bg-gray-100 text-gray-700" },
  { value: "ecard", label: "E-Card", color: "bg-blue-100 text-blue-700" },
  { value: "cashback", label: "Cashback", color: "bg-green-100 text-green-700" },
  { value: "points", label: "Points", color: "bg-purple-100 text-purple-700" },
  { value: "discount", label: "Discount", color: "bg-amber-100 text-amber-700" },
  { value: "loyalty", label: "Loyalty", color: "bg-pink-100 text-pink-700" },
  { value: "coupon", label: "Coupon", color: "bg-red-100 text-red-700" },
  { value: "course_access", label: "Course Access", color: "bg-indigo-100 text-indigo-700" },
];

const AUDIENCE_OPTIONS: { value: Audience; label: string; color: string }[] = [
  { value: "business", label: "Business", color: "bg-blue-100 text-blue-700" },
  { value: "consumer", label: "Consumer", color: "bg-green-100 text-green-700" },
  { value: "both", label: "Both", color: "bg-pink-100 text-pink-700" },
];

const STATUS_OPTIONS: { value: RewardStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-700" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-600" },
];

const TRIGGER_MODE_OPTIONS: { value: TriggerMode; label: string }[] = [
  { value: "minimum", label: "Minimum Contribution" },
  { value: "range", label: "Contribution Range" },
  { value: "exact", label: "Exact Contribution" },
];

const FULFILMENT_OPTIONS: { value: FulfilmentType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "instruction", label: "Instruction" },
  { value: "external_link", label: "External Link" },
  { value: "internal", label: "Internal" },
  { value: "mcom_vcard", label: "MCOM VCard" },
  { value: "webhook", label: "Webhook" },
];

const TYPE_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
  REWARD_TYPE_OPTIONS.map((t) => [t.value, { label: t.label, color: t.color }])
);

const AUDIENCE_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
  AUDIENCE_OPTIONS.map((a) => [a.value, { label: a.label, color: a.color }])
);

const STATUS_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, { label: s.label, color: s.color }])
);

const WIZARD_STEPS = [
  "Name & Description",
  "Audience",
  "Reward Assets",
  "Trigger Config",
  "Availability",
  "Fulfilment",
];

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const DEMO_REWARDS: Reward[] = [
  {
    id: "r1",
    name: "£10 E-Card",
    description: "A £10 digital gift card redeemable at participating retailers.",
    type: "ecard",
    audience: "consumer",
    status: "active",
    items: [
      { id: "ri1", title: "Digital Gift Card", description: "£10 e-card code", physicalType: "digital", assetType: "url", assetUrl: "https://example.com/ecard", quantity: 500 },
    ],
    assets: [
      { key: "digital:dig-1", assetId: "dig-1", name: "£10 Festive E-Gift Card", source: "digital", sourceLabel: "FundOrDonate Digital Assets", statusLabel: "Available" },
      { key: "internal:svc-mcomvcard", assetId: "svc-mcomvcard", name: "MCOM VCard Access", source: "internal", sourceLabel: "MCOM VCard", statusLabel: "Connected" },
    ],
    triggerMode: "minimum",
    triggerMin: 1000,
    triggerMax: 0,
    triggerExact: 0,
    quantityMode: "limited",
    maxQuantity: 500,
    availableFrom: "2026-10-01",
    availableUntil: "2026-12-31",
    claimDeadlineDays: 30,
    fulfilmentType: "external_link",
    createdAt: "2026-09-01",
  },
  {
    id: "r2",
    name: "Cashback 10%",
    description: "Receive 10% cashback on your contribution amount.",
    type: "cashback",
    audience: "both",
    status: "active",
    items: [
      { id: "ri2", title: "Cashback Reward", description: "10% cashback", physicalType: "digital", assetType: "url", assetUrl: "", quantity: 1000 },
    ],
    assets: [
      { key: "physical:phy-1", assetId: "phy-1", name: "FundOrDonate Branded Gift Box", source: "physical", sourceLabel: "Physical Assets", statusLabel: "Available" },
    ],
    triggerMode: "minimum",
    triggerMin: 2500,
    triggerMax: 0,
    triggerExact: 0,
    quantityMode: "unlimited",
    maxQuantity: 0,
    availableFrom: "2026-10-01",
    availableUntil: "",
    claimDeadlineDays: 60,
    fulfilmentType: "manual",
    createdAt: "2026-09-05",
  },
  {
    id: "r3",
    name: "500 Points Bonus",
    description: "Earn 500 loyalty points added to your account balance.",
    type: "points",
    audience: "consumer",
    status: "active",
    items: [
      { id: "ri3", title: "Points Credit", description: "500 points", physicalType: "digital", assetType: "url", assetUrl: "", quantity: 9999 },
    ],
    triggerMode: "minimum",
    triggerMin: 5000,
    triggerMax: 0,
    triggerExact: 0,
    quantityMode: "unlimited",
    maxQuantity: 0,
    availableFrom: "2026-10-01",
    availableUntil: "",
    claimDeadlineDays: 90,
    fulfilmentType: "internal",
    createdAt: "2026-09-08",
  },
  {
    id: "r4",
    name: "20% Discount Code",
    description: "A one-time 20% discount code for the rewards marketplace.",
    type: "discount",
    audience: "business",
    status: "active",
    items: [
      { id: "ri4", title: "Discount Voucher", description: "20% off", physicalType: "digital", assetType: "url", assetUrl: "https://example.com/redeem", quantity: 200 },
    ],
    triggerMode: "range",
    triggerMin: 10000,
    triggerMax: 50000,
    triggerExact: 0,
    quantityMode: "limited",
    maxQuantity: 200,
    availableFrom: "2026-10-15",
    availableUntil: "2026-11-30",
    claimDeadlineDays: 14,
    fulfilmentType: "external_link",
    createdAt: "2026-09-10",
  },
  {
    id: "r5",
    name: "Founder Certificate",
    description: "Personalised digital certificate of founding membership.",
    type: "standard",
    audience: "both",
    status: "draft",
    items: [
      { id: "ri5", title: "Digital Certificate", description: "PDF certificate", physicalType: "digital", assetType: "file", assetUrl: "", quantity: 0 },
      { id: "ri6", title: "Physical Framed Print", description: "Framed A4 certificate", physicalType: "physical", assetType: "file", assetUrl: "", quantity: 50 },
    ],
    triggerMode: "exact",
    triggerMin: 0,
    triggerMax: 0,
    triggerExact: 100000,
    quantityMode: "limited",
    maxQuantity: 100,
    availableFrom: "2026-10-01",
    availableUntil: "2026-12-31",
    claimDeadlineDays: 60,
    fulfilmentType: "instruction",
    createdAt: "2026-09-12",
  },
  {
    id: "r6",
    name: "Free Course Access",
    description: "3-month access to our online learning platform.",
    type: "course_access",
    audience: "consumer",
    status: "active",
    items: [
      { id: "ri7", title: "Course Subscription", description: "3-month full access", physicalType: "digital", assetType: "url", assetUrl: "https://learn.example.com", quantity: 300 },
    ],
    triggerMode: "minimum",
    triggerMin: 2000,
    triggerMax: 0,
    triggerExact: 0,
    quantityMode: "limited",
    maxQuantity: 300,
    availableFrom: "2026-10-01",
    availableUntil: "2026-12-31",
    claimDeadlineDays: 30,
    fulfilmentType: "external_link",
    createdAt: "2026-09-15",
  },
  {
    id: "r7",
    name: "Exclusive Merch Pack",
    description: "Branded t-shirt, mug, and sticker pack shipped to your door.",
    type: "loyalty",
    audience: "both",
    status: "draft",
    items: [
      { id: "ri8", title: "T-Shirt", description: "Branded cotton tee", physicalType: "physical", assetType: "file", assetUrl: "", quantity: 100 },
      { id: "ri9", title: "Mug", description: "Ceramic mug", physicalType: "physical", assetType: "file", assetUrl: "", quantity: 100 },
      { id: "ri10", title: "Sticker Set", description: "Pack of 5 stickers", physicalType: "physical", assetType: "file", assetUrl: "", quantity: 200 },
    ],
    triggerMode: "minimum",
    triggerMin: 25000,
    triggerMax: 0,
    triggerExact: 0,
    quantityMode: "limited",
    maxQuantity: 100,
    availableFrom: "",
    availableUntil: "",
    claimDeadlineDays: 14,
    fulfilmentType: "manual",
    createdAt: "2026-09-18",
  },
  {
    id: "r8",
    name: "Holiday Voucher Bundle",
    description: "£50 voucher bundle for holiday booking partners.",
    type: "coupon",
    audience: "business",
    status: "archived",
    items: [
      { id: "ri11", title: "Holiday Voucher", description: "£50 off holiday bookings", physicalType: "digital", assetType: "url", assetUrl: "https://travel.example.com", quantity: 50 },
    ],
    triggerMode: "minimum",
    triggerMin: 50000,
    triggerMax: 0,
    triggerExact: 0,
    quantityMode: "limited",
    maxQuantity: 50,
    availableFrom: "2026-06-01",
    availableUntil: "2026-08-31",
    claimDeadlineDays: 7,
    fulfilmentType: "external_link",
    createdAt: "2026-05-01",
  },
];

// ---------------------------------------------------------------------------
// Empty Form State
// ---------------------------------------------------------------------------

function createEmptyForm() {
  return {
    step: 0,
    name: "",
    description: "",
    audience: "consumer" as Audience,
    type: "standard" as RewardType,
    items: [
      { id: "new-1", title: "", description: "", physicalType: "digital" as PhysicalType, assetType: "url" as AssetType, assetUrl: "", quantity: 1 },
    ],
    selectedAssets: [] as RewardAsset[],
    imageUpload: { mode: "url" as "url" | "file", url: "", file: null as File | null, preview: "" },
    triggerMode: "minimum" as TriggerMode,
    triggerMin: "",
    triggerMax: "",
    triggerExact: "",
    quantityMode: "unlimited" as QuantityMode,
    maxQuantity: "",
    availableFrom: "",
    availableUntil: "",
    claimDeadlineDays: "30",
    fulfilmentType: "manual" as FulfilmentType,
    fulfilmentUrl: "",
    fulfilmentWebhook: "",
    fulfilmentInstructions: "",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTriggerPreview(mode: TriggerMode, min: string, max: string, exact: string): string {
  if (mode === "minimum" && min) return `Contribute £${min} or more`;
  if (mode === "range" && min && max) return `Contribute between £${min} and £${max}`;
  if (mode === "exact" && exact) return `Contribute exactly £${exact}`;
  return "Configure trigger to see preview";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RewardLibraryPage() {
  const [rewards, setRewards] = useState<Reward[]>(DEMO_REWARDS);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [form, setForm] = useState(createEmptyForm());
  const [assetSearch, setAssetSearch] = useState("");
  const [assetSource, setAssetSource] = useState<"digital" | "physical" | "internal">("digital");
  const [digitalTypeFilter, setDigitalTypeFilter] = useState<"all" | DigitalAssetType>("all");
  const [detailReward, setDetailReward] = useState<Reward | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = rewards.length;
    const active = rewards.filter((r) => r.status === "active").length;
    const digital = rewards.filter((r) => r.items.some((i) => i.physicalType === "digital")).length;
    const physical = rewards.filter((r) => r.items.some((i) => i.physicalType === "physical")).length;
    return { total, active, digital, physical };
  }, [rewards]);

  // Filtered
  const filtered = useMemo(() => {
    return rewards.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterAudience !== "all" && r.audience !== filterAudience) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [rewards, search, filterType, filterAudience, filterStatus]);

  // Actions
  const openCreateModal = () => {
    setEditingReward(null);
    setForm(createEmptyForm());
    setAssetSearch("");
    setAssetSource("digital");
    setDigitalTypeFilter("all");
    setShowModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setForm({
      step: 0,
      name: reward.name,
      description: reward.description,
      audience: reward.audience,
      type: reward.type,
      items: reward.items.map((i) => ({ ...i })),
      selectedAssets: (reward.assets ?? []).map((a) => ({ ...a })),
      imageUpload: { mode: "url", url: "", file: null, preview: "" },
      triggerMode: reward.triggerMode,
      triggerMin: reward.triggerMin ? String(reward.triggerMin) : "",
      triggerMax: reward.triggerMax ? String(reward.triggerMax) : "",
      triggerExact: reward.triggerExact ? String(reward.triggerExact) : "",
      quantityMode: reward.quantityMode,
      maxQuantity: reward.maxQuantity ? String(reward.maxQuantity) : "",
      availableFrom: reward.availableFrom,
      availableUntil: reward.availableUntil,
      claimDeadlineDays: String(reward.claimDeadlineDays),
      fulfilmentType: reward.fulfilmentType,
      fulfilmentUrl: "",
      fulfilmentWebhook: "",
      fulfilmentInstructions: "",
    });
    setAssetSearch("");
    setAssetSource("digital");
    setDigitalTypeFilter("all");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    const reward: Reward = {
      id: editingReward?.id || `r${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      audience: form.audience,
      status: editingReward?.status || "draft",
      items: form.items.filter((i) => i.title.trim()),
      assets: form.selectedAssets,
      triggerMode: form.triggerMode,
      triggerMin: Number(form.triggerMin) || 0,
      triggerMax: Number(form.triggerMax) || 0,
      triggerExact: Number(form.triggerExact) || 0,
      quantityMode: form.quantityMode,
      maxQuantity: Number(form.maxQuantity) || 0,
      availableFrom: form.availableFrom,
      availableUntil: form.availableUntil,
      claimDeadlineDays: Number(form.claimDeadlineDays) || 30,
      fulfilmentType: form.fulfilmentType,
      createdAt: editingReward?.createdAt || new Date().toISOString().split("T")[0] || "",
    };

    if (editingReward) {
      setRewards((prev) => prev.map((r) => (r.id === editingReward.id ? reward : r)));
    } else {
      setRewards((prev) => [reward, ...prev]);
    }
    setShowModal(false);
  };

  const handleDuplicate = (reward: Reward) => {
    const copy: Reward = {
      ...reward,
      id: `r${Date.now()}`,
      name: `${reward.name} (Copy)`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0] || "",
    };
    setRewards((prev) => [copy, ...prev]);
  };

  const handleArchive = (id: string) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: r.status === "archived" ? "active" : "archived" } : r))
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this reward permanently?")) return;
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const canGoNext = () => {
    switch (form.step) {
      case 0: return form.name.trim().length > 0;
      case 1: return true;
      case 2: return form.selectedAssets.length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Rewards</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reward Library</h1>
              <p className="text-sm text-gray-500">
                Create and manage reusable rewards that can be attached to campaigns
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Reward
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Gift className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Rewards</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500">Active Rewards</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.digital}</p>
                <p className="text-xs text-gray-500">Digital Rewards</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.physical}</p>
                <p className="text-xs text-gray-500">Physical Rewards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rewards..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          >
            <option value="all">All Types</option>
            {REWARD_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          >
            <option value="all">All Audiences</option>
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Rewards Table */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Gift className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No rewards found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or create a new reward.</p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Create Reward
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-5 py-3">Reward</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Audience</th>
                    <th className="px-5 py-3 text-center">Assets</th>
                    <th className="px-5 py-3">Trigger</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((reward) => {
                    const typeMeta = TYPE_MAP[reward.type] || TYPE_MAP.standard;
                    const audienceMeta = AUDIENCE_MAP[reward.audience] || AUDIENCE_MAP.both;
                    const statusMeta = STATUS_MAP[reward.status] || STATUS_MAP.draft;

                    const triggerText =
                      reward.triggerMode === "minimum"
                        ? `Min ${fmt(reward.triggerMin)}`
                        : reward.triggerMode === "range"
                          ? `${fmt(reward.triggerMin)} – ${fmt(reward.triggerMax)}`
                          : `Exact ${fmt(reward.triggerExact)}`;

                    return (
                      <tr key={reward.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                              <Gift className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => setDetailReward(reward)}
                                className="block max-w-full truncate text-left text-sm font-semibold text-gray-900 hover:text-primary-600"
                                title="View reward details"
                              >
                                {reward.name}
                              </button>
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{reward.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeMeta?.color ?? ""}`}>
                            {typeMeta?.label ?? ""}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${audienceMeta?.color ?? ""}`}>
                            {audienceMeta?.label ?? ""}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-medium text-gray-700">{reward.assets?.length || reward.items.length}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">{triggerText}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta?.color ?? ""}`}>
                            {statusMeta?.label ?? ""}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(reward)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(reward)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchive(reward.id)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              title={reward.status === "archived" ? "Unarchive" : "Archive"}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(reward.id)}
                              className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-400">
            Showing {filtered.length} of {rewards.length} rewards
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Create / Edit Modal                                                 */}
      {/* ------------------------------------------------------------------ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingReward ? "Edit Reward" : "Create Reward"}
                </h2>
                <p className="text-xs text-gray-400">Step {form.step + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[form.step]}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex border-b border-gray-100 px-6 py-2">
              {WIZARD_STEPS.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < form.step
                        ? "bg-green-100 text-green-700"
                          : i === form.step
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < form.step ? "✓" : i + 1}
                  </div>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div className={`mx-1 h-px w-4 ${i < form.step ? "bg-green-300" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Step 0 — Name & Description */}
              {form.step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reward Name *
                      <Tooltip content="A clear, recognizable name for this reward (e.g. '£10 E-Card', 'Free Haircut Voucher')">
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder='e.g. "£10 E-Card"'
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                      <Tooltip content="Explain what the recipient gets when they earn this reward">
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                      </Tooltip>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Describe what this reward includes..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 1 — Audience */}
              {form.step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Who can claim this reward?
                    <Tooltip content="Select who can earn this reward. Business-only rewards appear only to business contributors.">
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                    </Tooltip>
                  </p>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                        form.audience === opt.value
                          ? "border-primary-400 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="audience"
                        value={opt.value}
                        checked={form.audience === opt.value}
                        onChange={() => setForm({ ...form, audience: opt.value })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Step 2 — Reward Assets: Digital / Physical / MCOM */}
              {form.step === 2 && (() => {
                const handleImageFile = (file: File | null) => {
                  if (file) {
                    const preview = URL.createObjectURL(file);
                    setForm((prev) => ({
                      ...prev,
                      imageUpload: { ...prev.imageUpload, file, preview },
                    }));
                  }
                };

                const digitalAssets = getDigitalAssets().filter((a) => a.status !== "archived");
                const physicalAssets = getPhysicalAssets();
                // Internal Assets = connected platforms with an active internal asset status.
                const internalAssets = getMcomPlatforms().filter(
                  (p) => p.connected && p.status === "active"
                );

                const q = assetSearch.toLowerCase();
                const isSelected = (key: string) => form.selectedAssets.some((a) => a.key === key);

                const toggleAsset = (asset: RewardAsset) => {
                  setForm((prev) => ({
                    ...prev,
                    selectedAssets: prev.selectedAssets.some((a) => a.key === asset.key)
                      ? prev.selectedAssets.filter((a) => a.key !== asset.key)
                      : [...prev.selectedAssets, asset],
                  }));
                };

                const removeAsset = (key: string) => {
                  setForm((prev) => ({
                    ...prev,
                    selectedAssets: prev.selectedAssets.filter((a) => a.key !== key),
                  }));
                };

                const selected = form.selectedAssets;

                const filteredDigital = digitalAssets.filter(
                  (a) =>
                    (digitalTypeFilter === "all" || a.type === digitalTypeFilter) &&
                    (!q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
                );

                const filteredPhysical = physicalAssets.filter(
                  (a) => !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
                );

                const sourceOptions: { value: "digital" | "physical" | "internal"; label: string }[] = [
                  { value: "digital", label: "Digital Asset" },
                  { value: "physical", label: "Physical Asset" },
                  { value: "internal", label: "Internal Asset" },
                ];

                const searchPlaceholder =
                  assetSource === "digital" ? "Search digital assets..."
                  : assetSource === "physical" ? "Search physical assets..."
                  : "Search connected platforms...";

                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reward Assets
                        <Tooltip content="Assets are created once in Asset Management and attached here. A reward can combine digital, physical and internal assets (MCOM/247GBS platform access).">
                          <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>
                    </div>

                    {/* Selected assets — Asset | Source | Status */}
                    {selected.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 font-medium text-gray-500">Asset</th>
                              <th className="px-3 py-2 font-medium text-gray-500">Source</th>
                              <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                              <th className="px-3 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selected.map((a) => (
                              <tr key={a.key}>
                                <td className="px-3 py-2 font-medium text-gray-900">{a.name}</td>
                                <td className="px-3 py-2 text-gray-600">{a.sourceLabel}</td>
                                <td className="px-3 py-2">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    a.statusLabel === "Connected"
                                      ? "bg-teal-100 text-teal-700"
                                      : a.statusLabel === "Draft"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                  }`}>
                                    {a.statusLabel}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() => removeAsset(a.key)}
                                    className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    title="Remove"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-gray-400">
                        No assets attached yet — choose a source below and select assets.
                      </p>
                    )}

                    {/* Select Asset Source */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset Source</label>
                      <div className="grid grid-cols-3 gap-2">
                        {sourceOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setAssetSource(opt.value); setAssetSearch(""); }}
                            className={`rounded-lg border-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
                              assetSource === opt.value
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
                      />
                    </div>

                    {/* ── Digital Asset ── */}
                    {assetSource === "digital" && (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", ...DIGITAL_TYPE_ORDER] as const).map((t) => {
                            const label = t === "all" ? "All" : DIGITAL_TYPE_META[t].label;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setDigitalTypeFilter(t)}
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                                  digitalTypeFilter === t
                                    ? "border-primary-600 bg-primary-600 text-white"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-2">
                          {filteredDigital.length === 0 ? (
                            <p className="py-4 text-center text-xs text-gray-400">
                              No digital assets found — create them in Asset Management → Digital Assets.
                            </p>
                          ) : (
                            filteredDigital.map((a) => {
                              const key = `digital:${a.id}`;
                              const sel = isSelected(key);
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => toggleAsset({
                                    key, assetId: a.id, name: a.name, source: "digital",
                                    sourceLabel: "FundOrDonate Digital Assets",
                                    statusLabel: a.status === "active" ? "Available" : "Draft",
                                  })}
                                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                    sel ? "border-primary-400 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-medium text-gray-900">{a.name}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIGITAL_TYPE_META[a.type].color}`}>
                                          {DIGITAL_TYPE_META[a.type].label}
                                        </span>
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${AVAILABILITY_META[a.availability].color}`}>
                                          {AVAILABILITY_META[a.availability].label}
                                        </span>
                                      </div>
                                      <p className="mt-0.5 truncate text-xs text-gray-500">{a.description}</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                      <span className="text-xs font-semibold text-gray-700">
                                        {a.valueGbp !== null ? `£${a.valueGbp}` : "—"}
                                      </span>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sel ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                        {sel ? "Selected ✓" : "Select"}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}

                    {/* ── Physical Asset ── */}
                    {assetSource === "physical" && (
                      <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-2">
                        {filteredPhysical.length === 0 ? (
                          <p className="py-4 text-center text-xs text-gray-400">
                            No physical assets found — add them in Asset Management → Physical Assets.
                          </p>
                        ) : (
                          filteredPhysical.map((a: PhysicalAsset) => {
                            const inStock = physicalInStock(a);
                            const key = `physical:${a.id}`;
                            const sel = isSelected(key);
                            return (
                              <button
                                key={a.id}
                                type="button"
                                disabled={!inStock}
                                onClick={() => toggleAsset({
                                  key, assetId: a.id, name: a.name, source: "physical",
                                  sourceLabel: "Physical Assets", statusLabel: "Available",
                                })}
                                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                  !inStock
                                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-70"
                                    : sel
                                      ? "border-primary-400 bg-primary-50"
                                      : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-sm font-medium text-gray-900">{a.name}</span>
                                      {!inStock && (
                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                          Out of stock
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-gray-500">{a.description}</p>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                      Remaining: {a.quantityAvailable} of {a.quantityMaxIssued}
                                    </p>
                                  </div>
                                  {inStock && (
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${sel ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                      {sel ? "Selected ✓" : "Select"}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* ── MCOM Asset: choose a connected platform, then its assets ── */}
                    {/* ── Internal Asset: access to a connected MCOM/247GBS platform ── */}
                    {assetSource === "internal" && (
                      <div className="space-y-4">
                        {internalAssets.length === 0 && (
                          <p className="py-4 text-center text-xs text-gray-400">
                            No connected platforms — connect one in Asset Management → Internal Assets.
                          </p>
                        )}
                        {(["mcom", "247gbs"] as const).map((g) => {
                          const groupPlatforms = internalAssets.filter(
                            (p) => p.group === g && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
                          );
                          if (groupPlatforms.length === 0) return null;
                          return (
                            <div key={g}>
                              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${MCOM_GROUP_META[g].color}`}>
                                  {MCOM_GROUP_META[g].label}
                                </span>
                                Platform Access
                              </p>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {groupPlatforms.map((p) => {
                                  const key = `internal:${p.id}`;
                                  const sel = isSelected(key);
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => toggleAsset({
                                        key,
                                        assetId: p.id,
                                        name: `${p.name} Access`,
                                        source: "internal",
                                        sourceLabel: p.name,
                                        statusLabel: "Connected",
                                      })}
                                      className={`rounded-lg border p-3 text-left transition-colors ${
                                        sel ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-sm font-medium text-gray-900">{p.name} Access</span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${MCOM_GROUP_META[g].color}`}>
                                              {MCOM_GROUP_META[g].label}
                                            </span>
                                          </div>
                                          <p className="mt-0.5 truncate text-xs text-gray-500">Access to {p.name}</p>
                                          <p className="mt-1 text-[11px] text-teal-600">Connected</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${sel ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                          {sel ? "Selected ✓" : "Select"}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[11px] text-gray-400">
                          Selecting a platform grants the business access to it — provisioning happens through the backend connection, not a FundOrDonate product.
                        </p>
                      </div>
                    )}

                    {/* Image/Video section */}
                    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Image / Video
                        <Tooltip content="Upload an image or provide a URL link for the reward preview">
                          <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>

                      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                        <button
                          onClick={() => setForm((prev) => ({ ...prev, imageUpload: { ...prev.imageUpload, mode: "url" } }))}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.imageUpload.mode === "url"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          URL Link
                        </button>
                        <button
                          onClick={() => setForm((prev) => ({ ...prev, imageUpload: { ...prev.imageUpload, mode: "file" } }))}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.imageUpload.mode === "file"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Upload File
                        </button>
                      </div>

                      {form.imageUpload.mode === "url" ? (
                        <input
                          type="url"
                          value={form.imageUpload.url}
                          onChange={(e) => setForm((prev) => ({ ...prev, imageUpload: { ...prev.imageUpload, url: e.target.value } }))}
                          placeholder="https://example.com/image.jpg"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        />
                      ) : (
                        <div className="relative rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary-400 transition-colors">
                          <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 mb-2">Drag and drop an image here, or click to browse</p>
                          <input
                            ref={imageFileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          <button
                            type="button"
                            onClick={() => imageFileInputRef.current?.click()}
                            className="relative inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            <Upload className="h-3 w-3" />
                            Choose File
                          </button>
                        </div>
                      )}

                      {/* Preview */}
                      {(form.imageUpload.preview || form.imageUpload.url) && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={form.imageUpload.preview || form.imageUpload.url}
                            alt="Reward preview"
                            className="h-32 w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <button
                            onClick={() => setForm((prev) => ({ ...prev, imageUpload: { mode: "url", url: "", file: null, preview: "" } }))}
                            className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Step 3 — Trigger Configuration */}
              {form.step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Mode
                      <Tooltip content="Determine when this reward is earned based on contribution amount">
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                      </Tooltip>
                    </label>
                    <div className="flex gap-2">
                      {TRIGGER_MODE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setForm({ ...form, triggerMode: opt.value })}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            form.triggerMode === opt.value
                              ? "border-primary-400 bg-primary-50 text-primary-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(form.triggerMode === "minimum" || form.triggerMode === "range") && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Minimum Amount (£)
                        <Tooltip content="Minimum contribution amount to earn this reward">
                          <span className="ml-1.5 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        value={form.triggerMin}
                        onChange={(e) => setForm({ ...form, triggerMin: e.target.value })}
                        placeholder="0"
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {form.triggerMode === "range" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Maximum Amount (£)
                        <Tooltip content="Maximum contribution amount for this reward range">
                          <span className="ml-1.5 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        value={form.triggerMax}
                        onChange={(e) => setForm({ ...form, triggerMax: e.target.value })}
                        placeholder="0"
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {form.triggerMode === "exact" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Exact Amount (£)
                        <Tooltip content="Exact contribution amount needed to earn this reward">
                          <span className="ml-1.5 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        value={form.triggerExact}
                        onChange={(e) => setForm({ ...form, triggerExact: e.target.value })}
                        placeholder="0"
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Preview</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {getTriggerPreview(form.triggerMode, form.triggerMin, form.triggerMax, form.triggerExact)}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4 — Availability & Quantity */}
              {form.step === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                      <Tooltip content="Unlimited rewards have no cap. Limited rewards stop being available after the set quantity.">
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                      </Tooltip>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setForm({ ...form, quantityMode: "unlimited" })}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          form.quantityMode === "unlimited"
                            ? "border-primary-400 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {form.quantityMode === "unlimited" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        Unlimited
                      </button>
                      <button
                        onClick={() => setForm({ ...form, quantityMode: "limited" })}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          form.quantityMode === "limited"
                            ? "border-primary-400 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {form.quantityMode === "limited" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        Limited
                      </button>
                    </div>
                  </div>

                  {form.quantityMode === "limited" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Quantity</label>
                      <input
                        type="number"
                        value={form.maxQuantity}
                        onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })}
                        placeholder="100"
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Available From
                        <Tooltip content="Optional time window when this reward is available">
                          <span className="ml-1 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>
                      <DatePicker
                        value={form.availableFrom}
                        onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Available Until
                        <Tooltip content="Optional time window when this reward is available">
                          <span className="ml-1 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 cursor-help">?</span>
                        </Tooltip>
                      </label>
                      <DatePicker
                        value={form.availableUntil}
                        onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Claim Deadline (days after contribution)
                      <Tooltip content="How many days after earning does the contributor have to claim this reward?">
                        <span className="ml-1 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 cursor-help">?</span>
                      </Tooltip>
                    </label>
                    <input
                      type="number"
                      value={form.claimDeadlineDays}
                      onChange={(e) => setForm({ ...form, claimDeadlineDays: e.target.value })}
                      placeholder="30"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 5 — Fulfilment */}
              {form.step === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fulfilment Type
                      <Tooltip content="How the reward is delivered to the contributor">
                        <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 cursor-help">?</span>
                      </Tooltip>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FULFILMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setForm({ ...form, fulfilmentType: opt.value })}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            form.fulfilmentType === opt.value
                              ? "border-primary-400 bg-primary-50 text-primary-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.fulfilmentType === "external_link" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">External URL</label>
                      <input
                        type="url"
                        value={form.fulfilmentUrl}
                        onChange={(e) => setForm({ ...form, fulfilmentUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {form.fulfilmentType === "webhook" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
                      <input
                        type="url"
                        value={form.fulfilmentWebhook}
                        onChange={(e) => setForm({ ...form, fulfilmentWebhook: e.target.value })}
                        placeholder="https://hooks.example.com/..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {form.fulfilmentType === "instruction" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fulfilment Instructions</label>
                      <textarea
                        value={form.fulfilmentInstructions}
                        onChange={(e) => setForm({ ...form, fulfilmentInstructions: e.target.value })}
                        rows={4}
                        placeholder="Describe how to fulfil this reward..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {form.fulfilmentType === "manual" && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">
                        Campaign team manually handles reward delivery
                      </p>
                    </div>
                  )}

                  {form.fulfilmentType === "internal" && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        System automatically delivers the reward
                      </p>
                    </div>
                  )}

                  {form.fulfilmentType === "mcom_vcard" && (
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-purple-700">
                        MCOM VCard fulfilment sends a digital business card to the backer's mobile wallet via MCOM integration.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => form.step > 0 && setForm({ ...form, step: form.step - 1 })}
                disabled={form.step === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {form.step < WIZARD_STEPS.length - 1 ? (
                  <button
                    onClick={() => canGoNext() && setForm({ ...form, step: form.step + 1 })}
                    disabled={!canGoNext()}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    {editingReward ? "Save Changes" : "Create Reward"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Reward Details — Asset | Source | Status                             */}
      {/* ------------------------------------------------------------------ */}
      {detailReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailReward(null)}>
          <div
            className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detailReward.name}</h2>
                <p className="mt-0.5 text-xs text-gray-500">{detailReward.description}</p>
              </div>
              <button
                onClick={() => setDetailReward(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-medium ${TYPE_MAP[detailReward.type]?.color ?? ""}`}>
                  {TYPE_MAP[detailReward.type]?.label ?? detailReward.type}
                </span>
                <span className={`rounded-full px-2.5 py-1 font-medium ${AUDIENCE_MAP[detailReward.audience]?.color ?? ""}`}>
                  {AUDIENCE_MAP[detailReward.audience]?.label ?? detailReward.audience}
                </span>
                <span className={`rounded-full px-2.5 py-1 font-medium ${STATUS_MAP[detailReward.status]?.color ?? ""}`}>
                  {STATUS_MAP[detailReward.status]?.label ?? detailReward.status}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                  {detailReward.triggerMode === "minimum"
                    ? `Min ${fmt(detailReward.triggerMin)}`
                    : detailReward.triggerMode === "range"
                      ? `${fmt(detailReward.triggerMin)} – ${fmt(detailReward.triggerMax)}`
                      : `Exact ${fmt(detailReward.triggerExact)}`}
                </span>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Assets</p>
                {detailReward.assets && detailReward.assets.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 font-medium text-gray-500">Asset</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Source</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailReward.assets.map((a) => (
                          <tr key={a.key}>
                            <td className="px-3 py-2 font-medium text-gray-900">{a.name}</td>
                            <td className="px-3 py-2 text-gray-600">{a.sourceLabel}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                a.statusLabel === "Connected"
                                  ? "bg-teal-100 text-teal-700"
                                  : a.statusLabel === "Draft"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }`}>
                                {a.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : detailReward.items.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 font-medium text-gray-500">Asset</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Source</th>
                          <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailReward.items.map((i) => (
                          <tr key={i.id}>
                            <td className="px-3 py-2 font-medium text-gray-900">{i.title}</td>
                            <td className="px-3 py-2 text-gray-600">Reward item</td>
                            <td className="px-3 py-2">
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                Included
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-gray-400">
                    No assets attached to this reward.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => { setDetailReward(null); openEditModal(detailReward); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <Edit3 className="h-4 w-4" /> Edit Reward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
