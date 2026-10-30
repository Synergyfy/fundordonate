// =============================================================================
// Admin — Create / edit an access pass (full page)
// =============================================================================

import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
  planAdminService,
  type AccessPass,
  type CapabilityMap,
  type PlanFeature,
} from "@/services/plans";
import { PlanCapabilityEditor } from "@/components/admin/PlanCapabilityEditor";
import { planCapabilities } from "@/lib/plan-capabilities";
import { AdminLoading, fmtGbp } from "@/pages/admin/sections/shared";

interface PassDraft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  durationDays: number;
  pricePounds: string;
  codeValidityDays: number | "";
  isActive: boolean;
  sortOrder: number;
  capabilities: CapabilityMap;
}

export default function AccessPassFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<PassDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featuresQuery = useQuery({
    queryKey: ["admin-plan-features"],
    queryFn: () => planAdminService.listFeatures(),
  });
  const passQuery = useQuery({
    queryKey: ["admin-access-pass", id],
    queryFn: () => planAdminService.getAccessPass(id!),
    enabled: isEdit,
  });

  const features: PlanFeature[] = featuresQuery.data ?? [];
  const pass: AccessPass | undefined = passQuery.data;

  useEffect(() => {
    if (!features.length) return;
    if (isEdit) {
      if (!pass) return;
      setDraft({
        id: pass.id,
        name: pass.name,
        slug: pass.slug,
        description: pass.description ?? "",
        durationDays: pass.durationDays,
        pricePounds: String(pass.priceMinor / 100),
        codeValidityDays: pass.codeValidityDays ?? "",
        isActive: pass.isActive,
        sortOrder: pass.sortOrder,
        capabilities: planCapabilities(features, pass.capabilities),
      });
      return;
    }
    setDraft((current) =>
      current ?? {
        name: "",
        slug: "",
        description: "",
        durationDays: 90,
        pricePounds: "0",
        codeValidityDays: 365,
        isActive: true,
        sortOrder: 0,
        capabilities: planCapabilities(features),
      },
    );
  }, [features, isEdit, pass]);

  const save = useMutation({
    mutationFn: async (value: PassDraft) => {
      const payload = {
        name: value.name.trim(),
        slug: value.slug.trim() || undefined,
        description: value.description.trim() || null,
        durationDays: Math.max(1, Number(value.durationDays) || 1),
        priceMinor: priceToPence(value.pricePounds),
        codeValidityDays:
          value.codeValidityDays === "" ? null : Number(value.codeValidityDays),
        isActive: value.isActive,
        sortOrder: Number(value.sortOrder) || 0,
        capabilities: value.capabilities,
      };
      if (value.id) {
        return planAdminService.updateAccessPass(value.id, payload);
      }
      return planAdminService.createAccessPass(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-access-passes"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-catalog"] }),
        queryClient.invalidateQueries({ queryKey: ["plan-capabilities"] }),
      ]);
      navigate("/admin/membership/access-passes");
    },
    onError: (err: any) =>
      setError(err?.message ?? "Could not save the access pass."),
  });

  if (featuresQuery.isLoading || (isEdit && passQuery.isLoading) || !draft) {
    return <AdminLoading label="Loading access pass…" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/membership/access-passes"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to access passes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit access pass" : "New access pass"}
          </h1>
          <p className="text-sm text-gray-500">
            Business-only product with its own duration, price and capabilities.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/membership/access-passes"
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
            Save access pass
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
          title="Access pass details"
          description="Access passes are a business-only alternative to a plan. They have one duration and one set of capabilities, with no Standard/Pro/Pro+ variants."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              hint="The product name businesses see in the catalogue and at checkout, for example “90-Day Growth Pass”."
            >
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="90-Day Growth Pass"
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
                placeholder="90-day-growth-pass"
                className="input-field"
              />
            </Field>
            <Field
              label="Active days"
              hint="How many days the pass remains active after the business activates it or redeems its code. Example: 71 means the pass expires 71 days after activation."
            >
              <input
                type="number"
                min={1}
                value={draft.durationDays}
                onChange={(e) =>
                  setDraft({ ...draft, durationDays: Number(e.target.value) })
                }
                className="input-field"
              />
            </Field>
            <Field
              label="Price (£)"
              hint="Enter the price in pounds, for example 79 or 79.99. The backend stores it in pence for MCOM Pay."
            >
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.pricePounds}
                onChange={(e) =>
                  setDraft({ ...draft, pricePounds: e.target.value })
                }
                className="input-field"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                {fmtGbp(priceToPence(draft.pricePounds))}
              </p>
            </Field>
            <Field
              label="Code validity (days)"
              hint="How long an unredeemed code can be kept before it expires. Leave blank if codes should never expire. This is separate from the active days above."
            >
              <input
                type="number"
                min={1}
                value={draft.codeValidityDays}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    codeValidityDays:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                placeholder="Blank = never expires"
                className="input-field"
              />
            </Field>
            <Field
              label="Sort order"
              hint="Controls the order access passes appear in the catalogue. Lower numbers appear first: 10 is shown before 20. It does not affect price or access."
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
          </div>
          <div className="mt-4">
            <Field
              label="Description"
              hint="A short summary shown under the access pass name in the catalogue and purchase screen."
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
                Tick to show this access pass in the catalogue and allow
                businesses to buy it. Untick to hide it from new purchases.
              </span>
            </span>
          </label>
        </Section>

        <Section
          title="Capabilities"
          description="Choose exactly what a business gets while this access pass is active. Capabilities are enforced by the API and the dashboard, so unticked features are genuinely locked."
        >
          <PlanCapabilityEditor
            features={features}
            value={draft.capabilities}
            onChange={(capabilities) =>
              setDraft({ ...draft, capabilities })
            }
          />
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
