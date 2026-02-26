"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, ImageIcon } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 1200;

interface ImageUploadProps {
  bucket: string;
  folder: string;
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

async function resizeToWebP(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);

  let { width, height } = image;

  // Scale down if either dimension exceeds MAX_DIMENSION
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/webp",
      0.9,
    );
  });
}

export function ImageUpload({ bucket, folder, value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Formato inválido. Use JPEG, PNG ou WebP.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const blob = await resizeToWebP(file);
      const supabase = createClient();

      // Remove old file if exists
      if (value) {
        const oldPath = extractStoragePath(value, bucket);
        if (oldPath) {
          await supabase.storage.from(bucket).remove([oldPath]);
        }
      }

      const path = `${folder}/${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      onChange(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [bucket, folder, value, onChange]);

  const handleRemove = useCallback(async () => {
    if (value) {
      const supabase = createClient();
      const oldPath = extractStoragePath(value, bucket);
      if (oldPath) {
        await supabase.storage.from(bucket).remove([oldPath]);
      }
    }
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [bucket, value, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  if (isUploading) {
    return (
      <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 ${className ?? ""}`}>
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Enviando imagem...</span>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div className={`relative ${className ?? ""}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-[#FF4D00] bg-orange-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <ImageIcon className="h-8 w-8 text-gray-400" />
        <div className="text-center">
          <span className="text-sm font-medium text-gray-600">
            Arraste uma imagem ou clique para selecionar
          </span>
          <p className="mt-1 text-xs text-gray-400">
            JPEG, PNG ou WebP. Máximo {MAX_SIZE_MB}MB.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
