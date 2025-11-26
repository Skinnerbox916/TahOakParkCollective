"use client";

import { useState, useRef, DragEvent } from "react";

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  currentImage?: string | null;
  imageType: "logo" | "hero";
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({
  onUpload,
  currentImage,
  imageType,
  disabled = false,
}: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5MB limit";
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Allowed: JPEG, PNG, WebP";
    }
    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const label = imageType === "logo" ? "Logo" : "Hero Image";
  const description =
    imageType === "logo"
      ? "Square logo (256x256 recommended)"
      : "Cover image (1920x1080 recommended)";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <p className="text-xs text-gray-500">{description}</p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
          aspect-video w-full
          ${dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-400"}
          ${currentImage ? "bg-gray-100" : "bg-gray-50"}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : currentImage ? (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <img
              src={currentImage}
              alt={label}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error("Image failed to load:", currentImage);
                setError(`Failed to load: ${currentImage}`);
              }}
              onLoad={() => {
                console.log("Image loaded:", currentImage);
                setError(null);
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-1 text-center">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 text-center">JPEG, PNG, WebP (max 5MB)</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
