# Consumer FundOrDonate Dashboard — Detailed Staged/Phased Plan

Source spec: **"Consumer FundOrDonate Dashboard — Complete Flow"** — 23 numbered sections, the
complete consumer journey (public → Central Hub → confirmation → dashboard, plus the in-dashboard
loop), and the mobile-first rule. This plan maps **every** part of it to phases and to the
existing codebase. Nothing is omitted — verify with the coverage checklist at the end.

Scope: frontend only, fake data (fake async = `setTimeout`, repo convention). Labels are
**Fund / Donate** only (sponsor eliminated). No API keys or raw errors shown to end users.

---

## 1. Existing code map (everything this plan touches)

| Existing code | Location | Role today | Fate in this plan |
|---|---|---|---|
| **ConsumerLayout** | `components/layout/ConsumerLayout.tsx` | Consumer shell; bottom nav = Home/Donations/Receipts/Profile + 6-item desktop sidebar | **Modified (Phase 1)** → 5-tab nav Home/Explore/Rewards/Activity/You, sidebar removed |
| DashboardOverview | `pages/dashboard/DashboardOverview.tsx` at `/consumer` | Stat cards + quick links | **Rebuilt (Phase 2)** → spec Home |
| DonationHistory, PledgeHistory, BookmarkedCampaigns, ReceiptsPage | `pages/dashboard/*` at `/consumer/{donations,pledges,bookmarks,receipts}` | Legacy tabs | **Folded (Phase 6)** → Activity tabs; old routes become redirects |
| ProfilePage | `pages/dashboard/ProfilePage.tsx` at `/consumer/profile` | Edit profile | **Reused (Phase 8)** → You → Profile |
| **/consumer/campaigns** | `App.tsx:541` → `CampaignsPage audience="consumer"` | Audience campaign browser | **Data/card reuse (Phase 3)**; route **redirects** to `/consumer/explore` |
| **ConsumerHubPage** | `pages/ConsumerHubPage.tsx` at `/uk-hub-activation/consumer` | Public consumer hub entry | **Unchanged — journey anchor (Phases 4, 10)**: hub → campaign → participate → sign-in → dashboard |
| **pages/consumer/** (9 files) | `pages/consumer/` | Public pre-dashboard join journey (see below) | **Unchanged — journey anchors + CTA targets (Phases 4, 8, 10)** |
| — ConsumerBenefitsPage | `/uk-hub-activation/:city/consumer` | City-level consumer benefits | Journey verify (Phase 10); copy patterns reused |
| — ConsumerLocalAreaPage | `.../consumer/local-areas` | Local area list | Geographic pattern reused (Phase 3); journey verify (Phase 10) |
| — ConsumerHighStreetPage | `.../consumer/:localAreaSlug` | High street list | Geographic pattern reused (Phase 3); journey verify (Phase 10) |
| — ConsumerOpportunitiesPage | `.../join/opportunities` | Join opportunities | Participation CTA target (Phase 4) |
| — ConsumerParticipationChoicePage | `.../join/participation` | Backer vs founding choice | Participation CTA target (Phase 4) |
| — ConsumerBackerContributionPage | `.../join/backer` | Backer contribution | "Back This Campaign" path (Phases 4, 5) |
| — ConsumerFoundingMemberChoicePage | `.../join/founding-member-choice` | FM plan choice | "Become a Founding Member" path (Phase 4) |
| — ConsumerFoundingMemberPage | `.../join/founding-member` | One-off FM join | CTA target (Phase 4) + You → Founding Member reuse (Phase 8) |
| — ConsumerFoundingMemberMonthlyPage | `.../join/founding-member-monthly` | Monthly FM join | CTA target (Phase 4) + You → Founding Member reuse (Phase 8) |
| ConsumerCampaignListPage | `pages/hub/ConsumerCampaignListPage.tsx` at `/uk-hub-activation/:city/:area/:street/consumer` | Public per-high-street campaign list | Card/list pattern reused (Phase 3); journey verify (Phase 10) |
| ContributionFlow | `components/consumer/ContributionFlow.tsx` at `/contribute/:slug` | Multi-step contribution w/ "Go to Dashboard" | **Reused + re-targeted (Phase 4)**; confirmation step feeds Phase 5 |
| ContributionConfirmationPage | `components/consumer/ContributionConfirmationPage.tsx` at `/contribution/confirmation` | Success screen w/ View Campaign + Go to Dashboard | **Extended (Phase 5)** → spec §8 fields |
| ThankYouPage | `/thank-you` | Post-payment thanks | **Verified (Phase 5)** — must not dead-end |
| CampaignTrackingPage | `components/consumer/CampaignTrackingPage.tsx` at `/my-activity` | Contributions/bookmarks/rewards tracker | **Parts reused (Phases 6, 7)**; route kept as alias |
| CampaignBrowsePage | `components/consumer/CampaignBrowsePage.tsx` at `/discover` | Public campaign browse w/ filters | Filter/card pattern reused (Phase 3) |
| CampaignDetailPage + CampaignTabs | `pages/CampaignDetailPage.tsx`, `components/campaign/*` | Public detail (story/rewards/leaderboard/updates) | **Sections reused (Phase 4)** for in-dashboard detail |
| central-hub.service + `/auth/central-hub/callback` | `services/central-hub.service.ts`, `App.tsx:348` | Central Hub Solution SSO | **Handoff used (Phases 4, 10)** |
| auth.store | `stores/auth.store.ts` | `getHomeForUser("consumer") → "/consumer"` | Session + sign-out (Phases 1, 9) |
| season.service | `services/season.service.ts` | Current season + participation config | Home season card, Explore header (Phases 2, 3) |
| user-dashboard.service | `services/user-dashboard.service.ts` | `/user/dashboard/stats` | Home impact + My Impact (Phases 2, 6) |
| Rewards data | `data/demoRewards.ts`, `data/templateRewardLibrary.ts`, `simulateRewardEvaluation` | Reward templates/entitlements | Rewards area (Phases 5, 7) |
| Membership types | `packages/types` — tier bronze/silver/gold/platinum; plan standard/pro/pro+ | Membership model | You → Membership (Phase 8) |
| Campaign/location data | `data/demo.ts`, `adminCampaigns.ts`, `ukHubData.ts`, `highStreetData.ts`, `locationRegistry.ts` | Campaigns + UK geography | Explore/detail/recommendations (Phases 2–4) |
| FAQ data | `data/demo.ts` FAQ entries | Help content | Help & Support (Phase 9) |

**Not present yet (built by this plan):** consumer Rewards pages, Notifications, Settings,
Help & Support, Recognition, Membership screen, Founding Member status screen, You menu,
in-dashboard Explore and campaign detail, Home screen per spec.

## 2. Key decisions

- **D1 — Dashboard base route = `/consumer`.** The spec's "route concept: `/dashboard`" is taken
   by the **business** dashboard (`App.tsx:517–527`). All five tabs live under `/consumer/*`,
  matching `auth.store.getHomeForUser("consumer")`.
- **D2 — Legacy tabs folded.** `/consumer/{donations,pledges,bookmarks,receipts,profile}` →
  redirects to Activity/You equivalents. Bookmarks survive only as a campaign-card action
  (not in spec → no nav item).
- **D3 — `/consumer/campaigns` redirects to `/consumer/explore`** (Explore owns browsing);
  `CampaignsPage audience="consumer"` supplies data/card patterns to Phase 3.
- **D4 — In-dashboard campaign detail** at `/consumer/explore/campaign/:slug`, reusing
   `CampaignDetailPage`/`CampaignTabs` sections inside the 5-tab shell.
- **D5 — Consumer location source.** Registration does not capture an address
  (`auth.service.register` = email/username/password/name only), so the demo address
  (London → Camden → Camden High Street) is the consumer's default location. It is stored in
  `localStorage.fod:community`, updated by the Explore "Change location" popup (full street
  selection), and read via `getConsumerCommunity()` — the single swap point when real
  registration data exists. Explore `/consumer/explore` defaults to this location.

## 3. Ground rules (every phase)

1. **Mobile-first**: bottom nav is exactly **Home | Explore | Rewards | Activity | You**; no multi-item
   desktop sidebar; touch targets ≥44px; `safe-area-bottom`; no bottom-bar content overlap.
2. **No invented impact metrics** — only user activity + campaign configuration.
3. **Membership ≠ Backer** — stated explicitly in the Membership screen.
4. Public discovery happens before the dashboard; do not rebuild public pages, only handoffs.
5. Verify after code changes: `npx tsc -p apps/web/tsconfig.json --noEmit` (exit 0), then
   `npm run build --workspace=apps/web`. Never run `npm run lint`.
6. Modal convention `fixed inset-0 z-50 ... bg-black/50 p-4`; lucide-react `^0.468.0`
   (`Ellipsis`, not `MoreHorizontal`); loading via `setTimeout` fake async.

---

# Phase 1 — Shell & mobile-first navigation

**Scope:** Rebuild the consumer shell so the five-area IA exists before any screen is built.
Delivers the persistent bottom nav, desktop compact nav, route skeleton, redirects, and the
shared greeting header.

**Sections covered:** §2 (bottom nav: Home, Explore, Activity, You), mobile-first rule (nav
half), D1–D3.

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer` | Home (Phase 2 placeholder) | kept |
| `/consumer/explore` | Explore (Phase 3 placeholder) | new |
| `/consumer/activity` | Activity (Phase 6 placeholder) | new |
| `/consumer/you` | You (Phase 8 placeholder) | new |
| `/consumer/{donations,pledges,bookmarks,receipts}` | redirect → `/consumer/activity` | changed |
| `/consumer/profile` | redirect → `/consumer/you/profile` | changed |
| `/consumer/campaigns` | redirect → `/consumer/explore` (D3) | changed |
| all of the above | inside `ProtectedRoute requiredUserTypes=["consumer"]` + layout | kept (`App.tsx:539`) |

**Components:**
- New: `components/layout/ConsumerLayout` nav constants reworked; `GreetingHeader`
  (time-of-day + first name — reused Phases 2, 8); placeholder screens for the 4 areas;
  unread-badge hook (stub until Phase 9).
- Existing mapped: **`ConsumerLayout.tsx` → modify**: bottom nav = Home (`Home`, `/consumer`,
  `end`), Explore (`Compass`, `/consumer/explore`), Activity (`Activity`, `/consumer/activity`),
  You (`User`, `/consumer/you`); **delete the 6-item desktop sidebar** (replace with the same 4
  links in a compact desktop rail/top bar); keep `Outlet` + `pb-20` main area. Old nav constants
  (Donations/Receipts/Profile) removed.

**Data needs:** auth store (user name, `userType === "consumer"` for greeting/role label);
nothing else.

**Acceptance checks:**
- [ ] Bottom nav shows exactly Home | Explore | Rewards | Activity | You on mobile; active state + label per tab.
- [ ] Desktop shows the same 5 areas only — no legacy sidebar anywhere.
- [ ] All 5 routes render inside the shell; consumer-only guard still enforced (business/admin redirected).
- [ ] Legacy `/consumer/donations|pledges|bookmarks|receipts|profile|campaigns` URLs redirect correctly.
- [ ] `tsc` exit 0 + build succeeds; bottom bar doesn't overlap last card (padding/safe-area).

---

# Phase 2 — Consumer Home (first screen)

**Scope:** Rebuild `/consumer` from stat-cards into the spec Home: greeting, season, community,
impact, three actions, continue card, recommendations.

**Sections covered:** §1 (consumer opens dashboard / first screen experience), §3 (Home details).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer` | `ConsumerHomePage` (rebuilt DashboardOverview) | rebuilt |

**Components:**
- New: `ConsumerHomePage` sections — `GreetingHeader` (Phase 1), `SeasonCard`,
  `CommunityLocationCard` (city / local area / high street), `ImpactSummary`
  (total supported, campaigns supported, rewards earned), `PrimaryActions`
  (Explore Campaigns → `/consumer/explore`; My Contributions → `/consumer/activity` tab
  Contributions; My Rewards → `/consumer/rewards`), `ContinueCard`
  ("Continue with [Campaign Name]" from `localStorage.lastViewedCampaign`, else generic
  "Continue supporting your community"), `RecommendedCampaigns` (scoped
  High Street → Local Area → City → season, each + **View Campaigns** CTA),
  loading skeleton + empty state.
- Existing mapped: `pages/dashboard/DashboardOverview.tsx` → **rebuilt in place** (keep
  `userDashboardApi` stats load pattern); `GreetingHeader` reused; **ConsumerHubPage /
  pages/consumer/*** not touched (public side).

**Data needs:** `season.service` (current season + participation config);
`user-dashboard.service` stats; profile/location via auth user + `locationRegistry`/
`ukHubData` (demo city/area/street); campaign recommendations from `demo.ts`/`adminCampaigns`
(audience consumer/both) scoped by location; `localStorage.lastViewedCampaign` (written Phase 4);
rewards-earned count from entitlements (fake async). All via `setTimeout`.

**Acceptance checks:**
- [ ] Every §3 element present: greeting, current season, community (city/area/street), impact, three action buttons, continue card, recommendations + View Campaigns.
- [ ] Impact shows only real user-derived values (zeroed for a new user) — no invented metrics.
- [ ] Continue card absent/generic when no last-viewed campaign; correct campaign when present.
- [ ] Recommendations respect location ordering (street → area → city → season) and audience.
- [ ] Loading skeleton and empty/new-user states render; `tsc` + build pass.

---

# Phase 3 — Explore + geographic re-navigation

**Scope:** In-dashboard browse screen with season header, three-level location filtering, and
campaign cards; plus the City → Local Area → High Street drill-down inside the shell.

**Sections covered:** §4 (Explore: City / Local Area / High Street filters + campaign cards),
§5 (geographic re-navigation).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer/explore` | `ConsumerExplorePage` (top-level tab) | new |
| `/consumer/explore/city/:citySlug` | same page, city-scoped | new |
| `/consumer/explore/city/:citySlug/area/:areaSlug` | same page, area-scoped | new |
| `/consumer/explore/city/:citySlug/area/:areaSlug/street/:streetSlug` | same page, street-scoped | new |
| `/consumer/campaigns` | redirect → `/consumer/explore` (D3) | changed |

**Components:**
- New: `ConsumerExplorePage` — season header, compact `LocationBar` (saved city/area/street +
  **Change location** button + search icon — no always-visible filter block), 
  `ChangeLocationModal` popup (search input + cascading City / Local Area / High Street
  selects + **Apply location** / **Use my location**; full-street apply persists the
  consumer's location), `ConsumerCampaignCard` (image, name,
  short description, location, target amount, amount raised, progress bar, end date, status,
  **View Campaign**), empty state ("No campaigns in this area yet" + widen-filter action).
- Existing mapped: **`/consumer/campaigns` → `CampaignsPage audience="consumer"`** — keep file,
  used as pattern/source for tabs + card layout, route redirects (D3);
  `components/consumer/CampaignBrowsePage.tsx` (`/discover`) → filter-bar pattern reused;
  `pages/hub/ConsumerCampaignListPage.tsx` → card-row pattern + street-level list behaviour
  reused; `pages/consumer/ConsumerLocalAreaPage.tsx` + `ConsumerHighStreetPage.tsx` →
  geographic list/breadcrumb patterns reused (public files untouched).

**Data needs:** campaigns from `data/demo.ts` + `data/adminCampaigns.ts`
(audience consumer/both) + `data/highStreetData.ts` demo campaigns; geography from
`ukHubData.ts`, `highStreetData.ts`, `locationRegistry.ts`; season header from `season.service`;
fake async `setTimeout` per filter change.

**Acceptance checks:**
- [ ] Default scope = the consumer's saved location (single compact location row, no filter
  block); Change location button and search icon open the popup; cascading city → area →
  street selection applies and persists (§5 re-navigation via popup + Back at every depth).
- [ ] Cards show every §4 field: image, name, short description, location, target, raised, progress, end date, status, View Campaign.
- [ ] Empty-area state offered; season header present; audience filtered to consumer/both (Fund/Donate labels only).
- [ ] `/consumer/campaigns` redirects; `tsc` + build pass.

---

# Phase 4 — In-dashboard Campaign Details + participation

**Scope:** Full campaign detail inside the shell with conditional sections, the two
participation CTAs wired to existing flows through Central Hub sign-in, and the
last-viewed-campaign persistence that feeds Home's Continue card.

**Sections covered:** §6 (Campaign Details: image, about, progress, timeline, rewards,
leaderboard, updates), §7 (participation CTA: Back This Campaign / Become a Founding Member →
sign in/register → Central Hub Solution → contribution), journey leg 1
(public/hub → participate → sign-in), feeds §3 continue card.

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer/explore/campaign/:slug` | `ConsumerCampaignDetailPage` | new |
| `/contribute/:slug` | `ContributionFlow` (existing) | kept, re-targeted |
| `/uk-hub-activation/:city/:area/:street/join/*` | `pages/consumer/*` join flows | kept, re-targeted |
| `/auth/central-hub/callback` | Central Hub SSO callback | kept |

**Components:**
- New: `ConsumerCampaignDetailPage` — hero (image, name, status, season, city, local area,
  high street), `AboutSection` (description, purpose, what it supports, community impact),
  `ProgressSection` (raised / target / % bar), `TimelineSection` (start, end, time remaining),
  `RewardsSection` (only if campaign configured — "Rewards available for qualifying
  contributions"), `LeaderboardSection` (only if configured), `UpdatesSection`, sticky CTA
  (**Back This Campaign** or **Become a Founding Member** per campaign configuration);
  writes `localStorage.lastViewedCampaign` on mount.
- Existing mapped: `CampaignDetailPage` + `CampaignTabs` → section components reused/extracted;
  **`ContributionFlow`** (`/contribute/:slug`) → "Back This Campaign" target, its dashboard
  callback re-pointed to `/consumer` (D1); **`pages/consumer/ConsumerParticipationChoicePage`**
  + **`ConsumerOpportunitiesPage`** → alternative join entry (from-hub path);
  **`ConsumerBackerContributionPage`** → backer contribution leg; **`ConsumerFoundingMemberChoicePage` → `ConsumerFoundingMemberPage` / `ConsumerFoundingMemberMonthlyPage`** → "Become a
  Founding Member" target; **`ConsumerHubPage`** (`/uk-hub-activation/consumer`) → documented
  entry anchor for the public leg (unchanged).

**Data needs:** campaign detail (demo/admin campaign store + `campaignTemplateStore` config:
rewards enabled, leaderboard enabled, updates, mode fund/donation); rewards config from
`templateRewardLibrary`/`demoRewards`; entitlement check via `simulateRewardEvaluation`;
auth/`ProtectedRoute` + `central-hub.service` for sign-in; `localStorage` write.

**Acceptance checks:**
- [ ] Every §6 section renders, conditional sections hidden when not configured.
- [ ] Timeline shows time remaining; progress shows raised/target/percentage correctly.
- [ ] "Back This Campaign" → ContributionFlow; "Become a Founding Member" → FM choice/join; both gated by ProtectedRoute → Central Hub sign-in/register → return to campaign/dashboard (no stranding).
- [ ] Last-viewed campaign persisted (Home Continue card updates after visiting).
- [ ] Back button/breadcrumb returns to Explore with filters intact; `tsc` + build pass.

---

# Phase 5 — Contribution confirmation

**Scope:** Guarantee the post-contribution screen matches the spec exactly and always offers
both exit CTAs, on every contribution path.

**Sections covered:** §8 (Contribution Successful: campaign, amount, date, reference,
contribution status, reward eligibility; CTAs **View Campaign** + **Go to Dashboard**),
journey leg 2 (contribution → confirmation → dashboard).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/contribution/confirmation` | `ContributionConfirmationPage` (extended) | extended |
| `/thank-you` | `ThankYouPage` (verified) | verified |
| success step inside `/contribute/:slug` | `ContributionFlow` success (verified) | verified |

**Components:**
- New: none major — `ReferenceRow`, `RewardEligibilityRow` subcomponents inside confirmation.
- Existing mapped: **`components/consumer/ContributionConfirmationPage.tsx` → extend** with
  reference, contribution status, reward eligibility (it already has "Contribution Successful",
  View Campaign + Go to Dashboard); **`ContributionFlow` success step** → same fields; both CTAs
  re-targeted: View Campaign → `/consumer/explore/campaign/:slug`, Go to Dashboard →
  `/consumer`; **`ThankYouPage`** → ensure it also offers both CTAs or links to confirmation
  (no dead end).

**Data needs:** contribution record from fake async store (amount, date, generated reference,
status); reward eligibility via `simulateRewardEvaluation`; campaign name/slug for CTAs.

**Acceptance checks:**
- [x] Screen shows Contribution Successful + all §8 fields (campaign, amount, date, reference, status, reward eligibility).
- [x] View Campaign → in-dashboard detail; Go to Dashboard → `/consumer` — both from every contribution path (flow success, confirmation route, thank-you).
- [x] No path leaves the user stranded (every post-payment screen has ≥1 clear exit).
- [x] Loading/error states user-friendly, no raw errors; `tsc` + build pass.

---

# Phase 6 — Activity (Contributions, My Campaigns, My Impact)

**Scope:** The full Activity area with three tabs, contribution detail, and impact summary,
absorbing the legacy history pages.

**Sections covered:** §9 (Activity tabs Contributions | Campaigns | Impact), §10 (Contribution
Details), §11 (My Campaigns: Active / Completed), §12 (My Impact metrics).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer/activity` | `ConsumerActivityPage` (tabs) | new |
| `/consumer/activity?tab=contributions|campaigns|impact` | tab deep-link (Home actions) | new |
| `/consumer/activity/contributions/:id` | `ContributionDetailPage` | new |
| `/consumer/donations`, `/consumer/pledges` | redirect → `/consumer/activity?tab=contributions` | changed |
| `/consumer/receipts` | redirect → `/consumer/activity?tab=contributions` | changed |
| `/consumer/bookmarks` | redirect → `/consumer/explore` (D2) | changed |
| `/my-activity` | kept as alias → `/consumer/activity` | changed |

**Components:**
- New: `ConsumerActivityPage` (segmented tabs Contributions/Campaigns/Impact),
  `ContributionRow` (campaign, amount, status, date),
  `ContributionDetailPage` (campaign, amount, date, status, reference, payment status, reward
  status, **View Reward** → `/consumer/rewards/:id`),
  `MyCampaignsSection` (**Active** / **Completed** groups; cards: campaign, location, amount
  contributed, status, progress, View Campaign),
  `MyImpactSection` — **only**: Campaigns Supported, Total Contributions, Communities
  Supported, High Streets Supported (+ campaign-configured metrics if any).
- Existing mapped: **`pages/dashboard/DonationHistory.tsx` + `PledgeHistory.tsx` → folded**
  (contribution rows/detail; files removed after redirect verified);
  **`BookmarkedCampaigns.tsx` → folded/removed** (bookmarks remain a card-heart action only);
  **`ReceiptsPage.tsx` → folded** (receipt detail reachable from contribution detail);
  `components/consumer/CampaignTrackingPage.tsx` (`/my-activity`) → contributions/rewards
  data patterns reused, route aliased.

**Data needs:** contribution history (fake async store + legacy history data sources);
campaign progress for My Campaigns cards (`demo.ts`/`adminCampaigns`); impact aggregation from
contributions + profile location (communities/high streets actually supported);
`simulateRewardEvaluation` for reward-status field. **No invented metrics (§12).**

**Acceptance checks:**
- [x] All three tabs present and deep-linkable; Home's "My Contributions" lands on Contributions.
- [x] Contribution detail shows every §10 field incl. reference, payment status, reward status, working View Reward.
- [x] My Campaigns split Active/Completed; cards show all §11 fields.
- [x] My Impact shows exactly the approved metrics, computed from real fake data; zero state for new users.
- [x] Legacy routes redirect; no broken links to removed pages; `tsc` + build pass.

---

# Phase 7 — Rewards

**Scope:** Consumer rewards area (lists + detail + claim/open), reachable from You, Home, and
Activity.

**Sections covered:** §13 (Rewards: Available / Earned / Redeemed), §14 (Reward Details with
Claim/Open).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer/rewards` | `ConsumerRewardsPage` (tabs) | new |
| `/consumer/rewards/:id` | `RewardDetailPage` | new |

**Components:**
- New: `ConsumerRewardsPage` (segmented Available | Earned | Redeemed), `RewardCard` (name,
  campaign, qualification condition, status, expiry, **View Reward**), `RewardDetailPage`
  (name, campaign, how earned, date earned, status, expiry date; actions **Claim Reward** /
  **Open Reward** / configuration-provided instructions or external link),
  empty states per tab.
- Existing mapped: `components/consumer/CampaignTrackingPage.tsx` → rewards-tab patterns
  reused; admin `RewardTemplatesPage`/`RewardLibraryPage` → read-only config reference
  (templates define claim/open behaviour; admin files untouched); no consumer reward screen
  exists today — this phase creates it.

**Data needs:** `data/demoRewards.ts` (consumer rewards) + consumer entries in
`data/templateRewardLibrary.ts`; entitlements derived from contribution history via
`simulateRewardEvaluation`; claim/open state via fake async store (`setTimeout`).

**Acceptance checks:**
- [x] All three tabs present with correct membership (Available/Earned/Redeemed); card fields per §13.
- [x] Detail shows every §14 field (incl. how earned + expiry); Claim/Open actions behave per configuration (fake async, success state).
- [x] Reachable from Home "My Rewards", You menu, and contribution detail "View Reward".
- [x] Empty states per tab; `tsc` + build pass.

---

# Phase 8 — You area: menu, Profile, Membership, Founding Member, Recognition

**Scope:** The You tab with its exact menu, plus five sub-screens (Profile reused; the rest new).

**Sections covered:** §15 (You menu: Profile, Membership, Founding Member, Rewards,
Recognition, Notifications, Settings, Help & Support, Sign Out), §16 (Profile), §17 (Membership
— tiers/plans, ≠ Backer), §18 (Founding Member), §19 (Recognition).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer/you` | `ConsumerYouPage` (header + menu) | new |
| `/consumer/you/profile` | Profile (ProfilePage reused) | moved (old `/consumer/profile` redirects) |
| `/consumer/you/membership` | `ConsumerMembershipPage` | new |
| `/consumer/you/founding-member` | `ConsumerFoundingMemberStatusPage` | new |
| `/consumer/you/rewards` | redirect → `/consumer/rewards` | new |
| `/consumer/you/recognition` | `ConsumerRecognitionPage` | new |

**Components:**
- New: `ConsumerYouPage` — header (photo, name, "Consumer", current season, UK Hub) + mobile
  list menu **exactly**: Profile, Membership, Founding Member, Rewards, Recognition,
  Notifications, Settings, Help & Support, Sign Out (chevrons; unread badge on Notifications;
  Sign Out handler wired in Phase 9);
  `ConsumerMembershipPage` — tier (Bronze/Silver/Gold/Platinum), plan (Standard/Pro/Pro+),
  status, start/end dates, explanation copy incl. explicit **"Membership is not the same as
  being a Backer"**;
  `ConsumerFoundingMemberStatusPage` — active: type (Founding Member / Founding Member
  Monthly), associated campaign/hub, start date, status; inactive: **"Become a Founding
  Member"** CTA; `ConsumerRecognitionPage` — recognitions list (e.g. Community Supporter,
  Campaign Supporter, Founding Member) with earned date/context, explicitly separate from
  contribution history.
- Existing mapped: **`pages/dashboard/ProfilePage.tsx` → reused** at new path (view/edit name,
  email, phone, location, photo; Central Hub identity note); **`pages/consumer/ConsumerFoundingMemberPage.tsx` + `ConsumerFoundingMemberMonthlyPage.tsx` + `ConsumerFoundingMemberChoicePage.tsx`** → CTA targets when inactive + shared form/data patterns; `season.service` →
  header season; membership types from `packages/types`.

**Data needs:** auth user profile (edit via fake async); membership record (fake async demo
membership using tier/plan types); founding-member record (same data source as join pages);
recognitions (new small fake dataset, `setTimeout`); current season + hub from `season.service`
+ `ukHubData`.

**Acceptance checks:**
- [x] Menu matches §15 list exactly and in order; every entry resolves (Notifications/Settings/Help supplied by Phase 9 — placeholder then).
- [x] Profile shows/edits all §16 fields; path moved with redirect from old `/consumer/profile`.
- [x] Membership shows tier, plan, status, dates + the §17 "≠ Backer" statement.
- [x] Founding Member handles both states (active details / join CTA → existing join pages).
- [x] Recognition is its own list, not a copy of contributions (§19).
- [x] `tsc` + build pass.

---

# Phase 9 — Notifications, Settings, Help & Support, Sign Out

**Scope:** Complete the You menu with the final four entries.

**Sections covered:** §20 (Notifications), §21 (Settings: Account, Notifications, Privacy,
Communication Preferences, Security), §22 (Help & Support), §23 (Sign Out).

**Routes:**
| Route | Element | Status |
|---|---|---|
| `/consumer/you/notifications` | `ConsumerNotificationsPage` | new |
| `/consumer/you/settings` | `ConsumerSettingsPage` | new |
| `/consumer/you/help` | `ConsumerHelpPage` | new |
| sign-out action | auth store logout → public home | new |

**Components:**
- New: `ConsumerNotificationsPage` — categories: campaign updates, contribution confirmations,
  reward notifications, founding-member updates, season updates, community updates;
  read/unread state; feeds the Phase 1 badge hook;
  `ConsumerSettingsPage` — sections Account, Notifications (toggles), Privacy, Communication
  Preferences, Security (Central Hub linked state / local password action);
  `ConsumerHelpPage` — FAQ categories: general, campaigns, contributions/payments, rewards,
  account + **Contact Support** action (fake async submit + success state, never raw errors);
  Sign Out menu action → confirm dialog (optional) → logout → public home.
- Existing mapped: `auth.store` logout + redirect (existing `logout`); FAQ content from
  `data/demo.ts` FAQ entries; `central-hub.service` status for the Security section; no prior
  notifications/settings/help consumer screens exist — created here.

**Data needs:** fake notifications dataset (`setTimeout`, unread flags persisted in
`localStorage`); settings preferences (`localStorage`); FAQ from demo data; Central Hub link
status via `central-hub.service`; auth logout.

**Acceptance checks:**
- [x] Notifications list shows all §20 categories with read/unread; badge clears when read.
- [x] Settings contains all five §21 sections with working toggles/preferences.
- [x] Help & Support has the FAQ categories + contact action with success state; no raw errors.
- [x] Sign Out clears session, redirects to public home, and protected `/consumer/*` routes then bounce to sign-in.
- [x] `tsc` + build pass.

---

# Phase 10 — Journey QA, states, polish

**Scope:** Verify both complete-journey diagrams end to end, unify empty/loading/error states,
and run mobile-first polish + final cleanup.

**Sections covered:** complete consumer journey (both diagrams), mobile-first rule
(cross-cutting QA), plus release gate for Phases 1–9.

**Routes:** none new — verification across all existing routes.

**Components:** none new — fixes only. QA targets: `ConsumerLayout` (nav), all Phase 2–9
screens, public anchors (`ConsumerHubPage`, `pages/consumer/*`, `ConsumerCampaignListPage`,
hub pages), `ContributionFlow`, `ContributionConfirmationPage`, `ThankYouPage`,
`/auth/central-hub/callback`.

**Data needs:** none new.

**Acceptance checks:**
- [ ] **Journey leg A (public → dashboard):** UK Hub → City → Local Area → High Street → Consumer → Campaign → participate → sign in/register (Central Hub) → contribution → confirmation → dashboard Home — every arrow verified, redirects land on `/consumer`, return-to-campaign works.
- [ ] **Journey leg B (in-dashboard loop):** Home → Explore → campaign → Back This Campaign / Become a Founding Member → confirmation → dashboard; Home → Activity → contribution detail → View Reward; Home → My Rewards; You → Profile/Membership/Founding Member/Rewards/Recognition/Notifications/Settings/Help/Sign Out — all verified.
- [ ] Empty/loading/error states on every screen (fake async loading, friendly messages, no API internals).
- [ ] Mobile-first pass: bottom nav never overlaps content, safe-area correct, touch targets ≥44px, long names truncate cleanly, focus states visible, reduced-motion respected.
- [ ] `grep -i sponsor` over `apps/web/src` → 0 matches; Fund/Donate labels only; legacy redirects verified; dead files removed.
- [ ] Final `npx tsc` exit 0 + `npm run build --workspace=apps/web` succeeds.

---

## Coverage checklist (spec → phase) — nothing omitted

| # | Spec section | Phase |
|---|---|---|
| 1 | Consumer opens dashboard / first screen | 2 |
| 2 | Bottom nav: Home, Explore, Activity, You | 1 |
| 3 | Home details (greeting, season, location, impact, 3 actions, continue card, recommendations) | 2 |
| 4 | Explore (season header, City/Local Area/High Street filters, campaign cards) | 3 |
| 5 | Geographic re-navigation (City → Area → High Street) | 3 |
| 6 | Campaign Details (image, about, progress, timeline, rewards, leaderboard, updates) | 4 |
| 7 | Participation CTA (Back This Campaign / Become a Founding Member → Central Hub) | 4 |
| 8 | Contribution Confirmation (all fields + View Campaign / Go to Dashboard) | 5 |
| 9 | Activity tabs: Contributions, Campaigns, Impact | 6 |
| 10 | Contribution Details (reference, payment status, reward status, View Reward) | 6 |
| 11 | My Campaigns (Active / Completed) | 6 |
| 12 | My Impact (approved metrics only) | 6 |
| 13 | Rewards: Available / Earned / Redeemed | 7 |
| 14 | Reward Details (Claim / Open) | 7 |
| 15 | You menu (Profile, Membership, Founding Member, Rewards, Recognition, Notifications, Settings, Help & Support, Sign Out) | 8 (+7, 9) |
| 16 | Profile | 8 |
| 17 | Membership (tiers/plans; ≠ Backer) | 8 |
| 18 | Founding Member (active state / join CTA) | 8 |
| 19 | Recognition | 8 |
| 20 | Notifications | 9 |
| 21 | Settings (Account, Notifications, Privacy, Communication Preferences, Security) | 9 |
| 22 | Help & Support (FAQ categories + contact) | 9 |
| 23 | Sign Out | 9 |
| — | Complete journey: public → Central Hub → confirmation → dashboard | 4, 5, 10 |
| — | Complete journey: in-dashboard loop | 10 |
| — | Mobile-first rule (5-tab bottom nav, no big sidebar) | 1, 10 |

## Execution order & dependencies

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10, strictly. Phase 2 depends on Phase 1 nav; Phase 4
depends on 3 (entry) and feeds 2 (continue card) + 5 (confirmation); Phases 6/7/8/9 depend on 1
and on contribution data existing from 4–5; Phase 10 gates release. After each phase: `tsc`
exit 0 + web build.

## Out of scope

Backend/API integration (frontend + fake data only); business dashboard `/dashboard/*`; admin;
public-site redesign (shipped earlier); sponsor (eliminated); invented analytics/impact metrics.
