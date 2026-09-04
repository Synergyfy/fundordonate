interface Props {
  raised: number;
  goal: number;
  mode: string;
  size?: "sm" | "md" | "lg";
}

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

export function CampaignProgressBar({ raised, goal, size = "md" }: Props) {
  const progress = goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);
  const remaining = Math.max(goal - raised, 0);
  const isFunded = remaining === 0 && goal > 0;

  const barHeight = size === "sm" ? "h-1.5" : size === "lg" ? "h-4" : "h-2.5";

  return (
    <div className="space-y-2">
      <div className={`${barHeight} overflow-hidden rounded-full bg-gray-100`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isFunded
              ? "bg-secondary-500"
              : "bg-gradient-to-r from-primary-500 to-secondary-500"
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% funded`}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-gray-900">{formatCurrency(raised)}</span>
          <span className="text-gray-500">raised of {formatCurrency(goal)}</span>
        </div>
        <span className={`font-bold ${isFunded ? "text-secondary-600" : "text-primary-600"}`}>
          {progress}%
        </span>
      </div>

      {size !== "sm" && (
        <div className="text-sm">
          {isFunded ? (
            <span className="font-medium text-secondary-600">Fully funded</span>
          ) : (
            <span className="text-gray-500">{formatCurrency(remaining)} remaining</span>
          )}
        </div>
      )}
    </div>
  );
}
