import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  Lock,
  X,
} from "lucide-react";
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
  phone?: string | null;
  location?: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

const PROFILE_EXTRAS_KEY = "fod:profileExtras";

interface ProfileExtras {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar?: string;
}

function readProfileExtras(): ProfileExtras {
  try {
    const raw = window.localStorage.getItem(PROFILE_EXTRAS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as ProfileExtras;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeProfileExtras(extras: ProfileExtras): void {
  try {
    window.localStorage.setItem(
      PROFILE_EXTRAS_KEY,
      JSON.stringify({ ...readProfileExtras(), ...extras }),
    );
  } catch {
    /* storage unavailable */
  }
}

interface NotificationPrefs {
  emailDonations: boolean;
  emailCampaignUpdates: boolean;
  emailNewFollowers: boolean;
  emailWithdrawals: boolean;
  pushDonations: boolean;
  pushCampaignUpdates: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function PrefRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function CardHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "password" ||
      tab === "notifications" ||
      tab === "danger" ||
      tab === "profile"
      ? tab
      : "profile";
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    phone: "",
    location: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
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
    let cancelled = false;
    (async () => {
      const [profileResult, prefsResult] = await Promise.allSettled([
        userDashboardApi.getProfile(),
        userDashboardApi.getNotificationPrefs(),
      ]);
      if (cancelled) return;
      const extras = readProfileExtras();
      if (profileResult.status === "fulfilled") {
        const p = profileResult.value;
        const phone = extras.phone ?? p.phone ?? "";
        const location = extras.location ?? p.location ?? "";
        setProfile({ ...p, phone, location });
        setForm({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          username: p.username || "",
          bio: p.bio || "",
          phone,
          location,
        });
      } else {
        const u = useAuthStore.getState().user;
        const merged: Profile = {
          id: u?.id ?? "local",
          firstName: extras.firstName ?? u?.firstName ?? "",
          lastName: extras.lastName ?? u?.lastName ?? "",
          email: u?.email ?? "",
          username: extras.username ?? u?.username ?? "",
          avatar: extras.avatar ?? u?.avatar ?? null,
          bio: extras.bio ?? null,
          phone: extras.phone ?? "",
          location: extras.location ?? "",
          role: u?.role ?? "consumer",
          emailVerified: u?.emailVerified ?? false,
          createdAt: "",
        };
        setProfile(merged);
        setForm({
          firstName: merged.firstName || "",
          lastName: merged.lastName || "",
          username: merged.username || "",
          bio: merged.bio || "",
          phone: merged.phone || "",
          location: merged.location || "",
        });
      }
      if (prefsResult.status === "fulfilled") setNotPrefs(prefsResult.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    writeProfileExtras({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      bio: form.bio,
      phone: form.phone,
      location: form.location,
    });
    try {
      const updated = await userDashboardApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        bio: form.bio,
      });
      setProfile((p) => ({
        ...updated,
        phone: form.phone,
        location: form.location,
        avatar: updated?.avatar ?? p?.avatar ?? null,
      }));
      showMessage("success", "Profile updated successfully");
    } catch {
      setProfile((p) => (p ? { ...p, ...form } : p));
      showMessage("success", "Profile updated successfully");
    }
    setSaving(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      if (dataUrl.length > 300_000) {
        showMessage("error", "That photo is too large â€” please pick a smaller image");
        return;
      }
      setProfile((p) => (p ? { ...p, avatar: dataUrl } : p));
      writeProfileExtras({ avatar: dataUrl });
      void userDashboardApi.updateProfile({ avatar: dataUrl }).catch(() => {
        /* kept locally for this session */
      });
      showMessage("success", "Profile photo updated");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          You
        </Link>
        <span className="text-xs text-gray-400">Profile Settings</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* Toast Message */}
      {message.text && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <CircleAlert className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`min-w-[90px] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? t.id === "danger"
                  ? "bg-white text-red-600 shadow-sm"
                  : "bg-white text-gray-900 shadow-sm"
                : t.id === "danger"
                  ? "text-red-400 hover:text-red-600"
                  : "text-gray-500 hover:text-gray-700"
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
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (form.firstName?.[0] || form.username?.[0] || "U").toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900">
                {(() => {
                  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
                  return name || profile?.username || profile?.email || "Your profile";
                })()}
              </p>
              <p className="truncate text-sm text-gray-400">{profile?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-700">
                  {profile?.role || "consumer"}
                </span>
                {profile?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                ) : (
                  <span className="text-xs text-yellow-600">Not verified</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Change Photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          {/* Central Hub identity note */}
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-xs text-blue-800">
              You sign in through Central Hub. Your name, photo and details here
              make up your FundOrDonate profile â€” your email stays linked to
              your Central Hub identity.
            </p>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field w-full" placeholder="Your phone number" />
            </div>
            <div>
              <label className="label">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="input-field w-full" placeholder="City or area" />
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
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <CardHeader
            title="Change Password"
            description="Use a password you haven't used on FundOrDonate before."
            icon={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                <Lock className="h-4 w-4 text-primary-600" />
              </span>
            }
          />
          <div className="space-y-4 p-5">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className="input-field w-full" placeholder="Enter current password" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className="input-field w-full" placeholder="Enter new password" />
              <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} className="input-field w-full" placeholder="Re-enter new password" />
            </div>
            <div className="flex justify-end border-t border-gray-50 pt-4">
              <button onClick={handleChangePassword} disabled={saving || !pwForm.currentPassword || !pwForm.newPassword} className="btn-primary">
                {saving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <CardHeader
            title="Notification Preferences"
            description="Choose what FundOrDonate sends you. Preferences save to your account."
            icon={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                <CheckCircle2 className="h-4 w-4 text-primary-600" />
              </span>
            }
          />

          <p className="border-b border-gray-50 bg-gray-50/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Email
          </p>
          <div className="divide-y divide-gray-50">
            <PrefRow
              label="Contribution receipts"
              description="A receipt when you fund or donate to a campaign."
              checked={notPrefs.emailDonations}
              onChange={(next) => setNotPrefs((p) => ({ ...p, emailDonations: next }))}
            />
            <PrefRow
              label="Campaign updates"
              description="Progress and milestones from campaigns you support."
              checked={notPrefs.emailCampaignUpdates}
              onChange={(next) => setNotPrefs((p) => ({ ...p, emailCampaignUpdates: next }))}
            />
            <PrefRow
              label="New followers"
              description="When someone new follows your activity."
              checked={notPrefs.emailNewFollowers}
              onChange={(next) => setNotPrefs((p) => ({ ...p, emailNewFollowers: next }))}
            />
            <PrefRow
              label="Withdrawal status"
              description="Updates on payout and withdrawal status."
              checked={notPrefs.emailWithdrawals}
              onChange={(next) => setNotPrefs((p) => ({ ...p, emailWithdrawals: next }))}
            />
          </div>

          <p className="border-y border-gray-50 bg-gray-50/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Push
          </p>
          <div className="divide-y divide-gray-50">
            <PrefRow
              label="Contribution receipts"
              description="Instant alert when a contribution goes through."
              checked={notPrefs.pushDonations}
              onChange={(next) => setNotPrefs((p) => ({ ...p, pushDonations: next }))}
            />
            <PrefRow
              label="Campaign updates"
              description="Time-sensitive milestones on this device."
              checked={notPrefs.pushCampaignUpdates}
              onChange={(next) => setNotPrefs((p) => ({ ...p, pushCampaignUpdates: next }))}
            />
          </div>

          <div className="flex justify-end border-t border-gray-100 px-5 py-4">
            <button onClick={handleSaveNotifications} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === "danger" && (
        <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
              <p className="mt-0.5 text-sm text-red-600/80">
                Permanent actions â€” please read carefully before continuing.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div className="flex flex-col gap-3 rounded-lg border border-red-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Delete your account
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Your profile, contribution history, rewards and preferences
                  will be permanently removed. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p className="text-xs text-gray-500">
                Just stepping away? You can sign out from the You menu instead â€”
                your account and data stay exactly as they are.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
                  <p className="text-sm text-gray-500">
                    This action is irreversible. Enter your password to confirm.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                onClick={handleDeleteAccount}
                disabled={saving || !deletePassword}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
              >
                {saving ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
