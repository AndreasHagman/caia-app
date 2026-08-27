"use client";

import { useState, useRef, useEffect } from "react";
import { SectionData, SectionKey, updateSection } from "@/lib/dogsitter";
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
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens with new data
  useEffect(() => {
    setTitle(initialData.title);
    setContent(initialData.content);
    setImageUrl(initialData.imageUrl);
    setImageFile(null);
    setPreviewUrl(null);
  }, [initialData]);

  // Cleanup blob URL to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

      setImageFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Image processing error:", err);
      toast.error("Failed to process image");
    }
  }

  function handleRemoveImage() {
    setImageUrl(null);
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setUploadProgress(null);

    try {
      let finalImageUrl = imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const storagePath = `dogsitter/${sectionKey}.jpg`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, imageFile, {
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

        finalImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
      }

      // Update Firestore
      await updateSection(sectionKey, {
        title,
        content,
        imageUrl: finalImageUrl,
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
    setImageUrl(initialData.imageUrl);
    setImageFile(null);
    setPreviewUrl(null);
    onOpenChange(false);
  }

  const currentImageUrl = previewUrl || imageUrl;
  const hasImage = currentImageUrl !== null;

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

          {/* Image */}
          <div className="space-y-2">
            <Label>Image (optional)</Label>
            {hasImage ? (
              <div className="relative">
                <img
                  src={currentImageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
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
    </Dialog>
  );
}
