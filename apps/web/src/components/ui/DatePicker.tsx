// =============================================================================
// Date / DateTime Input
// The whole input box is clickable — clicking anywhere opens the native
// picker (DD/MM/YYYY per browser locale), not just the calendar icon.
// =============================================================================

import { useRef } from "react";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: "date" | "datetime-local";
}

export function DatePicker({
  className = "",
  type = "date",
  onClick,
  ...rest
}: DatePickerProps) {
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(e);
    try {
      ref.current?.showPicker?.();
    } catch {
      // Older browsers keep the native focus behaviour.
    }
  };

  return (
    <input
      ref={ref}
      {...rest}
      type={type}
      onClick={openPicker}
      className={`cursor-pointer ${className}`}
    />
  );
}
