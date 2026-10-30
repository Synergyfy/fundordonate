// =============================================================================
// Admin — Plans & Access Passes
// Catalogue lists, feature defaults, orders and issued codes.
// Create/edit lives on dedicated pages.
// =============================================================================

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Edit3,
  Plus,
  Ticket,
  Trash2,
} from "lucide-react";
import {
  planAdminService,
  type AccessPass,
  type MembershipPlan,
  type PlanAccessLevel,
  type PlanFeature,
} from "@/services/plans";
import {
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
  AdminTable,
  StatusPill,
  fmtDate,
  fmtGbp,
} from "@/pages/admin/sections/shared";

type Tab = "plans" | "passes" | "features" | "orders" | "codes";

const ACCESS_LEVELS: PlanAccessLevel[] = ["STANDARD", "PRO", "PRO_PLUS"];

export function AdminPlansPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const initialTab: Tab = location.pathname.endsWith("access-passes")
    ? "passes"
    : location.pathname.endsWith("features")
      ? "features"
      : location.pathname.endsWith("orders")
        ? "orders"
        : "plans";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const featuresQuery = useQuery({
    queryKey: ["admin-plan-features"],
    queryFn: () => planAdminService.listFeatures(),
  });
  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => planAdminService.listPlans(true),
  });
  const passesQuery = useQuery({
    queryKey: ["admin-access-passes"],
    queryFn: () => planAdminService.listAccessPasses(true),
  });
  const ordersQuery = useQuery({
    queryKey: ["admin-plan-orders"],
    queryFn: () => planAdminService.listOrders({ limit: 50 }),
    enabled: tab === "orders",
  });
  const codesQuery = useQuery({
    queryKey: ["admin-plan-codes"],
    queryFn: () => planAdminService.listCodes({ limit: 50 }),
    enabled: tab === "codes",
  });

  const features = featuresQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const passes = passesQuery.data ?? [];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-access-passes"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-plan-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-plan-codes"] }),
      queryClient.invalidateQueries({ queryKey: ["plan-catalog"] }),
      queryClient.invalidateQueries({ queryKey: ["plan-capabilities"] }),
    ]);
  };

  const deletePlan = useMutation({
    mutationFn: (id: string) => planAdminService.deletePlan(id),
    onSuccess: async (res) => {
      setNotice(
        res.archived
          ? res.message ?? "Plan archived because it has purchases attached."
          : "Plan deleted.",
      );
      await invalidate();
    },
    onError: (err: any) => setError(err?.message ?? "Could not delete the plan."),
  });

  const deletePass = useMutation({
    mutationFn: (id: string) => planAdminService.deleteAccessPass(id),
    onSuccess: async (res) => {
      setNotice(
        res.archived
          ? "Access pass archived (it has been used)."
          : "Access pass deleted.",
      );
      await invalidate();
    },
    onError: (err: any) =>
      setError(err?.message ?? "Could not delete the access pass."),
  });

  const saveFeature = useMutation({
    mutationFn: (payload: { key: string; patch: Partial<PlanFeature> }) =>
      planAdminService.updateFeature(payload.key, payload.patch),
    onSuccess: async () => {
      setNotice("Feature defaults updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-plan-features"] });
    },
    onError: (err: any) =>
      setError(err?.message ?? "Could not update the feature."),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Plans & Access Passes"
        description="Manage plans, variants and access passes. Create and edit open on their own page."
        actions={
          <div className="flex gap-2">
            {tab === "plans" && (
              <Link
                to="/admin/membership/plans/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" /> New plan
              </Link>
            )}
            {tab === "passes" && (
              <Link
                to="/admin/membership/access-passes/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" /> New access pass
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
        {(
          [
            ["plans", "Plans"],
            ["passes", "Access passes"],
            ["features", "Feature defaults"],
            ["orders", "Orders"],
            ["codes", "Access codes"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              tab === value
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check className="h-4 w-4" /> {notice}
          <button
            onClick={() => setNotice(null)}
            className="ml-auto text-xs font-bold text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {tab === "plans" && (
        <PlansTab
          loading={plansQuery.isLoading}
          plans={plans}
          onDelete={(id) => {
            if (
              confirm(
                "Delete this plan? Plans with purchases are archived instead.",
              )
            ) {
              deletePlan.mutate(id);
            }
          }}
        />
      )}

      {tab === "passes" && (
        <PassesTab
          loading={passesQuery.isLoading}
          passes={passes}
          onDelete={(id) => {
            if (
              confirm(
                "Delete this access pass? Used passes are archived instead.",
              )
            ) {
              deletePass.mutate(id);
            }
          }}
        />
      )}

      {tab === "features" && (
        <FeaturesTab
          loading={featuresQuery.isLoading}
          features={features}
          onSave={(key, patch) => saveFeature.mutate({ key, patch })}
          saving={saveFeature.isPending}
        />
      )}

      {tab === "orders" && (
        <OrdersTab
          loading={ordersQuery.isLoading}
          orders={ordersQuery.data?.items ?? []}
        />
      )}

      {tab === "codes" && (
        <CodesTab
          loading={codesQuery.isLoading}
          codes={codesQuery.data?.items ?? []}
        />
      )}
    </div>
  );
}

// ── Lists ───────────────────────────────────────────────────────────────────

function PlansTab({
  loading,
  plans,
  onDelete,
}: {
  loading: boolean;
  plans: MembershipPlan[];
  onDelete: (id: string) => void;
}) {
  if (loading) return <AdminLoading label="Loading plans…" />;
  if (plans.length === 0)
    return <AdminEmpty message="No plans yet. Create your first one." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: plan.color ?? "#6B7280" }}
                />
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                {plan.badge && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                    {plan.badge}
                  </span>
                )}
                <StatusPill status={plan.isActive ? "active" : "inactive"} />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {plan.audience} · /{plan.slug}
              </p>
            </div>
            <div className="flex gap-1">
              <Link
                to={`/admin/membership/plans/${plan.id}/edit`}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                title="Edit plan"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(plan.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                title="Delete plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {ACCESS_LEVELS.map((level) => {
              const variant = plan.variants.find((v) => v.accessLevel === level);
              return (
                <div
                  key={level}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-2.5"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {level.replace("_PLUS", "+")}
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-gray-900">
                    {variant ? fmtGbp(variant.priceMinor) : "—"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {variant ? `${variant.durationDays} days` : "Not configured"}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-400">
                    {variant?.counts?.entitlements ?? 0} active /{" "}
                    {variant?.counts?.orders ?? 0} orders
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PassesTab({
  loading,
  passes,
  onDelete,
}: {
  loading: boolean;
  passes: AccessPass[];
  onDelete: (id: string) => void;
}) {
  if (loading) return <AdminLoading label="Loading access passes…" />;
  if (passes.length === 0)
    return <AdminEmpty message="No access passes yet. Create your first one." />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {passes.map((pass) => (
        <div
          key={pass.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{pass.name}</h2>
                <p className="text-[11px] text-gray-500">
                  {pass.durationDays} days · {fmtGbp(pass.priceMinor)}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Link
                to={`/admin/membership/access-passes/${pass.id}/edit`}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                title="Edit access pass"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(pass.id)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                title="Delete access pass"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {pass.description && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-500">
              {pass.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {pass.count?.codes ?? 0} codes ·{" "}
              {pass.count?.entitlements ?? 0} active
            </span>
            <StatusPill status={pass.isActive ? "active" : "inactive"} />
          </div>
          {pass.codeValidityDays && (
            <p className="mt-1 text-[11px] text-gray-400">
              Codes valid {pass.codeValidityDays} days
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Feature defaults ────────────────────────────────────────────────────────

function FeaturesTab({
  loading,
  features,
  onSave,
  saving,
}: {
  loading: boolean;
  features: PlanFeature[];
  onSave: (key: string, patch: Partial<PlanFeature>) => void;
  saving: boolean;
}) {
  if (loading) return <AdminLoading label="Loading feature catalogue…" />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        These are the capabilities admins can attach to plans. The defaults here
        apply to business users with no active plan or access pass.
      </p>
      <AdminTable
        columns={[
          "Feature",
          "Category",
          "Default for non-subscribers",
          "Quota",
          "Saved",
        ]}
      >
        {features.map((feature) => (
          <FeatureRow
            key={feature.key}
            feature={feature}
            onSave={onSave}
            saving={saving}
          />
        ))}
      </AdminTable>
    </div>
  );
}

function FeatureRow({
  feature,
  onSave,
  saving,
}: {
  feature: PlanFeature;
  onSave: (key: string, patch: Partial<PlanFeature>) => void;
  saving: boolean;
}) {
  const [enabled, setEnabled] = useState(feature.defaultEnabled);
  const [supportsLimit, setSupportsLimit] = useState(feature.supportsLimit);
  const [defaultLimit, setDefaultLimit] = useState<number | "">(
    feature.defaultLimit ?? "",
  );
  const [dirty, setDirty] = useState(false);

  const mark = () => setDirty(true);

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="font-semibold text-gray-900">{feature.name}</div>
        <div className="font-mono text-[11px] text-gray-400">{feature.key}</div>
        {feature.description && (
          <div className="mt-0.5 text-xs text-gray-500">
            {feature.description}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs capitalize text-gray-600">
        {feature.category}
      </td>
      <td className="px-4 py-3">
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              mark();
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600"
          />
          {enabled ? "Enabled" : "Locked"}
        </label>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={supportsLimit}
              onChange={(e) => {
                setSupportsLimit(e.target.checked);
                mark();
              }}
              className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
            />
            Quota
          </label>
          {supportsLimit && (
            <input
              type="number"
              min={0}
              value={defaultLimit}
              onChange={(e) => {
                setDefaultLimit(
                  e.target.value === "" ? "" : Number(e.target.value),
                );
                mark();
              }}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs"
            />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          disabled={!dirty || saving}
          onClick={() => {
            onSave(feature.key, {
              defaultEnabled: enabled,
              supportsLimit,
              defaultLimit:
                defaultLimit === "" ? null : Number(defaultLimit),
            });
            setDirty(false);
          }}
          className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          Save
        </button>
      </td>
    </tr>
  );
}

// ── Orders & codes ──────────────────────────────────────────────────────────

function OrdersTab({ loading, orders }: { loading: boolean; orders: any[] }) {
  if (loading) return <AdminLoading label="Loading orders…" />;
  if (orders.length === 0) return <AdminEmpty message="No plan orders yet." />;
  return (
    <AdminTable
      columns={[
        "Reference",
        "Customer",
        "Product",
        "Amount",
        "Activation",
        "Status",
        "Date",
      ]}
    >
      {orders.map((order) => (
        <tr key={order.id}>
          <td className="px-4 py-3 font-mono text-xs">{order.reference}</td>
          <td className="px-4 py-3 text-xs">
            <div className="font-semibold text-gray-900">
              {[order.user?.firstName, order.user?.lastName]
                .filter(Boolean)
                .join(" ") ||
                order.user?.email ||
                order.userId}
            </div>
            <div className="text-gray-400">{order.user?.email}</div>
          </td>
          <td className="px-4 py-3 text-xs text-gray-700">{order.product}</td>
          <td className="px-4 py-3 text-xs font-semibold">
            {fmtGbp(order.amountMinor)}
          </td>
          <td className="px-4 py-3 text-xs uppercase text-gray-500">
            {order.activationMode === "save_code" ? "Saved code" : "Immediate"}
          </td>
          <td className="px-4 py-3">
            <StatusPill status={order.status.toLowerCase()} />
          </td>
          <td className="px-4 py-3 text-xs text-gray-500">
            {fmtDate(order.createdAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}

function CodesTab({ loading, codes }: { loading: boolean; codes: any[] }) {
  if (loading) return <AdminLoading label="Loading access codes…" />;
  if (codes.length === 0)
    return <AdminEmpty message="No access pass codes issued yet." />;
  return (
    <AdminTable
      columns={[
        "Code",
        "Access pass",
        "Owner",
        "Status",
        "Code expires",
        "Access expires",
      ]}
    >
      {codes.map((code) => (
        <tr key={code.id}>
          <td className="px-4 py-3 font-mono text-xs font-bold">{code.code}</td>
          <td className="px-4 py-3 text-xs">{code.accessPass?.name}</td>
          <td className="px-4 py-3 text-xs">
            {code.owner?.email ?? code.ownerId ?? "—"}
          </td>
          <td className="px-4 py-3">
            <StatusPill status={code.status.toLowerCase()} />
          </td>
          <td className="px-4 py-3 text-xs text-gray-500">
            {fmtDate(code.expiresAt)}
          </td>
          <td className="px-4 py-3 text-xs text-gray-500">
            {fmtDate(code.entitlementExpiresAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
