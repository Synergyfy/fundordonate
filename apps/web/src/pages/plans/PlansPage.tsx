// =============================================================================
// Plans & Access Passes
// Public catalogue + authenticated purchase, activation and code redemption.
// =============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  KeyRound,
  Loader2,
  LockKeyhole,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import { planService } from "@/services/plans";
import type {
  AccessPass,
  MembershipPlan,
  PlanAccessLevel,
  PlanOrderKind,
  PlanVariant,
  PurchasePlanPayload,
} from "@/services/plans/type";
import { useAuthStore } from "@/stores/auth.store";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { StripeElementsCheckout } from "@/components/payment/StripeElementsCheckout";
import { AccessRefreshButton } from "@/components/plans/AccessRefreshButton";

type Tab = "plans" | "access-passes" | "my-access";

export interface AccessRefreshState {
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
  message?: { type: "success" | "error"; text: string } | null;
}

const ACCESS_LABEL: Record<PlanAccessLevel, string> = {
  STANDARD: "Standard",
  PRO: "Pro",
  PRO_PLUS: "Pro+",
};

const fmtGbp = (pence: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);

const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

function effectiveSourceLabel(
  effective: { source: string; kind: string | null } | null | undefined,
): string {
  if (!effective) return "Active access";
  if (effective.kind === "membership" || effective.source === "membership") {
    return "Included in your MCOM membership";
  }
  if (effective.kind === "access_pass" || effective.source === "access_pass") {
    return "MCOM access pass";
  }
  if (effective.kind === "trial" || effective.source === "trial") {
    return "Programme trial";
  }
  return "MCOM access";
}

export function PlansExperience({
  embedded = false,
  accessRefresh,
}: {
  embedded?: boolean;
  accessRefresh?: AccessRefreshState;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((s) => s.authStatus);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = authStatus === "authenticated";
  const isBusiness = user?.userType?.toLowerCase() === "business";

  const [tab, setTab] = useState<Tab>("plans");
  const [selected, setSelected] = useState<{
    kind: PlanOrderKind;
    variant?: PlanVariant;
    pass?: AccessPass;
    activationMode: "immediate" | "save_code";
  } | null>(null);
  const [method, setMethod] = useState<"wallet" | "stripe" | "paypal">("wallet");
  const [error, setError] = useState<string | null>(null);
  const [forfeitConflict, setForfeitConflict] = useState<{
    message: string;
    activePlanName?: string | null;
    expiresAt?: string | null;
  } | null>(null);
  const [success, setSuccess] = useState<{
    kind: PlanOrderKind;
    code?: string | null;
    planName: string;
    expiresAt?: string | null;
  } | null>(null);
  const [stripeCheckout, setStripeCheckout] = useState<{
    orderId: string;
    clientSecret: string;
    publishableKey?: string;
    amountMinor: number;
  } | null>(null);

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["plan-catalog"],
    queryFn: () => planService.getCatalog(),
  });

  const { data: mine, isLoading: mineLoading } = useQuery({
    queryKey: ["plans-me"],
    queryFn: () => planService.getMine(),
    enabled: isAuthenticated,
  });

  const { data: wallet } = useWalletBalance();

  const centralEffective =
    !mine?.active &&
    mine?.effective &&
    mine.effective.source === "mcom" &&
    mine.effective.planName
      ? mine.effective
      : null;
  const hasAccessSummary = Boolean(mine?.active || centralEffective);

  const featureName = useMemo(() => {
    const map = new Map<string, string>();
    for (const feature of catalog?.features ?? []) {
      map.set(feature.key, feature.name);
    }
    return map;
  }, [catalog?.features]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["plan-catalog"] }),
      queryClient.invalidateQueries({ queryKey: ["plans-me"] }),
      queryClient.invalidateQueries({ queryKey: ["plan-capabilities"] }),
      queryClient.invalidateQueries({ queryKey: ["auth-me"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
    ]);
    await useAuthStore.getState().loadUser();
  };

  const purchase = useMutation({
    mutationFn: (payload: PurchasePlanPayload) => planService.purchase(payload),
    onSuccess: async (result) => {
      setError(null);
      if (result.approvalUrl) {
        window.location.href = result.approvalUrl;
        return;
      }
      if (result.clientSecret) {
        setStripeCheckout({
          orderId: result.order.id,
          clientSecret: result.clientSecret,
          publishableKey: result.publishableKey,
          amountMinor: Number(result.amountMinor),
        });
        return;
      }
      const activation = result.activation;
      if (activation) {
        setSuccess({
          kind: result.order.kind,
          code: activation.code?.code ?? null,
          planName:
            result.order.product ??
            activation.entitlement?.planName ??
            selected?.variant?.name ??
            selected?.pass?.name ??
            "Your plan",
          expiresAt:
            activation.entitlement?.expiresAt ??
            activation.order?.entitlementExpiresAt ??
            null,
        });
        setSelected(null);
        await refresh();
      } else {
        setError(
          "Payment was created but has not settled yet. Check My access in a moment.",
        );
      }
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      if (data?.details?.requiresForfeit) {
        setForfeitConflict({
          message: data.message,
          activePlanName: data.details.activePlanName,
          expiresAt: data.details.expiresAt,
        });
        setError(null);
        return;
      }
      const message =
        data?.message ?? err?.message ?? "Could not start your purchase.";
      setError(Array.isArray(message) ? message.join(", ") : String(message));
    },
  });

  const confirmStripe = async (paymentIntentId: string) => {
    if (!stripeCheckout) return;
    try {
      await planService.confirmOrder(stripeCheckout.orderId, {
        paymentIntentId,
      });
      setSuccess({
        kind: selected?.kind ?? "PLAN",
        planName:
          selected?.variant?.name ??
          selected?.pass?.name ??
          "Your plan",
      });
      setStripeCheckout(null);
      setSelected(null);
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Could not confirm your payment.");
    }
  };

  const startPurchase = (
    kind: PlanOrderKind,
    activationMode: "immediate" | "save_code",
    variant?: PlanVariant,
    pass?: AccessPass,
  ) => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent("/plans")}`);
      return;
    }
    if (!isBusiness) {
      navigate("/consumer");
      return;
    }
    setError(null);
    setForfeitConflict(null);
    setSelected({ kind, variant, pass, activationMode });
    setTab(kind === "PLAN" ? "plans" : "access-passes");
  };

  const submitPurchase = (confirmForfeit = false) => {
    if (!selected) return;
    purchase.mutate({
      kind: selected.kind,
      planVariantId: selected.variant?.id,
      accessPassId: selected.pass?.id,
      method,
      activationMode: selected.activationMode,
      acceptedTerms: true,
      confirmForfeit,
    });
  };

  if (authStatus === "authenticated" && user && !isBusiness) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <BadgeCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Your consumer account is free
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Consumer dashboards, rewards and everything else you use are included
            at no cost. Plans and access passes are only for business accounts.
          </p>
          <Link
            to="/consumer"
            className="mt-6 inline-block rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700"
          >
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (stripeCheckout) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Complete card payment</h1>
          <p className="mt-1 text-sm text-gray-500">
            {selected?.variant?.name ?? selected?.pass?.name ?? "Plan purchase"} ·{" "}
            {fmtGbp(stripeCheckout.amountMinor)}
          </p>
          <div className="mt-6">
            <StripeElementsCheckout
              clientSecret={stripeCheckout.clientSecret}
              publishableKey={stripeCheckout.publishableKey}
              amount={stripeCheckout.amountMinor / 100}
              onSuccess={confirmStripe}
              onError={setError}
            />
          </div>
          {error && <ErrorNote message={error} />}
          <button
            type="button"
            onClick={() => setStripeCheckout(null)}
            className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gray-50"}>
      <div className={embedded ? "" : "mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
              Plans & access
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Choose how you grow
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              A plan runs for Standard (90 days), Pro (180 days) or Pro+
              (1 year). Prefer not to join? Buy an access pass, activate it now,
              or keep the code for later.
            </p>
          </div>
          {isAuthenticated && !embedded && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to dashboard
            </Link>
          )}
        </div>

        {/* Current plan summary */}
        {isAuthenticated && hasAccessSummary && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  {mine?.active
                    ? mine.active.planName ?? "Active plan"
                    : centralEffective?.planName}
                </p>
                <p className="text-xs text-emerald-700">
                  {mine?.active
                    ? `${mine.active.kind === "ACCESS_PASS" ? "Access pass" : "Plan"} · active until ${fmtDate(mine.active.expiresAt)}`
                    : `${effectiveSourceLabel(centralEffective)}${centralEffective?.expiresAt ? ` · active until ${fmtDate(centralEffective.expiresAt)}` : ""}`}
                </p>
                {accessRefresh && (
                  <p className="mt-1 text-[11px] text-emerald-700/80">
                    Refresh to recheck MCOM Central for an updated membership,
                    plan or access pass.
                  </p>
                )}
                {accessRefresh?.message && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      accessRefresh.message.type === "success"
                        ? "text-emerald-800"
                        : "text-amber-800"
                    }`}
                  >
                    {accessRefresh.message.text}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {accessRefresh && (
                <AccessRefreshButton
                  onRefresh={accessRefresh.onRefresh}
                  refreshing={accessRefresh.refreshing}
                />
              )}
              <button
                onClick={() => setTab("my-access")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Manage access
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {(
            [
              ["plans", "Plans"],
              ["access-passes", "Access passes"],
              ["my-access", "My access"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                tab === value
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {catalogLoading && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
          </div>
        )}

        {tab === "plans" && catalog && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {catalog.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                featureName={featureName}
                onSelect={(variant) =>
                  startPurchase("PLAN", "immediate", variant)
                }
              />
            ))}
          </div>
        )}

        {tab === "access-passes" && catalog && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {catalog.accessPasses.map((pass) => (
              <AccessPassCard
                key={pass.id}
                pass={pass}
                featureName={featureName}
                onBuy={(mode) => startPurchase("ACCESS_PASS", mode, undefined, pass)}
              />
            ))}
            {catalog.accessPasses.length === 0 && (
              <div className="col-span-full rounded-2xl border bg-white p-10 text-center text-sm text-gray-500">
                No access passes are on sale right now.
              </div>
            )}
          </div>
        )}

        {tab === "my-access" && (
          <MyAccess
            mine={mine}
            loading={mineLoading}
            isAuthenticated={isAuthenticated}
            onRedeemed={refresh}
          />
        )}

        {success && (
          <SuccessPanel success={success} onClose={() => setSuccess(null)} />
        )}
      </div>

      {selected && (
        <PurchaseSheet
          selected={selected}
          method={method}
          setMethod={setMethod}
          walletBalance={wallet?.availableBalance}
          busy={purchase.isPending}
          error={error}
          forfeitConflict={forfeitConflict}
          onClose={() => {
            setSelected(null);
            setError(null);
            setForfeitConflict(null);
          }}
          onConfirm={submitPurchase}
        />
      )}
    </div>
  );
}

export default function PlansPage() {
  return <PlansExperience />;
}

// ── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  featureName,
  onSelect,
}: {
  plan: MembershipPlan;
  featureName: Map<string, string>;
  onSelect: (variant: PlanVariant) => void;
}) {
  const defaultVariant =
    plan.variants.find((v) => v.accessLevel === "PRO") ?? plan.variants[0];
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");
  const variant =
    plan.variants.find((v) => v.id === variantId) ?? defaultVariant;
  const enabled = capabilityLabels(variant?.capabilities, featureName).slice(0, 7);
  const bullets = variant?.features?.length ? variant.features.slice(0, 7) : enabled;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: plan.color ?? "#6B7280" }}
            />
            <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
          </div>
          {plan.description && (
            <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
          )}
        </div>
        {plan.badge && (
          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-bold text-primary-700">
            {plan.badge}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["STANDARD", "PRO", "PRO_PLUS"] as PlanAccessLevel[]).map((level) => {
          const v = plan.variants.find((x) => x.accessLevel === level);
          if (!v) return null;
          const active = v.id === variant?.id;
          return (
            <button
              key={v.id}
              onClick={() => setVariantId(v.id)}
              className={`rounded-xl border-2 p-2.5 text-left transition ${
                active
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                {ACCESS_LABEL[level]}
              </div>
              <div className="mt-0.5 text-sm font-bold text-gray-900">
                {fmtGbp(v.priceMinor)}
              </div>
              <div className="text-[11px] text-gray-500">{v.durationDays} days</div>
            </button>
          );
        })}
      </div>

      {variant && (
        <div className="mt-4 flex-1">
          <div className="text-sm font-bold text-gray-900">
            {variant.name} · {variant.durationDays} days
          </div>
          <ul className="mt-2 space-y-1.5">
            {bullets.map((label) => (
              <li key={label} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {label}
              </li>
            ))}
            {bullets.length === 0 && (
              <li className="text-sm text-gray-500">
                This variant has no features enabled yet.
              </li>
            )}
          </ul>
        </div>
      )}

      <button
        onClick={() => variant && onSelect(variant)}
        disabled={!variant}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        Choose {ACCESS_LABEL[variant?.accessLevel ?? "STANDARD"]}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Access pass card ────────────────────────────────────────────────────────

function AccessPassCard({
  pass,
  featureName,
  onBuy,
}: {
  pass: AccessPass;
  featureName: Map<string, string>;
  onBuy: (mode: "immediate" | "save_code") => void;
}) {
  const enabled = capabilityLabels(pass.capabilities, featureName).slice(0, 8);
  const bullets = pass.features?.length ? pass.features.slice(0, 8) : enabled;
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{pass.name}</h2>
          <p className="text-xs text-gray-500">{pass.durationDays} days of access</p>
        </div>
      </div>
      {pass.description && (
        <p className="mt-3 text-sm text-gray-600">{pass.description}</p>
      )}
      <div className="mt-3 text-2xl font-bold text-gray-900">
        {fmtGbp(pass.priceMinor)}
      </div>
      <ul className="mt-3 flex-1 space-y-1.5">
        {bullets.map((label) => (
          <li key={label} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-2">
        <button
          onClick={() => onBuy("immediate")}
          className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
        >
          Buy & activate now
        </button>
        <button
          onClick={() => onBuy("save_code")}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Buy & keep code for later
        </button>
      </div>
      {pass.codeValidityDays && (
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Codes stay redeemable for {pass.codeValidityDays} days.
        </p>
      )}
    </div>
  );
}

// ── My access ───────────────────────────────────────────────────────────────

function MyAccess({
  mine,
  loading,
  isAuthenticated,
  onRedeemed,
}: {
  mine: any;
  loading: boolean;
  isAuthenticated: boolean;
  onRedeemed: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activate = async (confirmForfeit = false) => {
    setBusy(true);
    setError(null);
    setConflict(null);
    try {
      const result = await planService.redeemAccessPass({
        code,
        confirmForfeit,
      });
      setSuccessMessage(
        `${result.accessPass.name} is active until ${fmtDate(result.expiresAt)}.`,
      );
      setCode("");
      await onRedeemed();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.details?.requiresForfeit) {
        setConflict(data);
      } else {
        const message = data?.message ?? err?.message ?? "Could not redeem this code.";
        setError(Array.isArray(message) ? message.join(", ") : String(message));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mt-6 rounded-2xl border bg-white p-10 text-center">
        <LockKeyhole className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-600">
          Sign in to see your plan, saved access pass codes and purchase history.
        </p>
        <Link
          to="/login?returnTo=/plans"
          className="mt-4 inline-block rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[25vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Current access
          </h3>
          {mine?.active ? (
            <div className="mt-3 space-y-1.5 text-sm text-gray-600">
              <p className="text-base font-bold text-gray-900">
                {mine.active.planName ?? "Active plan"}
              </p>
              <p>
                {mine.active.kind === "ACCESS_PASS" ? "Access pass" : "Plan"}{" "}
                · started {fmtDate(mine.active.startedAt)}
              </p>
              <p className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-gray-400" />
                Expires {fmtDate(mine.active.expiresAt)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              No active plan or access pass. Choose a plan to unlock paid
              features.
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <KeyRound className="h-4 w-4 text-purple-600" />
            Redeem an access pass code
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Enter a code you bought earlier or received. Activating it will forfeit
            any plan or pass that is currently active.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FDAP-XXXX-XXXX-XXXX"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-primary-500"
            />
            <button
              onClick={() => activate(false)}
              disabled={busy || code.trim().length < 4}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
          {successMessage && (
            <p className="mt-2 text-xs font-medium text-emerald-600">
              {successMessage}
            </p>
          )}
          {conflict && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">{conflict.message}</p>
              <button
                onClick={() => activate(true)}
                disabled={busy}
                className="mt-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                Forfeit current access and activate this pass
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Gift className="h-4 w-4 text-amber-600" />
          Saved access pass codes
        </h3>
        {mine?.codes?.length ? (
          <div className="mt-3 divide-y divide-gray-100">
            {mine.codes.map((saved: any) => (
              <div
                key={saved.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-gray-900">
                    {saved.code}
                  </p>
                  <p className="text-xs text-gray-500">
                    {saved.accessPass?.name} · {saved.accessPass?.durationDays} days
                    {saved.expiresAt ? ` · code expires ${fmtDate(saved.expiresAt)}` : ""}
                  </p>
                </div>
                {saved.status === "AVAILABLE" ? (
                  <button
                    onClick={() => {
                      setCode(saved.code);
                      activate(false);
                    }}
                    className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700"
                  >
                    Activate
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    Active until {fmtDate(saved.entitlementExpiresAt)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">No saved codes yet.</p>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Clock className="h-4 w-4 text-gray-500" />
          Purchase history
        </h3>
        {mine?.orders?.length ? (
          <div className="mt-3 divide-y divide-gray-100">
            {mine.orders.map((order: any) => (
              <div
                key={order.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {order.planVariant?.plan?.name
                      ? `${order.planVariant.plan.name} · ${order.planVariant.name}`
                      : order.accessPass?.name ?? "Plan order"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.reference} · {fmtDate(order.createdAt)} ·{" "}
                    {fmtGbp(order.amountMinor)}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    order.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">No purchases yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Purchase sheet ──────────────────────────────────────────────────────────

function PurchaseSheet({
  selected,
  method,
  setMethod,
  walletBalance,
  busy,
  error,
  forfeitConflict,
  onClose,
  onConfirm,
}: {
  selected: {
    kind: PlanOrderKind;
    variant?: PlanVariant;
    pass?: AccessPass;
    activationMode: "immediate" | "save_code";
  };
  method: "wallet" | "stripe" | "paypal";
  setMethod: (m: "wallet" | "stripe" | "paypal") => void;
  walletBalance?: number;
  busy: boolean;
  error: string | null;
  forfeitConflict: {
    message: string;
    activePlanName?: string | null;
    expiresAt?: string | null;
  } | null;
  onClose: () => void;
  onConfirm: (confirmForfeit?: boolean) => void;
}) {
  const amount =
    selected.variant?.priceMinor ?? selected.pass?.priceMinor ?? 0;
  const name =
    selected.kind === "PLAN"
      ? `${selected.variant?.name ?? "Plan"} · ${selected.variant?.durationDays ?? 0} days`
      : `${selected.pass?.name ?? "Access pass"} · ${selected.pass?.durationDays ?? 0} days`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complete your purchase</h2>
            <p className="mt-1 text-sm text-gray-500">{name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-2xl font-bold text-gray-900">{fmtGbp(amount)}</span>
          </div>
          {selected.activationMode === "save_code" && (
            <p className="mt-1 text-xs text-gray-500">
              You'll receive a code to keep. Nothing is activated until you redeem it.
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <PaymentOption
            active={method === "wallet"}
            onClick={() => setMethod("wallet")}
            icon={<Wallet className="h-5 w-5 text-amber-600" />}
            title="MCOM Central Wallet"
            subtitle={
              walletBalance !== undefined
                ? `Available balance: ${walletBalance.toFixed(2)} MCOM`
                : "Pay with prepaid credits"
            }
          />
          <PaymentOption
            active={method === "stripe"}
            onClick={() => setMethod("stripe")}
            icon={<CreditCard className="h-5 w-5 text-blue-600" />}
            title="Credit / debit card"
            subtitle="Visa, Mastercard, Amex via MCOM Pay"
          />
          <PaymentOption
            active={method === "paypal"}
            onClick={() => setMethod("paypal")}
            icon={<span className="text-lg">🅿️</span>}
            title="PayPal"
            subtitle="Pay securely through PayPal"
          />
        </div>

        {forfeitConflict && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">{forfeitConflict.message}</p>
            {forfeitConflict.expiresAt && (
              <p className="mt-1 text-[11px] text-amber-700">
                Existing access ends {fmtDate(forfeitConflict.expiresAt)}.
              </p>
            )}
            <button
              onClick={() => onConfirm(true)}
              disabled={busy}
              className="mt-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Forfeit existing access and continue
            </button>
          </div>
        )}

        {error && <ErrorNote message={error} />}

        <button
          onClick={() => onConfirm(false)}
          disabled={busy || Boolean(forfeitConflict)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting payment…
            </>
          ) : (
            <>Pay {fmtGbp(amount)}</>
          )}
        </button>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Payments are processed securely by MCOM Pay.
        </p>
      </div>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
        active ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
      <div
        className={`h-5 w-5 rounded-full border-2 ${
          active ? "border-primary-600" : "border-gray-300"
        }`}
      >
        {active && <div className="m-1 h-3 w-3 rounded-full bg-primary-600" />}
      </div>
    </button>
  );
}

function SuccessPanel({
  success,
  onClose,
}: {
  success: {
    kind: PlanOrderKind;
    code?: string | null;
    planName: string;
    expiresAt?: string | null;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          {success.code ? "Your access pass code is ready" : "You're all set"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{success.planName}</p>
        {success.code && (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Keep this code
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wider text-gray-900">
              {success.code}
            </p>
          </div>
        )}
        {success.expiresAt && (
          <p className="mt-3 text-sm text-gray-500">
            Active until {fmtDate(success.expiresAt)}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function capabilityLabels(
  capabilities: Record<string, { enabled: boolean }> | undefined,
  featureName: Map<string, string>,
): string[] {
  if (!capabilities) return [];
  return Object.entries(capabilities)
    .filter(([, rule]) => rule?.enabled)
    .map(([key]) => featureName.get(key) ?? key);
}
