/**
 * Read-only admin API contract smoke test.
 *
 * Run against a booted API with a seeded database:
 *   pnpm --filter @fundordonate/api verify:admin
 *
 * Optional env:
 *   API_URL        (default http://localhost:5024/api/v1)
 *   ADMIN_EMAIL    (default admin@fundordonate.com)
 *   ADMIN_PASSWORD (default Admin123!)
 */

const API_URL = process.env.API_URL ?? "http://localhost:5024/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@fundordonate.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";

let checks = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
  checks += 1;
}

async function request<T>(
  path: string,
  token?: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { data?: T; message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body?.message.join(", ")
      : body?.message;
    throw new Error(`${init.method ?? "GET"} ${path} -> ${response.status} ${message ?? ""}`);
  }

  return (body?.data ?? body) as T;
}

async function login(): Promise<string> {
  const data = await request<{ accessToken: string }>("/auth/admin/login", undefined, {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert(data?.accessToken, "Admin login did not return an access token");
  return data.accessToken;
}

async function main(): Promise<void> {
  const token = await login();

  // ADM-01: dashboard payload must contain every field the UI reads.
  const stats = await request<Record<string, unknown>>("/admin/stats", token);
  const requiredStats = [
    "totalRaised",
    "totalCampaigns",
    "publishedCampaigns",
    "totalUsers",
    "totalDonations",
    "totalDonationsAmount",
    "totalPledges",
    "totalPledgesAmount",
    "totalRevenue",
    "totalTransactions",
    "activeCampaigns",
    "totalBusinesses",
    "totalConsumers",
    "totalBackers",
    "averageDonation",
    "conversionRate",
    "generatedAt",
  ];
  for (const key of requiredStats) {
    assert(key in stats, `GET /admin/stats is missing "${key}"`);
  }
  assert(
    stats.totalRaised === stats.totalRevenue,
    "totalRaised must mirror totalRevenue",
  );

  // ADM-02: roll-up config must include the canonical rules shape.
  const rollup = await request<{
    rollUpRules?: { campaignTypes?: unknown };
  }>("/admin/locations/rollup-config", token);
  assert(
    rollup.rollUpRules && Array.isArray(rollup.rollUpRules.campaignTypes),
    "rollup-config is missing rollUpRules.campaignTypes",
  );

  // ADM-10: business list must expose aggregated contribution totals.
  const businesses = await request<{
    items?: Array<{ totalRaised?: unknown; totalContributed?: unknown }>;
  }>("/admin/businesses?limit=5", token);
  assert(Array.isArray(businesses.items), "businesses response is missing items");
  for (const business of businesses.items ?? []) {
    assert(
      typeof business.totalRaised === "number",
      "business row is missing numeric totalRaised",
    );
    assert(
      typeof business.totalContributed === "number",
      "business row is missing numeric totalContributed",
    );
  }

  // ADM-06: admin leaderboard must be reachable and return entries.
  const leaderboard = await request<{ entries?: unknown[] }>(
    "/admin/leaderboards/business?limit=5",
    token,
  );
  assert(
    Array.isArray(leaderboard.entries),
    "admin leaderboard response is missing entries",
  );

  // ADM-04: campaign-filtered donations must be accepted.
  const campaigns = await request<{ items?: Array<{ id: string }> }>(
    "/admin/campaigns?limit=1",
    token,
  );
  const campaignId = campaigns.items?.[0]?.id;
  if (campaignId) {
    const donations = await request<{ items?: unknown[] }>(
      `/admin/donations?campaignId=${campaignId}&limit=5`,
      token,
    );
    assert(
      Array.isArray(donations.items),
      "campaign-filtered donations response is missing items",
    );

    // Public campaign detail must expose the runner identity and audience.
    const publicCampaign = await request<{
      author?: { id?: string };
      targetAudience?: string;
    }>(`/campaigns/${campaignId}`);
    assert(
      Boolean(publicCampaign.author?.id),
      "public campaign is missing the runner (author.id)",
    );
    assert(
      ["business", "consumer", "both"].includes(
        publicCampaign.targetAudience ?? "",
      ),
      "public campaign is missing a valid targetAudience",
    );
  }

  console.log(`✓ ${checks} admin contract checks passed`);
}

main().catch((error) => {
  console.error(`✗ Admin contract checks failed: ${(error as Error).message}`);
  process.exit(1);
});
