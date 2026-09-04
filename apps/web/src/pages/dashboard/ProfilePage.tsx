import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { userDashboardApi } from "@/services/user-dashboard.service";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface NotificationPrefs {
  emailDonations: boolean;
  emailCampaignUpdates: boolean;
  emailNewFollowers: boolean;
  emailWithdrawals: boolean;
  pushDonations: boolean;
  pushCampaignUpdates: boolean;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", bio: "" });
  const [notPrefs, setNotPrefs] = useState<NotificationPrefs>({
    emailDonations: true,
    emailCampaignUpdates: true,
    emailNewFollowers: true,
    emailWithdrawals: true,
    pushDonations: true,
    pushCampaignUpdates: false,
  });

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    Promise.all([
      userDashboardApi.getProfile(),
      userDashboardApi.getNotificationPrefs(),
    ]).then(([p, n]) => {
      setProfile(p);
      setForm({ firstName: p.firstName || "", lastName: p.lastName || "", username: p.username || "", bio: p.bio || "" });
      setNotPrefs(n);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await userDashboardApi.updateProfile(form);
      setProfile(updated);
      showMessage("success", "Profile updated successfully");
    } catch {
      showMessage("error", "Failed to update profile");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMessage("error", "Passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await userDashboardApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMessage("success", "Password changed successfully");
    } catch {
      showMessage("error", "Failed to change password. Check your current password.");
    }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await userDashboardApi.updateNotificationPrefs(notPrefs as unknown as Record<string, boolean>);
      showMessage("success", "Notification preferences saved");
    } catch {
      showMessage("error", "Failed to save preferences");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setSaving(true);
    try {
      await userDashboardApi.deleteAccount(deletePassword);
      useAuthStore.getState().logout();
      navigate("/");
    } catch {
      showMessage("error", "Failed to delete account. Check your password.");
    }
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
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "notifications", label: "Notifications" },
    { id: "danger", label: "Danger Zone" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* Toast Message */}
      {message.text && (
        <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>{message.text}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[80px] rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700 overflow-hidden">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                form.firstName?.[0] || "U"
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">{profile?.role}</span>
                {profile?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                ) : (
                  <span className="text-xs text-yellow-600">Not verified</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First Name</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="input-field w-full" />
            </div>
          </div>

          <div>
            <label className="label">Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="input-field w-full" />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="input-field w-full" rows={3} placeholder="Tell us about yourself..." />
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" value={profile?.email || ""} disabled className="input-field w-full bg-gray-50 text-gray-400" />
          </div>

          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className="input-field w-full" />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} className="input-field w-full" />
          </div>
          <button onClick={handleChangePassword} disabled={saving || !pwForm.currentPassword || !pwForm.newPassword} className="btn-primary">
            {saving ? "Changing..." : "Change Password"}
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          {[
            { key: "emailDonations", label: "Donation received" },
            { key: "emailCampaignUpdates", label: "Campaign updates" },
            { key: "emailNewFollowers", label: "New followers" },
            { key: "emailWithdrawals", label: "Withdrawal status" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                checked={notPrefs[item.key as keyof NotificationPrefs]}
                onChange={(e) => setNotPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                className="rounded"
              />
            </label>
          ))}

          <h2 className="text-lg font-semibold text-gray-900 pt-2">Push Notifications</h2>
          {[
            { key: "pushDonations", label: "Donation received" },
            { key: "pushCampaignUpdates", label: "Campaign updates" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                checked={notPrefs[item.key as keyof NotificationPrefs]}
                onChange={(e) => setNotPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                className="rounded"
              />
            </label>
          ))}

          <button onClick={handleSaveNotifications} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === "danger" && (
        <div className="rounded-xl bg-white p-5 shadow-sm border border-red-200 space-y-4">
          <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
          <p className="text-sm text-gray-500">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          <button onClick={() => setShowDeleteModal(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            Delete Account
          </button>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-700">Delete Account</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              This action is irreversible. Please enter your password to confirm.
            </p>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-field w-full"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleDeleteAccount}
                disabled={saving || !deletePassword}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {saving ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
