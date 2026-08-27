# Dog Sitter Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, owner-editable dog sitter information page with seven sections (feeding, walks, treats, training, behavior, health, emergency contacts), each with optional images and text content.

**Architecture:** Single Firestore document at `settings/dogsitter` containing all seven sections. Page renders SectionCard components in a responsive grid. Owners can edit each section via a SectionEditor dialog that handles text and image uploads. Follows existing patterns from About page.

**Tech Stack:** Next.js 16, React 19, Firebase (Firestore + Storage), TypeScript, Tailwind CSS, shadcn/ui components

## Global Constraints

- Use existing shadcn/ui components (Card, Button, Dialog, Input, Textarea, Sheet, Skeleton)
- Follow cream/sage color scheme from existing design system
- Use rounded-3xl for cards (consistent with About page)
- Reuse image upload/compression patterns from AboutImageEditor
- Store images in Firebase Storage at `dogsitter/{sectionKey}.jpg`
- Public read access, owner-only write access (already configured in firestore.rules)
- No strict validation - allow empty content and any length text
- Preserve line breaks in content display

---

### Task 1: Firestore Library Functions

**Files:**
- Create: `src/lib/dogsitter.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/firebase`, Firestore functions from `firebase/firestore`
- Produces: 
  - `SectionData` interface with `title: string`, `content: string`, `imageUrl: string | null`
  - `DogSitterSettings` interface with seven section keys
  - `SectionKey` type (union of section keys)
  - `getDogSitterSettings(): Promise<DogSitterSettings>` - fetches all sections
  - `updateSection(sectionKey: SectionKey, data: Partial<SectionData>): Promise<void>` - updates one section

- [ ] **Step 1: Create types and default structure**

```typescript
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface SectionData {
  title: string;
  content: string;
  imageUrl: string | null;
}

export interface DogSitterSettings {
  feeding: SectionData;
  walks: SectionData;
  treats: SectionData;
  training: SectionData;
  behavior: SectionData;
  health: SectionData;
  emergency: SectionData;
}

export type SectionKey = keyof DogSitterSettings;

const DEFAULT_SETTINGS: DogSitterSettings = {
  feeding: { title: "Feeding", content: "", imageUrl: null },
  walks: { title: "Walks & Exercise", content: "", imageUrl: null },
  treats: { title: "Treats & Rewards", content: "", imageUrl: null },
  training: { title: "Training", content: "", imageUrl: null },
  behavior: { title: "Behavior & Personality", content: "", imageUrl: null },
  health: { title: "Health & Care", content: "", imageUrl: null },
  emergency: { title: "Emergency Contacts", content: "", imageUrl: null },
};
```

- [ ] **Step 2: Implement getDogSitterSettings**

```typescript
export async function getDogSitterSettings(): Promise<DogSitterSettings> {
  const snap = await getDoc(doc(db, "settings", "dogsitter"));
  if (!snap.exists()) {
    return DEFAULT_SETTINGS;
  }
  const data = snap.data();
  return {
    feeding: data.feeding ?? DEFAULT_SETTINGS.feeding,
    walks: data.walks ?? DEFAULT_SETTINGS.walks,
    treats: data.treats ?? DEFAULT_SETTINGS.treats,
    training: data.training ?? DEFAULT_SETTINGS.training,
    behavior: data.behavior ?? DEFAULT_SETTINGS.behavior,
    health: data.health ?? DEFAULT_SETTINGS.health,
    emergency: data.emergency ?? DEFAULT_SETTINGS.emergency,
  };
}
```

- [ ] **Step 3: Implement updateSection**

```typescript
export async function updateSection(
  sectionKey: SectionKey,
  data: Partial<SectionData>
): Promise<void> {
  await setDoc(
    doc(db, "settings", "dogsitter"),
    { [sectionKey]: data },
    { merge: true }
  );
}
```

- [ ] **Step 4: Verify types compile**

Run: `npm run build` or check TypeScript errors in IDE
Expected: No type errors in `src/lib/dogsitter.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/dogsitter.ts
git commit -m "feat: add Firestore library for dog sitter settings"
```

---

### Task 2: SectionCard Component

**Files:**
- Create: `src/components/dogsitter/SectionCard.tsx`

**Interfaces:**
- Consumes:
  - `SectionData` from `@/lib/dogsitter`
  - `SectionKey` from `@/lib/dogsitter`
  - `Card`, `CardContent` from `@/components/ui/card`
  - `Button` from `@/components/ui/button`
  - `Pencil` from `lucide-react`
- Produces:
  - `SectionCard` component with props:
    - `sectionKey: SectionKey`
    - `data: SectionData`
    - `onEdit: () => void`
    - `isOwner: boolean`

- [ ] **Step 1: Create component structure**

```typescript
"use client";

import { SectionData, SectionKey } from "@/lib/dogsitter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface Props {
  sectionKey: SectionKey;
  data: SectionData;
  onEdit: () => void;
  isOwner: boolean;
}

export function SectionCard({ sectionKey, data, onEdit, isOwner }: Props) {
  const hasContent = data.content.trim().length > 0;
  
  return (
    <Card className="rounded-3xl shadow-sm overflow-hidden relative">
      {data.imageUrl && (
        <div className="relative w-full h-48 bg-sage-100">
          <img
            src={data.imageUrl}
            alt={data.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold">{data.title}</h3>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
        
        {hasContent ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {data.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Click edit to add information
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Run: Check TypeScript errors in IDE
Expected: No type errors in `src/components/dogsitter/SectionCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/dogsitter/SectionCard.tsx
git commit -m "feat: add SectionCard component for dog sitter page"
```

---

### Task 3: SectionEditor Component

**Files:**
- Create: `src/components/dogsitter/SectionEditor.tsx`

**Interfaces:**
- Consumes:
  - `SectionData`, `SectionKey`, `updateSection` from `@/lib/dogsitter`
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `@/components/ui/dialog`
  - `Button` from `@/components/ui/button`
  - `Input` from `@/components/ui/input`
  - `Label` from `@/components/ui/label`
  - `Textarea` from `@/components/ui/textarea`
  - `storage` from `@/lib/firebase`
  - `ref`, `uploadBytesResumable`, `getDownloadURL` from `firebase/storage`
  - `toast` from `sonner`
  - `Upload`, `X` from `lucide-react`
  - `imageCompression` from `browser-image-compression`
- Produces:
  - `SectionEditor` component with props:
    - `open: boolean`
    - `onOpenChange: (open: boolean) => void`
    - `sectionKey: SectionKey`
    - `initialData: SectionData`
    - `onSave: () => void`

- [ ] **Step 1: Create component with form state**

```typescript
"use client";

import { useState, useRef } from "react";
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
  useState(() => {
    setTitle(initialData.title);
    setContent(initialData.content);
    setImageUrl(initialData.imageUrl);
    setImageFile(null);
    setPreviewUrl(null);
  });
```

- [ ] **Step 2: Add image handling functions**

```typescript
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
```

- [ ] **Step 3: Add save function**

```typescript
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
```

- [ ] **Step 4: Add render method**

```typescript
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
```

- [ ] **Step 5: Verify component compiles**

Run: Check TypeScript errors in IDE
Expected: No type errors in `src/components/dogsitter/SectionEditor.tsx`

- [ ] **Step 6: Commit**

```bash
git add src/components/dogsitter/SectionEditor.tsx
git commit -m "feat: add SectionEditor component with image upload"
```

---

### Task 4: Main Dog Sitter Page

**Files:**
- Create: `src/app/(public)/dogsitter/page.tsx`

**Interfaces:**
- Consumes:
  - `getDogSitterSettings`, `DogSitterSettings`, `SectionKey` from `@/lib/dogsitter`
  - `SectionCard` from `@/components/dogsitter/SectionCard`
  - `SectionEditor` from `@/components/dogsitter/SectionEditor`
  - `useAuth` from `@/contexts/AuthContext`
  - `Skeleton` from `@/components/ui/skeleton`
- Produces:
  - Default exported page component at `/dogsitter` route

- [ ] **Step 1: Create page component structure**

```typescript
"use client";

import { useEffect, useState } from "react";
import { getDogSitterSettings, DogSitterSettings, SectionKey } from "@/lib/dogsitter";
import { SectionCard } from "@/components/dogsitter/SectionCard";
import { SectionEditor } from "@/components/dogsitter/SectionEditor";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const SECTION_ORDER: SectionKey[] = [
  "feeding",
  "walks",
  "treats",
  "training",
  "behavior",
  "health",
  "emergency",
];

export default function DogSitterPage() {
  const { isOwner } = useAuth();
  const [settings, setSettings] = useState<DogSitterSettings | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDogSitterSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load dog sitter settings:", err);
      setError("Failed to load information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);
```

- [ ] **Step 2: Add render logic**

```typescript
  async function handleSave() {
    await loadSettings();
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadSettings}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Dog Sitter Guide</h1>
      <p className="text-muted-foreground mb-10">
        Everything you need to know to care for Caia
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTION_ORDER.map((sectionKey) => (
          <SectionCard
            key={sectionKey}
            sectionKey={sectionKey}
            data={settings[sectionKey]}
            onEdit={() => setEditingSection(sectionKey)}
            isOwner={isOwner}
          />
        ))}
      </div>

      {editingSection && (
        <SectionEditor
          open={true}
          onOpenChange={(open) => !open && setEditingSection(null)}
          sectionKey={editingSection}
          initialData={settings[editingSection]}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify page compiles**

Run: Check TypeScript errors in IDE
Expected: No type errors in `src/app/(public)/dogsitter/page.tsx`

- [ ] **Step 4: Test page loads in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000/dogsitter`
Expected: Page loads, shows 7 empty section cards with placeholder text

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/dogsitter/page.tsx
git commit -m "feat: add dog sitter page with sections grid"
```

---

### Task 5: Update Navigation

**Files:**
- Modify: `src/components/layout/Navbar.tsx:12-18`

**Interfaces:**
- Consumes: Existing `publicLinks` array
- Produces: Updated `publicLinks` with "Hundepass" entry

- [ ] **Step 1: Add dog sitter link to publicLinks**

Open `src/components/layout/Navbar.tsx` and locate the `publicLinks` array around line 12. Update it to:

```typescript
const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tricks", label: "Tricks" },
  { href: "/hikes", label: "Hikes" },
  { href: "/dogsitter", label: "Hundepass" },
  { href: "/gallery", label: "Gallery" },
];
```

- [ ] **Step 2: Verify navigation compiles**

Run: Check TypeScript errors in IDE
Expected: No type errors in `src/components/layout/Navbar.tsx`

- [ ] **Step 3: Test navigation in browser**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Expected: "Hundepass" link appears in navbar after "Hikes"

- [ ] **Step 4: Click navigation link**

Click: "Hundepass" in navbar
Expected: Navigates to `/dogsitter` page successfully

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: add Hundepass link to navigation"
```

---

### Task 6: Manual Testing & Verification

**Files:**
- Test: All created components and pages

**Interfaces:**
- Consumes: Entire dog sitter page feature
- Produces: Verified working implementation

- [ ] **Step 1: Test initial page load (not logged in)**

1. Open browser to `http://localhost:3000/dogsitter`
2. Verify page loads without errors
3. Verify all 7 section cards render with default titles
4. Verify placeholder text "Click edit to add information" appears
5. Verify edit buttons are NOT visible

- [ ] **Step 2: Test initial page load (logged in as owner)**

1. Log in as owner
2. Navigate to `/dogsitter`
3. Verify edit buttons appear on all section cards
4. Verify buttons have pencil icon and "Edit" text

- [ ] **Step 3: Test editing a section - text only**

1. As owner, click "Edit" on the "Feeding" section
2. Verify dialog opens with pre-filled title "Feeding"
3. Change content to: "2 cups dry food morning and evening\nWater always available"
4. Click "Save Changes"
5. Verify dialog closes
6. Verify content appears in card with line break preserved
7. Verify placeholder text no longer shows

- [ ] **Step 4: Test editing a section - with image upload**

1. Click "Edit" on the "Walks" section
2. Click "Upload Image" button
3. Select a JPG image from your computer
4. Verify image preview appears
5. Verify "Remove Image" button (X) appears on preview
6. Add content: "30-45 minute walks twice daily"
7. Click "Save Changes"
8. Verify upload progress bar appears
9. Verify dialog closes after upload completes
10. Verify image appears at top of "Walks" card
11. Verify content appears below image

- [ ] **Step 5: Test image removal**

1. Click "Edit" on the "Walks" section (which now has an image)
2. Verify image preview shows in dialog
3. Click the X button to remove image
4. Verify image preview disappears
5. Verify "Upload Image" button reappears
6. Click "Save Changes"
7. Verify card no longer shows image

- [ ] **Step 6: Test HEIC image upload (if available)**

1. Click "Edit" on any section
2. Select a HEIC image file
3. Verify image processes and preview shows
4. Click "Save Changes"
5. Verify image uploads and displays correctly

- [ ] **Step 7: Test cancel behavior**

1. Click "Edit" on any section
2. Make changes to title and content
3. Click "Cancel"
4. Verify dialog closes
5. Verify changes were NOT saved (card shows original content)

- [ ] **Step 8: Test error handling - network failure**

1. In browser DevTools, set Network throttling to "Offline"
2. Click "Edit" on any section
3. Make changes and click "Save Changes"
4. Verify error toast appears: "Failed to save changes"
5. Verify dialog stays open with user's changes intact
6. Set Network back to "Online"
7. Click "Save Changes" again
8. Verify save succeeds

- [ ] **Step 9: Test responsive layout - mobile**

1. Resize browser to mobile width (375px)
2. Verify grid switches to single column
3. Verify cards are full width
4. Verify edit buttons are accessible
5. Open dialog, verify it fits mobile screen
6. Verify image upload UI works on mobile

- [ ] **Step 10: Test all seven sections**

1. Edit and save content for all seven sections:
   - Feeding
   - Walks & Exercise
   - Treats & Rewards
   - Training
   - Behavior & Personality
   - Health & Care
   - Emergency Contacts
2. Verify each section updates correctly
3. Refresh page
4. Verify all content persists

- [ ] **Step 11: Test as non-owner user**

1. Log out
2. Navigate to `/dogsitter`
3. Verify all section content is visible
4. Verify edit buttons are NOT visible
5. Verify images display correctly

- [ ] **Step 12: Commit after successful testing**

```bash
git add -A
git commit -m "test: verify dog sitter page functionality"
```

---

## Implementation Complete

After completing all tasks and manual testing:

1. All seven sections render correctly in a responsive grid
2. Owners can edit section titles, content, and images
3. Images upload, compress, and display correctly
4. Content preserves line breaks
5. Empty states show appropriate placeholders
6. Navigation link works in navbar
7. Page is public but only owners can edit
8. Error handling works for network failures
9. Mobile layout is responsive and functional

The dog sitter page is ready for use!
