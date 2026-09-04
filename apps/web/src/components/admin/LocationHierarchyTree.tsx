// =============================================================================
// Admin — Location Hierarchy Tree Component
// Visual tree for viewing and managing the location hierarchy.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, MapPin } from "lucide-react";
import type { HubLocation } from "@/types/uk-hub";
import { LOCATION_PUBLIC_STATUS_META, LOCATION_TYPE_META } from "@/types/uk-hub";

interface LocationHierarchyTreeProps {
  locations: HubLocation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

interface TreeNodeProps {
  location: HubLocation;
  allLocations: HubLocation[];
  depth: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function TreeNode({ location, allLocations, depth, selectedId, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = allLocations.filter(l => l.parentId === location.id);
  const hasChildren = children.length > 0;
  const statusMeta = LOCATION_PUBLIC_STATUS_META[location.publicStatus];
  const typeMeta = LOCATION_TYPE_META[location.type];
  const isSelected = location.id === selectedId;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          isSelected ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className="text-base">{typeMeta?.icon || "📍"}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/hub-locations/${location.id}`}
              className="truncate font-medium text-gray-900 hover:text-primary-600"
            >
              {location.name}
            </Link>
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: statusMeta.bgColor, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
          </div>
          <span className="text-xs text-gray-400">{location.type} · {children.length} children</span>
        </div>

        {onSelect && (
          <button
            onClick={() => onSelect(location.id)}
            className="rounded-lg border px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            Select
          </button>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.id}
              location={child}
              allLocations={allLocations}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationHierarchyTree({ locations, selectedId, onSelect }: LocationHierarchyTreeProps) {
  const roots = locations.filter(l => !l.parentId);

  return (
    <div className="rounded-xl border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary-500" />
          Location Hierarchy
        </h3>
        <p className="text-xs text-gray-500">{locations.length} locations total · {roots.length} top-level</p>
      </div>
      <div className="max-h-[500px] overflow-y-auto p-2">
        {roots.map(root => (
          <TreeNode
            key={root.id}
            location={root}
            allLocations={locations}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
        {roots.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No locations found.</p>
        )}
      </div>
    </div>
  );
}
