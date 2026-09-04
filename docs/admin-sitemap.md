# FundorDonate — Admin Dashboard Sitemap

> **Source of truth** for admin pages, tabs and buttons. Mobile-first: every page
> has a compact top header with a back button (where relevant), a bottom-of-screen
> action bar where needed, and cards that stack on small screens (tables collapse
> to stacked rows). Built one page at a time from this map.

---

## 1. Sidebar Navigation (all roles render the same shell)

The `AuthenticatedLayout` shell already exists. The **Admin** nav must be
grouped into sections so admins can reach every page:

### Admin nav groups
| Group | Label | Path | Status |
|---|---|---|---|
| **Overview** | Dashboard | `/admin` | ✅ built |
| **Commerce** | Campaigns | `/admin/campaigns` | ✅ built |
| | Donations | `/admin/donations` | ✅ built |
| | Pledges | `/admin/pledges` | ✅ built |
| **People** | Users | `/admin/users` | ✅ built |
| **Content** | Categories & Tags | `/admin/categories` | ✅ built |
| | Hub Content | `/admin/hub-content` | ⚠️ built, **missing from nav** |
| **UK Hub** | Hub Locations | `/admin/hub-locations` | ⚠️ built, **missing from nav** |
| | Founding Programmes | `/admin/founding` | ⚠️ built, **missing from nav** |
| **System** | Reports / Analytics | `/admin/reports` | ❌ **not built** |
| | Backer Management | `/admin/backers` | ❌ **not built** |
| | Settings | `/admin/settings` | ✅ built |

> The three ⚠️ pages exist at their routes but are **unreachable from the sidebar** —
> this is the first nav fix.

---

## 2. Page-by-page map

### 2.1 Dashboard — `/admin`  ✅
- **Tabs**: none (single landing).
- **Sections / buttons**:
  - KPI cards: Campaigns, Donations, Pledges, Users (tappable → each route).
  - Recent Contributions list.
  - Top Campaigns list.
  - **Quick Actions**: Manage Campaigns, View Donations, Manage Users,
    Categories & Tags, Settings → **add** Hub Locations, Founding Programmes,
    Hub Content, Reports, Backers.

### 2.2 Campaigns — `/admin/campaigns`  ✅ refine
- **Toolbar buttons**: New Campaign, Filter (status: all / active / ended / draft),
  Sort.
- **List/table**: thumbnail, title, mode (Fund/Donate/Sponsor), goal/raised, status,
  date; tap → **details drawer** with actions: Edit, Approve/Reject, Archive,
  View public page.
- **Mobile**: list becomes stacked cards; primary action "Approve" on the card.

### 2.3 Donations — `/admin/donations`  ✅
- **Filter tabs**: All / Completed / Pending / Failed (+ search).
- **Table** + tap row → donation details (donor, campaign, amount, gateway, ref).

### 2.4 Pledges — `/admin/pledges`  ✅
- Same pattern as Donations: All / Pending / Confirmed / Collected; details drawer.

### 2.5 Users — `/admin/users`  ✅
- **Role tabs**: All / Admin / Fundraiser / Donor / Backer / Collaborator.
- **Table** + row → detail panel with actions: Edit, Deactivate, Reset, Verify.

### 2.6 Categories & Tags — `/admin/categories`  ✅
- **Tabs**: Categories / Tags.
- **Buttons**: Add Category, Add Tag; row actions; reorder.

### 2.7 Settings — `/admin/settings`  ✅
- **Tabs**: General, Payment, Email, Campaign, Security, Advanced.
- Each tab = form + **Save Changes** (bottom action bar on mobile).

### 2.8 UK Hub Locations — `/admin/hub-locations`  ⚠️ built, wire into nav
- **Toolbar**: Add Location, Search, Filter by type (City/Borough/District) + status.
- **List**: name, type, status, activation %, funding progress; tap → detail page.
- New location button opens `/admin/hub-locations/new`.

### 2.9 UK Hub Location Detail — `/admin/hub-locations/:id`  ⚠️ built
- **Tabs**: Details / Activation / Funding / Campaigns.
  - Details: metadata, trigger rule, unlock rule, parent (borough→city).
  - Activation: target %, threshold, status lifecycle.
  - Funding: funding target/raised, business + consumer founding allocation.
  - Campaigns: campaigns attached to this location.
- **Buttons**: Save, Archive, View live hub (`/uk-hub-activation/:slug`).

### 2.10 Founding Programmes — `/admin/founding`  ⚠️ built
- **List** of founding programmes (business + consumer) with allocation and
  remaining spots; **+ New Programme**; row → edit/programme detail.
- **Tabs**: Business / Consumer / All.

### 2.11 National Hub Content — `/admin/hub-content`  ⚠️ built
- **Tabs**: Hero / Announcements / Featured.
- Each tab editable; Save.

### 2.12 Reports / Analytics — `/admin/reports`  ❌ **new**
- **Tabs** (cards): Overview, Funding, Contributions, Backers, Hubs.
- **Buttons/actions**: Date range selector, Export CSV, print.

### 2.13 Backer Management — `/admin/backers`  ❌ **new**
- **Tabs**: All / City Hub / National / Redemption codes.
- **Buttons**: Issue funnel code, Link backer, View backer record, Export.
- Lists backers, their status tier, badges, and codes issued.

---

## 3. Cross-cutting mobile-first rules
- Sidebar collapses to a hamburger drawer (`lg:hidden`) — already in shell ✅.
- Tables collapse to stacked cards on `< md` (already partially present via
  `hidden sm:table-cell`).
- Primary actions pinned to a bottom action bar on mobile.
- All detail pages have a back button in the top header.
- Buttons are full-width on mobile, inline on desktop.

---

## 4. Build order (one by one)
1. **Nav wiring** (get the ⚠️ pages reachable) ← next
2. Refine Settings + Users role tabs if needed
3. **Reports / Analytics** (new)
4. **Backer Management** (new)
5. Refine UK Hub location detail with Funding tab
