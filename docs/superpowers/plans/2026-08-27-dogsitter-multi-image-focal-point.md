# Dog Sitter Multi-Image & Focal Point Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for 2 images per section with independent focal point adjustment for dog sitter page.

**Architecture:** Extend the existing dog sitter data model from single `imageUrl` to array-based `images` with focal points. Migrate existing data transparently at read-time. Update SectionCard to display side-by-side images with focal positioning. Enhance SectionEditor with 2 image slots and reuse ImageRepositionSheet from About page for focal point adjustment.

**Tech Stack:** Next.js 16, React 19, Firebase (Firestore + Storage), TypeScript, Tailwind CSS, ImageRepositionSheet component

## Global Constraints

- Reuse existing `ImageRepositionSheet` component from About page (no modifications needed)
- Migrate existing `imageUrl` data transparently at read-time (backward compatible)
- Store images at `dogsitter/{sectionKey}-1.jpg` and `dogsitter/{sectionKey}-2.jpg`
- Maximum 2 images per section enforced in UI
- Default focal points: `focalX: 50, focalY: 50` (centered)
- Follow cream/sage color scheme and existing design patterns
- Use `object-position` CSS for focal point display
- Height for images: `h-48` (12rem) in cards, `h-32` (8rem) in editor previews

---

### Task 1: Update Data Model with Migration

**Files:**
- Modify: `src/lib/dogsitter.ts`

**Interfaces:**
- Consumes: Firestore `doc`, `getDoc`, `setDoc` functions
- Produces:
  - `ImageData` interface: `{ url: string; focalX: number; focalY: number }`
  - Updated `SectionData` interface with `images: ImageData[]` (replacing `imageUrl`)
  - `getDogSitterSettings()` with migration logic
  - `updateSection()` unchanged (already supports `Partial<SectionData>`)

- [ ] **Step 1: Add ImageData interface and update SectionData**

```typescript
// After line 2, before existing SectionData interface
export interface ImageData {
  url: string;
  focalX: number;  // 0-100, default 50
  focalY: number;  // 0-100, default 50
}

// Update SectionData interface (replace existing)
export interface SectionData {
  title: string;
  content: string;
  images: ImageData[];  // 0-2 images allowed
}
```

- [ ] **Step 2: Update DEFAULT_SETTINGS to use images array**

```typescript
// Replace existing DEFAULT_SETTINGS (lines 22-30)
const DEFAULT_SETTINGS: DogSitterSettings = {
  feeding: { title: "Feeding", content: "", images: [] },
  walks: { title: "Walks & Exercise", content: "", images: [] },
  treats: { title: "Treats & Rewards", content: "", images: [] },
  training: { title: "Training", content: "", images: [] },
  behavior: { title: "Behavior & Personality", content: "", images: [] },
  health: { title: "Health & Care", content: "", images: [] },
  emergency: { title: "Emergency Contacts", content: "", images: [] },
};
```

- [ ] **Step 3: Add migration helper function**

```typescript
// Add before getDogSitterSettings function
function migrateSectionData(data: any, defaultSection: SectionData): SectionData {
  // If already using new format, return as-is
  if (data.images && Array.isArray(data.images)) {
    return {
      title: data.title ?? defaultSection.title,
      content: data.content ?? defaultSection.content,
      images: data.images,
    };
  }
  
  // Migrate from old imageUrl format
  const images: ImageData[] = [];
  if (data.imageUrl && typeof data.imageUrl === 'string') {
    images.push({
      url: data.imageUrl,
      focalX: 50,
      focalY: 50,
    });
  }
  
  return {
    title: data.title ?? defaultSection.title,
    content: data.content ?? defaultSection.content,
    images,
  };
}
```

- [ ] **Step 4: Update getDogSitterSettings to use migration**

```typescript
// Replace existing getDogSitterSettings function (lines 32-47)
export async function getDogSitterSettings(): Promise<DogSitterSettings> {
  const snap = await getDoc(doc(db, "settings", "dogsitter"));
  if (!snap.exists()) {
    return DEFAULT_SETTINGS;
  }
  const data = snap.data();
  return {
    feeding: migrateSectionData(data.feeding ?? {}, DEFAULT_SETTINGS.feeding),
    walks: migrateSectionData(data.walks ?? {}, DEFAULT_SETTINGS.walks),
    treats: migrateSectionData(data.treats ?? {}, DEFAULT_SETTINGS.treats),
    training: migrateSectionData(data.training ?? {}, DEFAULT_SETTINGS.training),
    behavior: migrateSectionData(data.behavior ?? {}, DEFAULT_SETTINGS.behavior),
    health: migrateSectionData(data.health ?? {}, DEFAULT_SETTINGS.health),
    emergency: migrateSectionData(data.emergency ?? {}, DEFAULT_SETTINGS.emergency),
  };
}
```

- [ ] **Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No type errors related to dogsitter.ts

- [ ] **Step 6: Commit data model changes**

```bash
git add src/lib/dogsitter.ts
git commit -m "feat: add multi-image support with migration to dogsitter data model"
```

---

### Task 2: Update SectionCard Display

**Files:**
- Modify: `src/components/dogsitter/SectionCard.tsx`

**Interfaces:**
- Consumes:
  - `SectionData` with `images: ImageData[]` from `@/lib/dogsitter`
  - Existing UI components (Card, Button, etc.)
- Produces:
  - Updated `SectionCard` component rendering 0/1/2 images with focal points

- [ ] **Step 1: Update image display logic**

Replace the current single image display (lines 20-28) with multi-image logic:

```typescript
      {data.images.length > 0 && (
        <div className={data.images.length === 1 ? "relative w-full h-48 bg-sage-100" : "grid grid-cols-2 gap-2 h-48"}>
          {data.images.map((img, index) => (
            <div key={index} className="relative overflow-hidden bg-sage-100">
              <img
                src={img.url}
                alt={`${data.title} ${index + 1}`}
                className="w-full h-full object-cover"
                style={{ objectPosition: `${img.focalX}% ${img.focalY}%` }}
              />
            </div>
          ))}
        </div>
      )}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No type errors related to SectionCard.tsx

- [ ] **Step 3: Test display in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/dogsitter`
Expected: Page loads without errors (existing sections with old data should show migrated single images)

- [ ] **Step 4: Commit SectionCard changes**

```bash
git add src/components/dogsitter/SectionCard.tsx
git commit -m "feat: update SectionCard to display multi-image with focal points"
```

---

### Task 3: Update SectionEditor for Multi-Image

**Files:**
- Modify: `src/components/dogsitter/SectionEditor.tsx`

**Interfaces:**
- Consumes:
  - `ImageData`, `SectionData`, `SectionKey`, `updateSection` from `@/lib/dogsitter`
  - `ImageRepositionSheet` from `@/components/about/ImageRepositionSheet`
  - Existing state management and upload logic
- Produces:
  - Updated `SectionEditor` with 2 image slots
  - Focal point adjustment per image
  - Upload to suffixed storage paths (`-1.jpg`, `-2.jpg`)

- [ ] **Step 1: Update imports to include ImageRepositionSheet**

Add after existing imports (around line 11):

```typescript
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { Move } from "lucide-react";
```

- [ ] **Step 2: Update state management for images array**

Replace the single `imageUrl`, `imageFile`, `previewUrl` state (lines 24-26) with:

```typescript
  const [images, setImages] = useState<ImageData[]>(initialData.images);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null]);
  const [repositioningIndex, setRepositioningIndex] = useState<number | null>(null);
```

- [ ] **Step 3: Update useEffect to reset state with images**

Replace existing useEffect (lines 35-41) with:

```typescript
  useEffect(() => {
    setTitle(initialData.title);
    setContent(initialData.content);
    setImages(initialData.images);
    setImageFiles([null, null]);
    setPreviewUrls([null, null]);
    setRepositioningIndex(null);
  }, [initialData]);
```

- [ ] **Step 4: Add cleanup effect for preview URLs**

Add new useEffect after the reset effect:

```typescript
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);
```

- [ ] **Step 5: Update handleFileSelect for slot-based uploads**

Replace existing `handleFileSelect` function with:

```typescript
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
```

- [ ] **Step 6: Add handleRemoveImage function**

```typescript
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
```

- [ ] **Step 7: Add handleRepositionCommit function**

```typescript
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
```

- [ ] **Step 8: Update handleSave to upload multiple images**

Replace existing `handleSave` function with:

```typescript
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
```

- [ ] **Step 9: Update handleCancel function**

```typescript
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
```

- [ ] **Step 10: Replace image upload UI with 2-slot layout**

Replace the existing image section (lines 203-237) with:

```typescript
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
```

- [ ] **Step 11: Add ImageRepositionSheet integration**

Add before the closing Dialog tag (after DialogFooter):

```typescript
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
```

- [ ] **Step 12: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No type errors related to SectionEditor.tsx

- [ ] **Step 13: Test in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/dogsitter`
As owner:
1. Click Edit on a section
2. Upload an image to slot 1
3. Click Reposition on slot 1 → sheet opens
4. Drag image to adjust focal point
5. Click Done → preview updates
6. Upload image to slot 2
7. Click Reposition on slot 2 → independent adjustment works
8. Click Save Changes
Expected: Section saves with 2 images, each with correct focal point

- [ ] **Step 14: Commit SectionEditor changes**

```bash
git add src/components/dogsitter/SectionEditor.tsx
git commit -m "feat: add multi-image upload and focal point adjustment to SectionEditor"
```

---

### Task 4: Manual Testing & Verification

**Files:**
- Test: All updated components

**Interfaces:**
- Consumes: Complete multi-image feature
- Produces: Verified working implementation

- [ ] **Step 1: Test data migration**

1. Ensure existing sections with old `imageUrl` display correctly
2. Verify focal point defaults to 50/50 for migrated images
3. Check browser console for migration errors
Expected: Existing images appear as single images with centered focal points

- [ ] **Step 2: Test image upload flow**

1. Open editor, upload first image
2. Verify preview shows in slot 1
3. Upload second image
4. Verify preview shows in slot 2
5. Verify both images persist after save
Expected: 2 images upload successfully to suffixed storage paths

- [ ] **Step 3: Test focal point adjustment**

1. Click "Reposition" on image 1
2. Drag to adjust focal point
3. Click "Done"
4. Verify preview updates with new focal point
5. Repeat for image 2
6. Save and reload page
Expected: Both images display with correct focal points

- [ ] **Step 4: Test display layouts**

1. Create section with 0 images → no image area shows
2. Create section with 1 image → full-width image with focal point
3. Create section with 2 images → side-by-side layout with gap
Expected: All layouts render correctly

- [ ] **Step 5: Test image removal**

1. Section with 2 images: remove first → second becomes first
2. Section with 2 images: remove second → first remains
3. Section with 1 image: remove it → empty state
Expected: Array shifts correctly, state updates

- [ ] **Step 6: Test cancel behavior**

1. Upload images and adjust focal points
2. Click "Cancel"
3. Reopen editor
Expected: Changes reverted to original state

- [ ] **Step 7: Test mobile responsiveness**

1. Resize browser to mobile width
2. Check section cards with 2 images
3. Check editor dialog on mobile
Expected: Side-by-side layout works (narrow but functional)

- [ ] **Step 8: Test error handling**

1. Disconnect network in DevTools
2. Try uploading image
3. Verify error toast appears
4. Reconnect network and retry
Expected: Error handling works, retry succeeds

- [ ] **Step 9: Final commit for testing verification**

```bash
git add -A
git commit -m "test: verify multi-image and focal point functionality"
```

---

## Implementation Complete

After completing all tasks:

1. Data model supports 0-2 images per section with focal points
2. Migration from old `imageUrl` happens transparently
3. SectionCard displays images side-by-side with focal point positioning
4. SectionEditor allows upload, removal, and focal point adjustment per image
5. ImageRepositionSheet reused from About page for drag-to-reposition
6. All images stored with suffixed paths (`-1.jpg`, `-2.jpg`)
7. Backward compatible - existing data migrates automatically

The multi-image focal point feature is complete and ready for use!
