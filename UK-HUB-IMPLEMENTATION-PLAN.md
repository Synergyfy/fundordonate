# UK HUB ACTIVATION — COMPLETE IMPLEMENTATION PLAN

## EXECUTIVE SUMMARY

This plan maps the 14-part UK Hub Activation specification into 13 concrete build phases.
Every specification section is accounted for. Nothing is missed.

---

## WHAT ALREADY EXISTS

| Asset | Location | Status |
|-------|----------|--------|
| HubActivation demo data (108 locations) | `apps/web/src/data/hubActivation.ts` | ✅ Exists — will migrate to DB |
| HubStatusBadge component | `apps/web/src/components/hub/HubStatusBadge.tsx` | ✅ Exists — will extend |
| UkMap (Google Maps) | `apps/web/src/components/hub/UkMap.tsx` | ✅ Exists — will refactor |
| LocationPanel component | `apps/web/src/components/hub/LocationPanel.tsx` | ✅ Exists — will refactor |
| UKHubActivationPage | `apps/web/src/pages/UKHubActivationPage.tsx` | ✅ Exists — will refactor |
| Campaign hierarchy (parentId, location) | `apps/api/prisma/schema.prisma` | ✅ Exists |
| CampaignLocation not yet created | — | ❌ Needs creation |
| HubLocation not yet created | — | ❌ Needs creation |
| FoundingProgramme not yet created | — | ❌ Needs creation |
| BackerStatus not yet created | — | ❌ Needs creation |
| Backend hierarchy API | `apps/api/src/routes/campaigns.ts` | ✅ Exists |
| Campaign service hierarchy methods | `apps/api/src/services/campaign.service.ts` | ✅ Exists |

---

## COMPLETE ENTITY MAP (What the spec requires)

### New Prisma Models Required

| Model | Spec Reference | Purpose |
|-------|---------------|---------|
| `HubLocation` | Part 2 (2.15) | Core location hierarchy entity |
| `CampaignLocation` | Part 5 (5.15) | Campaign-to-location relationship |
| `FoundingProgramme` | Part 8 (8.2) | Founding Member programme config |
| `FoundingMembership` | Part 8 (8.14) | Individual founding membership record |
| `BackerStatus` | Part 9 (9.4) | Backer recognition record |
| `HubProgress` | Part 2 (2.23) | Location progress tracking |
| `HubActivity` | Part 3 (3.20) | Community/activity items |
| `HubEvent` | Part 4 (4.34) | Events at locations |
| `LocationStatusHistory` | Part 6 (6.11) | Status change audit trail |
| `BenefitCatalogue` | Part 8 (8.11) | Configurable benefits |
| `HubAnalyticsEvent` | Part 7 (7.21) | Map/hub analytics |

### Existing Models to Extend

| Model | Changes |
|-------|---------|
| `Campaign` | Add `locationId` relation via `CampaignLocation` |
| `CampaignType` | Already extended with `isOpportunity`, `eligibleTiers` |

---

## IMPLEMENTATION PHASES

### PHASE 1: HubLocation Data Model & Service
**Spec:** Part 2 (2.2-2.15), Part 11 (11.3)
**Dependencies:** None
**Estimated Scope:** Schema + Service + API + Seed

#### 1.1 Prisma Schema — HubLocation

```prisma
model HubLocation {
  id                String   @id @default(uuid())
  name              String
  slug              String   @unique
  type              String   // NATIONAL, CITY, BOROUGH, DISTRICT, LOCAL_AREA, HIGH_STREET, COMMERCIAL_AREA
  parentId          String?
  parent            HubLocation?  @relation("LocationHierarchy", fields: [parentId], references: [id])
  children          HubLocation[] @relation("LocationHierarchy")

  // Content
  shortDescription  String?
  description       String?
  heroHeadline      String?
  heroSupportingText String?

  // Activation
  internalLifecycle String   @default("DRAFT") // DRAFT, IDENTIFIED, PREPARING, LAUNCHING, ACTIVATING, ACTIVE, EXPANDING, ARCHIVED
  publicStatus      String   @default("NEEDS_ACTIVATION") // NEEDS_ACTIVATION, MAKING_PROGRESS, ACTIVE
  statusOverride    String?  // Admin override — null means use calculated
  
  // Publication
  isActive          Boolean  @default(false)
  isPublic          Boolean  @default(false)
  
  // Map
  mapVisible        Boolean  @default(false)
  latitude          Float?
  longitude         Float?
  mapZoomLevel      Int?     @default(10)
  
  // Media
  primaryImage      String?
  secondaryImage    String?
  
  // Hierarchy path (for routing)
  fullPath          String?  @unique // e.g. "london/camden/camden-high-street"
  
  // Featured
  isFeaturedNationally Boolean @default(false)
  featuredPriority     Int?    @default(0)
  featuredFrom         DateTime?
  featuredUntil        DateTime?
  
  // Progress (cached/aggregated)
  fundingTarget     Int      @default(0) // in pence
  fundingRaised     Int      @default(0)
  activationThreshold Int?   @default(80) // percentage
  
  // Founding allocation (cached)
  foundingBusinessTotal   Int  @default(0)
  foundingBusinessAllocated Int @default(0)
  foundingConsumerTotal   Int  @default(0)
  foundingConsumerAllocated Int @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  campaigns        CampaignLocation[]
  foundingProgrammes FoundingProgram[]
  activity         HubActivity[]
  events           HubEvent[]
  progressHistory  HubProgress[]
  statusHistory    LocationStatusHistory[]
  analyticsEvents  HubAnalyticsEvent[]

  @@index([type])
  @@index([parentId])
  @@index([slug])
  @@index([fullPath])
  @@index([isPublic, isActive])
  @@index([type, publicStatus])
  @@index([isFeaturedNationally])
  @@map("hub_locations")
}
```

#### 1.2 Prisma Schema — LocationStatusHistory

```prisma
model LocationStatusHistory {
  id              String   @id @default(uuid())
  locationId      String
  location        HubLocation @relation(fields: [locationId], references: [id])
  previousStatus  String?
  newStatus       String
  previousLifecycle String?
  newLifecycle    String?
  changedByUserId String?
  reason          String?
  createdAt       DateTime @default(now())

  @@index([locationId])
  @@index([createdAt])
  @@map("location_status_history")
}
```

#### 1.3 Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/prisma/schema.prisma` — add HubLocation + LocationStatusHistory models |
| CREATE | `apps/api/src/services/location.service.ts` — CRUD, hierarchy queries, status resolution |
| CREATE | `apps/api/src/routes/locations.ts` — Location API endpoints |
| MODIFY | `apps/api/src/routes/index.ts` — register locations router |
| CREATE | `apps/api/prisma/seed-locations.ts` — seed hierarchy from existing hubActivation.ts data |
| VERIFY | `npx prisma db push` + `npx prisma generate` |
| VERIFY | `npx tsc --noEmit` (api) |

#### 1.4 Location Service Methods

```
createLocation(data)
updateLocation(id, data)
getLocationById(id)
getLocationBySlug(slug)
getLocationByFullPath(fullPath)
getChildLocations(parentId)
getLocationHierarchy(rootId)
getAncestors(locationId) // breadcrumb chain
updateLocationStatus(id, status, override?, changedBy, reason?)
getLocationsByType(type)
getFeaturedCities()
getNationalHub()
resolveLocationPath(pathSegments[]) // for routing
```

#### 1.5 Location API Endpoints

```
GET    /api/locations                    — list (with filters)
GET    /api/locations/:id                — by ID
GET    /api/locations/slug/:slug         — by slug
GET    /api/locations/path/*             — by full path
GET    /api/locations/:id/children       — child locations
GET    /api/locations/:id/hierarchy      — full tree
GET    /api/locations/:id/ancestors      — breadcrumb chain
POST   /api/locations                    — create (admin)
PUT    /api/locations/:id                — update (admin)
PATCH  /api/locations/:id/status         — status change (admin)
GET    /api/locations/featured           — featured cities
GET    /api/locations/national           — national hub data
```

#### 1.6 Seed Data

Migrate existing 108 locations from `hubActivation.ts`:
- 1 National Hub (United Kingdom)
- 76 Cities
- 32 London Boroughs (children of London)
- Additional boroughs for other cities where applicable
- Set `fullPath` for routing
- Set `mapVisible = true` for cities
- Set initial `publicStatus` from existing status data

---

### PHASE 2: Hub Projections & Routing
**Spec:** Part 2 (2.32-2.38), Part 3 (3.34), Part 11 (11.8-11.9)
**Dependencies:** Phase 1
**Estimated Scope:** Projection services + Frontend routing

#### 2.1 Projection Services

| Service | Purpose |
|---------|---------|
| `NationalHubProjectionService` | Aggregates national data into single projection |
| `CityHubProjectionService` | Aggregates city data into single projection |
| `MapProjectionService` | Lightweight map markers + panels |

#### 2.2 API Projections

```
GET /api/uk-hub/national — National Hub projection
GET /api/uk-hub/locations/:locationPath* — City/Location Hub projection
GET /api/uk-hub/map — Map markers projection
GET /api/uk-hub/map/locations/:id — Map location detail
```

#### 2.3 Frontend Routes

```
/uk-hub-activation                    → NationalHubPage
/uk-hub-activation/map                → UkHubMapPage
/uk-hub-activation/:locationPath*     → CityHubPage (dynamic resolution)
```

#### 2.4 Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/src/services/hub-projection.service.ts` |
| CREATE | `apps/api/src/routes/uk-hub.ts` |
| MODIFY | `apps/api/src/routes/index.ts` — register uk-hub router |
| CREATE | `apps/web/src/pages/NationalHubPage.tsx` |
| CREATE | `apps/web/src/pages/CityHubPage.tsx` |
| CREATE | `apps/web/src/pages/UkHubMapPage.tsx` |
| CREATE | `apps/web/src/lib/location-resolver.ts` — frontend path resolution |
| MODIFY | `apps/web/src/App.tsx` — add UK Hub routes |

---

### PHASE 3: City Activation Lifecycle
**Spec:** Part 6 (6.1-6.14)
**Dependencies:** Phase 1
**Estimated Scope:** Status model + lifecycle service + Admin controls

#### 3.1 Status Resolution Logic

```
calculatedStatus = deriveFromProgress(location)
adminOverride = location.statusOverride
effectiveStatus = adminOverride ?? calculatedStatus
```

#### 3.2 Lifecycle States

```
DRAFT → IDENTIFIED → PREPARING → LAUNCHING → ACTIVATING → ACTIVE → EXPANDING → ARCHIVED
```

#### 3.3 Activation Milestones

```
MILESTONE_CITY_PREPARED
MILESTONE_LAUNCH_OPENED
MILESTONE_FOUNDING_STARTED
MILESTONE_ACTIVATION_PROGRESS
MILESTONE_CITY_ACTIVATED
```

#### 3.4 Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/src/services/hub-status.service.ts` |
| MODIFY | `apps/api/src/routes/locations.ts` — status management endpoints |
| CREATE | `apps/web/src/components/hub/ActivationMilestones.tsx` |
| MODIFY | `apps/web/src/components/hub/HubStatusBadge.tsx` — extend for lifecycle |

---

### PHASE 4: Campaign/Location Integration
**Spec:** Part 5 (5.15-5.17), Part 11 (11.4)
**Dependencies:** Phase 1
**Estimated Scope:** CampaignLocation model + campaign-location queries

#### 4.1 Prisma Schema — CampaignLocation

```prisma
model CampaignLocation {
  id              String   @id @default(uuid())
  campaignId      String
  campaign        Campaign @relation(fields: [campaignId], references: [id])
  locationId      String
  location        HubLocation @relation(fields: [locationId], references: [id])
  relationshipType String @default("PRIMARY") // PRIMARY, LOCAL, NATIONAL, FEATURED
  visibility      String   @default("VISIBLE") // VISIBLE, HIDDEN
  createdAt       DateTime @default(now())

  @@unique([campaignId, locationId])
  @@index([campaignId])
  @@index([locationId])
  @@index([locationId, relationshipType])
  @@map("campaign_locations")
}
```

#### 4.2 Service Methods

```
attachCampaignToLocation(campaignId, locationId, type)
removeCampaignFromLocation(campaignId, locationId)
getCampaignsByLocation(locationId, filters)
getLocationsByCampaign(campaignId)
getNationalCampaigns()
getCityCampaigns(cityId)
```

#### 4.3 Files to Create/Modify

| Action | File |
|--------|------|
| MODIFY | `apps/api/prisma/schema.prisma` — add CampaignLocation |
| CREATE | `apps/api/src/services/campaign-location.service.ts` |
| MODIFY | `apps/api/src/routes/campaigns.ts` — location-aware queries |
| VERIFY | `npx prisma db push` + seed |

---

### PHASE 5: Founding Member System
**Spec:** Part 8 (8.1-8.14)
**Dependencies:** Phase 1, Phase 4
**Estimated Scope:** FoundingProgramme + FoundingMembership + Benefits

#### 5.1 Prisma Schema

```prisma
model FoundingProgramme {
  id                String   @id @default(uuid())
  locationId        String
  location          HubLocation @relation(fields: [locationId], references: [id])
  audience          String   // BUSINESS, CONSUMER
  status            String   @default("DRAFT") // DRAFT, SCHEDULED, OPEN, LIMITED, FULLY_ALLOCATED, CLOSED, ARCHIVED
  title             String
  description       String?
  
  // Allocation
  totalAllocation   Int      @default(0)
  allocatedCount    Int      @default(0)
  
  // Timing
  opensAt           DateTime?
  closesAt          DateTime?
  
  // Campaign link
  campaignId        String?
  campaign          Campaign? @relation(fields: [campaignId], references: [id])
  
  // Configuration (JSON)
  contributionConfig String  @default("{}") // contribution amounts, rules
  benefitConfig     String   @default("[]") // JSON array of benefit IDs
  eligibilityConfig String   @default("{}") // eligibility rules
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  memberships       FoundingMembership[]

  @@index([locationId])
  @@index([locationId, audience])
  @@index([status])
  @@index([campaignId])
  @@map("founding_programmes")
}

model FoundingMembership {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  programmeId       String
  programme         FoundingProgramme @relation(fields: [programmeId], references: [id])
  locationId        String
  location          HubLocation @relation(fields: [locationId], references: [id])
  campaignId        String?
  campaign          Campaign? @relation(fields: [campaignId], references: [id])
  status            String   @default("ACTIVE") // ACTIVE, REVOKED, EXPIRED
  contributionAmount Int?    // in pence
  grantedAt         DateTime @default(now())
  benefitsVersion   String?  // snapshot of benefits at time of grant
  
  @@unique([userId, programmeId])
  @@index([userId])
  @@index([programmeId])
  @@index([locationId])
  @@index([userId, locationId])
  @@map("founding_memberships")
}
```

#### 5.2 Service Methods

```
createProgramme(data)
updateProgramme(id, data)
openProgramme(id)
closeProgramme(id)
getProgrammesByLocation(locationId, audience?)
getProgrammeAllocation(programmeId)
joinProgramme(userId, programmeId, campaignId?, contribution?)
getMembershipByUser(userId, locationId?)
getUserMemberships(userId)
checkEligibility(userId, programmeId)
```

#### 5.3 Files to Create/Modify

| Action | File |
|--------|------|
| MODIFY | `apps/api/prisma/schema.prisma` — add FoundingProgramme + FoundingMembership |
| CREATE | `apps/api/src/services/founding.service.ts` |
| CREATE | `apps/api/src/routes/founding.ts` |
| MODIFY | `apps/api/src/routes/index.ts` |
| CREATE | `apps/web/src/components/hub/FoundingBusinessSection.tsx` |
| CREATE | `apps/web/src/components/hub/FoundingConsumerSection.tsx` |

---

### PHASE 6: Backer Status System
**Spec:** Part 9 (9.1-9.8)
**Dependencies:** Phase 4
**Estimated Scope:** BackerStatus + eligibility + recognition

#### 6.1 Prisma Schema

```prisma
model BackerStatus {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  statusType        String   @default("BACKER") // BACKER, CITY_HUB_BACKER, etc.
  sourceCampaignId  String?
  sourceCampaign    Campaign? @relation(fields: [sourceCampaignId], references: [id])
  locationId        String?
  location          HubLocation? @relation(fields: [locationId], references: [id])
  grantedAt         DateTime @default(now())
  visibility        String   @default("COUNTED") // COUNTED, PUBLIC
  metadata          String   @default("{}")
  
  @@unique([userId, sourceCampaignId])
  @@index([userId])
  @@index([locationId])
  @@index([sourceCampaignId])
  @@map("backer_statuses")
}
```

#### 6.2 Files to Create/Modify

| Action | File |
|--------|------|
| MODIFY | `apps/api/prisma/schema.prisma` — add BackerStatus |
| CREATE | `apps/api/src/services/backer.service.ts` |
| CREATE | `apps/api/src/routes/backer.ts` |
| CREATE | `apps/web/src/components/hub/BackerRecognition.tsx` |
| CREATE | `apps/web/src/components/hub/BackerBadge.tsx` |

---

### PHASE 7: National Hub Experience
**Spec:** Part 3 (3.1-3.39)
**Dependencies:** Phase 1, 2, 3, 4, 5, 6
**Estimated Scope:** Full National Hub page (15 sections)

#### 7.1 Page Sections

| # | Section | Component |
|---|---------|-----------|
| 1 | Header/Nav | Existing FundOrDonate nav |
| 2 | National Hub Hero | `NationalHubHero.tsx` |
| 3 | UK Activation Overview | `ActivationOverview.tsx` |
| 4 | National Progress Snapshot | `NationalProgress.tsx` |
| 5 | Explore UK Map | `MapPreview.tsx` |
| 6 | Featured/Launching Cities | `FeaturedCities.tsx` |
| 7 | City Status & Opportunities | `CityStatusGrid.tsx` |
| 8 | National Campaigns | `NationalCampaigns.tsx` |
| 9 | National Founding Opportunities | `NationalFounding.tsx` |
| 10 | UK Hub Community & Activity | `HubCommunity.tsx` |
| 11 | How Businesses Participate | `BusinessParticipation.tsx` |
| 12 | How Consumers Participate | `ConsumerParticipation.tsx` |
| 13 | How National→Local Works | `HierarchyExplainer.tsx` |
| 14 | Final CTA | `NationalHubCTA.tsx` |
| 15 | Footer | Existing FundOrDonate footer |

#### 7.2 Files to Create

| File |
|------|
| `apps/web/src/pages/NationalHubPage.tsx` |
| `apps/web/src/components/hub/national/NationalHubHero.tsx` |
| `apps/web/src/components/hub/national/ActivationOverview.tsx` |
| `apps/web/src/components/hub/national/NationalProgress.tsx` |
| `apps/web/src/components/hub/national/MapPreview.tsx` |
| `apps/web/src/components/hub/national/FeaturedCities.tsx` |
| `apps/web/src/components/hub/national/CityStatusGrid.tsx` |
| `apps/web/src/components/hub/national/NationalCampaigns.tsx` |
| `apps/web/src/components/hub/national/NationalFounding.tsx` |
| `apps/web/src/components/hub/national/HubCommunity.tsx` |
| `apps/web/src/components/hub/national/BusinessParticipation.tsx` |
| `apps/web/src/components/hub/national/ConsumerParticipation.tsx` |
| `apps/web/src/components/hub/national/HierarchyExplainer.tsx` |
| `apps/web/src/components/hub/national/NationalHubCTA.tsx` |

---

### PHASE 8: Reusable City Hub Experience
**Spec:** Part 4 (4.1-4.60)
**Dependencies:** Phase 1, 2, 3, 4, 5, 6
**Estimated Scope:** Full City Hub page (17 sections)

#### 8.1 Page Sections

| # | Section | Component |
|---|---------|-----------|
| 1 | Global Header | Existing nav |
| 2 | Breadcrumb | `LocationBreadcrumb.tsx` |
| 3 | City Hero | `CityHubHero.tsx` |
| 4 | Activation Status | `CityActivationStatus.tsx` |
| 5 | Progress Overview | `CityProgress.tsx` |
| 6 | Participation Paths | `ParticipationPaths.tsx` |
| 7 | Current Campaigns | `CityCampaigns.tsx` |
| 8 | Founding Business | `FoundingBusinessSection.tsx` |
| 9 | Founding Consumer | `FoundingConsumerSection.tsx` |
| 10 | City Backers | `BackerRecognition.tsx` |
| 11 | Child Locations | `LocalActivity.tsx` |
| 12 | Community | `CityCommunity.tsx` |
| 13 | Announcements & Events | `CityAnnouncements.tsx` |
| 14 | How Participation Works | `ParticipationExplainer.tsx` |
| 15 | Explore Wider UK Hub | `WiderHubLinks.tsx` |
| 16 | Final CTA | `CityHubCTA.tsx` |
| 17 | Footer | Existing footer |

#### 8.2 Files to Create

| File |
|------|
| `apps/web/src/pages/CityHubPage.tsx` |
| `apps/web/src/components/hub/city/LocationBreadcrumb.tsx` |
| `apps/web/src/components/hub/city/CityHubHero.tsx` |
| `apps/web/src/components/hub/city/CityActivationStatus.tsx` |
| `apps/web/src/components/hub/city/CityProgress.tsx` |
| `apps/web/src/components/hub/city/ParticipationPaths.tsx` |
| `apps/web/src/components/hub/city/CityCampaigns.tsx` |
| `apps/web/src/components/hub/city/FoundingBusinessSection.tsx` |
| `apps/web/src/components/hub/city/FoundingConsumerSection.tsx` |
| `apps/web/src/components/hub/city/BackerRecognition.tsx` |
| `apps/web/src/components/hub/city/LocalActivity.tsx` |
| `apps/web/src/components/hub/city/CityCommunity.tsx` |
| `apps/web/src/components/hub/city/CityAnnouncements.tsx` |
| `apps/web/src/components/hub/city/ParticipationExplainer.tsx` |
| `apps/web/src/components/hub/city/WiderHubLinks.tsx` |
| `apps/web/src/components/hub/city/CityHubCTA.tsx` |

---

### PHASE 9: Interactive UK Map
**Spec:** Part 7 (7.1-7.21)
**Dependencies:** Phase 1, 2
**Estimated Scope:** Map refactor + panels + search + filters + drill-down

#### 9.1 Map Features

- Status-colored markers (Blue=Making Progress, Yellow=Needs Activation, Green=Active)
- Location information panels (FundOrDonate data, not generic)
- Search by location name
- Filters (status, campaigns, founding opportunities)
- Geographic drill-down (City → Borough → Local Area → High Street)
- List View alternative
- Deep linking (?location=manchester, ?status=MAKING_PROGRESS)
- Mobile bottom sheet

#### 9.2 Files to Create/Modify

| Action | File |
|--------|------|
| REFACTOR | `apps/web/src/components/hub/UkMap.tsx` — use HubLocation data |
| REFACTOR | `apps/web/src/components/hub/LocationPanel.tsx` — use projection API |
| CREATE | `apps/web/src/components/hub/map/MapSearch.tsx` |
| CREATE | `apps/web/src/components/hub/map/MapFilters.tsx` |
| CREATE | `apps/web/src/components/hub/map/MapListView.tsx` |
| CREATE | `apps/web/src/components/hub/map/MapLegend.tsx` |
| CREATE | `apps/web/src/components/hub/map/LocationBottomSheet.tsx` |
| REFACTOR | `apps/web/src/pages/UKHubActivationPage.tsx` → rename/refactor |
| CREATE | `apps/web/src/pages/UkHubMapPage.tsx` |

---

### PHASE 10: Admin UK Hub Management
**Spec:** Part 10 (10.1-10.12)
**Dependencies:** Phase 1-6
**Estimated Scope:** Admin CRUD for all UK Hub entities

#### 10.1 Admin Screens

| Screen | Purpose |
|--------|---------|
| Location Management | CRUD locations, hierarchy |
| Location Status | Change status, lifecycle |
| Campaign Location | Attach campaigns to locations |
| Founding Programme | Create/manage programmes |
| Featured Locations | Editorial placement |
| National Hub Content | Hero, sections, announcements |
| City Hub Content | Per-city configuration |
| Map Configuration | Visibility, coordinates |

#### 10.2 Files to Create

| File |
|------|
| `apps/web/src/pages/admin/AdminLocationsPage.tsx` |
| `apps/web/src/pages/admin/AdminLocationDetailPage.tsx` |
| `apps/web/src/pages/admin/AdminFoundingPage.tsx` |
| `apps/web/src/pages/admin/AdminHubContentPage.tsx` |
| `apps/web/src/components/admin/LocationForm.tsx` |
| `apps/web/src/components/admin/LocationHierarchyTree.tsx` |
| `apps/web/src/components/admin/CampaignLocationManager.tsx` |
| `apps/web/src/components/admin/FoundingProgrammeForm.tsx` |

---

### PHASE 11: Analytics & Caching
**Spec:** Part 7 (7.21), Part 11 (11.10-11.11)
**Dependencies:** Phase 1-9
**Estimated Scope:** Analytics events + projection caching

#### 11.1 Analytics Events

```
UK_MAP_VIEWED
LOCATION_MARKER_CLICKED
LOCATION_PANEL_OPENED
LOCATION_CAMPAIGN_CLICKED
CITY_HUB_VIEWED
NATIONAL_HUB_VIEWED
FOUNDING_OPPORTUNITY_VIEWED
BACKER_STATUS_GRANTED
FOUNDING_STATUS_GRANTED
```

#### 11.2 Cache Strategy

```
uk-hub:national — 5 min TTL
uk-hub:city:{slug} — 5 min TTL
uk-hub:map — 5 min TTL
uk-hub:map:location:{id} — 5 min TTL
```

#### 11.3 Files to Create

| File |
|------|
| `apps/api/src/services/hub-analytics.service.ts` |
| `apps/api/src/services/hub-cache.service.ts` |
| `apps/web/src/lib/analytics.ts` — frontend event emitter |

---

### PHASE 12: Demo Data & Visual QA
**Spec:** Part 13 (13.1-13.8)
**Dependencies:** Phase 1-10
**Estimated Scope:** Seed data + cross-device validation

#### 12.1 Demo States Required

| Entity | States to Demonstrate |
|--------|----------------------|
| Cities | Needs Activation, Making Progress, Active |
| Hierarchy | National → City → Borough → High Street |
| Campaigns | National, City, Open, Closed |
| Founding | Business Open, Consumer Limited, Closed |
| Backers | Different recognition types |
| Map | All three status colors |
| Community | Announcements, events, milestones |

---

### PHASE 13: Integration, QA & Hardening
**Spec:** Part 14 (Batch M)
**Dependencies:** All previous phases
**Estimated Scope:** Final validation

#### 13.1 Validation Checklist

- [ ] RBAC: All Admin endpoints require correct role
- [ ] Campaign lifecycle: Existing functionality unbroken
- [ ] Financial: GBP, minor units, no double-counting
- [ ] API boundaries: Clean separation
- [ ] Mobile: All pages responsive
- [ ] Accessibility: Keyboard, screen reader, reduced motion
- [ ] Deep linking: All routes work with direct access
- [ ] Caching: Invalidation works correctly
- [ ] Demo/production: Clear separation maintained

---

## DEPENDENCY GRAPH

```
Phase 1 (HubLocation)
 ├── Phase 2 (Projections & Routing)
 │    ├── Phase 7 (National Hub)
 │    ├── Phase 8 (City Hub)
 │    └── Phase 9 (UK Map)
 ├── Phase 3 (Activation Lifecycle)
 │    └── Phase 7, 8
 ├── Phase 4 (Campaign/Location)
 │    ├── Phase 5 (Founding Member)
 │    │    └── Phase 7, 8
 │    └── Phase 6 (Backer Status)
 │         └── Phase 7, 8
 └── Phase 10 (Admin)
      └── Phase 11 (Analytics & Caching)
           └── Phase 12 (Demo Data)
                └── Phase 13 (QA & Hardening)
```

## PARALLEL OPPORTUNITIES

- Phase 3 can run alongside Phase 4
- Phase 5 and Phase 6 can run in parallel
- Phase 7 and Phase 8 can run in parallel (shared components)
- Phase 9 can run alongside Phase 7/8 (independent map)
- Frontend components can be built with demo data before backend is complete

---

## FILE COUNT SUMMARY

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Prisma Schema | 0 | 1 |
| Backend Services | 7 | 2 |
| Backend Routes | 3 | 2 |
| Backend Seed | 1 | 1 |
| Frontend Pages | 4 | 3 |
| Frontend Components (Hub) | 30+ | 3 |
| Frontend Components (Admin) | 8 | 0 |
| Frontend Lib/Utils | 2 | 0 |
| **TOTAL** | **~55** | **~12** |

---

## ESTIMATED EFFORT

| Phase | Scope | Estimated |
|-------|-------|-----------|
| 1 | HubLocation Data Model | Foundation |
| 2 | Projections & Routing | Foundation |
| 3 | Activation Lifecycle | Extension |
| 4 | Campaign/Location | Extension |
| 5 | Founding Member | New System |
| 6 | Backer Status | New System |
| 7 | National Hub | Full Page |
| 8 | City Hub | Full Page |
| 9 | UK Map | Refactor + Extend |
| 10 | Admin | CRUD Screens |
| 11 | Analytics & Caching | Infrastructure |
| 12 | Demo Data | Seed + QA |
| 13 | QA & Hardening | Validation |
