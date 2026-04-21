"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (url: string) => void;
  storagePath: string;
}

async function normalizeFile(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  if (isHeic) {
    console.log("[ImageEditor] HEIC detected — converting…");
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(result) ? result[0] : result;
    return new File([blob], file.name.replace(/\.heic?$/i, ".jpg"), { type: "image/jpeg" });
  }

  // Normalize EXIF orientation for non-HEIC images
  return imageCompression(file, { maxSizeMB: 20, useWebWorker: true, fileType: "image/jpeg" });
}

export function AboutImageEditor({ open, onOpenChange, onSaved, storagePath }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ src: string; file: File } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorDetail(null);
    console.log("[ImageEditor] Selected:", file.name, file.type, `${(file.size / 1024).toFixed(0)} KB`);
    try {
      const normalized = await normalizeFile(file);
      const src = URL.createObjectURL(normalized);
      setPreview({ src, file: normalized });
    } catch (err) {
      const msg = err instanceof Error ? err.message : err instanceof Event ? `Browser decoding error (${err.type})` : String(err);
      console.error("[ImageEditor] Normalisation failed:", err);
      setErrorDetail(`Could not read image: ${msg}`);
    }
  }

  async function handleUpload() {
    if (!preview) return;
    setProgress(0);
    setErrorDetail(null);
    try {
      const storageRef = ref(storage, storagePath);
      const task = uploadBytesResumable(storageRef, preview.file, { contentType: "image/jpeg" });

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          resolve,
        );
      });

      const url = await getDownloadURL(task.snapshot.ref);
      console.log("[ImageEditor] Uploaded:", url);
      onSaved(url);
      onOpenChange(false);
      setPreview(null);
      setProgress(null);
      toast.success("Photo updated — tap Reposition to adjust focal point");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ImageEditor] Upload failed:", err);
      setErrorDetail(msg);
      setProgress(null);
      toast.error("Upload failed — see details below");
    }
  }

  function handleClose() {
    if (progress !== null) return;
    onOpenChange(false);
    setPreview(null);
    setErrorDetail(null);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col p-0" aria-describedby={undefined}>
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle>Update photo</SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {preview ? (
            <>
              {/* Preview — full image, no crop */}
              <div className="relative flex-1 bg-black overflow-hidden">
                <img
                  src={preview.src}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Progress */}
              {progress !== null && (
                <div className="px-4 pt-3 shrink-0">
                  <div className="w-full bg-cream-200 rounded-full h-1.5">
                    <div
                      className="bg-sage-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
                </div>
              )}

              {/* Error */}
              {errorDetail && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 shrink-0">
                  <p className="text-xs text-red-700 font-mono break-all">{errorDetail}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center pt-3 px-4 shrink-0">
                After uploading, use the <strong>Reposition</strong> button on the image to adjust the focal point
              </p>

              {/* Actions */}
              <div className="px-4 pb-6 pt-3 flex gap-3 shrink-0 bg-white border-t border-cream-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setPreview(null); setErrorDetail(null); fileInputRef.current?.click(); }}
                  disabled={progress !== null}
                >
                  Choose different
                </Button>
                <Button
                  className="flex-1 bg-sage-600 hover:bg-sage-700"
                  onClick={handleUpload}
                  disabled={progress !== null}
                >
                  {progress !== null ? "Uploading…" : "Upload photo"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 pb-8">
              <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-sage-500" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Choose a photo of Caia</p>
                <p className="text-sm text-muted-foreground">Full image is uploaded — use the Reposition button to adjust the focal point afterwards</p>
              </div>
              {errorDetail && (
                <div className="w-full px-2 py-2 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-700 font-mono break-all">{errorDetail}</p>
                </div>
              )}
              <Button className="bg-sage-600 hover:bg-sage-700" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Select photo
              </Button>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </SheetContent>
    </Sheet>
  );
}
