# Plans, Access Passes & Capability Gating

Admin-authored commercial catalogue for **business accounts only**, backed by MCOM Pay. Plans and access passes
grant a **capability map** that the API and web app use to lock business features.

Consumer accounts are **free**: they cannot buy a plan or an access pass, and
their consumer dashboard features are never gated by this capability system.

## Catalogue model

| Model                                  | Purpose                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PlanFeature`                          | Global capability catalogue (the 25 billable features). Admins edit labels/defaults, never the stable `key`.                                                                                                                                                                            |
| `MembershipPlan` (Plan)                | Product family (e.g. Gold). One row per plan.                                                                                                                                                                                                                                           |
| `MembershipPlanVariant` (Plan variant) | Exactly three variants per plan: `STANDARD` (90 days), `PRO` (180 days), `PRO_PLUS` (365 days). The variant name and duration are generated automatically and cannot be edited. Each variant has its own price (entered in pounds in the admin UI, stored as pence) and capability map. |
| `AccessPass`                           | Standalone product with a single duration (admin chooses, e.g. 71 days) and capability map. No variants.                                                                                                                                                                                |
| `AccessPassCode`                       | A purchased-but-unredeemed (or active) access pass code.                                                                                                                                                                                                                                |
| `PlanOrder`                            | Purchase record: plan or access pass, MCOM charge id, activation mode, status.                                                                                                                                                                                                          |
| `UserEntitlement`                      | Activation history. At most one `ACTIVE` row per business; activating anything else forfeits the previous product.                                                                                                                                                                      |

### Capability shape

```json
{
  "campaign.creation": { "enabled": true, "limit": null, "unlimited": false },
  "campaign.active_slots": { "enabled": true, "limit": 3, "unlimited": false },
  "rewards.attach": { "enabled": true, "limit": null, "unlimited": true }
}
```

`limit` applies only to features marked `supportsLimit` in `PlanFeature`
(campaign claims, active campaign slots, premium templates and attached rewards). `unlimited` overrides the limit.

### Feature keys

`campaign.creation`, `campaign.claim_limit`, `campaign.active_slots`,
`templates.premium`, `rewards.attach`, `rewards.premium_library`,
`contributions.ledger`, `contributions.filters`, `leaderboard.city`,
`leaderboard.local`, `leaderboard.national`, `leaderboard.rank_tracking`,
`profile.enhanced`, `profile.featured`, `analytics.insights`,
`analytics.advanced`, `notifications.weekly_digest`, `notifications.alerts`,
`support.priority`, `profile.badges`, `campaign.promotion`.

## Capability resolution order

1. Active local `UserEntitlement` (plan or access pass) — authoritative.
2. Active MCOM Central entitlement, mapped onto the local catalogue:
   - **Membership** (`plan.source = "membership"`): `plan.planId` is resolved to a `MembershipPlan`; the variant is selected from the business's MCOM `membershipTier` (`Normal → Standard`, `Pro → Pro`, `Pro+ → Pro+`).
   - **Access pass** (`plan.source = "direct"`): `plan.planId` is resolved to an `AccessPass`.
   - **Trial** (`plan.source = "trial"`): the freemium capability defaults apply for the trial window.
   - If the local catalogue row no longer exists, Central's `plan.quotas` / `plan.limits` are translated into the capability map instead.
3. `PlanFeature.defaultEnabled` / `defaultLimit` — the freemium baseline.

A locally purchased plan/access pass always wins over a Central membership or access pass. Central SSO sync never downgrades an active local product.

Trial access is the lowest priority: if the account already has an active membership, local plan, local access pass, or Central access pass, that paid access is used instead of the trial.

The resolved map is mirrored to `Subscription.capabilities` and returned by
`GET /plans/capabilities`, `/auth/me` and `/auth/entitlement`.

## API

### User

| Method | Path                        | Description                                                    |
| ------ | --------------------------- | -------------------------------------------------------------- |
| GET    | `/plans/catalog`            | Public plans, variants, access passes and feature definitions. |
| GET    | `/plans/me`                 | Active entitlement, history, saved codes and orders.           |
| GET    | `/plans/capabilities`       | Resolved capability map for the signed-in user.                |
| POST   | `/plans/purchase`           | Create an MCOM Pay charge for a plan/access pass.              |
| POST   | `/plans/orders/:id/confirm` | Confirm a card/PayPal order.                                   |
| POST   | `/plans/access-pass/redeem` | Redeem a code (409 + `requiresForfeit` when access is active). |

`POST /plans/purchase` body:

```json
{
  "kind": "PLAN", // or ACCESS_PASS
  "planVariantId": "…", // plan
  "accessPassId": "…", // access pass
  "method": "wallet", // wallet | stripe | paypal
  "activationMode": "immediate", // access passes: immediate | save_code
  "acceptedTerms": true,
  "confirmForfeit": false
}
```

Wallet charges settle synchronously and activate immediately. Stripe/PayPal
orders activate on confirmation or the signed MCOM webhook
(`payment.succeeded` / `payment.refunded`), which is handled before contribution
settlement and is idempotent.

### Admin

| Method         | Path                                   | Description                                           |
| -------------- | -------------------------------------- | ----------------------------------------------------- |
| GET/POST       | `/admin/plans`                         | List / create plans (optionally with all 3 variants). |
| GET/PUT/DELETE | `/admin/plans/:id`                     | Read / update / delete (archives when purchased).     |
| POST           | `/admin/plans/:id/variants`            | Add a variant.                                        |
| PUT/DELETE     | `/admin/plans/:id/variants/:variantId` | Update / delete a variant.                            |
| GET            | `/admin/plans/features`                | Capability catalogue.                                 |
| PATCH          | `/admin/plans/features/:key`           | Edit labels, defaults and quota support.              |
| GET            | `/admin/plans/orders`                  | Purchase ledger.                                      |
| GET            | `/admin/plans/access-pass-codes`       | Issued codes.                                         |
| GET/POST       | `/admin/access-passes`                 | List / create access passes.                          |
| GET/PUT/DELETE | `/admin/access-passes/:id`             | Read / update / delete.                               |

Admin UI: **Plan & Plans** in the admin sidebar
(`/admin/plan/plans`, `/access-passes`, `/features`, `/orders`).

## Activation rules

- Plan/access pass purchase while a **different** product is active:
  API returns `409 ActiveEntitlementConflict` with `details.requiresForfeit`.
  The client re-submits with `confirmForfeit: true`.
- Redeeming a code while access is active: same 409 contract.
- Renewing the **same product** extends from the existing expiry instead of
  resetting it.
- Activating anything else marks the previous entitlement `FORFEITED`.
- Access pass codes can be bought and kept (`save_code`); the pass duration
  starts only on redemption. `AccessPass.codeValidityDays` controls how long
  the unredeemed code remains valid (blank = never expires).
- Refunds mark the order `REFUNDED`, cancel the entitlement and revoke an
  unused saved code.

## Enforcement

Backend gates live in `CapabilityService.assertFeature` /
`assertWithinLimit` and are applied to campaign claiming, setup/resubmission,
premium templates (with quota), campaign claims (with quota), reward attachment (with quota), contribution
ledger/filters, leaderboards, settings, dashboard insights and profile cover
images. Premium templates are additionally marked on `CampaignTemplate`
(`isPremium`, `requiredFeature`).

The web app mirrors the same map through `usePlanCapabilities()` and
`<FeatureGate feature="…">`; `/plans` is the purchase/activation surface.

## Enforcement & caching

### Backend is authoritative

Every plan-gated action calls `CapabilityService.assertFeature` or
`assertWithinLimit` before doing any work. The local browser snapshot is never
trusted for a mutation.

| Capability                                                                       | Enforced on                                                                                                                  |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `campaign.creation`                                                              | Claiming a template / Campaign Centre action                                                                                 |
| `campaign.claim_limit`                                                           | Total campaigns a business can claim (quota)                                                                                 |
| `campaign.active_slots`                                                          | Claim and submit (quota of running campaigns)                                                                                |
| `templates.premium`                                                              | Premium template claim/submit (quota of premium templates held)                                                              |
| `rewards.attach`                                                                 | Attaching a business reward (quota enforced)                                                                                 |
| `rewards.premium_library`                                                        | Available reward list filtering                                                                                              |
| `contributions.ledger`                                                           | Business contribution ledger                                                                                                 |
| `contributions.filters`                                                          | Channel/date filters and transaction references                                                                              |
| `leaderboard.city/local/national`                                                | Leaderboard scope requests                                                                                                   |
| `profile.enhanced`                                                               | Cover/logo updates                                                                                                           |
| `analytics.insights`                                                             | Business dashboard overview                                                                                                  |
| `notifications.weekly_digest`                                                    | Weekly digest preference                                                                                                     |
| `notifications.alerts`                                                           | Leaderboard/new-backer/reward-unlock preferences                                                                             |
| `support.priority`                                                               | Support ticket priority metadata                                                                                             |
| `profile.badges`, `profile.featured`, `campaign.promotion`, `analytics.advanced` | No dedicated business endpoint exists yet; the capability is stored and exposed, ready to gate the feature when it is built. |

### Cache layers

1. **Backend in-process cache** — 20 second TTL per business.
2. **Backend Redis cache** — 5 minute TTL (`fd:plan:caps:<userId>`), shared
   across API instances. Entries are ignored/deleted immediately when the
   entitlement `expiresAt` has passed.
3. **Frontend localStorage snapshot** — per user, used for instant page
   rendering and UI locks.
4. **Frontend revalidation** — every 5 minutes and on window focus. It sends
   only the stored `version`; when nothing changed the API returns a tiny
   `{ unchanged: true, version }` response instead of the full capability map.

Activation, forfeiture, refund and expiry call `CapabilityService.invalidate`
so the next request resolves fresh data. Admin edits to feature defaults clear
all cached snapshots.

The client snapshot is a UX accelerator only: it makes the correct pages and
buttons appear immediately, while the API independently re-checks the same
capability before allowing any action.

## MCOM Solutions Console integration

FundorDonate exposes the Generic Billing API contract used by MCOM Console's
`/admin/console` → app registration and `/admin/memberships` plan manager.

Register FundorDonate in Console with:

| Console field              | Value                                                        |
| -------------------------- | ------------------------------------------------------------ |
| Billing API URL            | `https://<fundordonate-api-host>` (no `/api/v1`)             |
| Plan Schema Endpoint       | `https://<fundordonate-api-host>/api/v1/system/plans/schema` |
| Access Pass Plans Endpoint | `https://<fundordonate-api-host>/api/v1/access-passes/plans` |

For local development, use `http://localhost:5024` as the Billing API URL.

All system endpoints require the app's Console API key in the
`x-mcom-solution-api-key` header (the `x-api-key` alias is also accepted). The
key is read from `MCOM_API_KEY` / `MCOM_SOLUTION_API_KEY` on the API.

### Endpoints

| Method | Path                          | Description                                          |
| ------ | ----------------------------- | ---------------------------------------------------- |
| GET    | `/api/v1/system/plans/schema` | Quotas + feature flags for MCOM's dynamic plan form. |
| GET    | `/api/v1/system/plans`        | Plans in MCOM `ExternalPlan` format.                 |
| POST   | `/api/v1/system/plans`        | Create a plan from MCOM Console.                     |
| GET    | `/api/v1/system/plans/:id`    | Get one plan.                                        |
| PATCH  | `/api/v1/system/plans/:id`    | Update a plan.                                       |
| DELETE | `/api/v1/system/plans/:id`    | Delete, or archive when purchases exist.             |
| GET    | `/api/v1/access-passes/plans` | Access-pass catalogue for MCOM bundle builders.      |

MCOM sends prices in major units (pounds) and configuration as
`configuration.quotas` (`-1` = unlimited) plus `configuration.featureFlags`.
FundorDonate translates these to pence and its capability map, and translates
back on reads. Display bullet points (`features`) are stored on plan variants
and access passes.
