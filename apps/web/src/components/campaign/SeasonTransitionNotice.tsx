// =============================================================================
// Campaign — Season Transition Notice
// Notice shown when a season is ending, explaining what happens to campaigns.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface SeasonTransitionNoticeProps {
  seasonId: string;
  seasonName: string;
  seasonEndDate: string;
  /** Whether this campaign has surplus to process */
  hasSurplus?: boolean;
  /** Number of days until season ends */
  daysRemaining?: number;
}

export function SeasonTransitionNotice({
  seasonId,
  seasonName,
  seasonEndDate,
  hasSurplus = false,
  daysRemaining,
}: SeasonTransitionNoticeProps) {
  const [countdown, setCountdown] = useState(daysRemaining);
  const endDate = new Date(seasonEndDate);
  const now = new Date();
  const computedDaysRemaining = countdown ?? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  useEffect(() => {
    if (countdown !== undefined) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      setCountdown(remaining);
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [countdown, endDate]);

  const isEnding = computedDaysRemaining <= 7;
  const isEnded = computedDaysRemaining === 0;

  return (
    <div className={`rounded-xl border p-4 ${
      isEnded
        ? "border-gray-200 bg-gray-50"
        : isEnding
        ? "border-amber-200 bg-amber-50"
        : "border-blue-200 bg-blue-50"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isEnded
            ? "bg-gray-200"
            : isEnding
            ? "bg-amber-100"
            : "bg-blue-100"
        }`}>
          {isEnded ? (
            <Calendar className="h-5 w-5 text-gray-500" />
          ) : (
            <Clock className={`h-5 w-5 ${isEnding ? "text-amber-600" : "text-blue-600"}`} />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-bold ${
            isEnded ? "text-gray-900" : isEnding ? "text-amber-900" : "text-blue-900"
          }`}>
            {isEnded
              ? `${seasonName} has ended`
              : isEnding
              ? `${seasonName} ending soon`
              : `${seasonName} — Active Season`}
          </h3>
          <p className={`mt-1 text-xs ${
            isEnded ? "text-gray-600" : isEnding ? "text-amber-700" : "text-blue-700"
          }`}>
            {isEnded ? (
              <>Season ended on {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</>
            ) : (
              <>
                Ends {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                {" "}({computedDaysRemaining} {computedDaysRemaining === 1 ? "day" : "days"} remaining)
              </>
            )}
          </p>

          {/* What happens at transition */}
          {isEnding && !isEnded && (
            <div className="mt-3 space-y-1.5 text-xs">
              <p className={`font-medium ${isEnding ? "text-amber-800" : "text-blue-800"}`}>
                When this season ends:
              </p>
              <ul className="ml-4 list-disc space-y-1 text-amber-700">
                <li>Campaigns marked as "Target Reached" will be finalized</li>
                <li>Surplus funds will be processed according to spillover rules</li>
                <li>Active campaigns may transition to the next season</li>
                <li>A review period allows admins to verify allocations</li>
              </ul>
            </div>
          )}

          {/* Post-transition info */}
          {isEnded && (
            <div className="mt-3 text-xs text-gray-600">
              <p>All surplus funds have been processed. Campaigns have been transitioned or archived.</p>
              {hasSurplus && (
                <p className="mt-1 font-medium text-gray-700">
                  This campaign had surplus funds that were redistributed according to its spillover rules.
                </p>
              )}
            </div>
          )}

          {/* View season details */}
          <Link
            to={`/campaigns?seasonId=${seasonId}`}
            className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
              isEnded ? "text-gray-600 hover:text-gray-700" : isEnding ? "text-amber-700 hover:text-amber-800" : "text-blue-700 hover:text-blue-800"
            }`}
          >
            View all {seasonName} campaigns <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
