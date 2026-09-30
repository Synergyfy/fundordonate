import { useState, useMemo } from "react";
import {
  Plus, Search, Download, Copy, Edit, Trash2, Archive,
  Package, Globe, Database, CheckCircle,
  X, Link as LinkIcon, Sparkles, Gift, Ticket, Percent, Tag,
  Eye, Plug, ChevronLeft, KeyRound,
} from "lucide-react";
import { FileUpload } from "../../../components/ui/FileUpload";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  getMcomPlatforms, setMcomPlatformConnected, getMcomPlatformAssets, updateMcomPlatform,
  MCOM_GROUP_META, type McomPlatform, type McomPlatformGroup,
} from "@/data/mcomAssetCatalogue";
import {
  DIGITAL_TYPE_ORDER, DIGITAL_TYPE_META, AVAILABILITY_META,
  getDigitalAssets, saveDigitalAsset, setDigitalAssetStatus, deleteDigitalAsset, duplicateDigitalAsset,
  getPhysicalAssets, savePhysicalAsset, setPhysicalAssetStatus, deletePhysicalAsset, duplicatePhysicalAsset,
  physicalInStock,
  type DigitalAsset, type DigitalAssetType, type PhysicalAsset, type AssetStatus,
} from "@/data/assetStore";

type AssetTab = "digital" | "physical" | "mcom" | "external";

interface ExternalAsset {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  type: string;
  syncFrequency: string;
  status: AssetStatus;
  lastSynced: string;
  description: string;
}

type Asset = DigitalAsset | PhysicalAsset | ExternalAsset;
type ModalAssetType = "digital" | "physical" | "external";

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
  draft: { label: "Draft", color: "text-yellow-700", bg: "bg-yellow-100" },
  archived: { label: "Archived", color: "text-gray-600", bg: "bg-gray-100" },
};

const EXTERNAL_TYPES = ["API", "Webhook", "RSS", "Feed"];

const DEMO_EXTERNAL_ASSETS: ExternalAsset[] = [
  { id: "e1", name: "Flight Booking API", apiEndpoint: "https://api.flights.com/v2", apiKey: "sk_live_xxx", type: "API", syncFrequency: "Real-time", status: "active", lastSynced: "2026-09-24T10:30:00Z", description: "Flight search and booking integration" },
  { id: "e2", name: "Hotel Inventory Feed", apiEndpoint: "https://feeds.hotels.com/xml", apiKey: "feed_key_xxx", type: "Feed", syncFrequency: "Hourly", status: "active", lastSynced: "2026-09-24T09:00:00Z", description: "Hotel availability and pricing data" },
  { id: "e3", name: "Payment Gateway Webhook", apiEndpoint: "https://webhooks.payments.com/events", apiKey: "whsec_xxx", type: "Webhook", syncFrequency: "On-demand", status: "draft", lastSynced: "Never", description: "Payment status notifications" },
  { id: "e4", name: "News RSS Aggregator", apiEndpoint: "https://rss.newsreader.com/feed", apiKey: "public", type: "RSS", syncFrequency: "Daily", status: "archived", lastSynced: "2026-09-23T08:00:00Z", description: "Latest news articles feed" },
];

const StatusBadge = ({ status }: { status: AssetStatus }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`}>
    {STATUS_CONFIG[status].label}
  </span>
);

export function AssetManagementPage() {
  const [activeTab, setActiveTab] = useState<AssetTab>("digital");
  const [search, setSearch] = useState("");

  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>(() => getDigitalAssets());
  const [physicalAssets, setPhysicalAssets] = useState<PhysicalAsset[]>(() => getPhysicalAssets());
  const [mcomPlatforms, setMcomPlatforms] = useState<McomPlatform[]>(() => getMcomPlatforms());
  const [mcomGroup, setMcomGroup] = useState<McomPlatformGroup>("mcom");
  const [externalAssets, setExternalAssets] = useState<ExternalAsset[]>(DEMO_EXTERNAL_ASSETS);

  const refreshDigital = () => setDigitalAssets(getDigitalAssets());
  const refreshPhysical = () => setPhysicalAssets(getPhysicalAssets());
  const refreshMcom = () => setMcomPlatforms(getMcomPlatforms());

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const tabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
    { id: "digital", label: "Digital Assets", icon: <Download className="h-4 w-4" /> },
    { id: "physical", label: "Physical Assets", icon: <Package className="h-4 w-4" /> },
    { id: "mcom", label: "Internal Assets", icon: <KeyRound className="h-4 w-4" /> },
    { id: "external", label: "External Assets", icon: <Globe className="h-4 w-4" /> },
  ];

  const getStats = (assets: { status: AssetStatus }[]) => ({
    total: assets.length,
    active: assets.filter((a) => a.status === "active").length,
    archived: assets.filter((a) => a.status === "archived").length,
  });

  const digitalStats = getStats(digitalAssets);
  const physicalStats = getStats(physicalAssets);
  const externalStats = getStats(externalAssets);

  const handleOpenAddModal = () => {
    setEditingAsset(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setShowModal(true);
    setActionMenuId(null);
  };

  const handleDuplicate = (asset: Asset) => {
    switch (activeTab) {
      case "digital": duplicateDigitalAsset(asset.id); refreshDigital(); break;
      case "physical": duplicatePhysicalAsset(asset.id); refreshPhysical(); break;
      case "external":
        setExternalAssets([...externalAssets, { ...asset, id: `${asset.id}-copy-${Date.now()}` } as ExternalAsset]);
        break;
      default: break;
    }
    setActionMenuId(null);
  };

  const handleArchive = (id: string) => {
    switch (activeTab) {
      case "digital": setDigitalAssetStatus(id, "archived"); refreshDigital(); break;
      case "physical": setPhysicalAssetStatus(id, "archived"); refreshPhysical(); break;
      case "external": setExternalAssets(externalAssets.map((a) => a.id === id ? { ...a, status: "archived" } : a)); break;
      default: break;
    }
    setActionMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    switch (activeTab) {
      case "digital": deleteDigitalAsset(id); refreshDigital(); break;
      case "physical": deletePhysicalAsset(id); refreshPhysical(); break;
      case "external": setExternalAssets(externalAssets.filter((a) => a.id !== id)); break;
      default: break;
    }
    setActionMenuId(null);
  };

  const togglePlatformConnection = (id: string, connected: boolean) => {
    setMcomPlatformConnected(id, connected);
    refreshMcom();
  };

  const formatLastSynced = (date: string) => {
    if (date === "Never") return "Never";
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
  };

  const addLabels: Record<Exclude<AssetTab, "mcom">, string> = {
    digital: "Add Digital Asset",
    physical: "Add Physical Asset",
    external: "Add External Asset",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Digital and Physical assets are managed by FundOrDonate. Internal Assets give businesses access to connected MCOM / 247GBS platforms — created once here, then attached to Rewards.
          </p>
        </div>
        {activeTab !== "mcom" && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {addLabels[activeTab as Exclude<AssetTab, "mcom">]}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "digital" && (
        <DigitalAssetsTab
          assets={digitalAssets}
          stats={digitalStats}
          search={search}
          onSearchChange={setSearch}
          onEdit={handleOpenEditModal}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          actionMenuId={actionMenuId}
          setActionMenuId={setActionMenuId}
        />
      )}
      {activeTab === "physical" && (
        <PhysicalAssetsTab
          assets={physicalAssets}
          stats={physicalStats}
          search={search}
          onSearchChange={setSearch}
          onEdit={handleOpenEditModal}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          actionMenuId={actionMenuId}
          setActionMenuId={setActionMenuId}
        />
      )}
      {activeTab === "mcom" && (
        <InternalAssetsTab
          key={mcomGroup}
          platforms={mcomPlatforms.filter((p) => p.group === mcomGroup)}
          group={mcomGroup}
          onGroupChange={(g) => { setMcomGroup(g); setSearch(""); }}
          onToggleConnect={togglePlatformConnection}
        />
      )}
      {activeTab === "external" && (
        <ExternalAssetsTab
          assets={externalAssets}
          stats={externalStats}
          search={search}
          onSearchChange={setSearch}
          onEdit={handleOpenEditModal}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
          formatLastSynced={formatLastSynced}
          actionMenuId={actionMenuId}
          setActionMenuId={setActionMenuId}
        />
      )}

      {/* Modal */}
      {showModal && activeTab !== "mcom" && (
        <AssetModal
          assetType={activeTab as ModalAssetType}
          asset={editingAsset}
          onClose={() => setShowModal(false)}
          onSave={(asset) => {
            switch (activeTab) {
              case "digital": saveDigitalAsset(asset as DigitalAsset); refreshDigital(); break;
              case "physical": savePhysicalAsset(asset as PhysicalAsset); refreshPhysical(); break;
              case "external":
                if (editingAsset) {
                  setExternalAssets(externalAssets.map((a) => a.id === editingAsset.id ? asset as ExternalAsset : a));
                } else {
                  setExternalAssets([...externalAssets, { ...asset, id: `e-${Date.now()}` } as ExternalAsset]);
                }
                break;
              default: break;
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Stats Component
// =============================================================================

function StatsRow({ stats, icon }: { stats: { total: number; active: number; archived: number }; icon: React.ReactNode }) {
  const cards = [
    { label: "Total Assets", value: stats.total, icon, color: "border-primary-200 bg-primary-50" },
    { label: "Active", value: stats.active, icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "border-green-200 bg-green-50" },
    { label: "Archived", value: stats.archived, icon: <Archive className="h-5 w-5 text-gray-500" />, color: "border-gray-200 bg-gray-50" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
          <div className="flex items-center gap-2 mb-1">
            {card.icon}
            <span className="text-xs font-medium text-gray-500">{card.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

// =============================================================================
// Action Menu
// =============================================================================

function ActionMenu({ id, actionMenuId, setActionMenuId, onEdit, onDuplicate, onArchive, onDelete }: {
  id: string; actionMenuId: string | null; setActionMenuId: (id: string | null) => void;
  onEdit: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setActionMenuId(actionMenuId === id ? null : id)}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      {actionMenuId === id && (
        <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button onClick={onEdit} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit className="h-4 w-4" /> Edit
          </button>
          <button onClick={onDuplicate} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button onClick={onArchive} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Archive className="h-4 w-4" /> Archive
          </button>
          <button onClick={onDelete} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Digital Assets Tab — Gift Card / Voucher / Coupon / Deal
// =============================================================================

function DigitalAssetsTab({ assets, stats, search, onSearchChange, onEdit, onDuplicate, onArchive, onDelete, actionMenuId, setActionMenuId }: {
  assets: DigitalAsset[]; stats: { total: number; active: number; archived: number };
  search: string; onSearchChange: (s: string) => void;
  onEdit: (a: Asset) => void; onDuplicate: (a: Asset) => void; onArchive: (id: string) => void; onDelete: (id: string) => void;
  actionMenuId: string | null; setActionMenuId: (id: string | null) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | DigitalAssetType>("all");

  const getTypeIcon = (type: DigitalAssetType) => {
    switch (type) {
      case "gift-card": return <Gift className="h-4 w-4" />;
      case "voucher": return <Ticket className="h-4 w-4" />;
      case "coupon": return <Percent className="h-4 w-4" />;
      case "deal": return <Tag className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (search && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, search, typeFilter]);

  return (
    <div>
      <StatsRow stats={stats} icon={<Download className="h-5 w-5 text-primary-500" />} />

      {/* Type filter — Henry's order: gift card → voucher → coupon → deal */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...DIGITAL_TYPE_ORDER] as const).map((t) => {
          const label = t === "all" ? "All" : DIGITAL_TYPE_META[t].label;
          const count = t === "all" ? assets.length : assets.filter((a) => a.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
              <span className={`ml-1.5 ${typeFilter === t ? "text-primary-100" : "text-gray-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search digital assets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Download className="h-6 w-6" />} title="No digital assets" description="Create your first Gift Card, Voucher, Coupon or Deal to get started." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Asset Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Value</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Availability</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{asset.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${DIGITAL_TYPE_META[asset.type].color}`}>
                      {DIGITAL_TYPE_META[asset.type].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs font-medium text-gray-700">
                    {asset.valueGbp !== null ? `£${asset.valueGbp}` : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${AVAILABILITY_META[asset.availability].color}`}>
                      {AVAILABILITY_META[asset.availability].label}
                    </span>
                    {(asset.startDate || asset.endDate) && (
                      <p className="mt-1 text-[10px] text-gray-400">
                        {asset.startDate || "…"} → {asset.endDate || "…"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu id={asset.id} actionMenuId={actionMenuId} setActionMenuId={setActionMenuId}
                      onEdit={() => onEdit(asset)} onDuplicate={() => onDuplicate(asset)}
                      onArchive={() => onArchive(asset.id)} onDelete={() => onDelete(asset.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Physical Assets Tab — inventory matters
// =============================================================================

function PhysicalAssetsTab({ assets, stats, search, onSearchChange, onEdit, onDuplicate, onArchive, onDelete, actionMenuId, setActionMenuId }: {
  assets: PhysicalAsset[]; stats: { total: number; active: number; archived: number };
  search: string; onSearchChange: (s: string) => void;
  onEdit: (a: Asset) => void; onDuplicate: (a: Asset) => void; onArchive: (id: string) => void; onDelete: (id: string) => void;
  actionMenuId: string | null; setActionMenuId: (id: string | null) => void;
}) {
  const filtered = useMemo(() => {
    if (!search) return assets;
    const q = search.toLowerCase();
    return assets.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }, [assets, search]);

  return (
    <div>
      <StatsRow stats={stats} icon={<Package className="h-5 w-5 text-primary-500" />} />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2.5">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Inventory matters</p>
            <p className="mt-0.5 text-sm text-amber-800">
              Physical rewards have limited quantities. Example: <strong>FundOrDonate branded gift box — Available: 100, Remaining: 73</strong>.
              When the remaining quantity reaches zero the asset becomes unavailable for new Rewards.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search physical assets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="h-6 w-6" />} title="No physical assets" description="Add your first physical reward item with its available quantity." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Asset Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Inventory</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Delivery</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Expiry</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((asset) => {
                const inStock = physicalInStock(asset);
                const pct = asset.quantityMaxIssued > 0
                  ? Math.round((asset.quantityAvailable / asset.quantityMaxIssued) * 100)
                  : 0;
                return (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{asset.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{asset.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[140px]">
                        <p className={`text-xs font-semibold ${inStock ? "text-gray-800" : "text-red-600"}`}>
                          {inStock ? `${asset.quantityAvailable} of ${asset.quantityMaxIssued} remaining` : "Out of stock"}
                        </p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${inStock ? (pct < 25 ? "bg-amber-500" : "bg-green-500") : "bg-red-400"}`}
                            style={{ width: `${Math.max(pct, inStock ? 2 : 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">
                      {asset.deliveryMethod === "delivery" ? "Delivery" : asset.deliveryMethod === "collection" ? "Collection" : "Delivery or collection"}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                      {asset.expiryDays !== null ? `${asset.expiryDays} days after claim` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {inStock ? (
                        <StatusBadge status={asset.status} />
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu id={asset.id} actionMenuId={actionMenuId} setActionMenuId={setActionMenuId}
                        onEdit={() => onEdit(asset)} onDuplicate={() => onDuplicate(asset)}
                        onArchive={() => onArchive(asset.id)} onDelete={() => onDelete(asset.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Internal Assets Tab — access to connected MCOM / 247GBS platforms
// =============================================================================

function InternalAssetsTab({ platforms, group, onGroupChange, onToggleConnect }: {
  platforms: McomPlatform[]; group: McomPlatformGroup; onGroupChange: (g: McomPlatformGroup) => void;
  onToggleConnect: (id: string, connected: boolean) => void;
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const meta = MCOM_GROUP_META[group];
  const viewing = viewingId ? platforms.find((p) => p.id === viewingId) : undefined;

  const connectedCount = platforms.filter((p) => p.connected).length;
  const assetCount = platforms.filter((p) => p.connected).reduce((sum, p) => sum + p.assets.length, 0);

  if (viewing) {
    return (
      <InternalAssetPanel
        platform={viewing}
        group={group}
        onBack={() => setViewingId(null)}
        onToggleConnect={onToggleConnect}
      />
    );
  }

  return (
    <div>
      {/* MCOM | 247GBS sub-tabs */}
      <div className="mb-4 flex gap-2 rounded-xl bg-gray-100 p-1.5">
        {(Object.keys(MCOM_GROUP_META) as McomPlatformGroup[]).map((g) => {
          const gMeta = MCOM_GROUP_META[g];
          const count = getMcomPlatforms(g).length;
          return (
            <button
              key={g}
              onClick={() => { setViewingId(null); onGroupChange(g); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                group === g ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${gMeta.color}`}>
                {gMeta.label}
              </span>
              {count} platform{count === 1 ? "" : "s"}
            </button>
          );
        })}
      </div>

      <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-start gap-2.5">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          <div>
            <p className="text-sm font-semibold text-teal-900">Internal Assets are platform access — not products</p>
            <p className="mt-0.5 text-sm text-teal-800">
              {meta.description} Connect a platform and it becomes an Internal Asset Admin can place
              inside a Reward — e.g. <strong>MCOM VCard Access</strong> simply means “give the
              eligible business access to MCOM VCard”. Technical connection details (API, webhook,
              authentication, provisioning) stay in the backend integration layer.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
          <div className="mb-1 text-xs font-medium text-gray-500">Platforms</div>
          <div className="text-2xl font-bold text-gray-900">{platforms.length}</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="mb-1 text-xs font-medium text-gray-500">Connected</div>
          <div className="text-2xl font-bold text-gray-900">{connectedCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-1 text-xs font-medium text-gray-500">Access Entries</div>
          <div className="text-2xl font-bold text-gray-900">{assetCount}</div>
        </div>
      </div>

      {platforms.length === 0 ? (
        <EmptyState icon={<Sparkles className="h-6 w-6" />} title={`No ${meta.label} platforms`} description="No platforms available in this group." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 font-medium text-gray-500">Access / Connection</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {platforms.map((p) => {
                const effectiveStatus = p.connected && p.status === "active" ? "active" : "inactive";
                return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconColor}`}>
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {p.connected ? `${p.assets.length} access entr${p.assets.length === 1 ? "y" : "ies"} · ` : ""}
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.connected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" /> Connected
                      </span>
                    ) : (
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                          Not connected
                        </span>
                        <button
                          onClick={() => onToggleConnect(p.id, true)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                        >
                          <Plug className="h-3.5 w-3.5" /> Connect
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      effectiveStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {effectiveStatus === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setViewingId(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Internal Asset detail — business-facing configuration only
// =============================================================================

function InternalAssetPanel({ platform, group, onBack, onToggleConnect }: {
  platform: McomPlatform; group: McomPlatformGroup;
  onBack: () => void; onToggleConnect: (id: string, connected: boolean) => void;
}) {
  const meta = MCOM_GROUP_META[group];
  const [description, setDescription] = useState(platform.description);
  const [status, setStatus] = useState<"active" | "inactive">(platform.status);
  const [saved, setSaved] = useState(false);
  const assets = getMcomPlatformAssets(platform.id);

  const handleSave = () => {
    updateMcomPlatform(platform.id, { description, status });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const readonlyClass = "rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700";

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" /> All {meta.label} platforms
      </button>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.iconColor}`}>
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{platform.name}</h2>
              <p className="text-xs text-gray-500">Internal Asset · {meta.label} platform</p>
            </div>
          </div>
          {platform.connected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <CheckCircle className="h-3.5 w-3.5" /> Connected
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                status === "active" && platform.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                Not connected
              </span>
              <button
                onClick={() => onToggleConnect(platform.id, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
              >
                <Plug className="h-3.5 w-3.5" /> Connect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Business-facing configuration */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-gray-900">Internal Asset configuration</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Asset Name</label>
            <div className={readonlyClass}>{platform.name}</div>
          </div>
          <div>
            <label className={labelClass}>Platform</label>
            <div className={readonlyClass}>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
            </div>
          </div>
          <div>
            <label className={labelClass}>Asset Type</label>
            <div className={readonlyClass}>Internal Asset</div>
          </div>
          <div>
            <label className={labelClass}>Access / Connection</label>
            <div className={readonlyClass}>
              {platform.connected ? (
                <span className="font-semibold text-green-700">Connected</span>
              ) : (
                <span className="text-gray-500">Not connected</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Access to MCOM VCard"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 items-end gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {saved ? "Saved ✓" : "Save Changes"}
            </button>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Technical connection details — API, webhook, authentication, endpoints and provisioning —
          are handled by the backend integration layer and are not configured here.
        </p>
      </div>

      {/* What the access includes */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-gray-900">Access includes</p>
        <p className="mb-3 text-xs text-gray-500">
          Provided by {platform.name} — retrieved through the connection, never recreated in FundOrDonate.
        </p>
        {assets.length === 0 ? (
          <p className="py-3 text-center text-xs text-gray-400">No access entries returned by this platform.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-500">Access Entry</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Type</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 font-medium text-gray-900">{a.name}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{a.type}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === "available" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {a.status === "available" ? "Available" : "Limited"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// External Assets Tab
// =============================================================================

function ExternalAssetsTab({ assets, stats, search, onSearchChange, onEdit, onDuplicate, onArchive, onDelete, formatLastSynced, actionMenuId, setActionMenuId }: {
  assets: ExternalAsset[]; stats: { total: number; active: number; archived: number };
  search: string; onSearchChange: (s: string) => void;
  onEdit: (a: Asset) => void; onDuplicate: (a: Asset) => void; onArchive: (id: string) => void; onDelete: (id: string) => void;
  formatLastSynced: (d: string) => string; actionMenuId: string | null; setActionMenuId: (id: string | null) => void;
}) {
  const filtered = useMemo(() => {
    if (!search) return assets;
    const q = search.toLowerCase();
    return assets.filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
  }, [assets, search]);

  return (
    <div>
      <StatsRow stats={stats} icon={<Globe className="h-5 w-5 text-primary-500" />} />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search external assets..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Globe className="h-6 w-6" />} title="No external assets" description="Create your first external asset to get started." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Asset Name</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">API Endpoint</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Last Synced</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{asset.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <LinkIcon className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">{asset.apiEndpoint}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      <Database className="h-3 w-3" />
                      {asset.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-500">{formatLastSynced(asset.lastSynced)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu id={asset.id} actionMenuId={actionMenuId} setActionMenuId={setActionMenuId}
                      onEdit={() => onEdit(asset)} onDuplicate={() => onDuplicate(asset)}
                      onArchive={() => onArchive(asset.id)} onDelete={() => onDelete(asset.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Asset Modal — Digital (type-first), Physical (inventory), External
// =============================================================================

const emptyDigital = (): DigitalAsset => ({
  id: "", type: "gift-card", name: "", description: "", valueGbp: null,
  codeMode: "auto", code: "", minSpend: null, usageLimit: null,
  availability: "open", startDate: "", endDate: "",
  claimConditions: "", instructions: "", status: "draft",
});

const emptyPhysical = (): PhysicalAsset => ({
  id: "", name: "", description: "", imageUrl: "",
  quantityAvailable: 0, quantityMaxIssued: 0,
  fulfilment: "", deliveryMethod: "both", claimInstructions: "",
  startDate: "", endDate: "", expiryDays: null, status: "draft",
});

function AssetModal({ assetType, asset, onClose, onSave }: {
  assetType: ModalAssetType; asset: Asset | null;
  onClose: () => void; onSave: (a: Asset) => void;
}) {
  const isEdit = !!asset;

  const [digitalForm, setDigitalForm] = useState<DigitalAsset>(
    asset && assetType === "digital" ? asset as DigitalAsset : emptyDigital()
  );

  const [physicalForm, setPhysicalForm] = useState<PhysicalAsset>(
    asset && assetType === "physical" ? asset as PhysicalAsset : emptyPhysical()
  );

  const [externalForm, setExternalForm] = useState<ExternalAsset>(
    asset && assetType === "external" ? asset as ExternalAsset : {
      id: "", name: "", apiEndpoint: "", apiKey: "", type: EXTERNAL_TYPES[0] || "", syncFrequency: "Daily", status: "draft", lastSynced: "Never", description: ""
    }
  );

  const handleSubmit = () => {
    switch (assetType) {
      case "digital": onSave(digitalForm); break;
      case "physical": onSave(physicalForm); break;
      case "external": onSave(externalForm); break;
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const title =
    assetType === "digital" ? `${isEdit ? "Edit" : "Add"} Digital Asset`
    : assetType === "physical" ? `${isEdit ? "Edit" : "Add"} Physical Asset`
    : `${isEdit ? "Edit" : "Add"} External Asset`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {assetType === "digital" && (
            <>
              {/* Asset type first — Henry's order: gift card → voucher → coupon → deal */}
              <div>
                <label className={labelClass}>Asset Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {DIGITAL_TYPE_ORDER.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDigitalForm({ ...digitalForm, type: t })}
                      className={`rounded-lg border-2 px-2 py-2.5 text-xs font-semibold transition-colors ${
                        digitalForm.type === t
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {DIGITAL_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Asset Name</label>
                <input className={inputClass} value={digitalForm.name} onChange={(e) => setDigitalForm({ ...digitalForm, name: e.target.value })} placeholder="e.g. £10 Festive E-Gift Card" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={2} value={digitalForm.description} onChange={(e) => setDigitalForm({ ...digitalForm, description: e.target.value })} placeholder="What this asset is and where it can be used" />
              </div>

              {/* Type-specific fields */}
              {(digitalForm.type === "gift-card" || digitalForm.type === "voucher") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Value (£)</label>
                    <input
                      type="number" min="0" step="0.01" className={inputClass}
                      value={digitalForm.valueGbp ?? ""}
                      onChange={(e) => setDigitalForm({ ...digitalForm, valueGbp: e.target.value === "" ? null : Number(e.target.value) })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Code Configuration</label>
                    <select className={inputClass} value={digitalForm.codeMode} onChange={(e) => setDigitalForm({ ...digitalForm, codeMode: e.target.value as DigitalAsset["codeMode"] })}>
                      <option value="auto">Auto-generated per claim</option>
                      <option value="fixed">Fixed code</option>
                      <option value="none">No code</option>
                    </select>
                  </div>
                  {digitalForm.codeMode === "fixed" && (
                    <div className="col-span-2">
                      <label className={labelClass}>{digitalForm.type === "voucher" ? "Voucher Code" : "Gift Card Code"}</label>
                      <input className={inputClass} value={digitalForm.code} onChange={(e) => setDigitalForm({ ...digitalForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE10" />
                    </div>
                  )}
                </div>
              )}

              {digitalForm.type === "coupon" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Coupon Code</label>
                    <input className={inputClass} value={digitalForm.code} onChange={(e) => setDigitalForm({ ...digitalForm, code: e.target.value.toUpperCase(), codeMode: "fixed" })} placeholder="SAVE10" />
                  </div>
                  <div>
                    <label className={labelClass}>Min Spend (£)</label>
                    <input type="number" min="0" className={inputClass} value={digitalForm.minSpend ?? ""} onChange={(e) => setDigitalForm({ ...digitalForm, minSpend: e.target.value === "" ? null : Number(e.target.value) })} placeholder="20" />
                  </div>
                  <div>
                    <label className={labelClass}>Usage Limit</label>
                    <input type="number" min="1" className={inputClass} value={digitalForm.usageLimit ?? ""} onChange={(e) => setDigitalForm({ ...digitalForm, usageLimit: e.target.value === "" ? null : Number(e.target.value) })} placeholder="1" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Availability</label>
                  <select className={inputClass} value={digitalForm.availability} onChange={(e) => setDigitalForm({ ...digitalForm, availability: e.target.value as DigitalAsset["availability"] })}>
                    <option value="open">Open</option>
                    <option value="limited">Limited</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div />
                <div>
                  <label className={labelClass}>Start Date</label>
                  <DatePicker className={inputClass} value={digitalForm.startDate} onChange={(e) => setDigitalForm({ ...digitalForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <DatePicker className={inputClass} value={digitalForm.endDate} onChange={(e) => setDigitalForm({ ...digitalForm, endDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Claim / Use Conditions</label>
                <textarea className={inputClass} rows={2} value={digitalForm.claimConditions} onChange={(e) => setDigitalForm({ ...digitalForm, claimConditions: e.target.value })} placeholder="e.g. One per donor. Claim within 30 days." />
              </div>
              <div>
                <label className={labelClass}>Link / Instructions</label>
                <input className={inputClass} value={digitalForm.instructions} onChange={(e) => setDigitalForm({ ...digitalForm, instructions: e.target.value })} placeholder="https://example.com or access instructions" />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={digitalForm.status} onChange={(e) => setDigitalForm({ ...digitalForm, status: e.target.value as AssetStatus })}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </>
          )}

          {assetType === "physical" && (
            <>
              <div>
                <label className={labelClass}>Asset Name</label>
                <input className={inputClass} value={physicalForm.name} onChange={(e) => setPhysicalForm({ ...physicalForm, name: e.target.value })} placeholder="e.g. FundOrDonate Branded Gift Box" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={2} value={physicalForm.description} onChange={(e) => setPhysicalForm({ ...physicalForm, description: e.target.value })} placeholder="What this physical item is" />
              </div>
              <FileUpload
                value={physicalForm.imageUrl}
                onChange={(url) => setPhysicalForm((prev) => ({ ...prev, imageUrl: url }))}
                label="Image"
                accept="image/*"
                placeholder="https://example.com/image.jpg"
                maxSizeMB={10}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Quantity Available</label>
                  <input type="number" min="0" className={inputClass} value={physicalForm.quantityAvailable} onChange={(e) => setPhysicalForm({ ...physicalForm, quantityAvailable: Math.max(0, parseInt(e.target.value) || 0) })} />
                </div>
                <div>
                  <label className={labelClass}>Maximum Quantity Issuable</label>
                  <input type="number" min="0" className={inputClass} value={physicalForm.quantityMaxIssued} onChange={(e) => setPhysicalForm({ ...physicalForm, quantityMaxIssued: Math.max(0, parseInt(e.target.value) || 0) })} />
                </div>
              </div>
              <p className="-mt-2 text-xs text-gray-400">
                Remaining: <strong>{physicalForm.quantityAvailable}</strong> of {physicalForm.quantityMaxIssued}
                {physicalForm.quantityAvailable === 0 && <span className="text-red-600"> — unavailable for new Rewards</span>}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <DatePicker className={inputClass} value={physicalForm.startDate} onChange={(e) => setPhysicalForm({ ...physicalForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <DatePicker className={inputClass} value={physicalForm.endDate} onChange={(e) => setPhysicalForm({ ...physicalForm, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Fulfilment Information</label>
                <input className={inputClass} value={physicalForm.fulfilment} onChange={(e) => setPhysicalForm({ ...physicalForm, fulfilment: e.target.value })} placeholder="e.g. Warehouse dispatch — 3–5 working days" />
              </div>
              <div>
                <label className={labelClass}>Delivery / Collection</label>
                <select className={inputClass} value={physicalForm.deliveryMethod} onChange={(e) => setPhysicalForm({ ...physicalForm, deliveryMethod: e.target.value as PhysicalAsset["deliveryMethod"] })}>
                  <option value="delivery">Delivery</option>
                  <option value="collection">Collection</option>
                  <option value="both">Delivery or collection</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Claim Instructions</label>
                <textarea className={inputClass} rows={2} value={physicalForm.claimInstructions} onChange={(e) => setPhysicalForm({ ...physicalForm, claimInstructions: e.target.value })} placeholder="How the claimant claims this item" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Expiry (days after claim)</label>
                  <input type="number" min="0" className={inputClass} value={physicalForm.expiryDays ?? ""} onChange={(e) => setPhysicalForm({ ...physicalForm, expiryDays: e.target.value === "" ? null : Number(e.target.value) })} placeholder="None" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={inputClass} value={physicalForm.status} onChange={(e) => setPhysicalForm({ ...physicalForm, status: e.target.value as AssetStatus })}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {assetType === "external" && (
            <>
              <div>
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={externalForm.name} onChange={(e) => setExternalForm({ ...externalForm, name: e.target.value })} placeholder="Enter asset name" />
              </div>
              <div>
                <label className={labelClass}>API Endpoint</label>
                <input className={inputClass} value={externalForm.apiEndpoint} onChange={(e) => setExternalForm({ ...externalForm, apiEndpoint: e.target.value })} placeholder="https://api.example.com/v1" />
              </div>
              <div>
                <label className={labelClass}>API Key</label>
                <input type="password" className={inputClass} value={externalForm.apiKey} onChange={(e) => setExternalForm({ ...externalForm, apiKey: e.target.value })} placeholder="sk_live_xxx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select className={inputClass} value={externalForm.type} onChange={(e) => setExternalForm({ ...externalForm, type: e.target.value })}>
                    {EXTERNAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sync Frequency</label>
                  <input className={inputClass} value={externalForm.syncFrequency} onChange={(e) => setExternalForm({ ...externalForm, syncFrequency: e.target.value })} placeholder="e.g. Hourly" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={3} value={externalForm.description} onChange={(e) => setExternalForm({ ...externalForm, description: e.target.value })} placeholder="Enter description" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={externalForm.status} onChange={(e) => setExternalForm({ ...externalForm, status: e.target.value as AssetStatus })}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            {isEdit ? "Save Changes" : "Create Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}
