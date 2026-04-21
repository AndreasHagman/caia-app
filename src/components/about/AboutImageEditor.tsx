"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";
import heic2any from "heic2any";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the final Storage download URL after a successful upload */
  onSaved: (url: string) => void;
  /** Firebase Storage path to upload to, e.g. "about/hero.jpg" */
  storagePath: string;
  /** Crop aspect ratio — defaults to 4/3 */
  aspect?: number;
}

async function getCroppedBlob(imageSrc: string, cropPixels: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/jpeg", 0.92);
  });
}

export function AboutImageEditor({ open, onOpenChange, onSaved, storagePath, aspect = 4 / 3 }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorDetail(null);
    console.log("[ImageEditor] File selected:", file.name, file.type, `${(file.size / 1024).toFixed(0)} KB`);
    try {
      let workingFile: File = file;

      // HEIC/HEIF: Chrome on Android has no native decoder — convert to JPEG first
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        /\.heic$/i.test(file.name) ||
        /\.heif$/i.test(file.name);

      if (isHeic) {
        console.log("[ImageEditor] HEIC detected — converting to JPEG via heic2any…");
        const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        const blob = Array.isArray(result) ? result[0] : result;
        workingFile = new File([blob], file.name.replace(/\.heic?$/i, ".jpg"), { type: "image/jpeg" });
        console.log("[ImageEditor] HEIC→JPEG done:", `${(workingFile.size / 1024).toFixed(0)} KB`);
      }

      console.log("[ImageEditor] Normalising EXIF orientation…");
      const normalized = await imageCompression(workingFile, {
        maxSizeMB: 10,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      console.log("[ImageEditor] Normalised:", normalized.type, `${(normalized.size / 1024).toFixed(0)} KB`);

      const reader = new FileReader();
      reader.onload = () => {
        console.log("[ImageEditor] Data URL ready, rendering cropper");
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(normalized);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : err instanceof Event ? `Browser decoding error (${err.type})` : String(err);
      console.error("[ImageEditor] Normalisation failed:", err);
      setErrorDetail(`Normalisation failed: ${msg}`);
    }
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    setErrorDetail(null);
    try {
      console.log("[ImageEditor] Cropping canvas…", croppedAreaPixels);
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      console.log("[ImageEditor] Blob ready:", `${(blob.size / 1024).toFixed(0)} KB`);

      console.log("[ImageEditor] Uploading to Storage:", storagePath);
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      console.log("[ImageEditor] Upload complete, fetching download URL…");

      const url = await getDownloadURL(storageRef);
      console.log("[ImageEditor] Done:", url);

      onSaved(url);
      onOpenChange(false);
      setImageSrc(null);
      toast.success("Photo updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ImageEditor] Save failed:", msg);
      setErrorDetail(msg);
      toast.error("Failed to save — see details below");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    onOpenChange(false);
    setImageSrc(null);
    setErrorDetail(null);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col p-0" aria-describedby={undefined}>
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle>Update photo</SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {imageSrc ? (
            <>
              {/* Cropper */}
              <div className="relative flex-1 bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom slider */}
              <div className="px-6 py-4 bg-white shrink-0">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Pinch or drag to adjust · scroll or slide to zoom
                </p>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-sage-600"
                />
              </div>

              {/* Error detail */}
              {errorDetail && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 shrink-0">
                  <p className="text-xs text-red-700 font-mono break-all">{errorDetail}</p>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 pb-6 pt-2 flex gap-3 shrink-0 bg-white border-t border-cream-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setImageSrc(null); setErrorDetail(null); fileInputRef.current?.click(); }}
                  disabled={saving}
                >
                  Choose different
                </Button>
                <Button
                  className="flex-1 bg-sage-600 hover:bg-sage-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save photo"}
                </Button>
              </div>
            </>
          ) : (
            /* Pick image prompt */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 pb-8">
              <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-sage-500" />
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">Choose a photo of Caia</p>
                <p className="text-sm text-muted-foreground">You can crop and zoom after selecting</p>
              </div>
              {errorDetail && (
                <div className="w-full px-2 py-2 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-700 font-mono break-all">{errorDetail}</p>
                </div>
              )}
              <Button
                className="bg-sage-600 hover:bg-sage-700"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select photo
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </SheetContent>
    </Sheet>
  );
}
