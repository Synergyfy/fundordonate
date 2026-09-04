# FUNDORDONATE — UK HUB ACTIVATION
# COMPLETE PRODUCT, SYSTEM & IMPLEMENTATION SPECIFICATION

# REMAINING PARTS 6–14

---

# PART 6 — CITY LAUNCH & ACTIVATION LIFECYCLE

## 6.1 Purpose

The City Launch and Activation Lifecycle defines how a UK City Hub moves from being identified as a potential location through to becoming an active part of the FundOrDonate UK Hub network.

A City must not simply appear as:

> “Active” or “Inactive”.

The system must support a controlled lifecycle showing where a city currently is within its activation journey.

The lifecycle connects:

- Location architecture.
- City funding targets.
- Campaign activity.
- Founding Member opportunities.
- Backer participation.
- Local business participation.
- Consumer participation.
- Internal activation planning.
- National Hub reporting.

The public-facing status and the internal operational lifecycle must remain related but distinct.

---

## 6.2 Core City Activation Principle

The lifecycle should follow this broad progression:

```text
IDENTIFIED
    ↓
PREPARING
    ↓
NEEDS ACTIVATION
    ↓
LAUNCHING
    ↓
MAKING PROGRESS
    ↓
ACTIVATING
    ↓
ACTIVE
    ↓
EXPANDING
```

Not every internal stage needs to be publicly visible.

The public system should remain simple and understandable.

The primary public statuses remain:

```text
NEEDS ACTIVATION
```

```text
MAKING PROGRESS
```

```text
ACTIVE
```

Internal stages can provide the operational detail required by Admin.

---

## 6.3 Internal City Activation Lifecycle

Recommended internal lifecycle:

### Stage 1 — Identified

The City exists within the internal UK location database.

At this stage:

- Population information may be available.
- City activation calculations may exist.
- The city may not yet be publicly visible.
- No public campaign is required.
- No Founding opportunity is required.

This is an internal planning state.

---

### Stage 2 — Preparing

The City is being prepared for possible activation.

The team may:

- Validate location information.
- Review population data.
- Calculate indicative resource requirements.
- Configure potential campaigns.
- Prepare Founding Member programmes.
- Identify launch requirements.

The City may remain unpublished.

---

### Stage 3 — Needs Activation

The City is publicly identified as a location requiring activation.

The City may now have:

- A public City Hub.
- A location status.
- An introductory description.
- A progress state.
- Calls to action.
- Future or current participation opportunities.

The public status is:

```text
NEEDS_ACTIVATION
```

The City does not need to have every programme active before becoming visible.

---

### Stage 4 — Launching

The City is entering its public launch period.

Possible activity includes:

- Launch campaigns.
- Founding Member opportunities opening.
- Business participation.
- Consumer participation.
- Local promotion.
- Community announcements.

Internally this may be a distinct lifecycle state.

Publicly it may appear as:

```text
MAKING_PROGRESS
```

---

### Stage 5 — Making Progress

The City has measurable activation activity.

Examples may include:

- Campaign participation.
- Founding allocation progress.
- Local business engagement.
- Consumer participation.
- Community activity.
- Activation milestones.

Public status:

```text
MAKING_PROGRESS
```

The system must not automatically assume that one metric alone determines this status.

---

### Stage 6 — Activating

The City is approaching its required activation criteria.

This is an operational stage that may involve:

- Reviewing funding.
- Reviewing resource requirements.
- Reviewing participation.
- Preparing local activity.
- Preparing Borough or Local Area expansion.

Publicly, the City may still show:

```text
MAKING_PROGRESS
```

until it is approved as active.

---

### Stage 7 — Active

The City Hub is operating as an active part of the UK Hub network.

Public status:

```text
ACTIVE
```

The City may now contain:

- Active campaigns.
- Community activity.
- Events.
- Local announcements.
- Founding Members.
- Backers.
- Business participation.
- Consumer participation.

---

### Stage 8 — Expanding

An active City may begin deeper geographic activation.

For example:

```text
CITY
   ↓
BOROUGH
   ↓
LOCAL AREA
   ↓
HIGH STREET
```

Expansion does not mean the City is no longer active.

It is an additional operational lifecycle.

---

# 6.4 CITY ACTIVATION STATE VS PUBLIC STATUS

The system must separate:

```text
Internal Lifecycle State
```

from:

```text
Public Hub Status
```

For example:

```text
Internal:
PREPARING

Public:
Not Visible
```

or:

```text
Internal:
LAUNCHING

Public:
MAKING_PROGRESS
```

or:

```text
Internal:
ACTIVATING

Public:
MAKING_PROGRESS
```

This prevents the public system from exposing unnecessary internal operational complexity.

---

# 6.5 CITY LAUNCH REQUIREMENTS

Before a City becomes publicly launchable, Admin should be able to validate whether the minimum required information exists.

At minimum:

- Location identity.
- Slug.
- Location type.
- Parent relationship where applicable.
- Public visibility.
- Public status.
- Basic City description.
- Geographic information where map visibility is enabled.

Depending on the launch configuration, additional requirements may include:

- Campaign configuration.
- Founding programme configuration.
- Activation target.
- Progress configuration.

These must remain Admin-configurable.

---

# 6.6 CITY LAUNCH MODEL

The launch model should be reusable.

The system must not create a custom application flow for every UK City.

The architecture should support:

```text
CITY HUB TEMPLATE
        +
CITY LOCATION DATA
        +
CITY CONFIGURATION
        +
CITY CAMPAIGNS
        +
CITY FOUNDING PROGRAMMES
        =
CITY HUB INSTANCE
```

The same reusable system should serve:

- London.
- Birmingham.
- Manchester.
- Liverpool.
- Leeds.
- Bristol.
- Glasgow.
- Edinburgh.

and future locations.

---

# 6.7 CITY LAUNCH CAMPAIGN FLOW

A City launch may involve one or more reusable campaigns.

Example:

```text
CITY SELECTED
      ↓
LAUNCH CAMPAIGN CONFIGURED
      ↓
LOCATION ATTACHED
      ↓
CAMPAIGN OPENS
      ↓
PARTICIPATION BEGINS
      ↓
PROGRESS TRACKED
      ↓
CITY ACTIVATION REVIEWED
```

Campaigns must not be permanently hardcoded to a specific city.

The campaign architecture defined in Part 5 must allow location-based campaign instances.

---

# 6.8 CITY LAUNCH AND FOUNDING MEMBERS

A City launch can also contain Founding Member opportunities.

Example:

```text
CITY LAUNCH
      │
      ├── Founding Business Members
      │
      └── Founding Consumer Members
```

These opportunities may:

- Open before the City becomes Active.
- Remain open during Making Progress.
- Close according to allocation or Admin rules.
- Contribute to City activation evidence where configured.

The Founding Member programme itself is defined fully in Part 8.

---

# 6.9 CITY ACTIVATION PROGRESS

The system must support an activation progress model without forcing every City to use the same visible calculation.

Possible activation components include:

- Founding allocation progress.
- Campaign funding progress.
- Resource readiness.
- Local participation.
- Operational milestones.

The system should allow Admin/internal services to determine:

```text
activationProgress
```

through configured rules or manually approved milestones.

Publicly, the City should receive a projection rather than raw internal calculations.

---

# 6.10 ACTIVATION MILESTONES

The internal system should support milestones.

Example:

```text
Milestone 1
City Prepared
```

```text
Milestone 2
Launch Open
```

```text
Milestone 3
Founding Participation Started
```

```text
Milestone 4
Activation Progress Achieved
```

```text
Milestone 5
City Activated
```

Milestones must be configurable rather than permanently hardcoded.

---

# 6.11 CITY ACTIVATION EVENTS

The system should record significant lifecycle events.

Examples:

```text
CITY_CREATED
```

```text
CITY_PUBLISHED
```

```text
CITY_LAUNCH_OPENED
```

```text
CITY_CAMPAIGN_OPENED
```

```text
FOUNDING_PROGRAMME_OPENED
```

```text
CITY_STATUS_CHANGED
```

```text
CITY_ACTIVATED
```

These events provide:

- Audit history.
- Admin visibility.
- Activity feeds.
- Analytics.
- Operational reporting.

---

# 6.12 NATIONAL HUB INTEGRATION

The National Hub aggregates City lifecycle information.

For example:

```text
TOTAL CITIES
```

```text
NEEDS ACTIVATION
```

```text
MAKING PROGRESS
```

```text
ACTIVE
```

The National Hub must derive these values from City data rather than maintain a manually entered statistics section.

---

# 6.13 CITY LAUNCH GOVERNANCE

A City should not automatically become Active merely because:

- A funding target is reached.
- A campaign succeeds.
- A number of people join.

The activation decision may require operational approval.

Recommended model:

```text
AUTOMATED DATA
      +
CONFIGURED RULES
      ↓
ACTIVATION REVIEW
      ↓
ADMIN APPROVAL
      ↓
ACTIVE
```

This prevents accidental lifecycle changes.

---

# 6.14 CITY ACTIVATION ROUTES

The canonical City route remains:

```text
/uk-hub-activation/:citySlug
```

City launch and activation information should be displayed within the same reusable City Hub architecture.

The system should not create separate standalone launch websites for every City.

---

# PART 7 — INTERACTIVE UK MAP

## 7.1 Purpose

The Interactive UK Map is the geographic discovery and navigation layer for the UK Hub Activation system.

It allows users to:

- Discover participating locations.
- Understand activation status.
- Explore City Hubs.
- Find local opportunities.
- Discover campaigns.
- Discover Founding opportunities.
- Drill into deeper geographic structures where available.

The Map is not a separate location management system.

It reads the same underlying:

```text
HubLocation
+
CampaignLocation
+
FoundingProgramme
+
HubProgress
+
HubActivity
```

architecture used by the rest of the UK Hub system.

---

## 7.2 National Map

Primary route:

```text
/uk-hub-activation/map
```

The National Map displays UK-wide location activity.

It should support:

- Cities.
- Activation statuses.
- Progress summaries.
- Search.
- Filters.
- Location selection.

---

## 7.3 City-Level Map

A City may optionally support a deeper map.

Example:

```text
London
   ↓
Boroughs
   ↓
Local Areas
   ↓
High Streets
```

Possible route:

```text
/uk-hub-activation/:citySlug/map
```

This should only be enabled where meaningful child-location geographic data exists.

---

## 7.4 Geographic Data

Map-visible locations require sufficient geographic information.

At minimum:

```text
latitude
longitude
```

The architecture should also support future:

```text
POLYGON
```

or other geographic boundary data.

Geographic geometry must remain separate from hierarchy.

Hierarchy is determined by:

```text
parentId
```

not by visual map placement.

---

## 7.5 Public Location Statuses

The primary public statuses remain:

```text
NEEDS_ACTIVATION
```

```text
MAKING_PROGRESS
```

```text
ACTIVE
```

The Map must not independently calculate status.

It consumes:

```text
effectiveStatus
```

from the UK Hub domain service.

---

## 7.6 Status Legend

The Map must provide an understandable legend.

Status must not rely only on colour.

Each status should be identifiable through:

- Text.
- Label.
- Marker shape.
- Icon.
- Accessible description.

---

## 7.7 Marker Interaction

Interaction flow:

```text
USER SELECTS LOCATION
        ↓
LOCATION INFORMATION PANEL
        ↓
USER SELECTS ACTION
```

Selecting a marker should normally not immediately navigate away.

---

## 7.8 Location Information Panel

The panel should contain:

- Location name.
- Location type.
- Parent context.
- Public status.
- Short description.
- Progress summary.
- Campaign summary where applicable.
- Founding opportunity summary where applicable.
- Primary CTA.

Example CTA:

```text
Explore Hub
```

or:

```text
Explore Location
```

---

## 7.9 Campaign Linkage

Campaigns remain attached through the reusable campaign/location relationship.

The Map should normally show:

```text
Location
   ↓
Campaign Summary
```

rather than creating one marker for every campaign.

This prevents visual overload.

---

## 7.10 Progress Display

The Map must keep different progress systems separate.

These may include:

```text
Activation Progress
```

```text
Campaign Funding Progress
```

```text
Founding Allocation Progress
```

They must not be merged into a misleading single percentage.

---

## 7.11 Founding Opportunity Display

The Map should indicate whether a location currently has:

- Business Founding opportunities.
- Consumer Founding opportunities.
- Both.
- No current opportunity.

Availability may include:

```text
OPENING_SOON
OPEN
LIMITED
FULLY_ALLOCATED
CLOSED
```

---

## 7.12 Geographic Drill-Down

The Map supports:

```text
UK
 ↓
CITY
 ↓
BOROUGH
 ↓
LOCAL AREA
 ↓
HIGH STREET
```

where those location levels exist.

The drill-down is data-driven.

Not every City must have every level.

---

## 7.13 Map Filters

Recommended filters:

```text
All Locations
```

```text
Needs Activation
```

```text
Making Progress
```

```text
Active
```

Additional filters:

```text
Campaigns Available
```

```text
Founding Opportunities Available
```

```text
Business Opportunities
```

```text
Consumer Opportunities
```

Filters should be API/query-driven.

---

## 7.14 Map Search

Search must support canonical location data.

Searchable fields may include:

- City.
- Borough.
- Local Area.
- High Street.

Results should display:

```text
Location Name
Location Type
Parent Context
Status
```

Selecting a result should:

```text
FOCUS LOCATION
```

then:

```text
OPEN LOCATION PANEL
```

---

## 7.15 Deep Linking

Selected location state must be shareable.

Example:

```text
/uk-hub-activation/map?location=manchester
```

Filters should also be recoverable from the URL.

Example:

```text
/uk-hub-activation/map?status=MAKING_PROGRESS
```

---

## 7.16 Map/List View

The Map must always have a non-map alternative.

Users must be able to switch between:

```text
MAP VIEW
```

and:

```text
LIST VIEW
```

The List View uses the same API projection.

---

## 7.17 Accessibility

The Map must support:

- Keyboard navigation where supported.
- Accessible labels.
- Text status.
- Focus management.
- Non-map List View.
- Search as an alternative to manual map navigation.

No essential information may exist only visually.

---

## 7.18 Mobile Behaviour

Mobile structure:

```text
HEADER
   ↓
SEARCH
   ↓
FILTER
   ↓
MAP
   ↓
LOCATION BOTTOM SHEET
```

The desktop side panel becomes a mobile bottom sheet.

Filters should not permanently occupy map space.

---

## 7.19 API Projection

Conceptual API:

```text
GET /api/uk-hub/map
```

Returns a lightweight projection.

Each location may include:

```text
id
name
slug
type
parent
latitude
longitude
effectiveStatus
progressSummary
campaignSummary
foundingSummary
mapVisibility
```

Location detail should be fetched separately where necessary.

---

## 7.20 Caching

Recommended cache projections:

```text
uk-map:national
```

```text
uk-map:scope:{locationId}
```

```text
uk-map:location:{locationId}
```

Invalidate affected projections when:

- Status changes.
- Visibility changes.
- Geographic data changes.
- Campaign availability changes.
- Founding availability changes.
- Relevant progress changes.

---

## 7.21 Query Analytics

Track useful aggregate interactions.

Examples:

```text
map_viewed
map_scope_changed
map_location_selected
map_search_performed
map_filter_applied
map_location_explored
map_hub_cta_clicked
```

Analytics may inform internal activation planning but must not automatically change location status.

---

# PART 8 — FOUNDING MEMBER SYSTEM

## 8.1 Purpose

The Founding Member system creates structured early-participation programmes attached to the National Hub or specific locations.

There are two primary audiences:

```text
FOUNDING BUSINESS MEMBERS
```

and:

```text
FOUNDING CONSUMER MEMBERS
```

The Founding Member system must be reusable.

It must not require a custom implementation for every City.

---

## 8.2 Core Architecture

```text
FOUNDING PROGRAMME TEMPLATE
        +
LOCATION
        +
AUDIENCE
        +
ALLOCATION RULES
        +
BENEFITS
        +
OPEN/CLOSE RULES
        =
FOUNDING PROGRAMME
```

---

## 8.3 Founding Programme Scope

A programme may attach to:

```text
NATIONAL HUB
```

or:

```text
CITY
```

or, where required:

```text
BOROUGH
LOCAL AREA
HIGH STREET
```

The location architecture determines scope.

---

## 8.4 Founding Business Members

Businesses can participate in configured programmes attached to a location.

The programme may define:

- Maximum allocation.
- Eligibility.
- Participation contribution.
- Benefits.
- Recognition.
- Access.
- Events.
- Early opportunities.

Benefits must be configuration-driven.

---

## 8.5 Founding Consumer Members

Consumers may participate in separate or shared location programmes.

The system may define:

- Maximum allocation.
- Eligibility.
- Contribution requirements.
- Benefits.
- Recognition.
- Community access.
- Events.
- Voting opportunities.
- Trials.
- Early access.

---

## 8.6 Contribution Rules

The contribution model must not be hardcoded.

A Founding programme should support configuration of:

```text
contributionRequired
```

```text
contributionType
```

```text
minimumContribution
```

```text
maximumAllocation
```

Contribution may connect to a FundOrDonate campaign where appropriate.

The Founding programme itself should not duplicate the payment/funding engine.

---

## 8.7 Campaign Connection

Recommended architecture:

```text
FOUNDING PROGRAMME
        ↓
OPTIONAL CAMPAIGN LINK
        ↓
PARTICIPATION / CONTRIBUTION
```

This allows the programme to use the existing campaign and funding architecture.

---

## 8.8 Allocation

A programme should support:

```text
totalAllocation
```

```text
allocatedCount
```

```text
remainingAllocation
```

Allocation rules may differ between:

- Business.
- Consumer.
- National.
- City.

The formula must remain configurable.

---

## 8.9 Founding Status Lifecycle

Recommended lifecycle:

```text
DRAFT
```

```text
SCHEDULED
```

```text
OPEN
```

```text
LIMITED
```

```text
FULLY_ALLOCATED
```

```text
CLOSED
```

```text
ARCHIVED
```

---

## 8.10 Open/Close Logic

A programme may close because:

- Admin closes it.
- End date is reached.
- Allocation is filled.
- Campaign rules complete.
- Location lifecycle changes.

The system should support multiple closure conditions without requiring custom frontend logic.

---

## 8.11 Founding Benefits

Benefits may include:

- Founding recognition.
- Early access.
- Trials.
- Voting opportunities.
- Events.
- Priority participation.
- Community recognition.

Benefits must be represented as configurable programme data.

They must not be embedded as hardcoded text throughout the frontend.

---

## 8.12 Voting and Early Access

Where Henry's model requires:

- Voting.
- Trials.
- Early access.

these should be represented as programme benefits or entitlements.

The Founding Member record may therefore connect to:

```text
Benefit
```

```text
Entitlement
```

```text
Access Window
```

rather than creating one-off features for each programme.

---

## 8.13 Events

Founding programmes may connect members to events.

Architecture:

```text
FOUNDING PROGRAMME
        ↓
EVENT / ACTIVITY
```

Events may be:

- National.
- City-specific.
- Audience-specific.

---

## 8.14 Founding Recognition

Recognition should be visible where appropriate.

Examples:

```text
Founding Business Member
```

```text
Founding Consumer Member
```

Recognition is distinct from Backer Status.

A user may potentially have both:

```text
FOUNDING MEMBER STATUS
```

and:

```text
BACKER STATUS
```

depending on participation.

---

# PART 9 — BACKER STATUS SYSTEM

## 9.1 Purpose

Backer Status is a recognition and participation status connected to campaign participation.

It should be distinct from:

- User role.
- Founding Member status.
- Membership plan.
- Payment status.

Backer Status recognises participation within the FundOrDonate ecosystem.

---

## 9.2 Core Principle

The system must support Henry's requirement that certain campaign/package participation can provide Backer Status.

The architecture should not hardcode:

```text
Bronze = Backer
```

or:

```text
Silver = Not Backer
```

as permanent business rules.

Instead, eligibility must be configurable through campaign/package configuration.

---

## 9.3 Standard and Pro Relationship

Where campaign/package configuration specifies that:

```text
STANDARD
```

or:

```text
PRO
```

provides Backer Status, the campaign configuration should determine eligibility.

Example concept:

```text
Campaign Package
     ↓
benefitConfiguration
     ↓
grantsBackerStatus = true
```

---

## 9.4 Backer Status Record

Conceptually:

```text
BackerStatus
```

should record:

- User.
- Status type.
- Source campaign or programme.
- Source participation.
- Granted date.
- Recognition scope.
- Current validity where applicable.

---

## 9.5 Recognition

Backer recognition may include:

- Badge.
- Profile recognition.
- Campaign acknowledgement.
- Hub acknowledgement.

The exact public visibility must be configurable.

Users should not be publicly exposed without appropriate participation/display settings.

---

## 9.6 Backer Status Badge

The badge should be driven by:

```text
BackerStatus configuration
```

rather than hardcoded into campaign UI.

Possible display:

```text
BACKER
```

or more specific configured recognition.

---

## 9.7 Relationship to Founding Status

A user may be:

```text
FOUNDING MEMBER
```

without automatically being:

```text
BACKER
```

unless the programme rules grant both.

Likewise:

```text
BACKER
```

does not automatically mean:

```text
FOUNDING MEMBER
```

The systems remain distinct.

---

## 9.8 Backer Status Journey

```text
USER PARTICIPATES
        ↓
PARTICIPATION VALIDATED
        ↓
ELIGIBILITY RULE CHECKED
        ↓
BACKER STATUS GRANTED
        ↓
RECOGNITION DISPLAYED
```

Eligibility rules must be evaluated server-side.

---

# PART 10 — ADMIN ARCHITECTURE

## 10.1 Purpose

Admin must control the UK Hub system without requiring code changes for normal business operations.

Admin architecture must cover:

- Locations.
- City lifecycle.
- Campaigns.
- Campaign templates.
- Founding programmes.
- Backer configuration.
- Progress.
- Status.
- Public content.
- Map configuration.
- Events and activity.

---

## 10.2 Location Management

Admin should manage:

```text
Location Name
Slug
Type
Parent
Visibility
Description
Geographic Data
Public Status
```

Location hierarchy must be managed through relationships.

Admin must not need to create new frontend pages for each City.

---

## 10.3 Location Types

Admin should support the location types established in Part 2:

```text
NATIONAL
CITY
BOROUGH
LOCAL_AREA
HIGH_STREET
```

Required and optional usage should follow the location hierarchy rules.

---

## 10.4 City Lifecycle Management

Admin should manage:

```text
Internal Lifecycle
```

and:

```text
Public Status
```

separately where required.

Changes should be auditable.

---

## 10.5 Campaign Administration

Admin must be able to:

- Create campaign templates.
- Configure campaign types.
- Configure funding models.
- Configure seasonal campaign options.
- Configure packages.
- Attach campaigns to locations.
- Open campaigns.
- Close campaigns.
- Manage benefits.
- Configure eligibility.

---

## 10.6 Founding Programme Administration

Admin must be able to:

- Create programmes.
- Select audience.
- Attach locations.
- Configure allocations.
- Configure contributions.
- Configure benefits.
- Configure opening and closing.
- Link campaigns.
- Monitor participation.

---

## 10.7 Backer Status Administration

Admin configuration should determine:

- Which campaign participation grants status.
- Recognition labels.
- Badge configuration.
- Visibility rules.
- Validity rules where required.

---

## 10.8 Progress Administration

Admin should be able to configure or review:

- Progress targets.
- Progress source.
- Milestones.
- Public display.
- Manual overrides where authorised.

Manual override must not destroy historical audit information.

---

## 10.9 Map Administration

Admin controls:

```text
mapVisible
```

```text
latitude
```

```text
longitude
```

and future geometry.

Admin may also manage:

- Display priority.
- Featured locations.
- Public publication.

---

## 10.10 National Hub Administration

Admin should configure:

- Featured Cities.
- Launching Cities.
- National campaigns.
- National Founding opportunities.
- National announcements.
- Community/activity content.

---

## 10.11 City Hub Administration

City configuration should support:

- Hero identity.
- Description.
- Images.
- Public status.
- Campaign visibility.
- Founding opportunities.
- Activity.
- Announcements.
- Events.
- Featured content.

The reusable City Hub template renders this configuration.

---

## 10.12 Permissions

Admin permissions should use the existing FundOrDonate RBAC architecture.

Do not create a separate unconnected UK Hub permission system.

Relevant permissions may include:

```text
LOCATION_VIEW
LOCATION_MANAGE
LOCATION_PUBLISH
```

```text
CAMPAIGN_MANAGE
```

```text
FOUNDING_PROGRAMME_MANAGE
```

```text
HUB_STATUS_MANAGE
```

```text
MAP_CONFIGURE
```

```text
HUB_CONTENT_MANAGE
```

---

# PART 11 — DATA & SERVICE ARCHITECTURE

## 11.1 Core Principle

The UK Hub system must extend the existing FundOrDonate architecture.

It must not replace:

- Existing campaign engine.
- Authentication.
- RBAC.
- Funding models.
- Payment architecture.
- Existing lifecycle controls.

---

## 11.2 Core Domain Model

Primary entities:

```text
HubLocation
```

```text
Campaign
```

```text
CampaignLocation
```

```text
FoundingProgramme
```

```text
FoundingMembership
```

```text
BackerStatus
```

```text
HubProgress
```

```text
HubActivity
```

```text
HubEvent
```

```text
LocationStatusHistory
```

---

## 11.3 HubLocation

Conceptual fields:

```text
id
name
slug
type
parentId
description
publicStatus
internalLifecycle
isPublic
mapVisible
latitude
longitude
createdAt
updatedAt
```

The model should remain extensible.

---

## 11.4 CampaignLocation

This creates the reusable relationship between campaigns and geography.

Conceptually:

```text
campaignId
locationId
relationshipType
visibility
```

Relationship types may support:

```text
PRIMARY
```

```text
LOCAL
```

```text
NATIONAL
```

```text
FEATURED
```

The exact final enum should follow implementation needs.

---

## 11.5 FoundingProgramme

Conceptual fields:

```text
id
locationId
audience
status
title
description
totalAllocation
allocatedCount
opensAt
closesAt
campaignId
configuration
```

Benefits and rules should remain configurable.

---

## 11.6 BackerStatus

Conceptual fields:

```text
id
userId
statusType
sourceCampaignId
sourceParticipationId
grantedAt
visibility
metadata
```

---

## 11.7 Service Architecture

Recommended services:

```text
LocationService
```

```text
HubStatusService
```

```text
HubProgressService
```

```text
CampaignLocationService
```

```text
FoundingProgrammeService
```

```text
FoundingEligibilityService
```

```text
BackerStatusService
```

```text
UKHubProjectionService
```

```text
UKHubMapService
```

---

## 11.8 Projection Architecture

Public frontend experiences should receive purpose-built projections.

Example:

```text
RAW DOMAIN DATA
       ↓
PROJECTION SERVICE
       ↓
PUBLIC DTO
       ↓
FRONTEND
```

This prevents frontend reconstruction of business rules.

---

## 11.9 API Structure

Conceptual public endpoints:

```text
GET /api/uk-hub
```

```text
GET /api/uk-hub/locations
```

```text
GET /api/uk-hub/locations/:slug
```

```text
GET /api/uk-hub/map
```

```text
GET /api/uk-hub/map/locations/:id
```

Campaign endpoints should continue using the existing campaign API architecture where possible.

---

## 11.10 Caching

Cache:

- National Hub projections.
- City Hub projections.
- Map projections.
- Location detail projections.

Invalidate selectively when source data changes.

---

## 11.11 Analytics Architecture

Analytics events should be emitted without placing analytics business logic inside UI components.

Use a consistent event service.

Events may include:

- Hub viewed.
- Location viewed.
- Campaign discovered.
- Founding opportunity viewed.
- Map searched.
- Map filtered.
- Participation journey started.

---

# PART 12 — USER JOURNEYS

## 12.1 National Discovery Journey

```text
USER ARRIVES
      ↓
FUNDORDONATE
      ↓
UK HUB ACTIVATION
      ↓
SEES NATIONAL ACTIVITY
      ↓
SELECTS CITY
      ↓
CITY HUB
      ↓
CAMPAIGN / FOUNDING OPPORTUNITY
      ↓
PARTICIPATION
```

---

## 12.2 Map Discovery Journey

```text
USER OPENS MAP
      ↓
SEARCHES / FILTERS
      ↓
SELECTS LOCATION
      ↓
VIEWS STATUS
      ↓
VIEWS OPPORTUNITIES
      ↓
EXPLORES HUB
```

---

## 12.3 Campaign Journey

```text
USER DISCOVERS LOCATION
      ↓
VIEWS CAMPAIGN
      ↓
UNDERSTANDS PURPOSE
      ↓
SELECTS PARTICIPATION
      ↓
COMPLETES FUND / DONATE FLOW
      ↓
PARTICIPATION CONFIRMED
      ↓
RELEVANT STATUS / BENEFIT GRANTED
```

---

## 12.4 Founding Business Journey

```text
BUSINESS USER
      ↓
DISCOVERS CITY
      ↓
VIEWS FOUNDING BUSINESS OPPORTUNITY
      ↓
REVIEWS BENEFITS
      ↓
REVIEWS CONTRIBUTION
      ↓
JOINS / PARTICIPATES
      ↓
ELIGIBILITY CONFIRMED
      ↓
FOUNDING BUSINESS STATUS GRANTED
```

---

## 12.5 Founding Consumer Journey

```text
CONSUMER
      ↓
CITY HUB / MAP / CAMPAIGN
      ↓
FOUNDING CONSUMER OPPORTUNITY
      ↓
BENEFITS
      ↓
PARTICIPATION
      ↓
VALIDATION
      ↓
FOUNDING STATUS
```

---

## 12.6 Backer Journey

```text
USER PARTICIPATES IN ELIGIBLE CAMPAIGN
       ↓
PARTICIPATION VALIDATED
       ↓
BACKER ELIGIBILITY CHECKED
       ↓
BACKER STATUS GRANTED
       ↓
BADGE / RECOGNITION AVAILABLE
```

---

## 12.7 City Activation Admin Journey

```text
ADMIN CREATES LOCATION
       ↓
CONFIGURES CITY
       ↓
SETS LIFECYCLE
       ↓
CONFIGURES CAMPAIGNS
       ↓
CONFIGURES FOUNDING PROGRAMMES
       ↓
PUBLISHES CITY
       ↓
MONITORS PROGRESS
       ↓
REVIEWS ACTIVATION
       ↓
APPROVES ACTIVE STATUS
```

---

# PART 13 — DEMO / SEED DATA REQUIREMENTS

## 13.1 Core Requirement

Demo and seed data must be realistic presentation and QA data.

It must never become:

- Hardcoded production business rules.
- Permanent production configuration.
- Replacement for Admin-managed data.

---

## 13.2 National Demo Data

Include:

- National Hub.
- Multiple City Hubs.
- Different activation statuses.
- Featured Cities.
- Launching Cities.
- National campaigns.
- National Founding opportunities.
- Activity examples.

---

## 13.3 City Status Demonstration

At minimum demonstrate:

```text
CITY A
NEEDS ACTIVATION
```

```text
CITY B
MAKING PROGRESS
```

```text
CITY C
ACTIVE
```

---

## 13.4 Hierarchy Demonstration

At least one City must demonstrate:

```text
CITY
 ├── BOROUGH
 │      ├── LOCAL AREA
 │      └── HIGH STREET
 │
 └── BOROUGH
```

This validates reusable hierarchy behaviour.

---

## 13.5 Campaign Demo Data

Demonstrate:

- National campaign.
- City campaign.
- Location campaign.
- Different funding models.
- Open campaign.
- Closed campaign.
- Seasonal/package-configured campaign where applicable.
- Campaign granting Backer Status.

---

## 13.6 Founding Demo Data

Demonstrate:

- Founding Business programme.
- Founding Consumer programme.
- Open programme.
- Limited programme.
- Fully allocated programme.
- Closed programme.

---

## 13.7 Map Demo Data

Demonstrate:

- Search.
- Status filters.
- Campaign filters.
- Founding filters.
- City selection.
- Child-location drill-down.
- List View.

---

## 13.8 Activity Demo Data

Include realistic:

- Announcements.
- Events.
- Community activity.
- Launch activity.

This allows visual QA across the National and City Hub experiences.

---

# PART 14 — IMPLEMENTATION BATCHES

The implementation should be delivered in controlled batches.

The UK Hub system should not be attempted as one uncontrolled frontend rewrite.

---

## BATCH A — FOUNDATION & LOCATION DOMAIN

Build:

- HubLocation model.
- Location hierarchy.
- Location types.
- Parent/child relationships.
- Location services.
- Location API.
- Seed hierarchy.

Validate:

- National → City.
- City → Borough.
- Borough → Local Area.
- Local Area → High Street.

---

## BATCH B — HUB PROJECTIONS & ROUTING

Build:

- National Hub projection.
- City Hub projection.
- Canonical routes.
- Location resolution.
- Breadcrumb architecture.

Routes:

```text
/uk-hub-activation
```

```text
/uk-hub-activation/:locationSlug
```

---

## BATCH C — CITY ACTIVATION LIFECYCLE

Build:

- Internal lifecycle.
- Public status.
- Activation milestones.
- Status history.
- Admin lifecycle controls.
- Activation progress projection.

---

## BATCH D — REUSABLE CAMPAIGN / LOCATION INTEGRATION

Extend the existing campaign engine with:

- CampaignLocation.
- National campaign support.
- Location campaign support.
- Hub campaign projections.
- Campaign discovery integration.

Do not replace existing FundOrDonate campaign functionality.

---

## BATCH E — FOUNDING MEMBER SYSTEM

Build:

- FoundingProgramme.
- Business audience.
- Consumer audience.
- Allocation.
- Benefits.
- Open/close lifecycle.
- Campaign integration.
- Recognition.

---

## BATCH F — BACKER STATUS SYSTEM

Build:

- Eligibility configuration.
- Server-side eligibility evaluation.
- BackerStatus record.
- Recognition.
- Badge rendering.
- Campaign/package integration.

---

## BATCH G — NATIONAL HUB EXPERIENCE

Implement:

- National overview.
- National progress.
- City discovery.
- Featured Cities.
- Launching Cities.
- National campaigns.
- National Founding opportunities.
- Activity.

---

## BATCH H — REUSABLE CITY HUB EXPERIENCE

Implement:

- City hero.
- Identity.
- Status.
- Progress.
- Campaigns.
- Founding opportunities.
- Backers.
- Local activity.
- Events.
- Announcements.

Ensure one reusable page serves all Cities.

---

## BATCH I — INTERACTIVE UK MAP

Implement:

- Map projection.
- Geographic data.
- Markers.
- Status legend.
- Search.
- Filters.
- Location panel.
- Drill-down.
- List View.
- Deep links.

---

## BATCH J — ADMIN UK HUB MANAGEMENT

Implement Admin management for:

- Locations.
- Hierarchy.
- Status.
- Lifecycle.
- Map data.
- Campaign attachments.
- Founding programmes.
- Featured locations.
- Public content.

---

## BATCH K — ANALYTICS & CACHING

Implement:

- Hub analytics.
- Map analytics.
- Location discovery analytics.
- Projection caching.
- Cache invalidation.

---

## BATCH L — DEMO DATA & VISUAL QA

Create realistic:

- National data.
- City data.
- Location hierarchy.
- Campaigns.
- Founding programmes.
- Backer status examples.
- Events.
- Activity.
- Map scenarios.

Validate:

- Desktop.
- Tablet.
- Mobile.
- Empty states.
- Loading states.
- Filtered states.
- Closed programme states.

---

## BATCH M — INTEGRATION, QA & HARDENING

Final validation:

- RBAC.
- Existing campaign lifecycle compatibility.
- Financial calculation integrity.
- GBP default currency preservation.
- API boundaries.
- Mobile responsiveness.
- Accessibility.
- Deep-link routing.
- Cache invalidation.
- Demo/production separation.

---

# FINAL COMPLETE UK HUB SYSTEM FLOW

The completed architecture becomes:

```text
                        FUNDORDONATE
                              │
                              ▼
                     UK HUB ACTIVATION
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
       NATIONAL HUB                      INTERACTIVE MAP
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
                         CITY HUB
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          CAMPAIGNS       FOUNDING         BACKERS
                         MEMBERS
             │                │                │
             └────────────────┴────────────────┘
                              │
                              ▼
                   BOROUGH / LOCAL AREA
                              │
                              ▼
                         HIGH STREET
```

The underlying system is:

```text
LOCATION ARCHITECTURE
        +
CITY ACTIVATION LIFECYCLE
        +
REUSABLE CAMPAIGN ENGINE
        +
FOUNDING MEMBER SYSTEM
        +
BACKER STATUS SYSTEM
        +
ADMIN CONFIGURATION
        +
PROJECTION SERVICES
        +
NATIONAL HUB
        +
REUSABLE CITY HUB
        +
INTERACTIVE UK MAP
```

The critical implementation principle throughout is:

> The UK Hub must be built as one reusable, data-driven architecture. National Hubs, City Hubs, Boroughs, Local Areas, High Streets, Campaigns, Founding programmes and Map experiences must read from shared domain data rather than being individually hardcoded pages or separate systems.

This completes the remaining specification from **Part 6 through Part 14** and provides the full architecture required to move from the existing FundOrDonate foundation into an implementable UK Hub Activation system.