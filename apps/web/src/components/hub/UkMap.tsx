import { useCallback, useMemo, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  HUB_STATUS_META,
  hubLatLng,
  type HubLocation,
  type HubStatus,
} from "@/data/hubActivation";

// UK bounding box for default view.
const UK_CENTER: google.maps.LatLngLiteral = { lat: 54.0, lng: -2.0 };

// Light map style matching FundOrDonate design.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#eef4fb" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe0f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#dce7f4" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8c9bb5" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e7eef8" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c0d2e8" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#6b83a8" }] },
  { featureType: "administrative", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
];

// Create a coloured SVG marker for a hub status.
function statusMarkerSvg(status: HubStatus, isSelected: boolean): string {
  const color = HUB_STATUS_META[status].color;
  const size = isSelected ? 28 : 20;
  const strokeW = isSelected ? 3 : 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - strokeW}" fill="${color}" stroke="white" stroke-width="${strokeW}"/>
    ${isSelected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 + 2}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5"/>` : ""}
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  styles: MAP_STYLES,
  clickableIcons: false,
  minZoom: 5,
  maxZoom: 15,
  restriction: {
    latLngBounds: { north: 61, south: 49, west: -11, east: 3 },
    strictBounds: true,
  },
};

interface UkMapProps {
  locations: HubLocation[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  statusFilter: HubStatus | "all";
}

export function UkMap({ locations, selectedSlug, onSelect, statusFilter }: UkMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return locations.filter((l) => statusFilter === "all" || l.status === statusFilter);
  }, [locations, statusFilter]);

  const selected = useMemo(
    () => (selectedSlug ? locations.find((l) => l.slug === selectedSlug) ?? null : null),
    [locations, selectedSlug]
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (filtered.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        filtered.forEach((l) => bounds.extend(hubLatLng(l)));
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      } else {
        map.setCenter(UK_CENTER);
        map.setZoom(6);
      }
    },
    [filtered]
  );

  const onMarkerClick = useCallback(
    (slug: string) => {
      onSelect(slug);
    },
    [onSelect]
  );

  // Loading / error states.
  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
        <p className="font-semibold">Google Maps failed to load</p>
        <p className="mt-1">Check your API key in <code className="bg-rose-100 px-1 rounded">.env</code> or review network settings.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 mb-2" />
        Loading map…
      </div>
    );
  }

  return (
    <div className="w-full">
      <GoogleMap
        mapContainerClassName="w-full rounded-2xl border border-gray-100 overflow-hidden"
        mapContainerStyle={{ width: "100%", height: "100%", minHeight: "360px" }}
        center={UK_CENTER}
        zoom={6}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {filtered.map((l) => {
          const pos = hubLatLng(l);
          const isSelected = l.slug === selectedSlug;
          return (
            <MarkerF
              key={l.id}
              position={pos}
              icon={{
                url: statusMarkerSvg(l.status, isSelected),
                anchor: new google.maps.Point(isSelected ? 14 : 10, isSelected ? 14 : 10),
              }}
              zIndex={isSelected ? 100 : 1}
              animation={isSelected ? google.maps.Animation.DROP : undefined}
              onClick={() => onMarkerClick(l.slug)}
              onMouseOver={() => setHoveredSlug(l.slug)}
              onMouseOut={() => setHoveredSlug(null)}
              title={`${l.name} — ${HUB_STATUS_META[l.status].label}`}
            />
          );
        })}

        {/* Hover tooltip */}
        {hoveredSlug && hoveredSlug !== selectedSlug && (() => {
          const hub = locations.find((l) => l.slug === hoveredSlug);
          if (!hub) return null;
          const pos = hubLatLng(hub);
          return (
            <InfoWindowF
              position={{ lat: pos.lat + 0.15, lng: pos.lng }}
              options={{
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(0, -10),
              }}
            >
              <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2 text-xs whitespace-nowrap">
                <span className="font-semibold text-gray-900">{hub.name}</span>
                <span className="ml-1.5 text-gray-500">— {HUB_STATUS_META[hub.status].label}</span>
              </div>
            </InfoWindowF>
          );
        })()}

        {/* Selected info window */}
        {selected && (() => {
          const pos = hubLatLng(selected);
          const meta = HUB_STATUS_META[selected.status];
          return (
            <InfoWindowF
              position={pos}
              onCloseClick={() => onSelect("")}
              options={{
                pixelOffset: new google.maps.Size(0, -12),
                headerDisabled: false,
              }}
            >
              <div className="p-1 max-w-[220px]">
                <p className="font-bold text-gray-900 text-sm">{selected.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      borderColor: meta.color + "44",
                      background: meta.color + "14",
                      color: meta.color,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-gray-500 leading-snug line-clamp-2">
                  {selected.shortDescription}
                </p>
                <button
                  onClick={() => onSelect(selected.slug)}
                  className="mt-2 text-[12px] font-semibold text-primary-600 hover:text-primary-700"
                >
                  View details →
                </button>
              </div>
            </InfoWindowF>
          );
        })()}
      </GoogleMap>
    </div>
  );
}
