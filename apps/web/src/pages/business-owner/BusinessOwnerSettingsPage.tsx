// =============================================================================
// Business Owner Settings Page
// Account and notification settings.
// =============================================================================

import { useState } from "react";
import { Bell, Lock, User } from "lucide-react";

export default function BusinessOwnerSettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    campaignUpdates: true,
    leaderboardChanges: true,
    rewardsEarned: true,
    newBackers: false,
    weeklyDigest: true,
  });

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and notification preferences.</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl bg-white p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-bold text-gray-900">Profile</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
            <input type="text" defaultValue="Sarah's Bakery" className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input type="email" defaultValue="sarah@sarahsbakery.com" className="input-field w-full" />
          </div>
          <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl bg-white p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-3">
          {Object.entries({
            email: "Email notifications",
            campaignUpdates: "Campaign updates",
            leaderboardChanges: "Leaderboard rank changes",
            rewardsEarned: "Rewards earned",
            newBackers: "New backer alerts",
            weeklyDigest: "Weekly digest",
          }).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-gray-700">{label}</span>
              <button
                onClick={() => toggle(key as keyof typeof notifications)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifications[key as keyof typeof notifications] ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  notifications[key as keyof typeof notifications] ? "translate-x-5" : ""
                }`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl bg-white p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-bold text-gray-900">Security</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left">
            Change Password
          </button>
          <button className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left">
            Enable Two-Factor Authentication
          </button>
        </div>
      </div>
    </div>
  );
}
