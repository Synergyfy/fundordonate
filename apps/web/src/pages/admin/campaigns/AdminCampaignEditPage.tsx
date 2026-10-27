// =============================================================================
// Admin — Edit Campaign
// Edits the campaign-level fields that can safely change after creation.
// Template-level configuration (objective, rewards, activation rules, …) lives
// on the campaign template and is managed from Campaign Templates.
// =============================================================================

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import { adminApi, type AdminCampaignDetail } from "@/services/admin";

function toDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toIsoDate(value: string, endOfDay = false): string | null {
  if (!value) return null;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const date = new Date(`${value}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface EditForm {
  title: string;
  description: string;
  targetAmount: string;
  businessContribution: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: EditForm = {
  title: "",
  description: "",
  targetAmount: "",
  businessContribution: "",
  startDate: "",
  endDate: "",
};

export function AdminCampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<AdminCampaignDetail | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.getCampaign(id);
        if (!active) return;
        setCampaign(data);
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          targetAmount: String((data.targetAmount ?? data.goalAmount ?? 0) / 100),
          businessContribution: String((data.businessContribution ?? 0) / 100),
          startDate: toDateInput(data.startDate),
          endDate: toDateInput(data.endDate),
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ||
          (err as Error)?.message ||
          "Failed to load campaign";
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const patch = (updates: Partial<EditForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setFieldErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.targetAmount || Number(form.targetAmount) <= 0) {
      errors.targetAmount = "Enter a target greater than zero";
    }
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) < new Date(form.startDate)
    ) {
      errors.endDate = "End date must be after the start date";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      await adminApi.updateCampaign(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        targetAmount: Math.round(Number(form.targetAmount) * 100),
        businessContribution: Math.round(
          Number(form.businessContribution || 0) * 100,
        ),
        startDate: toIsoDate(form.startDate),
        endDate: toIsoDate(form.endDate, true),
      });
      navigate(`/admin/campaigns/${id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to save campaign";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
        <h1 className="font-semibold text-gray-900">Campaign not found</h1>
        <p className="mt-1 text-sm text-gray-600">
          {error || "The requested campaign could not be loaded."}
        </p>
        <Link
          to="/admin/campaigns"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/admin/campaigns/${campaign.id}`}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="text-sm text-gray-500">
            Update campaign-level details. Template configuration is managed from
            Campaign Templates.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="label">
            Campaign title
          </label>
          <input
            id="title"
            type="text"
            className="input-field mt-1.5"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Campaign title"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            className="input-field mt-1.5"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What is this campaign funding?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="targetAmount" className="label">
              Funding target (£)
            </label>
            <input
              id="targetAmount"
              type="number"
              min="1"
              step="0.01"
              className="input-field mt-1.5"
              value={form.targetAmount}
              onChange={(e) => patch({ targetAmount: e.target.value })}
            />
            {fieldErrors.targetAmount && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.targetAmount}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="businessContribution" className="label">
              Business self-funding (£)
            </label>
            <input
              id="businessContribution"
              type="number"
              min="0"
              step="0.01"
              className="input-field mt-1.5"
              value={form.businessContribution}
              onChange={(e) =>
                patch({ businessContribution: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="label">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              className="input-field mt-1.5"
              value={form.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="label">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              className="input-field mt-1.5"
              value={form.endDate}
              onChange={(e) => patch({ endDate: e.target.value })}
            />
            {fieldErrors.endDate && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Link
            to={`/admin/campaigns/${campaign.id}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
