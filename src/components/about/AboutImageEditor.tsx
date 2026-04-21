"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
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
      else reject(new Error("Canvas toBlob failed"));
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    // reset crop state for new image
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      onSaved(url);
      onOpenChange(false);
      setImageSrc(null);
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to save photo");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    onOpenChange(false);
    setImageSrc(null);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col p-0">
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

              {/* Actions */}
              <div className="px-4 pb-6 pt-2 flex gap-3 shrink-0 bg-white border-t border-cream-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setImageSrc(null); fileInputRef.current?.click(); }}
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
