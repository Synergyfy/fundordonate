// =============================================================================
// Reusable File Upload Component
// Supports URL link and local file upload with drag-and-drop
// =============================================================================

import { useState, useRef, useCallback } from "react";
import { Upload, LinkIcon, X, FileImage } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
  accept?: string;
  label?: string;
  tooltip?: string;
  previewClassName?: string;
  placeholder?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  value,
  onChange,
  onFileSelect,
  accept = "image/*,video/*",
  label,
  previewClassName = "h-32 w-full object-cover",
  placeholder = "https://example.com/image.jpg",
  maxSizeMB = 10,
}: FileUploadProps) {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isVideoFile, setIsVideoFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptsDocs = /pdf|zip|doc|csv|txt|json/.test(accept);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      setError("");
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max size is ${maxSizeMB}MB.`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);
      setFileName(file.name);
      setIsVideoFile(file.type.startsWith("video/"));
      onFileSelect?.(file);
    },
    [onChange, onFileSelect, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const clearFile = () => {
    onChange("");
    setFileName("");
    setError("");
    setIsVideoFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isImageUrl = value && (value.startsWith("http") || value.startsWith("blob:"));
  const isVideo = isVideoFile || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
        <button
          type="button"
          onClick={() => {
            setMode("url");
            setIsVideoFile(false);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          URL Link
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "file" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload File
        </button>
      </div>

      {/* URL Input */}
      {mode === "url" && (
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="url"
            value={value?.startsWith("blob:") ? "" : value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setFileName("");
            }}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {/* File Upload Drop Zone */}
      {mode === "file" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary-400 bg-primary-50"
              : value
                ? "border-green-300 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          {value ? (
            <>
              <FileImage className="h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm font-medium text-green-700">{fileName || "File selected"}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {acceptsDocs ? "Images, PDFs, documents, archives" : "PNG, JPG, GIF, MP4"} up to {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview */}
      {value && isImageUrl && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          {isVideo ? (
            <video src={value} className={previewClassName} controls />
          ) : (
            <img
              src={value}
              alt="Preview"
              className={previewClassName}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
