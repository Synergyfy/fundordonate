# Admin Dashboard E2E — Bug Fix Plan

**Status:** Proposed  
**Source:** Browser E2E run on 2026-10-26 against local dev (`web:5023`, `api:5024`) with `admin@fundordonate.com`  
**Scope:** `/admin/**` (web) and the admin API modules that back it

---

## 1. Executive summary

The E2E run exercised **111 static admin routes**. 110 rendered; **1 crashed**. The remaining defects fall into three groups:

1. **Contract mismatches** — the UI and API disagree on field names/shapes (dashboard KPIs, roll-up config).
2. **Broken navigation/actions** — links and filters that point at routes or query params that do not exist (business-owner detail, campaign contributions, campaign edit).
3. **Advertised but unimplemented features** — categories, tags, target calculation, spillover rules, and the admin business leaderboard have no usable backend.

**Strategy:** fix contract mismatches and broken flows first (P0), then make an explicit implement-or-hide decision for unfinished features (P1), then clean up console/permission noise (P2). Finish by adding contract + route smoke tests so the same class of regression is caught automatically.

### Implementation progress

| PR | Items | Status |
| --- | --- | --- |
| PR 1 | ADM-01, ADM-10, ADM-19 | ✅ Implemented & verified (2026-10-26) |
| PR 2 | ADM-02 | ✅ Implemented & verified (2026-10-26) |
| PR 3 | ADM-03, ADM-04, ADM-13 | ✅ Implemented & verified (2026-10-26) |
| PR 4 | ADM-05 | ✅ Implemented & verified (2026-10-27) |
| PR 5 | ADM-06 | ✅ Implemented & verified (2026-10-27) |
| PR 6 | ADM-07/08/09 | ✅ Hidden behind redirects (2026-10-27) |
| PR 7 | ADM-11, ADM-12, ADM-14, ADM-15, ADM-17, ADM-18 | ✅ Implemented & verified (2026-10-27) |
| PR 8 | ADM-16, ADM-20 | ✅ Docs/UI + contract smoke test (2026-10-27) |
| PR 9 | ADM-21 | ✅ Relabelled/redirected to template creation (2026-10-27) |

**PR 1 verification:** dashboard now shows £24,400 raised / 29 campaigns / 23 donations (£23,700) / 14 users / 20 published; funding and report screens reconcile; business rows show real raised totals. `api build`, `web build`, and `web test` pass.

**PR 2 verification:** `/admin/rollup-config` renders without ErrorBoundary, shows defaults, and a save/reload round-trip succeeds. `api build` and `web build` pass.

**PR 3 verification:** business-owner rows open the correct profile (owner id), old business-id links resolve via fallback, campaign contributions render, and the wizard logs no duplicate-key warning. `api build`, `web build`, and `web test` pass.

**PR 4 verification:** `/admin/campaigns/:id/edit` loads the campaign, pre-fills title/target, saves via `PUT /admin/campaigns/:id`, and redirects to the detail page. A save/revert round-trip persisted correctly. `api build` and `web build` pass.

**PR 5 verification:** `/admin/business-owners/leaderboards` loads 12 ranked businesses, £24,400 total, no 403 and no console errors. New endpoint: `GET /admin/leaderboards/business`.

**PR 6 verification:** Categories removed from the admin nav; `/admin/categories`, `/admin/system/taxonomy`, `/admin/campaigns/targets`, and `/admin/campaigns/spillover` redirect to their nearest live pages. No 404s or console errors on those URLs.

**PR 7 verification:** admin pages no longer request `/wallet/balance`; the hub location cache no longer emits the BigInt serialization warning; signed-out `/admin/*` redirects to `/admin/login` without a misleading “session expired” and returns to the requested URL after login; `/admin/seasons/current` calls the new cities endpoint (200, no 404); the season selector shows reference codes; `/admin/finance/rules` redirects to payment settings.

**PR 8 verification:** `apps/api/README.md` documents local peers and degraded-mode behaviour; the integrations page lists each connected service; `pnpm test:admin-contracts` runs a read-only 33-check smoke test covering stats, roll-up config, business totals, leaderboard, and campaign-filtered donations.

**PR 9 verification:** the campaigns directory button now reads “Create Campaign Template” and links to `/admin/campaigns/templates/new`; `/admin/campaigns/new` redirects there. No button labelled “Create Campaign” produces a hidden template.

### Effort scale

| Size | Meaning |
| --- | --- |
| S | < 2 hours |
| M | ~0.5–1 day |
| L | > 1 day / needs product decision |

---

## 2. Issue register

| ID | Severity | Area | Symptom | Root cause | Effort |
| --- | --- | --- | --- | --- | --- |
| ADM-01 | **P0** | Dashboard / Funding / Reports | KPI cards show £0 / 0 despite live data | UI reads legacy fields the API no longer returns | M |
| ADM-02 | **P0** | `/admin/rollup-config` | Full-page ErrorBoundary crash | API returns weights object; UI expects `rollUpRules` | M |
| ADM-03 | **P0** | Business owners list → detail | Row click lands on public 404; `/detail` says “not found” | Link uses business id + missing route; detail fetches user by business id | S |
| ADM-04 | **P0** | Campaign detail → Contributions | Always “No contributions recorded yet” | `campaignId` query param rejected by DTO validation (400) | S |
| ADM-05 | **P0** | Campaign edit | `/admin/campaigns/:id/edit` opens empty “Create Campaign” | Wizard never loads or saves an existing campaign | L |
| ADM-06 | **P1** | Business owner leaderboards | Page gets 403 and logs error | Admin calls `/business/leaderboard`, guarded by `BusinessOwnerGuard` | M |
| ADM-07 | **P1** | Categories / Tags | Managers always empty; create/edit would 404 | No `Category`/`Tag` models or controllers exist | L (or S to hide) |
| ADM-08 | **P1** | Target calculation | Page empty; config cannot load/save | No `/target-calculation` backend module | L (or S to hide) |
| ADM-09 | **P1** | Spillover & surplus | Page empty; `/spillover-rules` 404 | No spillover-rules controller | M (or S to hide) |
| ADM-10 | **P1** | Business list / business reports | Every business shows £0 raised/contributed | `/admin/businesses` does not aggregate contribution totals | S |
| ADM-11 | **P2** | Every admin page | Console 400 on `/wallet/balance` | Wallet badge queries for admins with no MCOM link | S |
| ADM-12 | **P2** | Unauthenticated `/admin` | Redirects to public SSO login with “session expired” | `ProtectedRoute` is not admin-aware; interceptor sets reason on bootstrap 401 | S |
| ADM-13 | **P2** | Campaign wizard | React duplicate-key warnings | Sidebar groups non-contiguous categories with the same key | S |
| ADM-14 | **P2** | `/admin/seasons/current` | 404 on `/admin/seasons/:id/cities` | Endpoint missing; fallback works | S |
| ADM-15 | **P2** | Hub location cache | Redis warning `Do not know how to serialize a BigInt` | `JSON.stringify` on Prisma `BigInt` before cache write | S |
| ADM-16 | **P2** | Integrations | Central Hub token 500/503; 247GBS audit `ECONNREFUSED :9008` | Required peer services not running / misconfigured locally | M |
| ADM-17 | **P2** | Data quality | Duplicate-looking season names in selector | Seed contains both “Winter 2026” and “Winter 2026 Season” | S |
| ADM-18 | **P2** | `/admin/finance/rules` | Shows generic “Settings” page | Route maps to `SettingsPage`; no finance-rules page | S |
| ADM-19 | **Prevent** | Types / contracts | Mismatches compile because the stats type has `[key: string]: any` | Loose frontend types | S |
| ADM-20 | **Prevent** | Tests | No E2E or API contract coverage for admin | Only two util unit tests exist | M |
| ADM-21 | **P1** | `/admin/campaigns/new` | “Create Campaign” creates a template, not a campaign | The 19-step wizard calls `createTemplate`; templates are not listed in the campaigns directory | L (or S to relabel) |

---

## 3. Phase 1 — P0 correctness fixes

### ADM-01 — Restore dashboard KPI data

**Decision:** make the API additive rather than rewriting six consumers. The legacy fields are used by `DashboardHome`, `FundingPage`, `ReportsPage`, `ReportsAnalyticsPage`, `BusinessOwnersOverviewPage`, and `ConsumerOverviewPage`; returning them correctly fixes all of them at once.

**Files**

- `apps/api/src/modules/admin/services/admin-dashboard.service.ts`
- `apps/web/src/services/admin/type.ts`

**Changes**

1. In `getDashboardStats()`, add the missing aggregates:
   - `totalRaised` = existing `totalRevenue`
   - `totalCampaigns` = `businessCampaign.count()`
   - `publishedCampaigns` = `businessCampaign.count({ where: { status: ACTIVE } })`
   - `totalUsers` = existing `totalUsersCount`
   - `totalDonationsAmount` / `totalDonations` = completed contributions whose `metadata.chargePurpose` is `DONATION`
   - `totalPledgesAmount` / `totalPledges` = completed contributions whose `metadata.chargePurpose` is `PLEDGE`
2. Keep the newer fields (`totalRevenue`, `totalTransactions`, `activeCampaigns`, `totalBusinesses`, `totalConsumers`, `totalBackers`, `averageDonation`, `conversionRate`).
3. Add the new aggregates to the same `Promise.all` batch to avoid N+1 queries.
4. Document the pence units in the type (`amounts are minor units`).
5. Remove `[key: string]: any` from `AdminDashboardStats` and mark fields as required.

**Reference shape**

```ts
const [donationAgg, pledgeAgg, ...] = await Promise.all([
  this.prisma.contribution.aggregate({
    where: {
      status: ContributionStatus.COMPLETED,
      metadata: { path: ["chargePurpose"], equals: "DONATION" },
    },
    _sum: { amount: true },
    _count: { id: true },
  }),
  this.prisma.contribution.aggregate({
    where: {
      status: ContributionStatus.COMPLETED,
      metadata: { path: ["chargePurpose"], equals: "PLEDGE" },
    },
    _sum: { amount: true },
    _count: { id: true },
  }),
  // ...existing queries
]);
```

**Acceptance criteria**

- `/admin` shows Total Raised **£24,400**, Active Campaigns **20**, Total Businesses **12**, Total Backers **2** against the seeded DB.
- `/admin/funding` and `/admin/reports` show the same live totals, not £0.
- `pnpm --filter @fundordonate/api build` and `pnpm --filter web build` pass.
- No page reads a field that is absent from the API response.

**Note:** if “Total Pledges” is not a product requirement until a pledge model exists, remove that card instead of returning a permanently-zero field. Decide before implementation.

---

### ADM-02 — Fix roll-up configuration contract

**Files**

- `apps/api/src/modules/admin/services/admin-locations.service.ts`
- `apps/web/src/services/hub-progress/type.ts`
- `apps/web/src/pages/admin/AdminRollUpConfig.tsx`

**Changes**

1. Define one canonical `RollUpConfig` shape in the API:
   ```ts
   {
     enabled: boolean;
     aggregationLevel: "realtime" | "hourly" | "daily";
     autoPromoteStatus: boolean;
     activationThreshold: number;
     rollUpRules: {
       campaignTypes: string[];
       includeDonations: boolean;
       includePledges: boolean;
       includeFounding: boolean;
     };
     // legacy weight fields kept optional for backward compatibility
     nationalTargetMultiplier?: number;
     cityDefaultWeight?: number;
     localAreaWeight?: number;
     highStreetWeight?: number;
   }
   ```
2. `getRollupConfig()` should merge persisted values over defaults:
   ```ts
   const defaults = { enabled: true, aggregationLevel: "realtime", autoPromoteStatus: false,
     activationThreshold: 0, rollUpRules: { campaignTypes: ["donation", "fund", "founding"],
       includeDonations: true, includePledges: true, includeFounding: true } };
   const stored = setting?.value ?? {};
   return { ...defaults, ...stored,
     rollUpRules: { ...defaults.rollUpRules, ...(stored.rollUpRules ?? {}) } };
   ```
3. Add a `UpdateRollUpConfigDto` with validation and store the canonical shape.
4. Make the frontend type match and guard render access (`config.rollUpRules?.campaignTypes ?? []`) as defence in depth.

**Acceptance criteria**

- `/admin/rollup-config` renders without ErrorBoundary.
- Toggling campaign types, saving, reloading, and previewing all work.
- No `Cannot read properties of undefined (reading 'campaignTypes')` in console.

---

### ADM-03 — Repair business-owner list → detail navigation

**Files**

- `apps/web/src/pages/admin/business-owners/BusinessOwnersListPage.tsx`
- `apps/web/src/pages/admin/AdminBusinessOwnerDetailPage.tsx`
- `apps/web/src/App.tsx` (optional alias route)

**Changes**

1. Link rows with the owner id and the existing detail route:
   ```tsx
   to={`/admin/business-owners/${bo.ownerId}/detail`}
   ```
2. Make the detail page tolerant of both ids so old bookmarks and links keep working:
   ```ts
   let owner = await adminApi.getUser(id).catch(() => null);
   if (!owner) {
     const business = await adminApi.getBusiness(id);
     owner = await adminApi.getUser(business.ownerId);
   }
   ```
3. If `ownerId` can be null, render a disabled row or a clear message instead of a dead link.

**Acceptance criteria**

- Clicking any row in `/admin/business-owners/list` opens that owner's profile.
- `/admin/business-owners/<businessId>/detail` still resolves via the fallback.
- No public 404 page and no “Business owner not found” for valid seeded records.

---

### ADM-04 — Allow campaign filtering on admin donations

**Files**

- `apps/api/src/modules/admin/dto/finance-admin.dto.ts`
- `apps/api/src/modules/admin/services/admin-finance.service.ts`
- `apps/web/src/pages/admin/campaigns/AdminCampaignDetailPage.tsx`

**Changes**

1. Add an optional validated filter:
   ```ts
   @ApiPropertyOptional({ description: "Filter by campaign UUID" })
   @IsOptional()
   @IsUUID()
   campaignId?: string;
   ```
2. Apply it in `getDonations()`:
   ```ts
   if (campaignId) where.campaignId = campaignId;
   ```
3. Consider adding `businessId` at the same time if other screens need it.
4. Optionally surface a real error state on the tab instead of silently showing an empty list.

**Acceptance criteria**

- `GET /admin/donations?campaignId=<id>` returns 200 and the campaign's contributions.
- Campaign `High Street Eco & Energy Sustainability Grant` shows its completed contributions.
- No 400 `property campaignId should not exist`.

---

### ADM-05 — Make campaign edit actually edit

**Finding:** the 19-step `AdminCampaignWizard` is a **template builder**, not a campaign editor — it calls `adminApi.createTemplate()` and stores its data in `CampaignTemplate.config`. Hydrating it from a `BusinessCampaign` would edit the wrong entity (and would affect every instance of that template). The campaign detail Edit button therefore needs a campaign-level form.

**Implemented approach**

- New page: `apps/web/src/pages/admin/campaigns/AdminCampaignEditPage.tsx`
  - loads the campaign with `adminApi.getCampaign(id)`,
  - edits campaign-level fields: title, description, target amount, self-funding amount, start/end date,
  - validates required/date rules and shows field errors,
  - saves and returns to the campaign detail page.
- New API: `PUT /admin/campaigns/:id` (`UpdateAdminCampaignDto` + `AdminCampaignsService.updateCampaign`) with an audit-log entry.
- Route `/admin/campaigns/:id/edit` now renders `AdminCampaignEditPage` instead of the template wizard.
- `adminApi.updateCampaign()` now targets `/admin/campaigns/:id` (previously `/campaigns/:id`, which has no write route).

**Acceptance criteria (met)**

- Opening `/admin/campaigns/<id>/edit` pre-fills title, target, and dates from the DB.
- Saving persists changes via `PUT /admin/campaigns/:id` and returns to the detail page.
- Header reads **Edit Campaign**.
- End-before-start dates are rejected.

**Out of scope / follow-up:** template-level fields (objective, rewards, activation rules, contribution rules) are still edited only on the template. See ADM-21 for the create-flow mismatch.

---

### ADM-21 — “Create Campaign” creates a template

**Files**

- `apps/web/src/components/admin/wizard/AdminCampaignWizard.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/pages/admin/campaigns/AllCampaignsPage.tsx`
- `apps/api/src/modules/admin/controllers/admin-campaigns.controller.ts`
- `apps/api/src/modules/admin/services/admin-campaigns.service.ts`

**Finding:** `/admin/campaigns/new` runs the 19-step wizard, which calls `adminApi.createTemplate()` and stores the result in `CampaignTemplate`. The campaigns directory lists `BusinessCampaign` instances, so a newly “created campaign” does not appear there.

**Options**

1. **Relabel and redirect (S):** treat the wizard as a template builder — rename the button to “Create Campaign Template”, route it to `/admin/campaigns/templates/new`, and keep campaign creation to template instantiation.
2. **Implement campaign creation (L):** add `POST /admin/campaigns` that creates a `BusinessCampaign` from the wizard data, persist wizard-only config in `BusinessCampaign.settings` (or a new `config` column), and surface the campaign in the directory.
3. **Split the wizard (M):** keep the 19-step builder for templates and build a focused campaign create form (same fields as ADM-05) for direct campaign creation.

**Recommendation:** option 1 now (remove the misleading affordance), then option 3 if direct campaign creation is a product requirement.

**Acceptance criteria**

- Creating from the campaigns directory either produces a visible campaign or clearly produces a template.
- No button labelled “Create Campaign” leads to a template-only result.

---

## 4. Phase 2 — P1 broken or unfinished features

### ADM-06 — Give admins a proper business leaderboard endpoint

**Implemented**

- `apps/api/src/modules/admin/services/admin-leaderboard.service.ts` — platform-scoped SQL over active businesses and completed contributions, including rank, campaign count, backer count, and owner identity.
- `apps/api/src/modules/admin/controllers/admin-leaderboard.controller.ts` — `GET /admin/leaderboards/business`, protected by `JwtAuthGuard + AdminGuard`.
- `apps/api/src/modules/admin/dto/admin-leaderboard-query.dto.ts` — optional `scope`/`location` plus pagination.
- `apps/web/src/services/leaderboard/index.ts` — new `getAdminBusinessLeaderboard()`.
- `apps/web/src/pages/admin/business-owners/BusinessLeaderboardsPage.tsx` — now calls the admin endpoint.
- `BusinessOwnerGuard` was left untouched, preserving the business context boundary.

**Acceptance criteria (met)**

- `/admin/business-owners/leaderboards` returns 200 and renders 12 ranked businesses.
- No 403 in the network tab or console.
- Total season raised reconciles with the platform total (£24,400).

---

### ADM-07 / ADM-08 / ADM-09 — Categories, tags, target calculation, spillover

These are advertised in the admin nav but have no usable backend. **Status: hidden (2026-10-27)** until the backends are implemented.

| Feature | Backend state | Recommendation |
| --- | --- | --- |
| Categories | No `Category` model/controller; `BusinessCampaign.category` is a string | **Hide now.** Implementing needs models, migration, join relations, CRUD, and wizard wiring (L). |
| Tags | No `Tag` model/controller | **Hide now.** Same as categories (L). |
| Target calculation | Only a formula helper in `admin-campaigns.service.ts`; no metrics/config models or endpoints | **Hide now** unless target planning is in the current milestone (L). |
| Spillover rules | `Season.spilloverConfig` JSON exists; no `/spillover-rules` controller | **Implement read/write against the season config (M)** if the page is required; otherwise hide (S). |

**Implemented**

- Removed the Categories nav item from `adminNavConfig.tsx` and the unused `AdminLayout.tsx`.
- Removed the three lazy exports from `lazyRoutes.tsx`.
- Added redirects so old bookmarks do not 404:
  - `/admin/categories` → `/admin/campaigns`
  - `/admin/system/taxonomy` → `/admin/settings`
  - `/admin/campaigns/targets` → `/admin/campaigns`
  - `/admin/campaigns/spillover` → `/admin/campaigns`
- Page/component files are retained in the repo so they can be re-enabled once the backends exist.

**Acceptance criteria (met)**

- No admin nav item leads to a page that 404s or silently fails.
- Hidden URLs redirect cleanly with no 404s or console errors.

**Implement checklist (when chosen)**

- Add Prisma models + migration.
- Add admin CRUD controller/service/DTOs.
- Wire campaign wizard fields (category/tags).
- Add seed data and API tests.
- Re-enable the nav entry, route, and lazy export.

---

### ADM-10 — Aggregate contribution totals for businesses

**Files**

- `apps/api/src/modules/admin/services/admin-participants.service.ts`
- `apps/api/src/modules/admin/services/admin-participants.service.ts` (`getBusiness` if needed)
- `apps/web/src/pages/admin/business-owners/BusinessOwnersListPage.tsx`
- `apps/web/src/pages/admin/reports/ReportsPage.tsx`

**Changes**

1. After fetching the page of businesses, aggregate completed contributions in one query:
   ```ts
   const totals = await this.prisma.contribution.groupBy({
     by: ["businessId"],
     where: { businessId: { in: items.map((b) => b.id) }, status: COMPLETED },
     _sum: { amount: true },
   });
   ```
2. Map `totalRaised` and `totalContributed` (pence) onto each item.
3. Ensure `getBusiness(id)` returns the same totals for the detail view.
4. Make the frontend fields required once the API guarantees them.

**Acceptance criteria**

- Business owner list shows real raised amounts (e.g. `testman00` with 2 × £100 shows £200, not £0).
- Business report totals reconcile with the platform total (£24,400).

---

## 5. Phase 3 — P2 polish and resilience

### ADM-11 — Stop querying the wallet for unlinked users

**Files**

- `apps/web/src/hooks/useWalletBalance.ts`
- `apps/web/src/stores/auth.store.ts`
- `apps/api/src/auth/auth.service.ts` + `apps/api/src/auth/dto/auth-response.dto.ts` (robust option)
- `apps/web/src/components/wallet/WalletBalanceBadge.tsx`

**Changes**

- Minimal: gate the query for admins:
  ```ts
  enabled: isAuthenticated && Boolean(user?.id) && user?.userType !== "admin",
  ```
- Robust: expose `mcomLinked: Boolean(user.mcomUserId)` on `AuthUserDto` and gate on `user.mcomLinked`.
- Keep `WalletBalanceBadge` returning `null` on error (already does).

**Acceptance criteria**

- No `/wallet/balance` request on admin pages.
- No 400 in the console for local admins.

---

### ADM-12 — Send unauthenticated admins to the admin login

**Files**

- `apps/web/src/components/auth/ProtectedRoute.tsx`
- `apps/web/src/pages/auth/AdminLoginPage.tsx`
- `apps/web/src/lib/api.ts`

**Changes**

1. Make the redirect path-aware:
   ```ts
   const loginPath = location.pathname.startsWith("/admin") ? "/admin/login" : "/auth/login";
   return <Navigate to={loginPath} state={{ from: location }} replace />;
   ```
2. In `AdminLoginPage`, navigate to `location.state?.from?.pathname ?? "/admin"` after success.
3. In the response interceptor, only add `?reason=session-expired` when a refresh token/session actually existed. On a first visit with no token, let the route guard redirect without the misleading message.
4. Route admin-path refresh failures to `/admin/login`, not the public SSO login.

**Acceptance criteria**

- Signed-out visit to `/admin` lands on `/admin/login` without a “session expired” message.
- After login, the user returns to the originally requested admin URL.
- A genuinely expired session still shows the expiry message.

---

### ADM-13 — Fix wizard duplicate keys

**File:** `apps/web/src/components/admin/wizard/WizardShell.tsx`

**Change:** the grouping loop only merges consecutive categories, so non-contiguous `Funding` / `Participation` groups collide. Use a stable unique key:

```tsx
<div key={`${group.category}-${group.steps[0].id}`}>
```

Alternatively, group all steps globally by category (changes sidebar order). Prefer the key fix unless product wants category consolidation.

**Acceptance criteria**

- No “Encountered two children with the same key” warning on `/admin/campaigns/new`.

---

### ADM-14 — Remove the dead season-cities call

**Files**

- `apps/web/src/services/season/index.ts`
- `apps/web/src/pages/admin/seasons/CurrentSeasonPage.tsx`

**Changes**

- Either add `GET /admin/seasons/:id/cities` (returning `activationScope.cities`) or drop the call and use the existing fallback from `season.activationScope`.
- Recommended: drop the call now; the fallback already produces the correct rows.

**Acceptance criteria**

- No 404 on `/admin/seasons/current`.

---

### ADM-15 — Serialize BigInt before caching hub locations

**File:** `apps/api/src/modules/hub/hub.service.ts`

**Change:** use a JSON replacer when writing the cache:

```ts
await this.redis.set(
  cacheKey,
  JSON.stringify(roots, (_k, v) => (typeof v === "bigint" ? Number(v) : v)),
  "EX",
  600,
);
```

Consider extracting a shared `jsonWithBigInt` helper and reusing it in other cache writers.

**Acceptance criteria**

- No `Do not know how to serialize a BigInt` warning.
- `hub:location:tree` is populated and read back correctly.

---

### ADM-16 — Integration health and local documentation

**Files**

- `apps/api/.env.example`, `apps/api/README.md`
- Health/status surfaces in `apps/api/src/modules/admin` and `apps/web/src/pages/admin/system/*`

**Changes**

- Document required local peers (Central Hub on `:3010`, 247GBS audit on `:9008`, Redis, Postgres).
- Ensure failures degrade gracefully (they already do in most screens).
- Surface integration status on `/admin/system/health` and `/admin/system/integrations`.
- Treat repeated `RewardReconciliationService`/`AuditClient` errors as expected when peers are down; log once at warn level rather than per campaign.

**Acceptance criteria**

- Local setup doc explains which services are optional.
- Admin health page distinguishes “peer unavailable” from “platform broken”.

---

### ADM-17 — Season name data quality

**Files:** `apps/api/prisma/seed.ts` (or season admin display)

**Changes**

- Inspect the seeded seasons: “Winter 2026” vs “Winter 2026 Season”, “Autumn 2026” vs “Autumn 2026 Season”.
- Either dedupe the seed or include date ranges in the selector labels so users can tell them apart.

**Acceptance criteria**

- Season selector has no confusing duplicate-looking options.

---

### ADM-18 — Clarify `/admin/finance/rules`

**Files:** `apps/web/src/App.tsx`, `apps/web/src/components/admin/adminNavConfig.tsx`

**Changes**

- Confirm whether finance rules should be a distinct page. If yes, build it; if not, remove the route/nav entry or relabel it as “Settings”.
- Current mapping to `SettingsPage` renders a generic “Settings” heading under a finance URL.

**Acceptance criteria**

- The page title and navigation label match the feature.

---

## 6. Prevention — types and automated coverage

### ADM-19 — Tighten the API/UI contract

- Remove `[key: string]: any` from `AdminDashboardStats`.
- Move shared admin response types into `packages/types` (or generate from Swagger) so API and web compile against one definition.
- Add a lint rule or review checklist item: “no `any` index signatures on API response types”.
- Prefer additive API changes over silent optional fields.

**Acceptance criteria**

- Removing a field from the API breaks the web build (or a contract test), not just the runtime.

---

### ADM-20 — Add admin smoke tests

**Recommended:** add Playwright at the repo root.

**Test 1 — API contract tests (Supertest/Jest)**

- `GET /admin/stats` returns every field the web type requires.
- `GET /admin/locations/rollup-config` returns `rollUpRules.campaignTypes`.
- `GET /admin/donations?campaignId=<id>` returns 200.
- `GET /admin/businesses` returns `totalRaised` for each item.
- `GET /admin/leaderboards/business` returns 200 for an admin token.

**Test 2 — Browser smoke (Playwright)**

1. Log in at `/admin/login`.
2. Visit a curated list of admin routes (all top-level sections + one dynamic detail of each type).
3. Assert:
   - final URL is the requested route,
   - `h1` is not `404`,
   - body does not contain “Something went wrong”,
   - no console errors (allowlist known third-party noise),
   - no API responses ≥ 400 (allowlist optional/peer endpoints).
4. Run against a seeded test DB in CI.

**Test 3 — Link integrity**

- Crawl `App.tsx` routes and assert every admin nav `path` resolves to a route.
- Assert no `<Link>` in admin pages points to an undefined route.

**Acceptance criteria**

- CI fails if the dashboard goes back to zero, roll-up crashes, or a nav link 404s.

---

## 7. Rollout and verification

### Suggested PR breakdown

| PR | Contents | Risk |
| --- | --- | --- |
| PR 1 | ADM-01, ADM-10, ADM-19 (API aggregates + type tightening) | Low |
| PR 2 | ADM-02 (roll-up contract) | Low |
| PR 3 | ADM-03, ADM-04, ADM-13 (navigation + query param + keys) | Low |
| PR 4 | ADM-05 (campaign edit mode) | Medium |
| PR 5 | ADM-06 (admin leaderboard) | Low |
| PR 6 | ADM-07/08/09 (hide or implement unfinished features) | Decision |
| PR 7 | ADM-11, ADM-12, ADM-14, ADM-15, ADM-17, ADM-18 (polish) | Low |
| PR 8 | ADM-16, ADM-20 (health docs + tests) | Low |
| PR 9 | ADM-21 (create-campaign/template mismatch) | Decision |

### Manual verification checklist

- [x] Log in at `/admin/login`; wrong password shows an error; correct password lands on `/admin`.
- [x] Dashboard shows live totals matching `/api/v1/admin/stats`.
- [x] `/admin/rollup-config` renders and saves.
- [x] Business owner row → detail works.
- [x] Campaign detail → Contributions shows existing rows.
- [x] Campaign edit is pre-filled and saves.
- [x] Business owner leaderboard loads.
- [x] No 404s in the network tab for admin routes (unfinished features redirect; season cities endpoint added).
- [x] No unexpected console errors on the core admin pages (wallet noise gone).
- [x] Signed-out `/admin` goes to `/admin/login` without “session expired”, and returns to the requested URL after login.

### Commands

```bash
pnpm --filter @fundordonate/api build
pnpm --filter web build
pnpm --filter web test
pnpm lint
# after adding Playwright:
pnpm test:e2e
```

---

## 8. Decisions taken

1. **Pledges:** keep the card; `totalPledges*` is computed from completed contributions tagged `chargePurpose = PLEDGE`.
2. **Categories/tags:** hidden until a taxonomy model exists.
3. **Target calculation:** hidden until a scoped backend exists.
4. **Spillover:** hidden until a rules backend exists.
5. **Create campaign (ADM-21):** relabelled as template creation and redirected to `/admin/campaigns/templates/new`.
6. **Template-level editing:** campaign edit covers campaign-level fields; template fields remain on Campaign Templates.
7. **Business leaderboard:** platform-wide by default, with optional `scope`/`location` filters.

### Remaining product work

- Build a real direct campaign-create flow if admins should not start from templates.
- Implement the taxonomy, target-calculation, and spillover backends before re-enabling those pages.
- Add Playwright browser smoke coverage on top of the API contract script.

---

## 9. Definition of done

- [x] All P0 and P1 items are either fixed or explicitly hidden with product sign-off.
- [x] The admin contract smoke test (`pnpm test:admin-contracts`) passes locally.
- [ ] Wire the contract smoke test into CI and add Playwright browser coverage.
- [x] No tested admin page logs unexpected console errors or calls a missing endpoint.
- [x] Dashboard, funding, and report totals reconcile with `/admin/stats` and the database.
- [x] The decisions taken are recorded in this document.
