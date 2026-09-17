# Admin Campaign Wizard Redesign — Implementation Plan

## Overview

Replace the three fragmented campaign builders (AdminCampaignWizard 9-step, CampaignCreatePage 6-step, CampaignBuilder 5-step) with a single unified 11-step admin wizard + full campaign management pages. Location-first model, guided wizard with persistent progress, save-draft, validation, and review.

---

## Current State

| File | Lines | Steps | Status |
|------|-------|-------|--------|
| `AdminCampaignWizard.tsx` | 913 | 9 (inline) | Used for editing only |
| `CampaignCreatePage.tsx` | ~600 | 6 (demo data) | Used for creation only |
| `CampaignBuilder.tsx` | 309 | 5 (public) | Public builder, keep separate |

**Key gaps:**
- No backend location API routes (HubLocation model exists, no routes exposed)
- No step completion indicators or clickable step navigation
- No auto-save/draft persistence
- Three separate `CampaignFormData` interfaces
- No participant-facing preview in admin wizard
- No validation checklist before publish

---

## Target Architecture

### Wizard Steps (11 top-level)

| # | Step | Description |
|---|------|-------------|
| 1 | Campaign Scope | City / National / Independent + city selection |
| 2 | Location Coverage | City > Local Areas > High Streets tree selector |
| 3 | Campaign Details | Name, code, description, category, season, images, video |
| 4 | Audience | Business / Consumer / Both |
| 5 | Participation | Back Campaign, Founding Member, Founding Monthly toggles |
| 6 | Funding | Target, min/max, suggested amounts, custom toggle |
| 7 | Campaign Period | Start/end dates, schedule publication |
| 8 | Campaign Rules | Contribution limits, capacity, multiple contributions |
| 9 | Rewards | Has rewards? → reward list → Add Reward opens internal sub-step editor |
| 10 | Preview | Participant-facing preview + reward logic preview |
| 11 | Review & Submit | Validation checklist, save draft, submit for review |

### Reward Sub-Steps (inside Step 9, modal/panel)

| # | Sub-Step | Description |
|---|----------|-------------|
| R1 | Reward Details | Name, description, audience, reward type |
| R2 | Reward Trigger | Type (contribution/membership/first N/top N) |
| R3 | Contribution Trigger | Min / Range / Exact amounts |
| R4 | Reward Items | Add items (name, type digital/physical, value) |
| R5 | Item Fulfilment | Internal / MCOM / External / Manual / Instructions |
| R6 | Reward Availability | Quantity, claim deadline, qualification period |

### Campaign Management Pages

| Page | Route | Description |
|------|-------|-------------|
| All Campaigns | `/admin/campaigns` | Status tabs (All, Drafts, Pending, Scheduled, Active, Completed, Archived), search, filters |
| Campaign Detail | `/admin/campaigns/:id` | Operational dashboard with tabs (Overview, Locations, Rewards, Participants, Contributions, Funding, Reward Activity, Analytics, Settings) |
| Create Campaign | `/admin/campaigns/new` | The unified wizard |
| Edit Campaign | `/admin/campaigns/:id/edit` | Same wizard, pre-filled |

---

## File Plan

### New Files to Create

#### Backend — Location API
| # | File | Purpose |
|---|------|---------|
| B1 | `apps/api/src/routes/locations.ts` | Location tree endpoint, list, search |
| B2 | Register in `apps/api/src/routes/index.ts` | Add location router |

#### Frontend — Wizard Core
| # | File | Purpose |
|---|------|---------|
| F1 | `apps/web/src/types/campaign-wizard.ts` | Shared wizard types (CampaignWizardData, StepId, etc.) |
| F2 | `apps/web/src/components/admin/wizard/WizardShell.tsx` | Progress indicator, back/next/save footer, step click navigation |
| F3 | `apps/web/src/components/admin/wizard/AdminCampaignWizard.tsx` | Main orchestrator (replaces old 913-line monolith) |

#### Frontend — Step Components
| # | File | Purpose |
|---|------|---------|
| S1 | `apps/web/src/components/admin/wizard/steps/StepScope.tsx` | Campaign scope (city/national/independent) |
| S2 | `apps/web/src/components/admin/wizard/steps/StepLocations.tsx` | Location tree selector with exceptions |
| S3 | `apps/web/src/components/admin/wizard/steps/StepDetails.tsx` | Campaign details form |
| S4 | `apps/web/src/components/admin/wizard/steps/StepAudience.tsx` | Audience selection |
| S5 | `apps/web/src/components/admin/wizard/steps/StepParticipation.tsx` | Participation methods |
| S6 | `apps/web/src/components/admin/wizard/steps/StepFunding.tsx` | Funding/contribution config |
| S7 | `apps/web/src/components/admin/wizard/steps/StepPeriod.tsx` | Campaign period |
| S8 | `apps/web/src/components/admin/wizard/steps/StepRules.tsx` | Campaign limits & rules |
| S9 | `apps/web/src/components/admin/wizard/steps/StepRewards.tsx` | Rewards list + sub-step editor |
| S10 | `apps/web/src/components/admin/wizard/steps/StepPreview.tsx` | Participant-facing preview |
| S11 | `apps/web/src/components/admin/wizard/steps/StepReview.tsx` | Validation checklist + submit |

#### Frontend — Reward Editor (inside StepRewards)
| # | File | Purpose |
|---|------|---------|
| R1 | `apps/web/src/components/admin/wizard/rewards/RewardEditor.tsx` | Sub-step orchestrator (modal/panel) |
| R2 | `apps/web/src/components/admin/wizard/rewards/RewardDetailsForm.tsx` | Name, description, audience |
| R3 | `apps/web/src/components/admin/wizard/rewards/RewardTriggerForm.tsx` | Trigger type + config |
| R4 | `apps/web/src/components/admin/wizard/rewards/RewardItemsForm.tsx` | Items CRUD |
| R5 | `apps/web/src/components/admin/wizard/rewards/RewardFulfilmentForm.tsx` | Fulfilment method config |
| R6 | `apps/web/src/components/admin/wizard/rewards/RewardAvailabilityForm.tsx` | Quantity, deadlines |

#### Frontend — Campaign Management
| # | File | Purpose |
|---|------|---------|
| M1 | `apps/web/src/pages/admin/campaigns/AllCampaignsPage.tsx` | Redesigned campaign list with status tabs |
| M2 | `apps/web/src/pages/admin/campaigns/CampaignDetailPage.tsx` | Operational dashboard (replaces AdminCampaignDetailPage) |
| M3 | `apps/web/src/components/admin/campaigns/CampaignStatusBadge.tsx` | Status badge component |
| M4 | `apps/web/src/components/admin/campaigns/CampaignFilters.tsx` | Search + filter panel |

#### Frontend — Services & Hooks
| # | File | Purpose |
|---|------|---------|
| H1 | `apps/web/src/hooks/useLocationTree.ts` | Fetch location tree from API, manage selection state |
| H2 | `apps/web/src/services/location.service.ts` | API client for location endpoints |
| H3 | `apps/web/src/services/admin-campaign.service.ts` | Unified campaign CRUD (create, update, status transitions) |

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/routes/index.ts` | Register location router |
| `apps/web/src/App.tsx` | Update admin campaign routes |
| `apps/web/src/components/admin/adminNavConfig.tsx` | Update sidebar nav items |

### Files to Deprecate (keep but stop using)

| File | Reason |
|------|--------|
| `apps/web/src/components/admin/AdminCampaignWizard.tsx` | Replaced by new wizard |
| `apps/web/src/pages/admin/campaigns/CampaignCreatePage.tsx` | Replaced by new wizard |
| `apps/web/src/pages/admin/campaigns/AdminCampaignDetailPage.tsx` | Replaced by new detail page |

---

## Implementation Phases

### Phase 1: Backend Location API + Wizard Shell
**Goal:** Location data available, wizard navigation works

1. Create `apps/api/src/routes/locations.ts` with:
   - `GET /locations/tree` — returns full hierarchy (CITY > BOROUGH/LOCAL_AREA > HIGH_STREET)
   - `GET /locations` — flat list with type/search/parentId filters
   - Uses existing `HubLocation` Prisma model
2. Register in `apps/api/src/routes/index.ts`
3. Create `apps/web/src/services/location.service.ts` (API client)
4. Create `apps/web/src/hooks/useLocationTree.ts` (fetch + selection state)
5. Create `apps/web/src/types/campaign-wizard.ts` (shared types)
6. Create `WizardShell.tsx` with:
   - Step progress indicator (numbered, with completion checkmarks)
   - Clickable steps (jump back to completed steps)
   - Back / Save Draft / Continue footer
   - Step validation state
7. Create `AdminCampaignWizard.tsx` orchestrator with step routing

**Verify:** Wizard shell renders, steps navigate, progress indicator updates

### Phase 2: Steps 1-4 (Scope, Locations, Details, Audience)
**Goal:** Campaign can be scoped and described

1. `StepScope.tsx` — City/National/Independent radio, city search/select
2. `StepLocations.tsx` — Full tree selector:
   - Fetches from `/locations/tree`
   - All/Selected radio for Local Areas
   - All/Selected radio for High Streets
   - Exceptions management
   - Location summary with visual tree
   - Future locations explanation
3. `StepDetails.tsx` — Name, code (auto-generated), short/full description, category, season, images, video
4. `StepAudience.tsx` — Business/Consumer/Both checkboxes

**Verify:** Can navigate steps 1-4, location tree loads from API, selections persist

### Phase 3: Steps 5-8 (Participation, Funding, Period, Rules)
**Goal:** Campaign operational config complete

1. `StepParticipation.tsx` — Toggle switches for Back/Founding Member/Founding Monthly
2. `StepFunding.tsx` — Target, min/max contribution, suggested amounts, custom toggle
3. `StepPeriod.tsx` — Start/end datetime pickers, schedule publication toggle
4. `StepRules.tsx` — Contribution limit, participation limit, capacity, multiple contributions

**Verify:** Steps 5-8 complete, data persists across navigation

### Phase 4: Step 9 — Rewards (the complex step)
**Goal:** Full reward builder with sub-steps

1. `StepRewards.tsx` — Main rewards step:
   - "Does this campaign offer rewards?" toggle
   - If yes: reward list with cards showing trigger, items, audience
   - Each reward card: Edit, Duplicate, Delete, Reorder
   - "+ Add Reward" button opens RewardEditor
   - Qualification mode selector (highest/cumulative)
2. `RewardEditor.tsx` — Modal/panel with internal sub-steps:
   - Progress indicator for R1-R6
   - Back/Next within the editor
   - Save returns to reward list
3. `RewardDetailsForm.tsx` — Name, description, audience
4. `RewardTriggerForm.tsx` — Contribution (min/range/exact), Membership, First N, Top N
5. `RewardItemsForm.tsx` — Add items with name, type (digital/physical), value, description
6. `RewardFulfilmentForm.tsx` — Internal/MCOM/External Platform/External Link/API-Webhook/Manual/Instructions
7. `RewardAvailabilityForm.tsx` — Unlimited/Limited quantity, claim deadline, qualification period

**Verify:** Can add/edit/delete/duplicate rewards, sub-steps navigate correctly, items and fulfilment configure properly

### Phase 5: Steps 10-11 (Preview, Review) + Save/Submit
**Goal:** Campaign reviewable and submittable

1. `StepPreview.tsx` — Participant-facing preview:
   - Campaign card preview
   - Campaign detail preview with tabs
   - Reward tiers display
   - Contribution flow preview
   - Reward logic flow diagram (internal)
2. `StepReview.tsx` — Validation checklist:
   - Scope ✓/✗
   - Locations ✓/✗
   - Details ✓/✗
   - Audience ✓/✗
   - Participation ✓/✗
   - Funding ✓/✗
   - Period ✓/✗
   - Rules ✓/✗
   - Rewards ✓/✗ (including items + fulfilment)
   - Warnings for missing data
   - Click warning jumps to relevant step
3. Save Draft button (any step) — saves with `status: "draft"`
4. Submit for Review button (step 11) — saves with `status: "pending_review"`
5. `admin-campaign.service.ts` — API calls for create/update/status transitions

**Verify:** Can save draft, submit for review, validation catches missing fields

### Phase 6: Campaign Management Pages
**Goal:** Admin can manage all campaigns

1. `AllCampaignsPage.tsx` — Redesigned list:
   - Status tabs: All, Drafts, Pending Review, Scheduled, Active, Completed, Archived
   - Search by name/code
   - Filter by city, audience, mode
   - Table with: title, scope, city, status, dates, actions
   - Actions: Edit, View, Duplicate, Archive
   - Links to `/admin/campaigns/:id/edit` (wizard) and `/admin/campaigns/:id` (detail)
2. `CampaignDetailPage.tsx` — Operational dashboard:
   - Header: campaign title, status badge, action buttons
   - Tabs: Overview, Locations, Rewards, Participants, Contributions, Funding, Reward Activity, Analytics, Settings
   - Overview: key metrics, funding progress, recent activity
   - Locations: map/list of coverage, add/remove locations
   - Rewards: reward list with claim stats
   - Settings: edit campaign, status transitions
3. `CampaignStatusBadge.tsx` — Colored badge per status
4. `CampaignFilters.tsx` — Reusable search/filter panel

**Verify:** Campaign list loads, detail page shows correct tabs, status transitions work

### Phase 7: Routes, Navigation, Cleanup
**Goal:** Everything wired up, old code removed

1. Update `apps/web/src/App.tsx` routes:
   - `/admin/campaigns` → AllCampaignsPage
   - `/admin/campaigns/new` → AdminCampaignWizard (create mode)
   - `/admin/campaigns/:id` → CampaignDetailPage
   - `/admin/campaigns/:id/edit` → AdminCampaignWizard (edit mode)
2. Update `adminNavConfig.tsx` sidebar:
   - All Campaigns
   - Create Campaign
   - Drafts (filter shortcut)
   - Pending Review (filter shortcut)
   - Scheduled (filter shortcut)
   - Active (filter shortcut)
3. Remove/deprecate old files
4. TypeScript check + build verification

**Verify:** All routes work, sidebar navigation correct, build passes

---

## CampaignWizardData Shape

```typescript
interface CampaignWizardData {
  // Step 1 — Scope
  scope: "city" | "national" | "independent";
  citySlug: string;
  cityName: string;

  // Step 2 — Location Coverage
  locationCoverage: {
    mode: "all" | "selected";
    selectedLocalAreas: string[];
    excludedLocalAreas: string[];
    highStreetMode: "all" | "selected";
    selectedHighStreets: string[];
    excludedHighStreets: string[];
  };

  // Step 3 — Details
  title: string;
  campaignCode: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  seasonId: string;
  featuredImage: string;
  additionalImages: string[];
  videoUrl: string;

  // Step 4 — Audience
  audience: "business" | "consumer" | "both";

  // Step 5 — Participation
  participation: {
    backCampaign: boolean;
    foundingMember: boolean;
    foundingMemberMonthly: boolean;
  };

  // Step 6 — Funding
  funding: {
    hasTarget: boolean;
    targetAmount: string;
    startingAmount: string;
    stretchTarget: string;
    minContribution: string;
    maxContribution: string;
    suggestedAmounts: string[];
    allowCustomAmount: boolean;
  };

  // Step 7 — Period
  period: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    schedulePublication: boolean;
    publishAt: string;
  };

  // Step 8 — Rules
  rules: {
    contributionLimit: string;
    participationLimit: string;
    campaignCapacity: string;
    multipleContributions: boolean;
  };

  // Step 9 — Rewards
  rewards: CampaignReward[];
  qualificationMode: "highest" | "cumulative";
  hasRewards: boolean;

  // Meta
  status: "draft" | "pending_review" | "scheduled" | "active" | "paused" | "completed" | "archived";
}

interface CampaignReward {
  id: string;
  title: string;
  description: string;
  order: number;
  audience: "business" | "consumer" | "both";
  triggerType: "contribution" | "membership" | "founding_monthly" | "first_n" | "top_n";
  triggerConfig: {
    mode: "min" | "range" | "exact";
    min?: number;
    max?: number;
    exact?: number;
    count?: number;
    minQualification?: number;
  };
  quantityType: "unlimited" | "limited";
  quantityLimit: number | null;
  claimDeadlineDays: number;
  fulfilmentType: string;
  fulfilmentConfig: Record<string, unknown>;
  items: CampaignRewardItem[];
}

interface CampaignRewardItem {
  id: string;
  title: string;
  description: string;
  physicalType: "physical" | "digital";
  value: string;
  currency: string;
  assetType: "file" | "url" | "";
  assetUrl: string;
  order: number;
}
```

---

## Backend Location API Design

### `GET /locations/tree`

Returns the full location hierarchy:

```json
{
  "cities": [
    {
      "id": "uuid",
      "name": "Birmingham",
      "slug": "birmingham",
      "type": "CITY",
      "localAreas": [
        {
          "id": "uuid",
          "name": "Central",
          "slug": "central",
          "type": "LOCAL_AREA",
          "highStreets": [
            {
              "id": "uuid",
              "name": "New Street",
              "slug": "new-street",
              "type": "HIGH_STREET"
            }
          ]
        }
      ]
    }
  ]
}
```

### `GET /locations?type=CITY&parentId=xxx&search=cam`

Flat list with filters. Returns `[{ id, name, slug, type, parentId, fullPath }]`.

---

## Validation Rules

| Step | Required Fields | Warnings |
|------|----------------|----------|
| 1 | scope, citySlug (if city scope) | — |
| 2 | At least 1 local area, at least 1 high street | — |
| 3 | title, shortDescription | No featured image |
| 4 | audience | — |
| 5 | At least 1 participation method | — |
| 6 | targetAmount (if hasTarget), minContribution | — |
| 7 | startDate, endDate | Start in past |
| 8 | — | — |
| 9 | If hasRewards: ≥1 reward, each reward needs name, trigger, ≥1 item, fulfilment | Overlapping triggers |
| 10 | — | — |
| 11 | All required fields pass | Warnings listed |

---

## Key Design Decisions

1. **Wizard shell is reusable** — Same `WizardShell` component for both create and edit. Edit mode pre-fills data from API.
2. **Reward editor is a modal** — Opens from Step 9, has its own internal sub-step navigation. Saving returns to the reward list. This keeps the main wizard at 11 steps.
3. **Location tree is API-driven** — Fetches from new backend endpoint. Uses `useLocationTree` hook for selection state management.
4. **Save Draft is always available** — Any step can save. Draft retains all entered data.
5. **Click-back on step indicator** — Completed steps are clickable. Current and future steps are not.
6. **Validation is per-step + final** — Each step validates on Next. Step 11 shows full checklist with warnings.
7. **Preview shows participant view** — Admin sees what the public would see. Reward logic preview is internal-only.
8. **Management pages use real API** — Replace demo data with `adminApi` calls. Status transitions enforced.
