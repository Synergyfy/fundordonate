# FundOrDonate — Admin Dashboard Implementation Roadmap

> 30 admin areas organized into **8 implementation batches**.
> Each batch is self-contained and delivers visible value before the next batch starts.

---

## Existing vs. New — Status Map

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | Dashboard & Command Centre | ⚠️ Exists (basic) | Needs KPIs, alerts, charts |
| 2 | Campaign Management | ⚠️ Exists (wizard + list) | Needs template duplication, audit trail, assign location/manager |
| 3 | Campaign Categories & Taxonomy | ⚠️ Exists (basic) | Needs subcategories, display order, featured |
| 4 | UK Hub Management | ⚠️ Exists (partial) | Hub Content page exists; National Hub admin needs expansion |
| 5 | Locations & Geographic Hierarchy | ⚠️ Exists (basic) | Needs parent-child UI, coordinates, boundary, population |
| 6 | City Activation Management | ❌ Not built | Needs activation lifecycle, governance (calculated→proposed→approved) |
| 7 | Interactive UK Map Management | ⚠️ Exists (frontend only) | Needs admin add/edit markers, zoom config, analytics |
| 8 | Founding Member Management | ⚠️ Exists (basic) | Needs programme config, member list, benefits, badges |
| 9 | Backer Status & Recognition | ❌ Not built | Badge config, eligibility, recognition surfaces |
| 10 | Users & Accounts | ⚠️ Exists (basic) | Needs detail pages, activity, badges, audit |
| 11 | Businesses | ❌ Not built | Dedicated business management section |
| 12 | Consumers | ❌ Not built | Dedicated consumer management section |
| 13 | Fundraisers & Collaborators | ❌ Not built | Campaign team management |
| 14 | Membership & Access | ❌ Not built | Standard/Pro/Pro+ configuration |
| 15 | Fund/Donate Contributions | ⚠️ Exists (basic) | Needs contribution types, receipts, audit |
| 16 | Payments & Financial | ❌ Not built | Payment dashboard, transactions, refunds |
| 17 | Wallet & MCOM Financial | ❌ Not built | Wallet accounts, transfers, credits |
| 18 | Rewards & Products | ❌ Not built | Business offers, market-test, MCOM Mall |
| 19 | MCOM Integration Centre | ❌ Not built | Connection status, API health, sync |
| 20 | Events & Community | ❌ Not built | Event management, community activity |
| 21 | Announcements & Content | ⚠️ Exists (partial) | Hub Content has hero/announcements; needs expansion |
| 22 | Notifications | ❌ Not built | Email/in-app templates, triggers |
| 23 | Analytics & Reporting | ❌ Not built | Platform, campaign, hub, business analytics |
| 24 | Approvals & Moderation | ❌ Not built | Approval queues with workflow states |
| 25 | Business Audit & Opportunity | ❌ Not built | Excess stock, spare capacity, offers |
| 26 | API, Integrations & Data | ❌ Not built | API status, logs, webhooks |
| 27 | Demo & Seed Data | ❌ Not built | Demo management tools |
| 28 | Roles & Permissions | ❌ Not built | RBAC surfaced in admin UI |
| 29 | System Configuration | ⚠️ Exists (basic) | Needs currency, campaign rules, activation thresholds |
| 30 | Security, Audit Logs & Health | ❌ Not built | Audit trail, system health |

---

## Implementation Batches

### Batch 1 — Foundation & Navigation (COMPLETED ✅)
> What we've already done in this session.

- [x] Admin sidebar restructured with grouped sections
- [x] UK Hub admin pages wired into nav
- [x] Demo login redirect fixed
- [x] Campaign wizard (9-step, create/edit)
- [x] Campaign list enhanced (featured/hidden/location/season badges)
- [x] Admin API extensions (create/update/delete campaign)
- [x] Split contribution explainer on landing pages
- [x] Admin sitemap document

### Batch 2 — Core Admin Pages (Build Next)
> Fill the biggest gaps: the pages that are flagged in the sidebar but don't exist yet.

| Page | Route | Purpose |
|------|-------|---------|
| Reports & Analytics | `/admin/reports` | Platform KPIs, charts, export |
| Backer Management | `/admin/backers` | Backer list, tiers, funnel codes, badges |
| Business Management | `/admin/businesses` | Business profiles, verification, participation |
| Consumer Management | `/admin/consumers` | Consumer profiles, founding status, activity |
| Events Management | `/admin/events` | Create/edit events for national/city hubs |

**Estimated: 5 new pages + sidebar nav updates.**

### Batch 3 — UK Hub Deep Dive
> Flesh out the UK Hub admin that already has skeleton pages.

| Page | Route | Purpose |
|------|-------|---------|
| City Activation Dashboard | `/admin/activation` | Lifecycle management, governance workflow |
| Founding Programmes (enhanced) | `/admin/founding` | Programme config, member lists, benefits |
| Map Management | `/admin/map` | Add/edit markers, zoom, boundaries, analytics |
| National Hub Content (enhanced) | `/admin/hub-content` | Hero, announcements, featured, events |
| Location Detail (enhanced) | `/admin/hub-locations/:id` | Activation tab, funding tab, resources tab |

**Estimated: 5 pages (3 new, 2 enhanced).**

### Batch 4 — Financial & Contributions
> The money layer.

| Page | Route | Purpose |
|------|-------|---------|
| Payment Dashboard | `/admin/payments` | Processed, pending, failed, refunded |
| Transaction Management | `/admin/transactions` | Search, inspect, refund, webhooks |
| Contribution Management | `/admin/contributions` | All contributions with types, receipts |
| Wallet Management | `/admin/wallet` | Wallet accounts, balances, transfers |
| Rewards & Offers | `/admin/rewards` | Business offers, market-test, MCOM eligibility |

**Estimated: 5 new pages.**

### Batch 5 — People & Membership
> Complete the people management layer.

| Page | Route | Purpose |
|------|-------|---------|
| Fundraiser Management | `/admin/fundraisers` | Campaign teams, permissions |
| Collaborator Management | `/admin/collaborators` | Campaign collaborators |
| Membership & Access | `/admin/membership` | Standard/Pro/Pro+ config, pricing, benefits |
| User Detail (enhanced) | `/admin/users/:id` | Full profile, activity, badges, audit |

**Estimated: 4 pages (3 new, 1 enhanced).**

### Batch 6 — Community & Content
> The community layer.

| Page | Route | Purpose |
|------|-------|---------|
| Announcements | `/admin/announcements` | National/city/campaign announcements |
| Notifications | `/admin/notifications` | Email/in-app templates, triggers |
| Community Activity | `/admin/community` | Posts, highlights, moderation |
| Content Management | `/admin/content` | Hero sections, CTAs, display order |

**Estimated: 4 new pages.**

### Batch 7 — Approvals & Moderation
> The governance layer.

| Page | Route | Purpose |
|------|-------|---------|
| Approval Centre | `/admin/approvals` | Queues for campaigns, businesses, locations, etc. |
| Moderation Centre | `/admin/moderation` | Content, comments, community moderation |
| Business Opportunities | `/admin/opportunities` | Audit, excess stock, capacity, offers workflow |

**Estimated: 3 new pages.**

### Batch 8 — System & Operations
> The infrastructure layer.

| Page | Route | Purpose |
|------|-------|---------|
| Admin Users & Roles | `/admin/admin-users` | Admin accounts, RBAC |
| Roles & Permissions | `/admin/roles` | Permission matrix |
| System Configuration | `/admin/config` | Currency, rules, thresholds, statuses |
| API & Integrations | `/admin/integrations` | API health, webhooks, MCOM status |
| Audit Logs | `/admin/audit` | Who did what, when, previous/new values |
| System Health | `/admin/health` | API, database, jobs, errors |
| Demo Data Management | `/admin/demo` | Seed data, demo campaigns, demo users |

**Estimated: 7 new pages.**

---

## Final Sidebar Structure (Target State)

```text
OVERVIEW
  Dashboard

FUNDORDONATE
  Campaigns
  Contributions
  Payments
  Rewards & Offers

UK HUB NETWORK
  National Hub
  City Hubs
  Locations
  City Activation
  UK Map

PEOPLE
  Users
  Businesses
  Consumers
  Fundraisers
  Founding Members
  Backers

COMMUNITY
  Events
  Announcements
  Community Activity
  Notifications

ECOSYSTEM
  Membership & Access
  MCOM Integrations
  Wallet & Finance
  Business Opportunities

MANAGEMENT
  Approvals
  Analytics & Reports
  Content Management
  Demo Data

SYSTEM
  Admin Users
  Roles & Permissions
  Configuration
  API & Integrations
  Audit Logs
  System Health
```

---

## Build Priority (Recommended)

**Batch 2 is the immediate next step** — it fills the biggest gaps (Reports, Backers, Businesses, Consumers, Events) that are already flagged in the sidebar but return 404 when clicked.

After Batch 2, the order depends on business priorities:
- If **UK Hub activation** is the priority → Batch 3
- If **money/financial** is the priority → Batch 4
- If **people management** is the priority → Batch 5

---

## Mobile-First Rules (Apply to Every Batch)

1. Sidebar collapses to hamburger drawer on `< lg`
2. Tables collapse to stacked cards on `< md`
3. Primary actions pinned to bottom action bar on mobile
4. Detail pages have back button in top header
5. Forms use full-width inputs on mobile
6. Modals become full-screen sheets on mobile
7. Filters collapse into a single dropdown on mobile
