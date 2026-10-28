// =============================================================================
// Media Answer Field
// Campaign images/video: upload from the device (validated server-side by MIME,
// magic bytes and size) or paste a remote link (verified server-side: public
// host, real image/video content type, size limit).
// =============================================================================

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { campaignService } from "@/services/campaign";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/api\/v1\/?$/, "");

/** Absolute URL for a stored `/uploads/...` path. */
export function mediaPreviewSrc(url: string): string {
  if (!url) return "";
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url) ||
  /\/video\//i.test(url);

/** Read-only thumbnail used by the review/summary views. */
export function MediaPreview({ url }: { url: string }) {
  const src = mediaPreviewSrc(url);
  if (!src) return null;
  return isVideoUrl(url) ? (
    <video
      src={src}
      controls
      className="mt-2 max-h-48 w-full rounded-lg border border-gray-200 bg-black"
    />
  ) : (
    <img
      src={src}
      alt="Campaign media"
      className="mt-2 max-h-48 w-full rounded-lg border border-gray-200 object-contain"
    />
  );
}

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;

interface MediaAnswerFieldProps {
  campaignId?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function MediaAnswerField({
  campaignId,
  value,
  onChange,
  error,
}: MediaAnswerFieldProps) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const disabled = !campaignId || busy;
  const shownError = localError ?? error;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setLocalError("Choose an image or video file.");
      return;
    }
    const limitMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > limitMb * 1024 * 1024) {
      setLocalError(`File is too large. ${isVideo ? "Videos" : "Images"} must be under ${limitMb}MB.`);
      return;
    }
    if (!campaignId) {
      setLocalError("Claim the campaign before adding media.");
      return;
    }

    setBusy(true);
    try {
      const res = await campaignService.uploadCampaignMedia(campaignId, file);
      onChange(res.url);
    } catch (err: any) {
      setLocalError(
        err?.response?.data?.message ?? err?.message ?? "Upload failed. Try again.",
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleVerifyLink = async () => {
    setLocalError(null);
    if (!campaignId) {
      setLocalError("Claim the campaign before adding media.");
      return;
    }
    if (!link.trim()) {
      setLocalError("Paste a link to an image or video.");
      return;
    }

    setBusy(true);
    try {
      const res = await campaignService.verifyCampaignMediaLink(campaignId, link.trim());
      onChange(res.url);
      setLink("");
    } catch (err: any) {
      setLocalError(
        err?.response?.data?.message ?? err?.message ?? "That link could not be verified.",
      );
    } finally {
      setBusy(false);
    }
  };

  const preview = mediaPreviewSrc(value);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {isVideoUrl(value) ? (
            <video src={preview} controls className="max-h-64 w-full bg-black" />
          ) : (
            <img
              src={preview}
              alt="Campaign media preview"
              className="max-h-64 w-full object-contain"
            />
          )}
          <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-2">
            <span className="truncate text-xs text-gray-500">{value}</span>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setLocalError(null);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(
          [
            { id: "upload", label: "Upload from device", icon: Upload },
            { id: "link", label: "Use a link", icon: Link2 },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setMode(option.id);
              setLocalError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === option.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <option.icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {busy ? "Uploading…" : "Choose a file"}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Drag and drop or choose a file. JPG, PNG, WEBP, GIF, AVIF up to {MAX_IMAGE_MB}MB ·
            MP4, WEBM, MOV up to {MAX_VIDEO_MB}MB.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://… image or video link"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => void handleVerifyLink()}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {busy ? "Checking…" : "Verify & use"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            We fetch the link before saving it: it must be a public http(s) image or video — internal
            addresses and non-media links are rejected.
          </p>
        </div>
      )}

      {shownError && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {shownError}
        </p>
      )}
    </div>
  );
}
