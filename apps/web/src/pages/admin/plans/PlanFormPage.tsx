// =============================================================================
// Admin — Create / edit a plan (full page)
// =============================================================================

import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
} from "lucide-react";
import {
  planAdminService,
  type CapabilityMap,
  type MembershipPlan,
  type PlanAccessLevel,
  type PlanFeature,
} from "@/services/plans";
import { PlanCapabilityEditor } from "@/components/admin/PlanCapabilityEditor";
import { planCapabilities } from "@/lib/plan-capabilities";
import { AdminLoading, fmtGbp } from "@/pages/admin/sections/shared";

const ACCESS_LEVELS: PlanAccessLevel[] = ["STANDARD", "PRO", "PRO_PLUS"];
const ACCESS_LABELS: Record<PlanAccessLevel, string> = {
  STANDARD: "Standard (90 days)",
  PRO: "Pro (180 days)",
  PRO_PLUS: "Pro+ (1 year)",
};
const DEFAULT_DURATIONS: Record<PlanAccessLevel, number> = {
  STANDARD: 90,
  PRO: 180,
  PRO_PLUS: 365,
};

interface VariantDraft {
  id?: string;
  accessLevel: PlanAccessLevel;
  description: string;
  durationDays: number;
  pricePounds: string;
  isActive: boolean;
  capabilities: CapabilityMap;
}

interface PlanDraft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  audience: "BUSINESS";
  badge: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  variants: VariantDraft[];
}

export default function PlanFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openVariant, setOpenVariant] = useState<PlanAccessLevel | null>(
    "STANDARD",
  );

  const featuresQuery = useQuery({
    queryKey: ["admin-plan-features"],
    queryFn: () => planAdminService.listFeatures(),
  });
  const planQuery = useQuery({
    queryKey: ["admin-plan", id],
    queryFn: () => planAdminService.getPlan(id!),
    enabled: isEdit,
  });

  const features: PlanFeature[] = featuresQuery.data ?? [];
  const plan: MembershipPlan | undefined = planQuery.data;

  useEffect(() => {
    if (!features.length) return;
    if (isEdit) {
      if (!plan) return;
      setDraft(fromPlan(plan, features));
      return;
    }
    setDraft((current) => current ?? emptyPlan(features));
  }, [features, isEdit, plan]);

  const save = useMutation({
    mutationFn: async (value: PlanDraft) => {
      const payload = toPayload(value);
      if (value.id) return planAdminService.updatePlan(value.id, payload);
      return planAdminService.createPlan(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-plans"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-catalog"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-capabilities"] }),
      ]);
      navigate("/admin/membership/plans");
    },
    onError: (err: any) =>
      setError(err?.message ?? "Could not save the plan."),
  });

  if (featuresQuery.isLoading || (isEdit && planQuery.isLoading) || !draft) {
    return <AdminLoading label="Loading plan…" />;
  }

  const patchVariant = (
    accessLevel: PlanAccessLevel,
    patch: Partial<VariantDraft>,
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      variants: draft.variants.map((variant) =>
        variant.accessLevel === accessLevel ? { ...variant, ...patch } : variant,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/membership/plans"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to plans
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit plan" : "New plan"}
          </h1>
          <p className="text-sm text-gray-500">
            Plan details, Standard/Pro/Pro+ variants and every capability.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/membership/plans"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={() => save.mutate(draft)}
            disabled={save.isPending || !draft.name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save plan
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Section
          title="Plan details"
          description="The public product information businesses see when comparing plans."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Plan name"
              hint="The product name shown in the catalogue and at checkout. Example: Gold."
            >
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Gold"
                className="input-field"
              />
            </Field>
            <Field
              label="Slug (optional)"
              hint="URL-friendly identifier used in links. Leave blank to generate it from the name. Changing it later can break saved links."
            >
              <input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder="gold"
                className="input-field"
              />
            </Field>
            <Field
              label="Badge"
              hint="Optional short marketing label shown on the plan card, for example “Most popular” or “Best value”."
            >
              <input
                value={draft.badge}
                onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                placeholder="Most popular"
                className="input-field"
              />
            </Field>
            <Field
              label="Colour"
              hint="Accent colour used for the plan swatch and plan card. It does not affect pricing or access."
            >
              <input
                type="color"
                value={draft.color || "#D4AF37"}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-200"
              />
            </Field>
            <Field
              label="Sort order"
              hint="Controls the order plans appear in the catalogue. Lower numbers appear first: 10 is shown before 20. It does not affect price or access."
            >
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(e) =>
                  setDraft({ ...draft, sortOrder: Number(e.target.value) })
                }
                className="input-field"
              />
            </Field>
            <Field
              label="Audience"
              hint="Plans are sold to business accounts only. Consumers never pay for plans or access passes."
            >
              <input
                value="Business accounts only"
                readOnly
                className="input-field bg-gray-50 text-gray-500"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field
              label="Description"
              hint="A short summary shown under the plan name in the catalogue and purchase screen. Explain who the plan is for."
            >
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                rows={3}
                className="input-field"
              />
            </Field>
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) =>
                setDraft({ ...draft, isActive: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <span>
              <span className="font-medium">Published</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Tick to show this plan in the catalogue and allow businesses to
                buy it. Untick to hide it from new purchases. Businesses already
                on the plan keep their access until it expires.
              </span>
            </span>
          </label>
        </Section>

        <Section
          title="Variants & capabilities"
          description="Every plan has three duration variants: Standard (90 days), Pro (180 days) and Pro+ (1 year). Each variant has its own price, availability and set of capabilities. A business chooses one variant when buying."
        >
          <div className="space-y-3">
            {draft.variants.map((variant) => {
              const open = openVariant === variant.accessLevel;
              return (
                <div
                  key={variant.accessLevel}
                  className="rounded-xl border border-gray-200"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenVariant(open ? null : variant.accessLevel)
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {ACCESS_LABELS[variant.accessLevel]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fmtGbp(priceToPence(variant.pricePounds))} · {variant.accessLevel}
                      </div>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {open && (
                    <div className="space-y-4 border-t border-gray-100 px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Price (£)"
                          hint="Enter the price in pounds, for example 150 or 149.99. The backend stores it in pence for MCOM Pay."
                        >
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={variant.pricePounds}
                            onChange={(e) =>
                              patchVariant(variant.accessLevel, {
                                pricePounds: e.target.value,
                              })
                            }
                            className="input-field"
                          />
                          <p className="mt-1 text-[11px] text-gray-400">
                            {fmtGbp(priceToPence(variant.pricePounds))}
                          </p>
                        </Field>
                        <Field
                          label="Active"
                          hint="Untick to hide this variant from new purchases without deleting it. Existing subscribers keep access until expiry."
                        >
                          <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) =>
                                patchVariant(variant.accessLevel, {
                                  isActive: e.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-gray-300 text-primary-600"
                            />
                            Available for purchase
                          </label>
                        </Field>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Capabilities for this variant
                        </h3>
                        <p className="mb-4 mt-1 text-xs text-gray-500">
                          Choose exactly what a business on this variant can use.
                          Capabilities are checked by the API and the dashboard,
                          so unticked features are genuinely locked.
                        </p>
                        <PlanCapabilityEditor
                          features={features}
                        value={variant.capabilities}
                          onChange={(capabilities) =>
                            patchVariant(variant.accessLevel, { capabilities })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

function priceToPence(value: string): number {
  const pounds = Number(value);
  return Number.isFinite(pounds) ? Math.max(0, Math.round(pounds * 100)) : 0;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">
        {label}
      </span>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-4 text-gray-500">{hint}</p>}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      <p className="mb-4 mt-1 text-xs text-gray-500">{description}</p>
      {children}
    </section>
  );
}

function emptyPlan(features: PlanFeature[]): PlanDraft {
  return {
    name: "",
    slug: "",
    description: "",
    audience: "BUSINESS",
    badge: "",
    color: "#D4AF37",
    isActive: true,
    sortOrder: 0,
    variants: ACCESS_LEVELS.map((accessLevel) => ({
      accessLevel,
      name: `${
        ACCESS_LABELS[accessLevel].split(" ")[0]
      }`,
      description: "",
      durationDays: DEFAULT_DURATIONS[accessLevel],
      pricePounds: "0",
      isActive: true,
      capabilities: planCapabilities(features),
    })),
  };
}

function fromPlan(plan: MembershipPlan, features: PlanFeature[]): PlanDraft {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? "",
    audience: "BUSINESS",
    badge: plan.badge ?? "",
    color: plan.color ?? "#D4AF37",
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    variants: ACCESS_LEVELS.map((accessLevel) => {
      const variant = plan.variants.find((v) => v.accessLevel === accessLevel);
      return {
        id: variant?.id,
        accessLevel,
        description: variant?.description ?? "",
        durationDays: DEFAULT_DURATIONS[accessLevel],
        pricePounds: String((variant?.priceMinor ?? 0) / 100),
        isActive: variant?.isActive ?? true,
        capabilities: planCapabilities(features, variant?.capabilities),
      };
    }),
  };
}

function toPayload(draft: PlanDraft) {
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim() || undefined,
    description: draft.description.trim() || null,
    audience: draft.audience,
    badge: draft.badge.trim() || null,
    color: draft.color || null,
    isActive: draft.isActive,
    sortOrder: Number(draft.sortOrder) || 0,
    variants: draft.variants.map((variant, index) => ({
      accessLevel: variant.accessLevel,
      description: variant.description.trim() || null,
      durationDays:
        DEFAULT_DURATIONS[variant.accessLevel],
      priceMinor: priceToPence(variant.pricePounds),
      isActive: variant.isActive,
      capabilities: variant.capabilities,
      sortOrder: index * 10,
    })),
  };
}
