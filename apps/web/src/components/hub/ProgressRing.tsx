// =============================================================================
// UK Hub — Progress Ring Component
// Animated circular progress indicator for activation/funding targets.
// =============================================================================

import { useRef, useEffect, useState } from "react";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
  animate?: boolean;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#3b82f6",
  trackColor = "#e5e7eb",
  label,
  sublabel,
  className,
  animate = true,
}: ProgressRingProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;
    startRef.current = performance.now();

    function tick(now: number) {
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, animate]);

  const clamped = Math.min(Math.max(displayValue, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  const pctClass = size <= 50 ? "text-[10px]" : size <= 80 ? "text-xs" : "text-sm font-bold";
  const lblClass = size <= 50 ? "hidden" : size <= 80 ? "text-[9px]" : "text-[10px]";
  const subClass = size <= 80 ? "hidden" : "text-[8px]";

  return (
    <div
      className={`relative inline-flex items-center justify-center${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`${pctClass} font-bold text-gray-900`}>{clamped}%</span>
        {label && <span className={`${lblClass} font-medium text-gray-500`}>{label}</span>}
        {sublabel && <span className={`${subClass} text-gray-400`}>{sublabel}</span>}
      </div>
    </div>
  );
}
