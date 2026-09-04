import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  title: string;
  slug: string;
}

export function QrShare({ title, slug }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const url = typeof window !== "undefined" ? `${window.location.origin}/campaigns/${slug}` : "";
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${slug}-qr.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(qrApiUrl, "_blank");
    }
  }, [qrApiUrl, slug]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="qr-panel"
        aria-label="Show QR code for this campaign"
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        QR Code
      </button>

      {open && (
        <div
          id="qr-panel"
          role="dialog"
          aria-label={`QR code for ${title}`}
          className="absolute bottom-full left-1/2 z-50 mb-3 w-56 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-lg sm:w-64"
        >
          <p className="mb-3 text-sm font-medium text-gray-700">Scan to view campaign</p>
          <img
            src={qrApiUrl}
            alt={`QR code for ${title}`}
            className="mx-auto h-40 w-40 rounded-lg border border-gray-100"
          />
          <p className="mt-2 text-xs text-gray-500 line-clamp-1" title={url}>{url}</p>
          <button
            onClick={handleDownload}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            aria-label="Download QR code as image"
          >
            Download QR
          </button>
        </div>
      )}
    </div>
  );
}
