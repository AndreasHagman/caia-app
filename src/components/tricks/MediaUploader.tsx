"use client";

import { uploadMedia, validateMediaFile, deleteMediaByUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

async function normalizeFile(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  if (!isHeic) return file;

  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(result) ? result[0] : result;
  return new File([blob], file.name.replace(/\.heic?$/i, ".jpg"), { type: "image/jpeg" });
}

interface Props {
  trickId: string;
  mediaUrls: string[];
  onUrlsChange: (urls: string[]) => void;
}

function isVideo(url: string): boolean {
  return url.match(/\.(mp4|mov|webm|avi)/i) !== null || url.includes("video");
}

export function MediaUploader({ trickId, mediaUrls, onUrlsChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    let file = files[0];

    const validationError = validateMediaFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setUploadProgress(0);

      // Convert HEIC/HEIF → JPEG so it displays on Android/Windows
      file = await normalizeFile(file);

      const ext = file.name.split(".").pop() ?? "bin";
      const path = `tricks/${trickId}/${Date.now()}.${ext}`;

      const url = await uploadMedia(file, path, setUploadProgress);
      onUrlsChange([...mediaUrls, url]);
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(url: string) {
    try {
      await deleteMediaByUrl(url);
      onUrlsChange(mediaUrls.filter((u) => u !== url));
      toast.success("Deleted");
    } catch {
      toast.error("Could not delete file");
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Existing media */}
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mediaUrls.map((url) => (
            <div key={url} className="relative group rounded-xl overflow-hidden bg-sage-50 aspect-video">
              {isVideo(url) ? (
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleDelete(url)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploadProgress !== null}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        Add photo or video
      </Button>
    </div>
  );
}
