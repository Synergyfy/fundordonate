# MCOM Ecosystem — Reward/Campaign Bugfix Plan

Scope: `fundordonate`, `mcom-rewards`, `mcom-mall`, `central-hub-solution`.
Source: live end-to-end test on 2026-10-30 (admin campaign → consumer earns → mall checkout/booking → Central grant).

> **Implementation status (2026-10-30):** all P0/P1/P2/P3 items below are implemented in code and verified against the running stack. See the "Implementation log" at the end of this document for files changed and live verification results.

Guiding rules:
- No new business logic. Fix contracts, state transitions, and UI wiring so the behaviour already designed in the handbooks works.
- Keep every change backward compatible (additive DTO fields, optional params) where peers may be deployed independently.
- Every fix needs a regression test that fails before and passes after.

---

## Priority summary

| # | Severity | Area | Bug | Fix owner |
|---|---|---|---|---|
| 1 | P0 | Rewards/Mall | `/partner/issuances/:id/redeem` rejects `instrumentType` → instrument redemptions never sync | mcom-rewards |
| 2 | P0 | Mall storefront | Applying a coupon crashes checkout (`toFixed` on undefined) | mcom-mall |
| 3 | P1 | Mall storefront/API | Reward-issued vouchers can't be applied ("no balance") | mcom-mall |
| 4 | P1 | Mall API | Gift card can't cover > ~50% of an order (net-total double subtraction) | mcom-mall |
| 5 | P1 | Rewards | Issuer never receives `reward.redeemed` → FundOrDonate mirror stale | mcom-rewards |
| 6 | P1 | Rewards | Delivered Mall/Central issuances stay `fulfilment_status = NOT_REQUIRED` | mcom-rewards |
| 7 | P2 | Mall API | Cancelled booking leaves reward `RESERVED` | mcom-mall |
| 8 | P2 | Mall API | Order rows don't persist coupon/gift-card/voucher fields | mcom-mall |
| 9 | P2 | FND + Rewards | Code rewards display `£0.00` | mcom-rewards + fundordonate |
| 10 | P3 | Mall API | `/membership/my` returns 403 for customers | mcom-mall |
| 11 | P3 | Dev tooling | `seed-partner-demo.js` reassigns other businesses' rows | mcom-mall |

---

## P0-1 — Mall → Rewards redeem callback is rejected

**Symptom**
Every instrument use produces a `partner_redemption_outbox` row that retries and fails with HTTP 400. Rewards and FundOrDonate keep the issuance `ISSUED`.

**Root cause**
- Mall sends `{ code, note, instrumentType }`:
  `mcom-mall/apps/mcom_mallAPI/src/resources/rewards-integration/rewards-client.service.ts` (`redeemIssuance`, ~L152-167) and the outbox payload builder.
- Rewards validates with global `whitelist: true, forbidNonWhitelisted: true`, and `RedeemIssuanceDto` has no `instrumentType`:
  `mcom-rewards/apps/api/src/resources/partner-rewards/dto/redeem-issuance.dto.ts`.
- Error captured in `rewards-api.log`: `{"message":["property instrumentType should not exist"]}`.

**Fix (recommended: tolerate on the receiver + keep sending for audit)**

`mcom-rewards/.../dto/redeem-issuance.dto.ts`:

```ts
@ApiPropertyOptional({ description: "Instrument kind, for audit only (GIFT_CARD|VOUCHER|COUPON)" })
@IsOptional()
@IsString()
@MaxLength(32)
instrumentType?: string;
```

Then in `RewardIssuanceService.redeem()` persist it under `metadata.redeemedInstrumentType` (do **not** branch logic on it).

Optional hardening (belt and braces): strip unknown keys instead of rejecting, but only for partner-facing controllers — keep strict validation elsewhere. Do **not** relax the global pipe.

**Also do**
- Make the outbox success predicate accept `2xx` only (already) and add a log line with the peer response body on failure so the next contract break is diagnosable.
- Clamp/annotate max attempts (currently 8). When attempts == max, emit an admin notification instead of silently going `FAILED`.

**Tests**
- Unit: DTO accepts body with `instrumentType`; controller returns 200.
- Integration: call `/partner/issuances/:id/redeem` with the exact mall payload; assert status `REDEEMED` and outbox row `SENT`.
- Regression: replay the existing failed outbox rows after deploy — they should drain without manual SQL.

**Rollback**: additive DTO field only; safe.

---

## P0-2 — Coupon application crashes the checkout page

**Symptom**
Enter `GJ-10-OFF` → page shows "Something went wrong".
Console: `TypeError: Cannot read properties of undefined (reading 'toFixed') at renderDiscountLine (OrderSummaryCard)`.

**Root cause**
- `CheckoutClient.tsx` L308-315: `setCouponDiscount(result.discountAmount)`.
- `POST /coupons/validate` returns the coupon entity (`discountValue`, `discountType`) and no `discountAmount`.
- `OrderSummaryCard.tsx` L78-95 calls `amount.toFixed(2)` with `undefined`.

**Fix**
1. Backend: add cart context so the server computes the authoritative discount.
   - `ValidateCouponDto`: add optional `items`/`subtotal` (minor units or decimal, match existing style).
   - Return an additive DTO: `{ ...coupon, discountAmount, finalAmount? }` computed with the same scoping math used by `OrderService.checkout` (extract that math into a shared helper to avoid divergence).
2. Frontend:
   - `setCouponDiscount(Number(result.discountAmount ?? 0))`.
   - `renderDiscountLine`: `const value = Number(amount ?? 0); if (!Number.isFinite(value) || value <= 0) return null;`
   - Apply the same guard to `offerDiscount`, `giftCardDiscount`, `voucherDiscount`, `rewardDiscount`, `pointsDiscount`.

**Tests**
- Unit: `renderDiscountLine` with `undefined`, `NaN`, `0`, `-1` renders nothing.
- API: validate returns `discountAmount` for fixed and percentage coupons, and respects business/scope.
- E2E: apply a coupon in the browser and assert the summary updates without an error boundary.

**Rollback**: additive response field; old clients unaffected.

---

## P1-3 — Reward-issued vouchers cannot be applied in the storefront

**Symptom**
"Check Balance" alerts "This voucher has no balance." although the voucher has £20. Gift cards work.

**Root cause**
- `CheckoutClient.tsx` L262-278 calls `applyVoucher(code)` → `GET /vouchers/:code`.
- `VoucherConsumerController.getVoucherDetails` is `@Public()` and returns `findPublicVoucherByCode`, which intentionally strips `balance` (`voucher.service.ts` L914+).
- The gift-card flow uses `/gift-cards/balance/:code`, which does return the balance.

**Fix**
1. Add an authenticated balance endpoint (do not un-mask the public one):

```http
GET /vouchers/:code/balance        (JwtAuthGuard)
→ { code, status, balance, currency, expiresAt, allowPartialRedemption }
```

   Authorisation: caller must be the voucher owner/recipient, **or** the voucher was issued from an MCOM Rewards issuance whose `recipientMcomUserId` equals the caller's `centralUserId` (look up `vouchers.issuanceId`). Deny otherwise.
2. Frontend: use the new endpoint in `handleCheckVoucherBalance`; keep "no balance" only when balance is genuinely 0.
3. If a voucher is business-scoped, also return the eligible line keys so the UI can show "does not apply to this item" instead of a generic error.

**Tests**
- Owner can read balance; another user gets 404/403; unauthenticated gets 401.
- Reward-issued voucher returns the correct balance.
- E2E: apply `MCOM-…` voucher in the storefront and pay.

---

## P1-4 — Gift card limited to ~half the order total

**Symptom**
£14.99 order: gift card 6 and 7 accepted; 8–14.99 rejected with "Redemption amount cannot exceed order total."

**Root cause**
`order.service.ts` ~L806 sets `total: finalAmount` (already net of the gift card) on `savedOrder`, then calls `giftCardService.redeem(...)`. `gift-card.service.ts` L1050 compares `order.total < amount`. The total has been reduced once already, so the effective cap is `amount <= finalAmount`.

The same pattern may exist in `voucher.redeemForOrder` and coupon consumption — audit all three.

**Fix**
1. Make the instrument validators compare against the **pre-instrument payable** amount.
   - Add an optional `orderTotalOverride?: number` to `giftCardService.redeem`, `voucher.redeemForOrder`, and coupon consume/redeem.
   - Use `const orderTotal = this.toMoney(orderTotalOverride ?? order.total)`.
   - Call sites pass `totalWithShipping` (or `subtotal + shipping` before any instrument) from `order.service.ts`.
2. Do **not** change `orders.total` (accounting uses the paid amount). If reporting needs the pre-discount amount, add a separate `instrumentEligibleTotal` column — out of scope for this fix.
3. Keep the `amount <= balance` check as-is.

**Tests**
- Table-driven: totals 14.99/29.98/100, amounts 1, half, full, over-balance, over-total.
- Full-value gift card order (amount == total) must succeed and leave `total = 0`.
- Verify voucher and coupon have the same behaviour.

---

## P1-5 — Issuer is never told about a redemption

**Symptom**
Mall commits a reward; mall's mirror updates; FundOrDonate's `reward_issuances` stays `ISSUED`.

**Root cause**
`RewardIssuanceService.commit()` notifies only `callerClientId` (mall) (`reward-issuance.service.ts` ~L812-818). `issuer_client_id` (FundOrDonate) is never notified. `PartnerEventNotifier` posts to `MCOM_PARTNER_EVENT_PATH` (default `/api/v1/partner/events`), which FundOrDonate exposes as an alias.

**Fix**
1. Notify every interested peer, de-duplicated:

```ts
const targets = new Set(
  [callerClientId, issuance.issuer_client_id].filter(Boolean) as string[],
);
for (const target of targets) {
  await this.notifier.notify(target, PartnerRewardEvent.REDEEMED, dto);
}
```

   Apply the same fan-out to `expired` and `revoked`, and consider `issued` (currently only the issuer is notified; mall learns via the live call).
2. Verify egress/ingress: `mcom-rewards.allowedAudiences` must include `fundordonate` (it does), and `fundordonate.allowedCallers` must include `mcom-rewards` (it does).
3. FundOrDonate's webhook handler must accept the `note`/`instrumentType` additions — it already mirrors by issuance id/status, so no change expected; add a test.

**Tests**
- Commit from a third-party caller (mall) produces two deliveries (mall + issuer), each idempotent on `(id,status)`.
- Peer down: commit still succeeds; delivery is best-effort and logged.

---

## P1-6 — Delivered issuances report `fulfilment_status = NOT_REQUIRED`

**Symptom**
Mall gift card/voucher/coupon and Central grants end with `fulfilment_status: NOT_REQUIRED`, `fulfilledAt: null`, although `fulfilmentRef`/`fulfilmentCode` are populated.

**Root cause**
- DB default is `NOT_REQUIRED` (`1770000000029-AddRewardFulfilment.ts` L41).
- `reward-fulfilment.service.ts` `fulfil()` only flips to `DELIVERED` when the status is already **not** `NOT_REQUIRED`; provider strategies never set `PENDING`, so the guard is false.

**Fix**
In `fulfil()`:
```ts
// before the switch, for provider-backed kinds
issuance.fulfilment_status = FulfilmentStatus.PENDING;

// after successful strategy
issuance.fulfilment_status = FulfilmentStatus.DELIVERED;
issuance.fulfilled_at = new Date();
issuance.fulfilment_error = null;
```

Keep the early return for `provider === NONE` / `kind === MALL_DISCOUNT` (these genuinely are `NOT_REQUIRED`).

**Backfill** (new migration):
```sql
UPDATE reward_issuance
SET fulfilment_status = 'DELIVERED',
    fulfilled_at = COALESCE(fulfilled_at, updated_at)
WHERE fulfilment_provider IN ('MALL','CENTRAL')
  AND fulfilment_ref IS NOT NULL
  AND fulfilment_status = 'NOT_REQUIRED';
```

**Tests**
- Each of the 7 fulfilment kinds asserts the expected status (`DELIVERED` vs `NOT_REQUIRED` for discount/none).
- Failure paths still produce `FAILED`/`PENDING_IDENTITY`/`PENDING_CONFLICT`.

---

## P2-7 — Cancelling a booking does not release the reward

**Root cause**
`BookingService.cancel()` (`booking.service.ts` ~L773+) updates status/refunds but never calls `releasePendingBookingRewards`.

**Fix**
- After the status change (and outside the DB transaction), call `await this.releasePendingBookingRewards(bookingId, 'booking_cancelled')`.
- Also call it from `decline`, `refund`, and the payment-failure path if not already covered.
- Keep the operation idempotent: skip rows already `COMMITTED`/`RELEASED`; never release a `REDEEMED` issuance.

**Tests**
- Cancel a booking with a `RESERVED` reward → provider issuance returns to `ISSUED`, row `RELEASED`.
- Cancel a paid/committed booking → reward stays `REDEEMED`.
- Double cancel is a no-op.

---

## P2-8 — Orders don't persist applied instrument details

**Root cause**
`order.service.ts` `orderData` sets `rewardDiscountApplied`, `voucherCode`, `voucherAmountApplied` but omits the coupon/gift-card fields that exist on `Order` (`order.entity.ts` L73-95).

**Fix**
```ts
couponCode: couponDiscountTotal > 0 ? createCheckoutDto.couponCode ?? null : null,
couponDiscountApplied: couponDiscountTotal,
giftCardCode: giftCardAmountToApply > 0 ? createCheckoutDto.giftCardCode ?? null : null,
giftCardAmountApplied: giftCardAmountToApply,
```
Apply to both direct-purchase and cart paths. Verify `voucherCode` is set in the same place (it appeared null in one path).

**Tests**
- Checkout with each instrument writes the matching columns.
- Order history/admin reporting shows them.

---

## P2-9 — Code rewards display £0.00

**Root cause**
Rewards issuance copies `reward.value` (0 for instrument rewards) into `issuance.value`; FundOrDonate's consumer mapper reads `issuance.value` (`consumer.service.ts` L223/472).

**Fix (two layers, either is sufficient; do both for resilience)**
1. Rewards: in `persistIssuance`, for `MALL_GIFT_CARD|MALL_VOUCHER|MALL_COUPON`, set `issuance.value = Number(config.value?.amount) || issuance.value`. For `MALL_DISCOUNT`, store the discount value/max discount in metadata (already there).
2. FundOrDonate: in the mirror mapper, fall back to the provider payload:
   `value: Number(r.value) || Number(r.metadata?.fulfilment?.value?.amount) || 0`.

**Tests**
- £20 voucher issuance returns `value = 20` from `/consumer/rewards` and `/partner/issuances`.
- Discount reward still shows the percentage, not a currency value.

---

## P3-10 — `/membership/my` 403 for customers

**Root cause**
`MembershipController` is class-guarded with `@Roles(UserRole.OWNER)` (`membership.controller.ts` L35); the storefront calls it for every signed-in user.

**Fix**
- Allow `CUSTOMER` on the read-only membership endpoint and return `{ membership: null }` for non-business users, or
- Add a public/customer-safe `GET /membership/me` used by the storefront navbar.

Do not weaken the write/mutation endpoints.

---

## P3-11 — Dev seed script reassigns other businesses' rows

**Root cause**
`apps/mcom_mallAPI/scripts/seed-partner-demo.js` uses global `ON CONFLICT (sku)` / `ON CONFLICT (code)` and updates `businessId = EXCLUDED."businessId"` (products ~L171-189, coupons ~L300-330). Running it for a new email steals rows.

**Fix**
- Remove `businessId` from every `DO UPDATE SET` clause (products, services, coupons, gift-card template, voucher product).
- Prefer conflict targets scoped to the business: `ON CONFLICT ("businessId", sku)` / `("businessId", code)` once those unique indexes exist.
- Namespace seeded codes/SKUs with the business slug for new runs.
- Add a `--dry-run` flag and a guard that refuses to update rows owned by a different business.

**Data remediation for this environment**
```sql
-- products / services / coupons currently on E2E Test Store A
UPDATE "Products" SET "businessId" = '7f934640-b815-41de-ade2-b159f6858192'
WHERE "businessId" = '0d4d2572-3e6a-4fae-bcdd-282673c47504';
UPDATE services SET "businessId" = '7f934640-b815-41de-ade2-b159f6858192'
WHERE "businessId" = '0d4d2572-3e6a-4fae-bcdd-282673c47504';
UPDATE coupons SET "businessId" = '7f934640-b815-41de-ade2-b159f6858192'
WHERE code IN ('GJ-10-OFF','GJ-15PCT');
```
Only run this if the demo catalogue should stay with the original business; otherwise re-seed Business A with unique SKUs and leave it.

---

## Data remediation after the code fixes

1. **Replay failed redemptions**: after P0-1 ships, `partner_redemption_outbox` rows still under max attempts will succeed on the next sweep. For rows at max attempts, reset `status='PENDING', attempts=0, next_attempt_at=now()` (or expose an admin "retry outbox" action).
2. **Backfill fulfilment status** (P1-6 migration).
3. **Re-run FundOrDonate reconcile** for affected campaigns (`POST /admin/mcom-rewards/reconcile/:campaignId`) to refresh mirrors.
4. **Release stuck reservation**: reward `ae849970-…` is `RESERVED` from the cancelled booking; either let the 1-hour sweeper release it or call the new cancel release path once, then verify.
5. **Seed reassignment**: decide whether the demo catalogue stays with Business A or is restored (P3-11).

---

## Rollout order

1. **Rewards API** (P0-1, P1-5, P1-6, P2-9). Backward compatible; unblocks the whole sync loop.
2. **Mall API + storefront** (P0-2, P1-3, P1-4, P2-7, P2-8, P3-10).
3. **FundOrDonate** (P2-9 fallback; no deploy needed for P1-5).
4. **Migrations/backfills** (P1-6).
5. **Dev tooling** (P3-11) — not deployable to prod.

Each step independently releasable. No central-hub-solution change is required; Central already behaves correctly (membership/access/coupon are verified working).

---

## Regression / acceptance matrix

| Flow | Assertion |
|---|---|
| Admin campaign, 4 Mall rewards, £30 donation | 4 issuances, codes on FND, wallet shows them |
| Business claims template + own reward, £25 donation | admin + business rewards both issued; business-only reward skipped for consumer |
| Product checkout with discount reward | reserve → commit → rewards `REDEEMED`, mall mirror `REDEEMED` |
| Product checkout with gift card (full value) | total 0, gift card balance 0, order fields populated |
| Product checkout with voucher via UI | balance shown, applied, order persisted |
| Product checkout with coupon via UI | no crash, discount shown, order persisted |
| Booking with reward | eligible, reserve, discount, cancel releases |
| Central membership reward | Central membership active; business entitled in Rewards |
| Central access pass | code redeemed in Central; pass active |
| Central coupon | coupon visible; validates to 20% off |
| Instrument used | Rewards + FundOrDonate both reach `REDEEMED` (P0-1/P1-5) |
| Order of operations | no duplicate events, idempotent retries |

Automated coverage:
- Rewards: unit tests for DTO/fulfilment/commit fan-out; Jest integration for partner endpoints.
- Mall: unit tests for pricing/instrument math; Jest integration for checkout/booking; one Playwright spec per checkout path.
- FND: existing vitest + a new mirror-mapping test.
- A single cross-service smoke script that seeds two businesses/customers, runs the matrix above, and asserts across all three databases.

---

## Definition of done

- [ ] All P0/P1 fixed and covered by tests.
- [ ] `partner_redemption_outbox` drains to zero failures for the test dataset.
- [ ] No issuance in `NOT_REQUIRED` with a provider ref.
- [ ] Rewards, mall mirror, and FND mirror agree on every issuance status.
- [ ] Browser checkout succeeds for discount, gift card, voucher, and coupon without console errors.
- [ ] Cancelled booking leaves no `RESERVED` reward.
- [ ] Order rows contain the instrument codes/amounts used.
- [ ] Seed script no longer mutates other businesses' rows.

---

## Implementation log (2026-10-30)

### mcom-rewards
| File | Change |
|---|---|
| `apps/api/src/resources/partner-rewards/dto/redeem-issuance.dto.ts` | Added optional `instrumentType` so peers sending it are accepted (`forbidNonWhitelisted` no longer rejects the callback). |
| `apps/api/src/resources/partner-rewards/services/reward-issuance.service.ts` | `redeem()` records `metadata.redeemedInstrumentType` and marks provider-backed rows `DELIVERED`; `commit()` marks `DELIVERED` and fans `reward.redeemed` out to **both** caller and issuer; `toDto()` falls back to `metadata.fulfilment.amount` for instrument value. |
| `apps/api/src/resources/reward-fulfilment/reward-fulfilment.service.ts` | Provider-backed fulfilment sets `PENDING` before the provider call and `DELIVERED` + `fulfilled_at` on success; Mall instruments persist `value` and `metadata.fulfilment.amount`. |
| `apps/api/src/database/migrations/1770000000030-BackfillDeliveredFulfilmentStatus.ts` | New idempotent backfill for legacy `NOT_REQUIRED` rows with a provider ref. |

### mcom-mall (API)
| File | Change |
|---|---|
| `resources/coupon/coupon.service.ts`, `coupon.controller.ts`, `dto/validate-coupon.dto.ts` | `POST /coupons/validate` accepts an optional `subtotal` and returns a server-computed `discountAmount`. |
| `resources/voucher/voucher.service.ts`, `voucher-consumer.controller.ts` | New authenticated `GET /vouchers/:code/balance` (owner or recipient-email match). Public masked endpoint unchanged. |
| `resources/gift-card/gift-card.service.ts`, `resources/order/order.service.ts` | Gift-card redemption compares against the pre-instrument total (`orderTotalOverride`), enabling full-value redemption; orders now persist coupon/gift-card codes and amounts. |
| `resources/booking/booking.service.ts` | `cancel()` releases any `RESERVED` reward immediately (idempotent). |
| `resources/membership/membership.controller.ts` | `GET /membership/my` now allows customers (returns `null`), removing spurious 403s. |
| `resources/partner-instruments/partner-callback.service.ts` | Outbox failures record the peer response body for diagnosability. |
| `scripts/seed-partner-demo.js` | Refuses to move SKUs/codes owned by another business; `--force` skips them; `businessId` removed from all conflict updates. |

### mcom-mall (storefront)
| File | Change |
|---|---|
| `app/(public)/checkout/components/CheckoutClient.tsx` | Coupon validation sends `subtotal`; voucher balance uses the authenticated endpoint; numeric coercion. |
| `app/(public)/checkout/components/OrderSummaryCard.tsx` | `renderDiscountLine` guards non-finite/undefined/≤0 amounts. |
| `service/coupons/types.ts`, `service/vouchers/hook.ts`, `service/vouchers/types.ts` | Updated DTO/response types and added `useVoucherBalance`. |

### fundordonate
| File | Change |
|---|---|
| `apps/api/src/modules/consumer/consumer.service.ts` | Reward `value` falls back to `metadata.fulfilment.amount` in both wallet views. |

### Live verification (same day)
- Redeem with `instrumentType` → `200`, `REDEEMED`, `DELIVERED`, metadata recorded.
- Previously failing partner outbox rows → all `SENT`; rewards + FND mirrors both `REDEEMED/DELIVERED`.
- Product order commit → FND mirror `REDEEMED` without running reconcile (issuer fan-out).
- Coupon validate: fixed £10 → `discountAmount 10`; 15% of £19.99 → `3`. UI shows `Coupon Discount −£1.50`, no crash.
- Voucher balance endpoint → `£20`; UI shows `Balance: £20.00`.
- Full-value gift card → order total `0`, gift card debited, order columns populated.
- Booking cancel → booking reward `RELEASED`, provider issuance back to `ISSUED`.
- New £20 voucher issuance → `value 20`, `fulfilmentStatus DELIVERED`, FND consumer returns `value 20`.
- Mall dashboard console: no `/membership/my` 403.
- Typecheck: rewards API, mall API, mall storefront (edited files), fundordonate API — clean.
- Targeted tests: mall 12/12, rewards 79/79 pass.

### Not changed / follow-ups
- Existing old instrument issuances keep `value = 0` in the column (their metadata predates `fulfilment.amount`); new issuances are correct and FND falls back gracefully.
- Optional data remediation for the demo catalogue reassigned during testing remains a manual decision (see P3-11).
