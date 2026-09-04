import { useState, useEffect } from "react";

interface Props {
  deadline: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CampaignCountdown({ deadline }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const isEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isEnded) {
    return (
      <div className="rounded-lg bg-gray-100 p-3 text-center">
        <span className="text-sm font-medium text-gray-600">Campaign ended</span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-2">
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center rounded-lg bg-gray-900 px-3 py-2 text-white min-w-[60px]">
          <span className="text-xl font-bold tabular-nums">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase text-gray-400">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
