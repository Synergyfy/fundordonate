// Digital and Physical assets — managed centrally in FundOrDonate.
//
// Admin → Asset Management creates them once; Rewards then attach them
// (ASSET → REWARD → CAMPAIGN). Both Asset Management and the Reward builder
// read/write this store so assets are never recreated per reward.

export type AssetStatus = "active" | "draft" | "archived";

export type DigitalAssetType = "gift-card" | "voucher" | "coupon" | "deal";

/** Henry's corrected terminology/order. */
export const DIGITAL_TYPE_ORDER: DigitalAssetType[] = ["gift-card", "voucher", "coupon", "deal"];

export const DIGITAL_TYPE_META: Record<DigitalAssetType, { label: string; color: string }> = {
  "gift-card": { label: "Gift Card", color: "bg-purple-100 text-purple-700" },
  voucher: { label: "Voucher", color: "bg-blue-100 text-blue-700" },
  coupon: { label: "Coupon", color: "bg-amber-100 text-amber-700" },
  deal: { label: "Deal", color: "bg-rose-100 text-rose-700" },
};

export type DigitalCodeMode = "fixed" | "auto" | "none";
export type DigitalAvailability = "open" | "limited" | "scheduled";

export const AVAILABILITY_META: Record<DigitalAvailability, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-green-100 text-green-700" },
  limited: { label: "Limited", color: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Scheduled", color: "bg-sky-100 text-sky-700" },
};

export interface DigitalAsset {
  id: string;
  type: DigitalAssetType;
  name: string;
  description: string;
  /** Gift card / voucher / coupon value in GBP (null for deals). */
  valueGbp: number | null;
  codeMode: DigitalCodeMode;
  code: string;
  /** Coupon only — minimum spend for redemption. */
  minSpend: number | null;
  /** Coupon only — redemption limit per customer. */
  usageLimit: number | null;
  availability: DigitalAvailability;
  startDate: string;
  endDate: string;
  claimConditions: string;
  instructions: string;
  status: AssetStatus;
}

export type PhysicalDeliveryMethod = "delivery" | "collection" | "both";

export interface PhysicalAsset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  /** Units left to issue. When 0 the asset is unavailable for new Rewards. */
  quantityAvailable: number;
  /** Maximum quantity that can ever be issued. */
  quantityMaxIssued: number;
  fulfilment: string;
  deliveryMethod: PhysicalDeliveryMethod;
  claimInstructions: string;
  startDate: string;
  endDate: string;
  /** Expiry in days after claim, or null. */
  expiryDays: number | null;
  status: AssetStatus;
}

export const physicalInStock = (a: PhysicalAsset): boolean => a.quantityAvailable > 0;

const seedDigital: DigitalAsset[] = [
  {
    id: "dig-1", type: "gift-card", name: "£10 Festive E-Gift Card",
    description: "Digital £10 gift card issued from the gift card catalogue",
    valueGbp: 10, codeMode: "auto", code: "", minSpend: null, usageLimit: null,
    availability: "open", startDate: "2026-10-01", endDate: "2026-12-31",
    claimConditions: "One per donor. Claim within 30 days of the campaign closing.",
    instructions: "https://example.com/gift-card",
    status: "active",
  },
  {
    id: "dig-2", type: "gift-card", name: "£25 Celebration E-Gift Card",
    description: "Digital £25 gift card for campaign milestones",
    valueGbp: 25, codeMode: "fixed", code: "CELEBRATE25", minSpend: null, usageLimit: null,
    availability: "limited", startDate: "", endDate: "",
    claimConditions: "Milestone rewards only.",
    instructions: "https://example.com/egift-25",
    status: "draft",
  },
  {
    id: "dig-3", type: "voucher", name: "£5 High Street Voucher",
    description: "£5 off voucher redeemable at participating high street partners",
    valueGbp: 5, codeMode: "fixed", code: "HIGH5", minSpend: null, usageLimit: null,
    availability: "open", startDate: "", endDate: "2026-12-31",
    claimConditions: "Redeem in store or online within the validity window.",
    instructions: "https://example.com/voucher/HIGH5",
    status: "active",
  },
  {
    id: "dig-4", type: "voucher", name: "15% New Season Voucher",
    description: "Seasonal voucher — expired, kept for the record",
    valueGbp: null, codeMode: "fixed", code: "SEASON15", minSpend: null, usageLimit: null,
    availability: "scheduled", startDate: "2026-01-01", endDate: "2026-03-31",
    claimConditions: "One use per customer.",
    instructions: "https://example.com/voucher/SEASON15",
    status: "archived",
  },
  {
    id: "dig-5", type: "coupon", name: "10% Off Partner Coupon",
    description: "One-time 10% discount coupon for partner stores",
    valueGbp: null, codeMode: "fixed", code: "SAVE10", minSpend: 20, usageLimit: 1,
    availability: "open", startDate: "", endDate: "",
    claimConditions: "Min spend £20. One redemption per customer.",
    instructions: "https://example.com/coupon/SAVE10",
    status: "active",
  },
  {
    id: "dig-6", type: "deal", name: "Free Coffee Weekend Deal",
    description: "Weekend coffee deal at participating cafés",
    valueGbp: null, codeMode: "none", code: "", minSpend: null, usageLimit: null,
    availability: "limited", startDate: "", endDate: "2026-11-30",
    claimConditions: "Valid Saturdays and Sundays, 9am–4pm.",
    instructions: "Show this deal at the till — https://example.com/deal/coffee",
    status: "active",
  },
];

const seedPhysical: PhysicalAsset[] = [
  {
    id: "phy-1", name: "FundOrDonate Branded Gift Box",
    description: "Curated FundOrDonate thank-you gift box",
    imageUrl: "", quantityAvailable: 73, quantityMaxIssued: 100,
    fulfilment: "Warehouse dispatch — 3–5 working days",
    deliveryMethod: "both",
    claimInstructions: "Claim from the campaign reward page; UK addresses only.",
    startDate: "", endDate: "", expiryDays: null, status: "active",
  },
  {
    id: "phy-2", name: "Wireless Headphones",
    description: "Noise-cancelling Bluetooth headphones",
    imageUrl: "", quantityAvailable: 45, quantityMaxIssued: 60,
    fulfilment: "Warehouse dispatch — 3–5 working days",
    deliveryMethod: "delivery",
    claimInstructions: "Shipping address required at claim.",
    startDate: "", endDate: "", expiryDays: 90, status: "active",
  },
  {
    id: "phy-3", name: "Canvas Tote Bag",
    description: "Eco-friendly branded tote bag",
    imageUrl: "", quantityAvailable: 0, quantityMaxIssued: 89,
    fulfilment: "Collect at partner venues",
    deliveryMethod: "collection",
    claimInstructions: "Show claim QR code at the venue.",
    startDate: "", endDate: "", expiryDays: null, status: "active",
  },
  {
    id: "phy-4", name: "Bamboo Water Bottle",
    description: "Eco-friendly 750ml bottle",
    imageUrl: "", quantityAvailable: 0, quantityMaxIssued: 50,
    fulfilment: "Warehouse dispatch",
    deliveryMethod: "delivery",
    claimInstructions: "",
    startDate: "", endDate: "", expiryDays: null, status: "draft",
  },
  {
    id: "phy-5", name: "Organic Cotton T-Shirt",
    description: "Premium organic cotton campaign tee",
    imageUrl: "", quantityAvailable: 120, quantityMaxIssued: 150,
    fulfilment: "Warehouse dispatch — size selection at claim",
    deliveryMethod: "both",
    claimInstructions: "Choose size during checkout of the claim.",
    startDate: "", endDate: "", expiryDays: null, status: "active",
  },
];

const digitalAssets: DigitalAsset[] = seedDigital.map((a) => ({ ...a }));
const physicalAssets: PhysicalAsset[] = seedPhysical.map((a) => ({ ...a }));

// ---------------------------------------------------------------------------
// Digital API
// ---------------------------------------------------------------------------

export const getDigitalAssets = (type?: DigitalAssetType): DigitalAsset[] =>
  digitalAssets
    .filter((a) => !type || a.type === type)
    .map((a) => ({ ...a }));

export const getDigitalAsset = (id: string): DigitalAsset | undefined => {
  const a = digitalAssets.find((x) => x.id === id);
  return a ? { ...a } : undefined;
};

export const saveDigitalAsset = (asset: DigitalAsset): DigitalAsset => {
  if (asset.id) {
    const idx = digitalAssets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      digitalAssets[idx] = { ...asset };
      return { ...asset };
    }
  }
  const created = { ...asset, id: asset.id || `dig-${Date.now()}` };
  digitalAssets.unshift(created);
  return { ...created };
};

export const setDigitalAssetStatus = (id: string, status: AssetStatus): void => {
  const a = digitalAssets.find((x) => x.id === id);
  if (a) a.status = status;
};

export const deleteDigitalAsset = (id: string): void => {
  const idx = digitalAssets.findIndex((a) => a.id === id);
  if (idx >= 0) digitalAssets.splice(idx, 1);
};

export const duplicateDigitalAsset = (id: string): void => {
  const a = digitalAssets.find((x) => x.id === id);
  if (!a) return;
  digitalAssets.unshift({ ...a, id: `dig-${Date.now()}`, name: `${a.name} (Copy)`, status: "draft" });
};

// ---------------------------------------------------------------------------
// Physical API
// ---------------------------------------------------------------------------

export const getPhysicalAssets = (): PhysicalAsset[] => physicalAssets.map((a) => ({ ...a }));

export const getPhysicalAsset = (id: string): PhysicalAsset | undefined => {
  const a = physicalAssets.find((x) => x.id === id);
  return a ? { ...a } : undefined;
};

export const savePhysicalAsset = (asset: PhysicalAsset): PhysicalAsset => {
  if (asset.id) {
    const idx = physicalAssets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      physicalAssets[idx] = { ...asset };
      return { ...asset };
    }
  }
  const created = { ...asset, id: asset.id || `phy-${Date.now()}` };
  physicalAssets.unshift(created);
  return { ...created };
};

export const setPhysicalAssetStatus = (id: string, status: AssetStatus): void => {
  const a = physicalAssets.find((x) => x.id === id);
  if (a) a.status = status;
};

export const deletePhysicalAsset = (id: string): void => {
  const idx = physicalAssets.findIndex((a) => a.id === id);
  if (idx >= 0) physicalAssets.splice(idx, 1);
};

export const duplicatePhysicalAsset = (id: string): void => {
  const a = physicalAssets.find((x) => x.id === id);
  if (!a) return;
  physicalAssets.unshift({
    ...a,
    id: `phy-${Date.now()}`,
    name: `${a.name} (Copy)`,
    quantityAvailable: 0,
    status: "draft",
  });
};
