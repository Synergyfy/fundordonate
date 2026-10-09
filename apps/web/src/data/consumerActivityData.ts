import { resolveCampaignForDetail } from "./consumerExploreData";
import { getDemoCampaignsForHighStreet } from "./highStreetData";
import { getDemoRewardsForCampaign } from "./demoRewards";

export type ContributionKind = "donation" | "pledge";
export type ContributionStatus = "completed" | "pending" | "failed";
export type RewardStatus = "available" | "claimed" | "redeemed";

export interface ConsumerContribution {
  id: string;
  reference: string;
  campaignSlug: string;
  campaignTitle: string;
  campaignImage?: string;
  campaignLocation: string;
  communityCityName: string;
  communityAreaName: string;
  communityStreetName: string;
  mode: "donation" | "fund";
  participationType: string;
  kind: ContributionKind;
  amount: number;
  status: ContributionStatus;
  paymentStatus: string;
  rewardEligible: boolean;
  rewardId?: string;
  rewardTitle?: string;
  rewardStatus?: RewardStatus;
  createdAt: string;
}

export interface ContributionInput {
  reference: string;
  campaignSlug: string;
  campaignTitle: string;
  campaignImage?: string;
  campaignLocation: string;
  communityCityName: string;
  communityAreaName: string;
  communityStreetName: string;
  mode: "donation" | "fund";
  participationType: string;
  kind: ContributionKind;
  amount: number;
  rewardEligible: boolean;
  rewardId?: string;
  rewardTitle?: string;
}

export interface ActivityImpact {
  campaignsSupported: number;
  totalContributions: number;
  communitiesSupported: number;
  highStreetsSupported: number;
}

export interface LocalActivityStats {
  totalContributed: number;
  campaignsBacked: number;
  rewardsEarned: number;
}

const STORE_KEY = "fod:contributions";
const DELAY_MS = 250;

function delay<T>(value: T, ms = DELAY_MS): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms));
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function streetCampaign(
  citySlug: string,
  areaSlug: string,
  streetSlug: string,
  index: number,
) {
  return (
    getDemoCampaignsForHighStreet(citySlug, areaSlug, streetSlug).find(
      (c) => c.slug === `${streetSlug}-campaign-${index}`,
    ) ?? null
  );
}

function buildSeedContributions(): ConsumerContribution[] {
  const out: ConsumerContribution[] = [];

  const camden = streetCampaign("london", "camden", "camden-high-street", 2);
  if (camden) {
    out.push({
      id: "seed-contribution-1",
      reference: "TXN-CAMDEN-0001",
      campaignSlug: camden.slug,
      campaignTitle: camden.title,
      campaignImage: camden.featuredImage,
      campaignLocation: camden.location ?? "Camden High Street, Camden",
      communityCityName: "London",
      communityAreaName: "Camden",
      communityStreetName: "Camden High Street",
      mode: camden.mode,
      participationType: camden.mode === "fund" ? "backer" : "donation",
      kind: camden.mode === "fund" ? "pledge" : "donation",
      amount: 2500,
      status: "completed",
      paymentStatus: "Paid",
      rewardEligible: true,
      rewardId: "demo-default-r1",
      rewardTitle: "Supporter E-Card",
      rewardStatus: "available",
      createdAt: daysAgo(6),
    });
  }

  const chalk = streetCampaign("london", "camden", "chalk-farm-road", 2);
  if (chalk) {
    out.push({
      id: "seed-contribution-2",
      reference: "TXN-CHALK-0002",
      campaignSlug: chalk.slug,
      campaignTitle: chalk.title,
      campaignImage: chalk.featuredImage,
      campaignLocation: chalk.location ?? "Chalk Farm Road, Camden",
      communityCityName: "London",
      communityAreaName: "Camden",
      communityStreetName: "Chalk Farm Road",
      mode: chalk.mode,
      participationType: chalk.mode === "fund" ? "backer" : "donation",
      kind: chalk.mode === "fund" ? "pledge" : "donation",
      amount: 1000,
      status: "pending",
      paymentStatus: "Processing",
      rewardEligible: true,
      rewardId: "demo-default-r1",
      rewardTitle: "Supporter E-Card",
      rewardStatus: "available",
      createdAt: daysAgo(3),
    });
  }

  const lambeth = resolveCampaignForDetail("lambeth-founding-membership");
  if (lambeth) {
    out.push({
      id: "seed-contribution-3",
      reference: "TXN-LAMBETH-0003",
      campaignSlug: lambeth.campaign.slug,
      campaignTitle: lambeth.campaign.title,
      campaignImage: lambeth.campaign.featuredImage,
      campaignLocation: lambeth.campaign.location ?? "Lambeth",
      communityCityName: "London",
      communityAreaName: "Lambeth",
      communityStreetName: "",
      mode: "donation",
      participationType: "founding_member",
      kind: "donation",
      amount: 10000,
      status: "completed",
      paymentStatus: "Paid",
      rewardEligible: true,
      rewardId: "demo-default-r2",
      rewardTitle: "Premium Supporter Package",
      rewardStatus: "claimed",
      createdAt: daysAgo(14),
    });
  }

  const bristol = resolveCampaignForDetail("bristol-arts-centre");
  if (bristol) {
    out.push({
      id: "seed-contribution-4",
      reference: "TXN-BRISTOL-0004",
      campaignSlug: bristol.campaign.slug,
      campaignTitle: bristol.campaign.title,
      campaignImage: bristol.campaign.featuredImage,
      campaignLocation: bristol.campaign.location ?? "Bristol",
      communityCityName: bristol.hierarchy?.cityName ?? "Bristol",
      communityAreaName: bristol.hierarchy?.areaName ?? "Bristol",
      communityStreetName: bristol.hierarchy?.streetName ?? "",
      mode: bristol.campaign.mode === "fund" ? "fund" : "donation",
      participationType: "backer",
      kind: "pledge",
      amount: 5000,
      status: "completed",
      paymentStatus: "Paid",
      rewardEligible: true,
      rewardId: "demo-default-r1",
      rewardTitle: "Supporter E-Card",
      rewardStatus: "redeemed",
      createdAt: daysAgo(40),
    });
  }

  return out;
}

function writeStore(items: ConsumerContribution[]): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

function readStore(): ConsumerContribution[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ConsumerContribution[];
    }
  } catch {
    /* fall through to seed */
  }
  const seeds = buildSeedContributions();
  writeStore(seeds);
  return seeds;
}

export async function listContributions(): Promise<ConsumerContribution[]> {
  const items = [...readStore()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return delay(items);
}

export async function getContribution(
  id: string,
): Promise<ConsumerContribution | null> {
  return delay(readStore().find((c) => c.id === id) ?? null);
}

export async function recordContribution(
  input: ContributionInput,
): Promise<ConsumerContribution> {
  const record: ConsumerContribution = {
    id: `contribution-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    reference: input.reference,
    campaignSlug: input.campaignSlug,
    campaignTitle: input.campaignTitle,
    campaignImage: input.campaignImage,
    campaignLocation: input.campaignLocation,
    communityCityName: input.communityCityName,
    communityAreaName: input.communityAreaName,
    communityStreetName: input.communityStreetName,
    mode: input.mode,
    participationType: input.participationType,
    kind: input.kind,
    amount: input.amount,
    status: "completed",
    paymentStatus: "Paid",
    rewardEligible: input.rewardEligible,
    rewardId: input.rewardId,
    rewardTitle: input.rewardTitle,
    rewardStatus: input.rewardEligible ? "available" : undefined,
    createdAt: new Date().toISOString(),
  };
  const next = [record, ...readStore()];
  writeStore(next);
  return delay(record);
}

export function computeImpact(
  items: ConsumerContribution[],
): ActivityImpact {
  const slugs = new Set<string>();
  const communities = new Set<string>();
  const streets = new Set<string>();
  let total = 0;
  for (const c of items) {
    if (c.status === "failed") continue;
    total += c.amount;
    slugs.add(c.campaignSlug);
    if (c.communityAreaName) communities.add(c.communityAreaName);
    if (c.communityStreetName) streets.add(c.communityStreetName);
  }
  return {
    campaignsSupported: slugs.size,
    totalContributions: total,
    communitiesSupported: communities.size,
    highStreetsSupported: streets.size,
  };
}

export function computeLocalStats(
  items: ConsumerContribution[],
): LocalActivityStats {
  const slugs = new Set<string>();
  let total = 0;
  let rewards = 0;
  for (const c of items) {
    if (c.status === "failed") continue;
    total += c.amount;
    slugs.add(c.campaignSlug);
    if (c.rewardEligible) rewards += 1;
  }
  return {
    totalContributed: total,
    campaignsBacked: slugs.size,
    rewardsEarned: rewards,
  };
}

export async function getLocalStats(): Promise<LocalActivityStats> {
  return delay(computeLocalStats(readStore()));
}

// ── Reward entitlements (Phase 7) ──

export interface ConsumerRewardEntitlement {
  id: string;
  rewardId: string;
  title: string;
  description: string;
  condition: string;
  campaignSlug: string;
  campaignTitle: string;
  campaignImage?: string;
  campaignLocation: string;
  contributionAmount: number;
  reference: string;
  status: RewardStatus;
  earnedAt: string;
  expiryDate: string;
  fulfilmentType: string;
  rewardType: string;
  items: string[];
  code: string;
}

function gbp(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

function describeCondition(tc?: {
  mode: string;
  min?: number;
  max?: number;
  exact?: number;
}): string {
  if (!tc) return "Qualifying contribution";
  if (tc.mode === "min") return `Contribute ${gbp(tc.min ?? 0)} or more`;
  if (tc.mode === "range")
    return `Contribute between ${gbp(tc.min ?? 0)} and ${gbp(tc.max ?? 0)}`;
  if (tc.mode === "exact") return `Contribute exactly ${gbp(tc.exact ?? 0)}`;
  return "Qualifying contribution";
}

function buildRewardEntitlement(
  c: ConsumerContribution,
): ConsumerRewardEntitlement | null {
  if (!c.rewardEligible || !c.rewardId) return null;
  const cfg = getDemoRewardsForCampaign(c.campaignSlug).find(
    (r) => r.id === c.rewardId,
  );
  const claimDays = cfg?.claimDeadlineDays ?? 30;
  const expiryDate = new Date(
    new Date(c.createdAt).getTime() + claimDays * 86400000,
  ).toISOString();
  const code = `FOD-${c.reference.replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase()}`;
  return {
    id: c.id,
    rewardId: c.rewardId,
    title: cfg?.title ?? c.rewardTitle ?? "Reward",
    description: cfg?.description ?? "",
    condition: describeCondition(cfg?.triggerConfig),
    campaignSlug: c.campaignSlug,
    campaignTitle: c.campaignTitle,
    campaignImage: c.campaignImage,
    campaignLocation: c.campaignLocation,
    contributionAmount: c.amount,
    reference: c.reference,
    status: c.rewardStatus ?? "available",
    earnedAt: c.createdAt,
    expiryDate,
    fulfilmentType: cfg?.fulfilmentType ?? "manual",
    rewardType: cfg?.rewardType ?? "standard",
    items: cfg?.items.map((i) => i.title) ?? [],
    code,
  };
}

export async function listRewards(): Promise<ConsumerRewardEntitlement[]> {
  const items = readStore()
    .map(buildRewardEntitlement)
    .filter((e): e is ConsumerRewardEntitlement => e !== null)
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
  return delay(items);
}

export async function getRewardEntitlement(
  id: string,
): Promise<ConsumerRewardEntitlement | null> {
  const found = readStore().find((c) => c.id === id) ?? null;
  return delay(found ? buildRewardEntitlement(found) : null);
}

function setRewardStatus(
  id: string,
  from: RewardStatus,
  to: RewardStatus,
): ConsumerRewardEntitlement | null {
  const items = readStore();
  const idx = items.findIndex((c) => c.id === id);
  const current = idx >= 0 ? items[idx] : undefined;
  if (!current) return null;
  const effective = current.rewardStatus ?? "available";
  const updated = effective === from ? { ...current, rewardStatus: to } : current;
  if (updated !== current) items[idx] = updated;
  if (updated !== current) writeStore(items);
  return buildRewardEntitlement(updated);
}

export async function claimReward(
  id: string,
): Promise<ConsumerRewardEntitlement | null> {
  return delay(setRewardStatus(id, "available", "claimed"));
}

export async function openReward(
  id: string,
): Promise<ConsumerRewardEntitlement | null> {
  return delay(setRewardStatus(id, "claimed", "redeemed"));
}
