import { useEffect, useState } from "react";
import { adminApi } from "@/services/admin.service";

interface Settings {
  siteName: string;
  currency: string;
  platformFee: number;
  paymentGateways: string[];
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await adminApi.updateSettings(settings as unknown as Record<string, unknown>);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "payment", label: "Payment" },
    { id: "email", label: "Email" },
    { id: "campaign", label: "Campaign" },
    { id: "security", label: "Security" },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        {activeTab === "general" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
            <div>
              <label className="label">Site Name</label>
              <input type="text" value={settings?.siteName || ""} onChange={(e) => setSettings((s) => s ? { ...s, siteName: e.target.value } : s)} className="input-field w-full" />
            </div>
            <div>
              <label className="label">Currency</label>
              <select value={settings?.currency || "usd"} onChange={(e) => setSettings((s) => s ? { ...s, currency: e.target.value } : s)} className="input-field w-full">
                <option value="gbp">GBP (£)</option>
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
            <div>
              <label className="label">Platform Fee (%)</label>
              <input type="number" value={settings?.platformFee || 5} onChange={(e) => setSettings((s) => s ? { ...s, platformFee: Number(e.target.value) } : s)} className="input-field w-full sm:w-40" />
            </div>
            <div>
              <label className="label">Active Gateways</label>
              <div className="mt-2 space-y-2">
                {["stripe", "paypal", "native"].map((g) => (
                  <label key={g} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings?.paymentGateways?.includes(g) || false}
                      onChange={(e) => {
                        setSettings((s) => {
                          if (!s) return s;
                          const gateways = e.target.checked
                            ? [...(s.paymentGateways || []), g]
                            : (s.paymentGateways || []).filter((x) => x !== g);
                          return { ...s, paymentGateways: gateways };
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{g === "native" ? "Offline (Bank Transfer)" : g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Email & Notification Settings</h2>
            <p className="text-sm text-gray-500">Configure email templates and notification preferences.</p>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Email template management coming soon.</div>
          </div>
        )}

        {activeTab === "campaign" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Settings</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Require login to view campaigns</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Show contributor list</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Allow comments on campaigns</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Enable social sharing</span>
            </label>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Enable spam protection (reCAPTCHA)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Require email verification</span>
            </label>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Advanced Settings</h2>
            <div>
              <label className="label">Permalink Structure</label>
              <select defaultValue="campaign" className="input-field w-full sm:w-60">
                <option value="campaign">/campaigns/:slug</option>
                <option value="c">/c/:slug</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Enable debug mode</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
