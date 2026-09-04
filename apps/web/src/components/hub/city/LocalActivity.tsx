// =============================================================================
// City Hub — Local Activity Section
// =============================================================================

import type { HubActivity } from "@/types/uk-hub";

interface LocalActivityProps {
  activity: HubActivity[];
}

export function LocalActivity({ activity }: LocalActivityProps) {
  if (activity.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900">Local Activity</h2>
      <div className="mt-4 space-y-3">
        {activity.map(a => (
          <div key={a.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary-600 uppercase">{a.activityType.replace("_", " ")}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
            <h3 className="mt-1 font-semibold text-gray-900">{a.title}</h3>
            {a.content && <p className="mt-1 text-sm text-gray-600">{a.content}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
