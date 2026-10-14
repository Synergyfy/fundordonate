// =============================================================================
// Asset Management Service (Digital, Physical & MCOM Platforms)
// Persisted locally with real storage — no mock data.
// =============================================================================

import {
  type DigitalAsset,
  type DigitalAssetType,
  type PhysicalAsset,
  type AssetStatus,
  type McomPlatform,
  type McomPlatformGroup,
  type McomPlatformAsset,
  MCOM_PLATFORMS,
  MCOM_GROUP_META,
  DIGITAL_TYPE_ORDER,
  DIGITAL_TYPE_META,
  AVAILABILITY_META,
} from "@/types/rewards";

export {
  MCOM_GROUP_META,
  DIGITAL_TYPE_ORDER,
  DIGITAL_TYPE_META,
  AVAILABILITY_META,
};

export type {
  DigitalAsset,
  DigitalAssetType,
  PhysicalAsset,
  AssetStatus,
  McomPlatform,
  McomPlatformGroup,
  McomPlatformAsset,
};

const DIGITAL_KEY = "fd_digital_assets";
const PHYSICAL_KEY = "fd_physical_assets";
const MCOM_KEY = "fd_mcom_platforms";

function loadStorage<T>(key: string, defaultVal: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota
  }
}

let digitalAssets: DigitalAsset[] = loadStorage<DigitalAsset>(DIGITAL_KEY, []);
let physicalAssets: PhysicalAsset[] = loadStorage<PhysicalAsset>(PHYSICAL_KEY, []);
let mcomPlatforms: McomPlatform[] = loadStorage<McomPlatform>(MCOM_KEY, MCOM_PLATFORMS);

// ───────────────────── Digital Assets ─────────────────────

export const getDigitalAssets = (): DigitalAsset[] => [...digitalAssets];

export const getDigitalAsset = (id: string): DigitalAsset | undefined =>
  digitalAssets.find((a) => a.id === id);

export const saveDigitalAsset = (asset: DigitalAsset): DigitalAsset => {
  if (asset.id) {
    const idx = digitalAssets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      digitalAssets[idx] = { ...asset };
      saveStorage(DIGITAL_KEY, digitalAssets);
      return { ...asset };
    }
  }
  const created: DigitalAsset = { ...asset, id: asset.id || `dig-${Date.now()}` };
  digitalAssets.unshift(created);
  saveStorage(DIGITAL_KEY, digitalAssets);
  return { ...created };
};

export const setDigitalAssetStatus = (id: string, status: AssetStatus): void => {
  const a = digitalAssets.find((x) => x.id === id);
  if (a) {
    a.status = status;
    saveStorage(DIGITAL_KEY, digitalAssets);
  }
};

export const deleteDigitalAsset = (id: string): void => {
  const idx = digitalAssets.findIndex((a) => a.id === id);
  if (idx >= 0) {
    digitalAssets.splice(idx, 1);
    saveStorage(DIGITAL_KEY, digitalAssets);
  }
};

export const duplicateDigitalAsset = (id: string): void => {
  const a = digitalAssets.find((x) => x.id === id);
  if (!a) return;
  digitalAssets.unshift({ ...a, id: `dig-${Date.now()}`, name: `${a.name} (Copy)`, status: "draft" });
  saveStorage(DIGITAL_KEY, digitalAssets);
};

// ───────────────────── Physical Assets ─────────────────────

export const physicalInStock = (a: PhysicalAsset): boolean => (a.quantityAvailable || 0) > 0;

export const getPhysicalAssets = (): PhysicalAsset[] => [...physicalAssets];

export const getPhysicalAsset = (id: string): PhysicalAsset | undefined =>
  physicalAssets.find((a) => a.id === id);

export const savePhysicalAsset = (asset: PhysicalAsset): PhysicalAsset => {
  if (asset.id) {
    const idx = physicalAssets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      physicalAssets[idx] = { ...asset };
      saveStorage(PHYSICAL_KEY, physicalAssets);
      return { ...asset };
    }
  }
  const created: PhysicalAsset = { ...asset, id: asset.id || `phy-${Date.now()}` };
  physicalAssets.unshift(created);
  saveStorage(PHYSICAL_KEY, physicalAssets);
  return { ...created };
};

export const setPhysicalAssetStatus = (id: string, status: AssetStatus): void => {
  const a = physicalAssets.find((x) => x.id === id);
  if (a) {
    a.status = status;
    saveStorage(PHYSICAL_KEY, physicalAssets);
  }
};

export const deletePhysicalAsset = (id: string): void => {
  const idx = physicalAssets.findIndex((a) => a.id === id);
  if (idx >= 0) {
    physicalAssets.splice(idx, 1);
    saveStorage(PHYSICAL_KEY, physicalAssets);
  }
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
  saveStorage(PHYSICAL_KEY, physicalAssets);
};

// ───────────────────── MCOM Platforms ─────────────────────

export const getMcomPlatforms = (group?: McomPlatformGroup): McomPlatform[] => {
  if (group) return mcomPlatforms.filter((p) => p.group === group);
  return [...mcomPlatforms];
};

export const getMcomPlatform = (id: string): McomPlatform | undefined =>
  mcomPlatforms.find((p) => p.id === id || p.code === id);

export const setMcomPlatformConnected = (id: string, connected: boolean): void => {
  const p = mcomPlatforms.find((x) => x.id === id || x.code === id);
  if (p) {
    p.connected = connected;
    p.status = connected ? "active" : "inactive";
    saveStorage(MCOM_KEY, mcomPlatforms);
  }
};

export const getMcomPlatformAssets = (platformId: string): McomPlatformAsset[] => {
  const p = getMcomPlatform(platformId);
  return p?.connected ? p.assets : [];
};

export const updateMcomPlatform = (
  id: string,
  patch: Partial<McomPlatform>
): void => {
  const p = mcomPlatforms.find((x) => x.id === id || x.code === id);
  if (p) {
    Object.assign(p, patch);
    saveStorage(MCOM_KEY, mcomPlatforms);
  }
};
