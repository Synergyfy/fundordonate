// =============================================================================
// UK Hub — Breadcrumb Component
// =============================================================================

import { Link } from "react-router-dom";
import type { BreadcrumbItem } from "@/types/uk-hub";

interface HubBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function HubBreadcrumb({ items, className }: HubBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Hub breadcrumb" className={`flex items-center gap-1 text-sm text-gray-500${className ? ` ${className}` : ""}`}>
      <Link to="/uk-hub-activation" className="hover:text-primary-600 transition-colors">
        UK Hub
      </Link>
      {items.map((item, i) => (
        <span key={item.slug} className="flex items-center gap-1">
          <span className="text-gray-300">/</span>
          {i === items.length - 1 ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <Link to={`/uk-hub-activation/${item.fullPath}`} className="hover:text-primary-600 transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
