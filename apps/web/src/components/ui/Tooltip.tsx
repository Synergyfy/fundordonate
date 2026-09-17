// =============================================================================
// Reusable Tooltip Component
// =============================================================================

import React, { useState } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, className = "", position = "top" }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900",
    right: "right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900",
  };

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      {children || (
        <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
      )}
      {show && (
        <span className={`absolute z-50 w-64 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg sm:w-72 ${positionClasses[position]}`}>
          {content}
          <span className={`absolute ${arrowClasses[position]}`} />
        </span>
      )}
    </span>
  );
}

// Pre-defined tooltip content for common terms
export const TOOLTIPS = {
  localArea: "A Local Area is a geographic subdivision of a city. In London, these are often called 'Boroughs'. In other UK cities, they may be called 'Districts', 'Neighbourhoods', or 'Wards'. The terminology varies by city.",
  borough: "A Borough is a type of Local Area, commonly used in London and some other UK cities. It's an administrative division that helps organize local services and communities.",
  highStreet: "A High Street is a main commercial road in a Local Area, typically featuring shops, restaurants, and businesses.",
};
