// =============================================================================
// VCard Recognition Display
// Shows VCard recognition status, badges, and points.
// =============================================================================

import { useState, useEffect } from "react";
import { physicalApi, type VCardRecognition } from "@/services/physical.service";
import { Smartphone } from "lucide-react";

const RECOGNITION_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  none: { icon: "", color: "text-gray-400", bg: "bg-gray-100", label: "No Recognition" },
  backer: { icon: "🤝", color: "text-purple-600", bg: "bg-purple-100", label: "Backer" },
  community_backer: { icon: "🏘️", color: "text-green-600", bg: "bg-green-100", label: "Community Backer" },
  founding_member: { icon: "⭐", color: "text-amber-600", bg: "bg-amber-100", label: "Founding Member" },
  original_founder: { icon: "👑", color: "text-yellow-600", bg: "bg-yellow-100", label: "Original Founder" },
};

interface VCardRecognitionDisplayProps {
  userId: string;
  variant?: "compact" | "full";
}

export function VCardRecognitionDisplay({ userId, variant = "full" }: VCardRecognitionDisplayProps) {
  const [recognition, setRecognition] = useState<{
    recognitions: VCardRecognition[];
    highestLevel: string;
    displayInfo: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    physicalApi.getVCardRecognition(userId).then((data) => {
      setRecognition(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-200 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!recognition || recognition.highestLevel === "none") {
    return null;
  }

  const meta = RECOGNITION_META[recognition.highestLevel] || { icon: "", color: "text-gray-400", bg: "bg-gray-100", label: "No Recognition" };

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${meta.bg}`}>
        <span className="text-lg">{meta.icon}</span>
        <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="h-5 w-5 text-primary-500" />
        <h3 className="text-lg font-bold text-gray-900">VCard Recognition</h3>
      </div>

      {/* Highest Recognition */}
      <div className={`rounded-xl p-4 mb-4 ${meta.bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <div className={`text-lg font-bold ${meta.color}`}>{meta.label}</div>
            <div className="text-sm text-gray-600">Your recognition level</div>
          </div>
        </div>
      </div>

      {/* All Recognitions */}
      {recognition.recognitions.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">Recognition History</h4>
          <div className="space-y-2">
            {recognition.recognitions.slice(0, 5).map((r) => {
              const rMeta = RECOGNITION_META[r.recognitionLevel] || { icon: "🏅", color: "text-gray-600", bg: "bg-gray-100", label: "Recognition" };
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="text-xl">{rMeta.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{r.details.title}</div>
                    <div className="text-xs text-gray-500">{r.details.description}</div>
                  </div>
                  {r.details.pointsAwarded && (
                    <div className="text-xs font-bold text-primary-600">+{r.details.pointsAwarded} pts</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-center">
        Recognition is displayed when you scan your VCard at participating terminals
      </div>
    </div>
  );
}
