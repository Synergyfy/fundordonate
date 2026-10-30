# MCOM Rewards — Campaign Rewards Runbook

MCOM Rewards is the single source of truth for campaign rewards. FundOrDonate
stores only a mirror of provider issuances (`reward_issuances`) so the UI can
render status, codes and fulfilment instructions without calling the provider on
every page load.

## Configuration

| Variable | Purpose |
|:--|:--|
| `MCOM_SOLUTIONS_URL` | Central Hub service-token issuer |
| `MCOM_CLIENT_ID` / `MCOM_CLIENT_SECRET` | Service identity (`fundordonate`) |
| `MCOM_REWARDS_BASE_URL` | MCOM Rewards partner API |
| `MCOM_REWARDS_AUDIENCE` | Token audience (`mcom-rewards`) |
| `MALL_WEB_URL` | Base URL used to build Mall deep links |
| `CENTRAL_WEB_URL` | Base URL used to build Central links |
| `REWARDS_MCOM_ONLY` | `true` (default) disables legacy local issuance |
| `REWARDS_RECONCILE_ENABLED` / `REWARDS_RECONCILE_INTERVAL_MS` | Reconciliation safety net |

Required scopes for `fundordonate`: `rewards:read rewards:issue rewards:gift`.

## Provider outage

1. Retryable errors (429, 5xx, timeouts, `ENTITLEMENT_UNAVAILABLE`) leave the
   reservation `PENDING`; the issue queue retries with backoff.
2. Fatal errors (400/401/403/404, `BUSINESS_NOT_ENTITLED`, `OUT_OF_STOCK`) mark
   the mirror `FAILED` and free the cap slot.
3. Stale `PENDING` reservations older than 10 minutes are reaped by
   reconciliation and re-driven; provider idempotency prevents duplicates.
4. Check `GET /api/v1/admin/mcom-rewards` to confirm the provider is reachable;
   inspect service-token minting logs if all calls fail with 401.

## Entitlement failures

- `BUSINESS_NOT_ENTITLED`: the sponsoring business has no active MCOM plan.
  Do not retry. Ask the business to activate a membership/access pass that
  includes MCOM Rewards. The consumer UI shows an upgrade message.
- `ENTITLEMENT_UNAVAILABLE`: Central could not verify the entitlement. This is
  retryable; the queue will retry.

## Quantity exhaustion

- Campaign caps are enforced in `RewardReservationService` under a per-rule
  advisory lock. The effective cap is the minimum of the campaign rule cap, the
  attachment cap, and provider stock.
- When the cap is reached the engine returns `null` (not an error) and the
  public reward view reports `soldOut: true`.
- Provider stock (`OUT_OF_STOCK`) is authoritative and is never retried.
- A live campaign cannot be edited to a cap below the number already issued.

## Webhook replay / missed webhooks

- Lifecycle events (`reward.issued/redeemed/expired/revoked`) are idempotent and
  upsert the mirror on the provider issuance id / idempotency key.
- If a webhook is missed, run `POST /api/v1/admin/mcom-rewards/reconcile` (all
  campaigns) or `/reconcile/:campaignId`. The job mirrors provider issuances and
  re-evaluates completed contributions to backfill anything missing.
- Reconciliation also refreshes `deepLink`, `instructions` and fulfilment
  fields from the provider.

## Audience safety

- Consumers must never receive `CENTRAL_MEMBERSHIP`, `CENTRAL_ACCESS_PASS` or
  `CENTRAL_COUPON`.
- Enforced in the admin/business pickers and in `RewardTriggerService` before
  the provider call. Provider `RECIPIENT_NOT_A_BUSINESS` is recorded as
  `metadata.ineligibleAudience` if the provider rejects the call anyway.
- Business owners may win Mall and Central kinds, except for their own campaign
  rewards (existing rule).

## Provider contract dependency

The catalogue DTO must expose `fulfilmentProvider`, `fulfilmentKind`,
`fulfilmentConfig`, `consumerEligible` and `businessEligible`. Until it does,
FundOrDonate feature-detects them, displays “MCOM” when unknown, and relies on
the provider's issue-time enforcement. Do not infer Mall vs Central from the
cosmetic `rewardType`.
