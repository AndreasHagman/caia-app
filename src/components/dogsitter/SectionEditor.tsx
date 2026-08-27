"use client";

import { useState, useRef, useEffect } from "react";
import { SectionData, SectionKey, updateSection, ImageData } from "@/lib/dogsitter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { Move } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey: SectionKey;
  initialData: SectionData;
  onSave: () => void;
}

export function SectionEditor({ open, onOpenChange, sectionKey, initialData, onSave }: Props) {
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [images, setImages] = useState<ImageData[]>(initialData.images);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null]);
  const [repositioningIndex, setRepositioningIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens with new data
  useEffect(() => {
    setTitle(initialData.title);
    setContent(initialData.content);
    setImages(initialData.images);
    setImageFiles([null, null]);
    setPreviewUrls([null, null]);
    setRepositioningIndex(null);
  }, [initialData]);

  // Cleanup blob URL to prevent memory leak
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  async function handleFileSelect(slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Handle HEIC conversion
      let processedFile = file;
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        /\.heic$/i.test(file.name) ||
        /\.heif$/i.test(file.name);

      if (isHeic) {
        const heic2any = (await import("heic2any")).default;
        const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        const blob = Array.isArray(result) ? result[0] : result;
        processedFile = new File([blob], file.name.replace(/\.heic?$/i, ".jpg"), { type: "image/jpeg" });
      }

      // Compress image
      const compressed = await imageCompression(processedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });

      // Update state for this slot
      const newFiles = [...imageFiles];
      newFiles[slotIndex] = compressed;
      setImageFiles(newFiles);

      const newPreviews = [...previewUrls];
      if (newPreviews[slotIndex]) {
        URL.revokeObjectURL(newPreviews[slotIndex]!);
      }
      newPreviews[slotIndex] = URL.createObjectURL(compressed);
      setPreviewUrls(newPreviews);
    } catch (err) {
      console.error("Image processing error:", err);
      toast.error("Failed to process image");
    }
  }

  function handleRemoveImage(slotIndex: number) {
    const newImages = images.filter((_, i) => i !== slotIndex);
    setImages(newImages);

    const newFiles = [...imageFiles];
    newFiles[slotIndex] = null;
    setImageFiles(newFiles);

    const newPreviews = [...previewUrls];
    if (newPreviews[slotIndex]) {
      URL.revokeObjectURL(newPreviews[slotIndex]!);
    }
    newPreviews[slotIndex] = null;
    setPreviewUrls(newPreviews);
  }

  function handleRepositionCommit(x: number, y: number) {
    if (repositioningIndex === null) return;

    const updated = [...images];
    updated[repositioningIndex] = {
      ...updated[repositioningIndex],
      focalX: x,
      focalY: y,
    };
    setImages(updated);
    setRepositioningIndex(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setUploadProgress(null);

    try {
      const finalImages: ImageData[] = [];

      // Process each slot
      for (let i = 0; i < 2; i++) {
        if (imageFiles[i]) {
          // New upload for this slot
          const storagePath = `dogsitter/${sectionKey}-${i + 1}.jpg`;
          const storageRef = ref(storage, storagePath);
          const uploadTask = uploadBytesResumable(storageRef, imageFiles[i]!, {
            contentType: "image/jpeg",
          });

          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                setUploadProgress(progress);
              },
              reject,
              resolve
            );
          });

          const url = await getDownloadURL(uploadTask.snapshot.ref);
          finalImages.push({
            url,
            focalX: 50,
            focalY: 50,
          });
        } else if (images[i]) {
          // Existing image, preserve it
          finalImages.push(images[i]);
        }
      }

      // Update Firestore
      await updateSection(sectionKey, {
        title,
        content,
        images: finalImages,
      });

      toast.success("Section updated");
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  }

  function handleCancel() {
    setTitle(initialData.title);
    setContent(initialData.content);
    setImages(initialData.images);
    setImageFiles([null, null]);
    previewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setPreviewUrls([null, null]);
    setRepositioningIndex(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {initialData.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Section Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Feeding"
              disabled={isSaving}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add details for dog sitters..."
              rows={6}
              disabled={isSaving}
              className="resize-none"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images (up to 2)</Label>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((slotIndex) => {
                const currentImage = images[slotIndex];
                const currentPreview = previewUrls[slotIndex];
                const hasImage = currentImage || currentPreview;

                return (
                  <div key={slotIndex} className="space-y-2">
                    {hasImage ? (
                      <div className="relative">
                        <img
                          src={currentPreview || currentImage?.url}
                          alt={`Preview ${slotIndex + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                          style={
                            currentImage
                              ? { objectPosition: `${currentImage.focalX}% ${currentImage.focalY}%` }
                              : undefined
                          }
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveImage(slotIndex)}
                          disabled={isSaving}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {currentImage && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRepositioningIndex(slotIndex)}
                              disabled={isSaving}
                              type="button"
                              className="flex-1"
                            >
                              <Move className="h-3.5 w-3.5 mr-1.5" />
                              Reposition
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 bg-sage-100 rounded-lg flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById(`file-input-${slotIndex}`)?.click()}
                          disabled={isSaving}
                          type="button"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                    )}
                    <input
                      id={`file-input-${slotIndex}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(slotIndex, e)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="w-full bg-cream-200 rounded-full h-2">
                <div
                  className="bg-sage-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-sage-600 hover:bg-sage-700"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {repositioningIndex !== null && images[repositioningIndex] && (
        <ImageRepositionSheet
          open={true}
          onOpenChange={(open) => !open && setRepositioningIndex(null)}
          imageUrl={images[repositioningIndex].url}
          heightVh={24}
          focalX={images[repositioningIndex].focalX}
          focalY={images[repositioningIndex].focalY}
          onCommit={handleRepositionCommit}
        />
      )}
    </Dialog>
  );
}
