"use client";

import { useState, useEffect } from "react";
import { ImageUploader } from "./ImageUploader";
import { Button } from "@/components/ui/Button";
import { ApiResponse } from "@/types";

interface ImageManagerProps {
  entityId: string;
  currentImages?: Record<string, string> | null;
  onImageUpdate?: () => void;
}

export function ImageManager({
  entityId,
  currentImages,
  onImageUpdate,
}: ImageManagerProps) {
  const [images, setImages] = useState<Record<string, string>>(
    currentImages || {}
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setImages(currentImages || {});
  }, [currentImages]);

  const handleUpload = async (file: File, type: "logo" | "hero") => {
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/entities/${entityId}/upload?type=${type}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data: ApiResponse<{ path: string }> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to upload image");
    }

    // Update local state with the new path immediately
    const newPath = data.data!.path;
    console.log("Image uploaded, new path:", newPath);
    setImages((prev) => ({
      ...prev,
      [type]: newPath,
    }));

    // Refresh entity data after a short delay to ensure file is written
    setTimeout(async () => {
      try {
        const entityResponse = await fetch(`/api/entities/${entityId}`);
        const entityData: ApiResponse<any> = await entityResponse.json();
        if (entityData.success && entityData.data?.images) {
          console.log("Refreshed entity images:", entityData.data.images);
          const updatedImages = entityData.data.images || {};
          setImages(updatedImages);
          
          // Force ImageUploader to update by ensuring currentImage prop changes
          // This is handled by the parent component's onEntityUpdate callback
        }
      } catch (err) {
        console.error("Failed to refresh entity:", err);
      }
    }, 1000);

    // Call callback to refresh entity data
    if (onImageUpdate) {
      onImageUpdate();
    }
  };

  const handleDelete = async (type: "logo" | "hero") => {
    if (!confirm(`Are you sure you want to delete the ${type} image?`)) {
      return;
    }

    setError(null);
    setDeleting(type);

    try {
      const response = await fetch(
        `/api/entities/${entityId}/images/${type}`,
        {
          method: "DELETE",
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete image");
      }

      // Refresh entity data to get updated images
      try {
        const entityResponse = await fetch(`/api/entities/${entityId}`);
        const entityData: ApiResponse<any> = await entityResponse.json();
        if (entityData.success && entityData.data?.images) {
          setImages(entityData.data.images || {});
        } else {
          // If no images field, remove from local state
          const updated = { ...images };
          delete updated[type];
          setImages(updated);
        }
      } catch (err) {
        console.error("Failed to refresh entity:", err);
        // Fallback: remove from local state
        const updated = { ...images };
        delete updated[type];
        setImages(updated);
      }

      // Call callback to refresh entity data
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <div className="flex flex-col">
          <ImageUploader
            imageType="logo"
            currentImage={images.logo}
            onUpload={(file) => handleUpload(file, "logo")}
            disabled={deleting !== null}
          />
          {images.logo && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete("logo")}
                disabled={deleting === "logo"}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                {deleting === "logo" ? "Deleting..." : "Delete Logo"}
              </Button>
            </div>
          )}
        </div>

        {/* Hero Upload */}
        <div className="flex flex-col">
          <ImageUploader
            imageType="hero"
            currentImage={images.hero}
            onUpload={(file) => handleUpload(file, "hero")}
            disabled={deleting !== null}
          />
          {images.hero && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete("hero")}
                disabled={deleting === "hero"}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                {deleting === "hero" ? "Deleting..." : "Delete Hero Image"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

