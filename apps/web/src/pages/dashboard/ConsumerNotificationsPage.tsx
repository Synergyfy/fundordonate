import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, CheckCheck } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_CATEGORIES,
  type ConsumerNotification,
  type NotificationCategory,
} from "@/data/consumerNotificationsData";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function ConsumerNotificationsPage() {
  const { unread } = useUnreadNotifications();
  const [items, setItems] = useState<ConsumerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listNotifications()
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpen = (notification: ConsumerNotification) => {
    if (notification.read) return;
    setItems((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    markNotificationRead(notification.id);
  };

  const handleMarkAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead();
  };

  const byCategory = (category: NotificationCategory) =>
    items.filter((n) => n.category === category);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          You
        </Link>
        <span className="text-xs text-gray-400">Notifications</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unread > 0 && !loading && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Bell className="h-6 w-6 text-primary-500" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">
            No notifications yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Campaign, contribution and reward updates will appear here.
          </p>
          <Link
            to="/consumer/explore"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Explore Campaigns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const list = byCategory(category.id);
            return (
              <section key={category.id}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {category.label}{" "}
                  <span className="ml-1 text-gray-400">({list.length})</span>
                </h2>
                {list.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                    No notifications in this category yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {list.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleOpen(n)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                          n.read
                            ? "border-gray-100 bg-white hover:bg-gray-50"
                            : "border-primary-100 bg-primary-50/50 hover:bg-primary-50"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                            n.read ? "bg-gray-200" : "bg-primary-600"
                          }`}
                          aria-label={n.read ? "Read" : "Unread"}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={`text-sm ${
                                n.read
                                  ? "font-medium text-gray-700"
                                  : "font-bold text-gray-900"
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="shrink-0 text-xs text-gray-400">
                              {formatDate(n.createdAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-sm text-gray-500">
                            {n.body}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
