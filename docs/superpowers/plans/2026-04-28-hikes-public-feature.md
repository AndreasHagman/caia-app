# Hikes Public Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hikes publicly accessible at `/hikes` and `/hikes/[id]` with full image layout controls and a lightbox gallery.

**Architecture:** Extend the `Hike` type with the same image-config fields as `Trick` (cover image, focal point, media settings). Add a `getHike(id)` lib function and `useHike` hook. Build two pages under the existing `(public)` route group. Build a `HikeLightbox` component on top of Radix Dialog primitives for full-screen browsing.

**Tech Stack:** Next.js 16 (App Router), Firebase Firestore, Radix UI, Tailwind CSS, TypeScript, lucide-react

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/types/index.ts` | Add image-config fields to `Hike` |
| Modify | `src/lib/hikes.ts` | Add `getHike(id)` function |
| Modify | `firestore.rules` | Allow unauthenticated reads on `hikes` |
| Create | `src/hooks/useHike.ts` | Single-hike fetcher hook |
| Modify | `src/components/hikes/HikeCard.tsx` | Cover image, focal point, optional `href` link |
| Create | `src/components/hikes/HikeLightbox.tsx` | Full-screen image lightbox |
| Create | `src/app/(public)/hikes/page.tsx` | Public list page |
| Create | `src/app/(public)/hikes/[id]/page.tsx` | Public detail page |
| Modify | `src/components/layout/Navbar.tsx` | Add Hikes to public nav |

---

### Task 1: Extend Hike type and add getHike()

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/hikes.ts`

- [ ] **Step 1: Extend Hike type in `src/types/index.ts`**

Replace the existing `Hike` interface with:

```ts
export interface Hike {
  id: string;
  title: string;
  location: string;
  distance?: number;
  notes: string;
  mediaUrls: string[];
  mediaSettings?: Record<string, { focalX?: number; focalY?: number; heightVh?: number }>;
  coverImageUrl?: string | null;
  coverHeightVh?: number;
  coverFocalX?: number;
  coverFocalY?: number;
  date: Date;
  createdBy: string;
  createdAt: Date;
}
```

- [ ] **Step 2: Add `getDoc` to imports and add `getHike()` to `src/lib/hikes.ts`**

Replace the import line:
```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
```
with:
```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
```

Then add this function after `getHikes()`:

```ts
export async function getHike(id: string): Promise<Hike | null> {
  const snap = await getDoc(doc(db, "hikes", id));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/hikes.ts
git commit -m "feat: extend Hike type with image-config fields and add getHike()"
```

---

### Task 2: Update Firestore rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Change hikes read rule to public**

In `firestore.rules`, replace:
```
match /hikes/{hikeId} {
  allow read: if isAuthenticated();
  allow create, update: if canEdit();
  allow delete: if isOwner();
}
```
with:
```
match /hikes/{hikeId} {
  allow read: if true;
  allow create, update: if canEdit();
  allow delete: if isOwner();
}
```

- [ ] **Step 2: Deploy rules**

```bash
firebase deploy --only firestore:rules
```

Expected: `Deploy complete!`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: allow public read access to hikes collection"
```

---

### Task 3: Add useHike hook

**Files:**
- Create: `src/hooks/useHike.ts`

- [ ] **Step 1: Create `src/hooks/useHike.ts`**

```ts
"use client";

import { getHike } from "@/lib/hikes";
import type { Hike } from "@/types";
import { useEffect, useState } from "react";

export function useHike(id: string) {
  const [hike, setHike] = useState<Hike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHike(id)
      .then(setHike)
      .catch(() => setError("Hike not found"))
      .finally(() => setLoading(false));
  }, [id]);

  return { hike, loading, error };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useHike.ts
git commit -m "feat: add useHike hook for single-hike fetching"
```

---

### Task 4: Update HikeCard with cover image and href support

**Files:**
- Modify: `src/components/hikes/HikeCard.tsx`

- [ ] **Step 1: Rewrite `src/components/hikes/HikeCard.tsx`**

```tsx
import type { Hike } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Props {
  hike: Hike;
  href?: string;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export function HikeCard({ hike, href, showActions = false, onDelete }: Props) {
  const thumbnail =
    hike.coverImageUrl ??
    hike.mediaUrls.find((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i));
  const focalX = hike.coverFocalX ?? 50;
  const focalY = hike.coverFocalY ?? 50;

  const card = (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
      {thumbnail && (
        <div
          className={cn(
            "relative bg-sage-50 overflow-hidden",
            !hike.coverHeightVh && "aspect-video"
          )}
          style={hike.coverHeightVh ? { height: `${hike.coverHeightVh}vh` } : undefined}
        >
          <img
            src={thumbnail}
            alt={hike.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold leading-tight">{hike.title}</h3>
          {showActions && (
            <div className="flex gap-1 shrink-0">
              <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                <Link href={`/dashboard/hikes/${hike.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(hike.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        <time className="text-xs text-muted-foreground">{formatDate(hike.date)}</time>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          {hike.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {hike.location}
            </span>
          )}
          {hike.distance && (
            <span className="flex items-center gap-1">
              <Route className="h-3.5 w-3.5" />
              {hike.distance} km
            </span>
          )}
        </div>
        {hike.notes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{hike.notes}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:shadow-md transition-shadow rounded-2xl">
        {card}
      </Link>
    );
  }
  return card;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/hikes/HikeCard.tsx
git commit -m "feat: add cover image, focal point, and href support to HikeCard"
```

---

### Task 5: Build HikeLightbox component

**Files:**
- Create: `src/components/hikes/HikeLightbox.tsx`

- [ ] **Step 1: Create `src/components/hikes/HikeLightbox.tsx`**

Uses Radix Dialog primitives directly (not the shadcn wrapper) to avoid style conflicts with the full-screen layout.

```tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  images: string[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

export function HikeLightbox({
  images,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange,
}: Props) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        onIndexChange((currentIndex - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        onIndexChange((currentIndex + 1) % images.length);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, currentIndex, images.length, onIndexChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
              diff > 0
                ? onIndexChange((currentIndex + 1) % images.length)
                : onIndexChange((currentIndex - 1 + images.length) % images.length);
            }
            touchStartX.current = null;
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Photo {currentIndex + 1} of {images.length}
          </DialogPrimitive.Title>

          {/* Counter */}
          <div className="absolute top-4 right-14 text-white/80 text-sm font-medium z-10">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Close */}
          <DialogPrimitive.Close className="absolute top-4 right-4 text-white/80 hover:text-white z-10 transition-colors">
            <X className="w-6 h-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Image */}
          {images[currentIndex] && (
            <img
              src={images[currentIndex]}
              alt={`Photo ${currentIndex + 1} of ${images.length}`}
              className="max-w-full max-h-screen object-contain px-16"
            />
          )}

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors z-10"
              onClick={() =>
                onIndexChange((currentIndex - 1 + images.length) % images.length)
              }
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors z-10"
              onClick={() =>
                onIndexChange((currentIndex + 1) % images.length)
              }
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/hikes/HikeLightbox.tsx
git commit -m "feat: add HikeLightbox with keyboard and swipe navigation"
```

---

### Task 6: Build public /hikes list page

**Files:**
- Create: `src/app/(public)/hikes/page.tsx`

- [ ] **Step 1: Create `src/app/(public)/hikes/page.tsx`**

```tsx
"use client";

import { useHikes } from "@/hooks/useHikes";
import { updateHike } from "@/lib/hikes";
import { HikeCard } from "@/components/hikes/HikeCard";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Hike } from "@/types";
import { Move } from "lucide-react";
import { useState } from "react";

export default function HikesPage() {
  const { hikes, loading } = useHikes();
  const { isOwner } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [repositionHike, setRepositionHike] = useState<Hike | null>(null);
  const [coverPatches, setCoverPatches] = useState<
    Record<string, { focalX: number; focalY: number }>
  >({});
  const [heightPatches, setHeightPatches] = useState<Record<string, number>>({});

  const repositionImageUrl = repositionHike
    ? (repositionHike.coverImageUrl ??
        repositionHike.mediaUrls.find((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i)) ??
        null)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-4xl font-bold">Hikes &amp; adventures</h1>
        {isOwner && !loading && (
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            className={isEditMode ? "bg-sage-600 hover:bg-sage-700" : ""}
            onClick={() => setIsEditMode((v) => !v)}
          >
            {isEditMode ? "Done" : "Edit layout"}
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mb-8">Adventures with Caia.</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : hikes.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No hikes logged yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hikes.map((hike) => {
            const coverPatch = coverPatches[hike.id];
            const heightPatch = heightPatches[hike.id];
            const displayHike: Hike = {
              ...hike,
              ...(coverPatch
                ? { coverFocalX: coverPatch.focalX, coverFocalY: coverPatch.focalY }
                : {}),
              ...(heightPatch !== undefined ? { coverHeightVh: heightPatch } : {}),
            };
            const thumbnail =
              hike.coverImageUrl ??
              hike.mediaUrls.find((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i));

            return (
              <div key={hike.id} className="space-y-1.5">
                <div className="relative">
                  <HikeCard hike={displayHike} href={`/hikes/${hike.id}`} />
                  {isOwner && thumbnail && (
                    <button
                      className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                      onClick={() => setRepositionHike(hike)}
                    >
                      <Move className="w-3 h-3" />
                      Cover
                    </button>
                  )}
                </div>
                {isOwner && isEditMode && thumbnail && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground shrink-0">S</span>
                    <input
                      type="range"
                      min={15}
                      max={80}
                      step={5}
                      value={heightPatch ?? hike.coverHeightVh ?? 30}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        setHeightPatches((prev) => ({ ...prev, [hike.id]: h }));
                      }}
                      onPointerUp={(e) => {
                        const h = Number((e.target as HTMLInputElement).value);
                        updateHike(hike.id, { coverHeightVh: h });
                      }}
                      onTouchEnd={(e) => {
                        const h = Number((e.target as HTMLInputElement).value);
                        updateHike(hike.id, { coverHeightVh: h });
                      }}
                      className="flex-1 accent-sage-600"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">L</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {repositionHike && repositionImageUrl && (
        <ImageRepositionSheet
          open={!!repositionHike}
          onOpenChange={(open) => {
            if (!open) setRepositionHike(null);
          }}
          imageUrl={repositionImageUrl}
          heightVh={heightPatches[repositionHike.id] ?? repositionHike.coverHeightVh ?? 30}
          focalX={coverPatches[repositionHike.id]?.focalX ?? repositionHike.coverFocalX ?? 50}
          focalY={coverPatches[repositionHike.id]?.focalY ?? repositionHike.coverFocalY ?? 50}
          onCommit={(x, y) => {
            updateHike(repositionHike.id, { coverFocalX: x, coverFocalY: y });
            setCoverPatches((prev) => ({
              ...prev,
              [repositionHike.id]: { focalX: x, focalY: y },
            }));
            setRepositionHike(null);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and manually verify `/hikes` loads**

```bash
npm run dev
```

Open http://localhost:3000/hikes — confirm the list renders hikes as cards with cover images, each card links to `/hikes/[id]`. Owner should see "Edit layout" button.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/hikes/page.tsx
git commit -m "feat: add public /hikes list page"
```

---

### Task 7: Build public /hikes/[id] detail page

**Files:**
- Create: `src/app/(public)/hikes/[id]/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/app/\(public\)/hikes/\[id\]
```

- [ ] **Step 2: Create `src/app/(public)/hikes/[id]/page.tsx`**

```tsx
"use client";

import { useHike } from "@/hooks/useHike";
import { updateHike } from "@/lib/hikes";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { HikeLightbox } from "@/components/hikes/HikeLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Move, Route } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

type MediaSettings = { focalX: number; focalY: number; heightVh: number };
type SettingsMap = Record<string, MediaSettings>;

const DEFAULT_SETTINGS: MediaSettings = { focalX: 50, focalY: 50, heightVh: 40 };

function isVideo(url: string): boolean {
  return /\.(mp4|mov|webm|avi)/i.test(url);
}

export default function HikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hike, loading } = useHike(id);
  const { isOwner } = useAuth();

  const [mediaSettings, setMediaSettings] = useState<SettingsMap>({});
  const [repositionUrl, setRepositionUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Hero cover controls
  const [coverPatch, setCoverPatch] = useState<{ focalX: number; focalY: number } | null>(null);
  const [coverHeightPatch, setCoverHeightPatch] = useState<number | undefined>(undefined);
  const [repositionCover, setRepositionCover] = useState(false);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const settingsRef = useRef<SettingsMap>({});
  settingsRef.current = mediaSettings;

  useEffect(() => {
    if (!hike) return;
    const init: SettingsMap = {};
    hike.mediaUrls.forEach((url) => {
      const s = hike.mediaSettings?.[url];
      init[url] = {
        focalX: s?.focalX ?? 50,
        focalY: s?.focalY ?? 50,
        heightVh: s?.heightVh ?? 40,
      };
    });
    setMediaSettings(init);
  }, [hike?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveMediaSettings(updated: SettingsMap) {
    await updateHike(id, { mediaSettings: updated });
  }

  function openLightbox(url: string) {
    const images = (hike?.mediaUrls ?? []).filter((u) => !isVideo(u));
    const idx = images.indexOf(url);
    setLightboxImages(images);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!hike) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Hike not found.</p>
        <Button asChild variant="outline">
          <Link href="/hikes">Back to hikes</Link>
        </Button>
      </div>
    );
  }

  const coverImage =
    hike.coverImageUrl ?? hike.mediaUrls.find((u) => !isVideo(u));
  const coverFocalX = coverPatch?.focalX ?? hike.coverFocalX ?? 50;
  const coverFocalY = coverPatch?.focalY ?? hike.coverFocalY ?? 50;
  const coverHeight = coverHeightPatch ?? hike.coverHeightVh ?? 50;

  const repositionSettings = repositionUrl
    ? (mediaSettings[repositionUrl] ?? DEFAULT_SETTINGS)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/hikes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All hikes
        </Link>
      </Button>

      {/* Hero */}
      {coverImage && (
        <div className="mb-8">
          <div
            className="relative rounded-3xl overflow-hidden bg-sage-100"
            style={{ height: `${coverHeight}vh` }}
          >
            <img
              src={coverImage}
              alt={hike.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: `${coverFocalX}% ${coverFocalY}%` }}
            />
            {isOwner && (
              <button
                className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                onClick={() => setRepositionCover(true)}
              >
                <Move className="w-3 h-3" />
                Reposition
              </button>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 px-1 mt-2">
              <span className="text-xs text-muted-foreground shrink-0">S</span>
              <input
                type="range"
                min={20}
                max={80}
                step={5}
                value={coverHeight}
                onChange={(e) => setCoverHeightPatch(Number(e.target.value))}
                onPointerUp={(e) =>
                  updateHike(id, {
                    coverHeightVh: Number((e.target as HTMLInputElement).value),
                  })
                }
                onTouchEnd={(e) =>
                  updateHike(id, {
                    coverHeightVh: Number((e.target as HTMLInputElement).value),
                  })
                }
                className="flex-1 accent-sage-600"
              />
              <span className="text-xs text-muted-foreground shrink-0">L</span>
            </div>
          )}
        </div>
      )}

      {/* Title + meta */}
      <h1 className="text-4xl font-bold mb-2">{hike.title}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        <time>{formatDate(hike.date)}</time>
        {hike.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {hike.location}
          </span>
        )}
        {hike.distance && (
          <span className="flex items-center gap-1">
            <Route className="h-3.5 w-3.5" />
            {hike.distance} km
          </span>
        )}
      </div>

      {/* Notes */}
      {hike.notes && (
        <blockquote className="border-l-4 border-sage-300 pl-4 text-muted-foreground italic mb-8">
          {hike.notes}
        </blockquote>
      )}

      {/* Gallery */}
      {hike.mediaUrls.length > 0 && (
        <div>
          {isOwner && (
            <div className="flex justify-end mb-3">
              <Button
                size="sm"
                variant={isEditMode ? "default" : "outline"}
                className={isEditMode ? "bg-sage-600 hover:bg-sage-700" : ""}
                onClick={() => setIsEditMode((v) => !v)}
              >
                {isEditMode ? "Done" : "Edit layout"}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hike.mediaUrls.map((url) => {
              const s = mediaSettings[url] ?? DEFAULT_SETTINGS;
              return (
                <div key={url} className="space-y-1.5">
                  <div
                    className="relative rounded-2xl overflow-hidden bg-sage-50"
                    style={{ height: `${s.heightVh}vh` }}
                  >
                    {isVideo(url) ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={hike.title}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        style={{ objectPosition: `${s.focalX}% ${s.focalY}%` }}
                        onClick={() => openLightbox(url)}
                      />
                    )}
                    {isOwner && !isVideo(url) && (
                      <button
                        className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                        onClick={() => setRepositionUrl(url)}
                      >
                        <Move className="w-3 h-3" />
                        Reposition
                      </button>
                    )}
                  </div>

                  {isOwner && isEditMode && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs text-muted-foreground shrink-0">S</span>
                      <input
                        type="range"
                        min={15}
                        max={80}
                        step={5}
                        value={s.heightVh}
                        onChange={(e) => {
                          const heightVh = Number(e.target.value);
                          setMediaSettings((prev) => ({
                            ...prev,
                            [url]: { ...(prev[url] ?? DEFAULT_SETTINGS), heightVh },
                          }));
                        }}
                        onPointerUp={(e) => {
                          const heightVh = Number(
                            (e.target as HTMLInputElement).value
                          );
                          const curr = settingsRef.current;
                          saveMediaSettings({
                            ...curr,
                            [url]: { ...(curr[url] ?? DEFAULT_SETTINGS), heightVh },
                          });
                        }}
                        onTouchEnd={(e) => {
                          const heightVh = Number(
                            (e.target as HTMLInputElement).value
                          );
                          const curr = settingsRef.current;
                          saveMediaSettings({
                            ...curr,
                            [url]: { ...(curr[url] ?? DEFAULT_SETTINGS), heightVh },
                          });
                        }}
                        className="flex-1 accent-sage-600"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">L</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gallery image reposition */}
      {repositionUrl && repositionSettings && (
        <ImageRepositionSheet
          open={!!repositionUrl}
          onOpenChange={(open) => {
            if (!open) setRepositionUrl(null);
          }}
          imageUrl={repositionUrl}
          heightVh={repositionSettings.heightVh}
          focalX={repositionSettings.focalX}
          focalY={repositionSettings.focalY}
          onCommit={(x, y) => {
            const curr = settingsRef.current;
            const updated = {
              ...curr,
              [repositionUrl]: {
                ...(curr[repositionUrl] ?? DEFAULT_SETTINGS),
                focalX: x,
                focalY: y,
              },
            };
            setMediaSettings(updated);
            saveMediaSettings(updated);
            setRepositionUrl(null);
          }}
        />
      )}

      {/* Cover reposition */}
      {coverImage && (
        <ImageRepositionSheet
          open={repositionCover}
          onOpenChange={(open) => {
            if (!open) setRepositionCover(false);
          }}
          imageUrl={coverImage}
          heightVh={coverHeight}
          focalX={coverFocalX}
          focalY={coverFocalY}
          onCommit={(x, y) => {
            updateHike(id, { coverFocalX: x, coverFocalY: y });
            setCoverPatch({ focalX: x, focalY: y });
            setRepositionCover(false);
          }}
        />
      )}

      {/* Lightbox */}
      <HikeLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify in browser**

Navigate to a hike detail page (e.g. http://localhost:3000/hikes/<some-id>).

Check:
- Hero image renders with correct focal point
- Title, date, location, and distance show below hero
- Notes render as an italic blockquote (only if non-empty)
- Gallery images render in a 2-column grid
- Clicking an image opens the lightbox
- Lightbox arrow buttons and keyboard arrows navigate between images
- Swiping left/right on mobile navigates images
- Image counter in top-right shows correct position (e.g. "2 / 5")
- Videos play inline and do NOT appear in the lightbox
- Owner sees "Edit layout", height sliders, and "Reposition" buttons

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/hikes/[id]/page.tsx"
git commit -m "feat: add public /hikes/[id] detail page with hero, gallery, and lightbox"
```

---

### Task 8: Add Hikes to Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Add Hikes link to `publicLinks` in `src/components/layout/Navbar.tsx`**

Replace:
```ts
const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tricks", label: "Tricks" },
  { href: "/gallery", label: "Gallery" },
];
```
with:
```ts
const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tricks", label: "Tricks" },
  { href: "/hikes", label: "Hikes" },
  { href: "/gallery", label: "Gallery" },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Open http://localhost:3000 — confirm "Hikes" appears in the desktop nav between "Tricks" and "Gallery". Open mobile nav (hamburger) and confirm "Hikes" appears there too. Click the link and confirm it goes to `/hikes`.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: add Hikes to public navigation"
```
