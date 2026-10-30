import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { userDashboardApi } from "@/services/user-dashboard";
import { getCentralProfileUrl } from "@/lib/central-hub";

const NOTIFICATION_PREFS_KEY = "fod:notificationPrefs";

interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string;
  username: string | null;
  avatar: string | null;
  jobTitle: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  country: string | null;
  role: string;
  userType: string;
  profileType: string | null;
  isAffiliate: boolean;
  emailVerified: boolean;
  membershipLevel: string | null;
  membershipStatus: string | null;
  profile: Record<string, unknown> | null;
}

interface NotificationPrefs {
  emailDonations: boolean;
  emailCampaignUpdates: boolean;
  emailNewFollowers: boolean;
  emailWithdrawals: boolean;
  pushDonations: boolean;
  pushCampaignUpdates: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailDonations: true,
  emailCampaignUpdates: true,
  emailNewFollowers: true,
  emailWithdrawals: true,
  pushDonations: true,
  pushCampaignUpdates: false,
};

function readNotificationPrefs(): NotificationPrefs {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
      return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
    }
  } catch {
    /* use defaults */
  }
  return DEFAULT_NOTIFICATION_PREFS;
}

function writeNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
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

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-3 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-medium text-gray-900">
        {value?.trim() ? value : "Not provided"}
      </span>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "notifications" || tab === "danger" ? tab : "profile";
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [notPrefs, setNotPrefs] = useState<NotificationPrefs>(readNotificationPrefs);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async (fromCentral: boolean) => {
      if (fromCentral) {
        // Central is the source of truth — pick up edits made there without
        // requiring a re-login. Failures fall back to the cached profile.
        await useAuthStore.getState().refreshProfile().catch(() => undefined);
      }

      const result = await userDashboardApi.getProfile().then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason) => ({ status: "rejected" as const, reason }),
      );
      if (cancelled) return;

      if (result.status === "fulfilled") {
        setProfile(result.value as unknown as Profile);
      } else {
        const u = useAuthStore.getState().user;
        setProfile(
          u
            ? {
                id: u.id,
                firstName: u.firstName ?? null,
                lastName: u.lastName ?? null,
                fullName: u.fullName ?? null,
                email: u.email,
                username: u.username,
                avatar: u.avatar ?? null,
                jobTitle: u.jobTitle ?? null,
                phone: u.phone ?? null,
                address: u.address ?? null,
                postcode: u.postcode ?? null,
                country: u.country ?? null,
                role: u.role,
                userType: u.userType,
                profileType: u.profileType ?? null,
                isAffiliate: u.isAffiliate ?? false,
                emailVerified: u.emailVerified,
                membershipLevel: u.membershipLevel ?? null,
                membershipStatus: u.membershipStatus ?? null,
                profile: u.profile ?? null,
              }
            : null,
        );
      }
      setLoading(false);
    };

    void load(true);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void load(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSaveNotifications = () => {
    writeNotificationPrefs(notPrefs);
    showMessage("success", "Notification preferences saved on this device");
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await userDashboardApi.deleteAccount();
      useAuthStore.getState().logout();
      navigate("/");
    } catch {
      showMessage("error", "Failed to delete account. Please try again.");
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

  const displayName =
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.username ||
    profile?.email ||
    "Your profile";

  const editProfileUrl = getCentralProfileUrl(
    authUser ?? (profile ? { role: profile.role, userType: profile.userType } : null),
  );

  const tabs = [
    { id: "profile", label: "Profile" },
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
        <span className="text-xs text-gray-400">Profile</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

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

      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-gray-900">{displayName}</p>
                <p className="truncate text-sm text-gray-500">{profile?.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-700">
                    {(profile?.profileType || profile?.userType || "consumer").toLowerCase()}
                  </span>
                  {profile?.isAffiliate && (
                    <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Affiliate
                    </span>
                  )}
                  {profile?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified by Central Hub
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600">Not verified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold">Your details are managed by MCOM Central Hub.</p>
              <p className="mt-1">
                Name, email, phone, address and business information are synced from
                Central Hub each time you sign in. To change them, update your profile
                in Central Hub.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Personal details</h2>
              <a
                href={editProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Edit on Central Hub
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="divide-y divide-gray-50">
              <DetailRow label="First name" value={profile?.firstName} />
              <DetailRow label="Last name" value={profile?.lastName} />
              <DetailRow label="Email" value={profile?.email} />
              <DetailRow label="Phone" value={profile?.phone} />
              <DetailRow label="Job title" value={profile?.jobTitle} />
              <DetailRow label="Address" value={profile?.address} />
              <DetailRow label="Postcode" value={profile?.postcode} />
              <DetailRow label="Country" value={profile?.country} />
              <DetailRow label="Username" value={profile?.username} />
            </div>
          </div>

          {profile?.membershipLevel && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-base font-semibold text-gray-900">Membership</h2>
              <div className="divide-y divide-gray-50">
                <DetailRow label="Level" value={profile.membershipLevel} />
                <DetailRow label="Status" value={profile.membershipStatus} />
              </div>
            </div>
          )}

          {profile?.profileType === "CUSTOMER" && profile.profile && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-base font-semibold text-gray-900">
                Central Hub profile
              </h2>
              <div className="divide-y divide-gray-50">
                <DetailRow
                  label="Loyalty points"
                  value={
                    profile.profile.loyaltyPoints !== undefined
                      ? String(profile.profile.loyaltyPoints)
                      : null
                  }
                />
                <DetailRow
                  label="Account status"
                  value={
                    typeof profile.profile.status === "string"
                      ? profile.profile.status
                      : null
                  }
                />
                <DetailRow
                  label="Platforms used"
                  value={
                    Array.isArray(profile.profile.platformUsage)
                      ? profile.profile.platformUsage.join(", ")
                      : null
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <CardHeader
            title="Notification Preferences"
            description="Choose what FundOrDonate sends you. Preferences are saved on this device."
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
              onChange={(next) =>
                setNotPrefs((p) => ({ ...p, emailCampaignUpdates: next }))
              }
            />
            <PrefRow
              label="New followers"
              description="When someone new follows your activity."
              checked={notPrefs.emailNewFollowers}
              onChange={(next) =>
                setNotPrefs((p) => ({ ...p, emailNewFollowers: next }))
              }
            />
            <PrefRow
              label="Withdrawal status"
              description="Updates on payout and withdrawal status."
              checked={notPrefs.emailWithdrawals}
              onChange={(next) =>
                setNotPrefs((p) => ({ ...p, emailWithdrawals: next }))
              }
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
              onChange={(next) =>
                setNotPrefs((p) => ({ ...p, pushCampaignUpdates: next }))
              }
            />
          </div>

          <div className="flex justify-end border-t border-gray-100 px-5 py-4">
            <button onClick={handleSaveNotifications} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "danger" && (
        <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
              <p className="mt-0.5 text-sm text-red-600/80">
                Permanent actions - please read carefully before continuing.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div className="flex flex-col gap-3 rounded-lg border border-red-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Delete your FundOrDonate account
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Your FundOrDonate profile, contribution history, rewards and
                  preferences will be permanently removed. Your MCOM Central Hub
                  account is not deleted.
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
                Just stepping away? You can sign out from the You menu instead -
                your account and data stay exactly as they are.
              </p>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
                  <p className="text-sm text-gray-500">
                    This action is irreversible. Please confirm to continue.
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                onClick={() => setShowDeleteModal(false)}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Deleting your FundOrDonate account is permanent and cannot be undone.
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
              >
                {saving ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
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
