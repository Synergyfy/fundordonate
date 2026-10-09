import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, Flag, Heart, Info, Medal } from "lucide-react";
import {
  listRecognitions,
  type ConsumerRecognition,
  type RecognitionIcon,
} from "@/data/consumerYouData";

const ICONS: Record<RecognitionIcon, typeof Heart> = {
  heart: Heart,
  flag: Flag,
  award: Award,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function ConsumerRecognitionPage() {
  const [items, setItems] = useState<ConsumerRecognition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listRecognitions()
      .then((list) => {
        if (!cancelled) {
          setItems(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          You
        </Link>
        <span className="text-xs text-gray-400">Recognition</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Recognition</h1>

      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-sm text-blue-900">
          Recognitions are separate from your contribution history — they
          celebrate milestones you have reached, not individual contributions.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Medal className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            No recognitions yet
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Recognitions you earn will appear here.
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
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {items.length} recognition{items.length === 1 ? "" : "s"}
          </p>
          {items.map((r) => {
            const Icon = ICONS[r.icon] ?? Medal;
            return (
              <article
                key={r.id}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{r.title}</h3>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatDate(r.earnedDate)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{r.description}</p>
                  <p className="mt-1.5 text-xs font-medium text-gray-400">
                    {r.context}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
