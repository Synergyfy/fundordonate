// Internal Assets — access to MCOM / 247GBS platforms.
//
// An Internal Asset is NOT a product FundOrDonate imports or gives out.
// It represents access: "give the eligible business access to MCOM VCard".
// Admin only connects the platform and configures business-facing info;
// the technical connection (API, webhook, auth, provisioning) lives in the
// backend/integration layer. The platform manages whatever the access unlocks.

export type McomPlatformGroup = "mcom" | "247gbs";

export interface McomPlatformAsset {
  id: string;
  name: string;
  type: string;
  status: "available" | "limited";
}

export interface McomPlatform {
  id: string;
  group: McomPlatformGroup;
  code: string;
  /** Asset Name (business-facing). */
  name: string;
  /** Description (business-facing). */
  description: string;
  connected: boolean;
  /** Asset Status — Active / Inactive (the internal asset is only usable while connected). */
  status: "active" | "inactive";
  /** Access entries the platform makes available once connected. */
  assets: McomPlatformAsset[];
}

export const MCOM_GROUP_META: Record<
  McomPlatformGroup,
  { label: string; color: string; iconColor: string; description: string }
> = {
  mcom: {
    label: "MCOM",
    color: "bg-teal-100 text-teal-700",
    iconColor: "bg-teal-100 text-teal-600",
    description:
      "Internal Assets give businesses access to MCOM platforms — VCard, Mall, Reward, Spin, Hotspot and QLinks. FundOrDonate connects to the platform; it never creates or imports their products.",
  },
  "247gbs": {
    label: "247GBS",
    color: "bg-indigo-100 text-indigo-700",
    iconColor: "bg-indigo-100 text-indigo-600",
    description:
      "Internal Assets give businesses access to 247GBS platforms — Audit, Reward and Expo. Access is provisioned through the backend connection, not by recreating anything inside FundOrDonate.",
  },
};

const platforms: McomPlatform[] = [
  {
    id: "svc-mcomvcard",
    group: "mcom",
    code: "mcomvcard",
    name: "MCOM VCard",
    description: "VCard-related asset and access",
    connected: true,
    status: "active",
    assets: [
      { id: "vcard-access", name: "MCOM VCard Access", type: "Access", status: "available" },
      { id: "vcard-10", name: "MCOM VCard £10", type: "VCard", status: "available" },
      { id: "vcard-25", name: "MCOM VCard £25", type: "VCard", status: "available" },
      { id: "vcard-vip", name: "VCard VIP Access", type: "Access", status: "limited" },
    ],
  },
  {
    id: "svc-mcommall",
    group: "mcom",
    code: "mcommall",
    name: "MCOM Mall",
    description: "Mall-related asset and access",
    connected: true,
    status: "active",
    assets: [
      { id: "mall-giftcard", name: "Mall Gift Card", type: "Gift Card", status: "available" },
      { id: "mall-voucher", name: "Mall Shopping Voucher", type: "Voucher", status: "available" },
      { id: "mall-coupon", name: "Mall Partner Coupon", type: "Coupon", status: "available" },
      { id: "mall-deal", name: "Mall Weekend Deal", type: "Deal", status: "available" },
    ],
  },
  {
    id: "svc-mcomreward",
    group: "mcom",
    code: "mcomreward",
    name: "MCOM Reward",
    description: "Reward and loyalty-related asset and access",
    connected: true,
    status: "active",
    assets: [
      { id: "reward-access", name: "Reward Access", type: "Reward", status: "available" },
      { id: "loyalty-access", name: "Loyalty Access", type: "Membership", status: "available" },
      { id: "reward-membership-90", name: "Reward Membership — 90 Days", type: "Membership", status: "available" },
      { id: "reward-points-boost", name: "Points Boost", type: "Reward", status: "limited" },
    ],
  },
  {
    id: "svc-mcomspin",
    group: "mcom",
    code: "mcomspin",
    name: "MCOM Spin",
    description: "Spin-the-wheel related asset and access",
    connected: true,
    status: "active",
    assets: [
      { id: "spin-entry", name: "Spin Entry Token", type: "Access", status: "available" },
      { id: "spin-daily", name: "Daily Spin Access", type: "Access", status: "available" },
    ],
  },
  {
    id: "svc-mcomhotspot",
    group: "mcom",
    code: "mcomhotspot",
    name: "MCOM Hotspot",
    description: "Hotspot-related asset and access",
    connected: false,
    status: "active",
    assets: [
      { id: "hotspot-wifi", name: "Hotspot Wi-Fi Access", type: "Access", status: "available" },
      { id: "hotspot-pass", name: "Venue Hotspot Pass", type: "Pass", status: "available" },
    ],
  },
  {
    id: "svc-mcomlinks",
    group: "mcom",
    code: "mcomlinks",
    name: "MCOM QLinks",
    description: "QLinks / rotator-related asset and access",
    connected: true,
    status: "active",
    assets: [
      { id: "qlinks-slot", name: "QLinks Rotator Slot", type: "Access", status: "available" },
      { id: "qlinks-pack", name: "Rotator Link Pack", type: "Access", status: "available" },
    ],
  },
  {
    id: "svc-247gbs-audit",
    group: "247gbs",
    code: "247gbs-audit",
    name: "247GBS Audit",
    description: "Audit-related access and asset",
    connected: true,
    status: "active",
    assets: [
      { id: "audit-access", name: "Audit Access", type: "Access", status: "available" },
      { id: "audit-slot", name: "Compliance Audit Slot", type: "Service", status: "available" },
    ],
  },
  {
    id: "svc-247gbs-reward",
    group: "247gbs",
    code: "247gbs-reward",
    name: "247GBS Reward",
    description: "Reward-related access and asset",
    connected: true,
    status: "active",
    assets: [
      { id: "gbs-reward-credit", name: "Reward Credit", type: "Reward", status: "available" },
      { id: "gbs-tier-access", name: "Tiered Reward Access", type: "Membership", status: "available" },
    ],
  },
  {
    id: "svc-247gbs-expo",
    group: "247gbs",
    code: "247gbs-expo",
    name: "247GBS Expo",
    description: "Expo-related access and asset",
    connected: false,
    status: "active",
    assets: [
      { id: "expo-access", name: "Expo Access", type: "Access", status: "available" },
      { id: "expo-vip", name: "Expo VIP Pass", type: "Pass", status: "limited" },
    ],
  },
];

const copyPlatform = (p: McomPlatform): McomPlatform => ({
  ...p,
  assets: p.assets.map((a) => ({ ...a })),
});

export const getMcomPlatforms = (group?: McomPlatformGroup): McomPlatform[] =>
  platforms
    .filter((p) => !group || p.group === group)
    .map(copyPlatform);

export const getConnectedMcomPlatforms = (): McomPlatform[] =>
  platforms.filter((p) => p.connected).map(copyPlatform);

export const getMcomPlatform = (id: string): McomPlatform | undefined => {
  const p = platforms.find((x) => x.id === id);
  return p ? copyPlatform(p) : undefined;
};

export const setMcomPlatformConnected = (id: string, connected: boolean): void => {
  const p = platforms.find((x) => x.id === id);
  if (p) p.connected = connected;
};

/** Business-facing config only — technical connection details live in the backend. */
export const updateMcomPlatform = (
  id: string,
  patch: { description?: string; status?: "active" | "inactive" }
): void => {
  const p = platforms.find((x) => x.id === id);
  if (!p) return;
  if (patch.description !== undefined) p.description = patch.description;
  if (patch.status !== undefined) p.status = patch.status;
};

/** Simulated platform API — the asset list the connected platform exposes. */
export const getMcomPlatformAssets = (platformId: string): McomPlatformAsset[] => {
  const p = platforms.find((x) => x.id === platformId);
  return p ? p.assets.map((a) => ({ ...a })) : [];
};
