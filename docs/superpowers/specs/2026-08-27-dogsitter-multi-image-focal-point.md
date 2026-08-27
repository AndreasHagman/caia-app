# Dog Sitter Multi-Image & Focal Point Support

**Date:** 2026-08-27  
**Status:** Approved  
**Feature:** Add support for 2 images per section with independent focal point adjustment

## Overview

Enhance the dog sitter page to support up to 2 images per section (instead of 1) and add focal point adjustment for each image. Images will display side-by-side in the card view, and each image can be repositioned independently using a drag interface similar to the About page.

## Purpose

Allow dog sitters to see multiple relevant images per section (e.g., Caia eating from two different angles, or on two different walks) while giving owners precise control over how each image is cropped within the card display.

## Data Model Changes

### New ImageData Interface

```typescript
export interface ImageData {
  url: string;
  focalX: number;  // 0-100, default 50
  focalY: number;  // 0-100, default 50
}
```

### Updated SectionData Interface

**Before:**
```typescript
export interface SectionData {
  title: string;
  content: string;
  imageUrl: string | null;
}
```

**After:**
```typescript
export interface SectionData {
  title: string;
  content: string;
  images: ImageData[];  // 0-2 images allowed
}
```

### Migration Strategy

**Backward Compatibility:**

The old `imageUrl` field remains in Firestore documents but is no longer used by the application. Migration happens at read-time in `getDogSitterSettings()`:

1. Check if section has `images` array field
2. If yes: use it directly
3. If no: check for old `imageUrl` field and migrate:
   - `imageUrl: "https://..."` → `images: [{ url: "...", focalX: 50, focalY: 50 }]`
   - `imageUrl: null` or missing → `images: []`
4. Return migrated data (original Firestore document unchanged)

**Default Values:**
- New sections: `images: []`
- Migrated images: `focalX: 50, focalY: 50` (centered)
- All other fields: unchanged from current defaults

### Storage Paths

**Current:**
- Single image: `dogsitter/{sectionKey}.jpg`

**New:**
- First image: `dogsitter/{sectionKey}-1.jpg`
- Second image: `dogsitter/{sectionKey}-2.jpg`

The old path (`dogsitter/{sectionKey}.jpg`) is no longer written to, but existing files remain in storage (can be manually cleaned up later).

## UI Components

### SectionCard (Updated)

**Display Logic:**
- **0 images:** No image area shown (current empty behavior)
- **1 image:** Single image at top, full width, h-48, using its focal point
- **2 images:** Side-by-side layout with gap-2, each 50% width, h-48, each using its own focal point

**Layout Example (2 images):**
```tsx
<div className="grid grid-cols-2 gap-2 h-48">
  <img style={{ objectPosition: `${image1.focalX}% ${image1.focalY}%` }} />
  <img style={{ objectPosition: `${image2.focalX}% ${image2.focalY}%` }} />
</div>
```

**Props Changes:**
- No changes to component interface
- `data.images` array replaces `data.imageUrl` internally

### SectionEditor (Updated)

**Image Section Layout:**

Shows 2 image slots:

```
┌─────────────────────┬─────────────────────┐
│  Image 1 Slot       │  Image 2 Slot       │
│  [preview if exists]│  [preview if exists]│
│  [Upload] button    │  [Upload] button    │
│  [Reposition] btn   │  [Reposition] btn   │
│  [Remove X] btn     │  [Remove X] btn     │
└─────────────────────┴─────────────────────┘
```

**Per-Slot UI:**
- If image exists:
  - Show preview (h-32, object-cover with current focal point)
  - "Reposition" button
  - "Remove" button (X icon in top-right)
  - "Change Image" button (replaces current image)
- If slot empty:
  - Placeholder box (h-32, bg-sage-100)
  - "Upload Image" button centered

**Max Images Enforcement:**
- When 2 images exist, disable "Upload" on both slots
- Only "Change Image" (replace) is available
- Or remove one image to free a slot

**State Management:**
```typescript
const [images, setImages] = useState<ImageData[]>(initialData.images);
const [repositioningIndex, setRepositioningIndex] = useState<number | null>(null);
```

### ImageRepositionSheet (Reused)

Reuse the existing `ImageRepositionSheet` component from the About page:

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;           // images[N].url
  heightVh: number;           // 24 (h-48 = 12rem = ~24vh at 1080p)
  focalX: number;            // images[N].focalX
  focalY: number;            // images[N].focalY
  onCommit: (x: number, y: number) => void;  // update images[N]
}
```

**Integration:**
- Owner clicks "Reposition" on image slot N
- Set `repositioningIndex = N`
- Open sheet with `images[N]` data
- On "Done", update `images[N].focalX` and `images[N].focalY`
- Close sheet

No changes needed to `ImageRepositionSheet` itself.

## Data Flow

### Page Load & Migration

1. `DogSitterPage` calls `getDogSitterSettings()`
2. Library function checks each section:
   ```typescript
   if (data.images) {
     return data.images;
   } else if (data.imageUrl) {
     return [{ url: data.imageUrl, focalX: 50, focalY: 50 }];
   } else {
     return [];
   }
   ```
3. Returns `DogSitterSettings` with `images` arrays
4. Page renders `SectionCard` components with new data

### Image Upload Flow

1. Owner clicks "Upload Image" in slot N (0 or 1)
2. File picker → select image
3. HEIC conversion if needed (existing logic)
4. Compression (existing logic)
5. Upload to Firebase Storage at `dogsitter/{sectionKey}-{N+1}.jpg`
6. Get download URL
7. Create `ImageData`: `{ url, focalX: 50, focalY: 50 }`
8. Add to local `images` array at index N
9. Update preview in editor

### Focal Point Adjustment Flow

1. Owner clicks "Reposition" on image slot N
2. `setRepositioningIndex(N)`
3. Open `ImageRepositionSheet` with:
   - `imageUrl={images[N].url}`
   - `focalX={images[N].focalX}`
   - `focalY={images[N].focalY}`
   - `heightVh={24}` (matches h-48 card display)
4. Owner drags image in sheet to adjust position
5. On "Done":
   ```typescript
   const updated = [...images];
   updated[N] = { ...updated[N], focalX: newX, focalY: newY };
   setImages(updated);
   ```
6. Close sheet, set `repositioningIndex(null)`
7. Preview updates immediately with new focal point

### Image Remove Flow

1. Owner clicks "Remove" (X) on image slot N
2. Confirm or directly remove from local state:
   ```typescript
   const updated = images.filter((_, i) => i !== N);
   setImages(updated);
   ```
3. Optionally delete from Storage (or skip for rollback capability)

### Save Flow

1. Owner clicks "Save Changes" in editor
2. If any images were uploaded/changed, uploads are already complete
3. Call `updateSection(sectionKey, { title, content, images })`
4. Firestore merges update into `settings/dogsitter` document
5. Call `onSave()` callback → parent page calls `loadSettings()`
6. `SectionCard` re-renders with updated images and focal points

### Cancel Flow

1. Owner clicks "Cancel"
2. Discard local `images` state
3. Close dialog
4. Reset form state to `initialData.images` on next open

## Error Handling

### Upload Errors

- If image upload fails: show toast error, keep dialog open, allow retry
- If Firestore save fails: show toast error, keep dialog open with user's changes

### Migration Errors

- If old `imageUrl` is malformed: default to `images: []`
- If Firestore read fails: show error on page (existing error handling)

### Display Errors

- If image URL fails to load (404, network error): show bg-sage-100 placeholder
- Browser will handle broken image gracefully with alt text

### Validation

- Maximum 2 images: enforced in UI (disable upload when `images.length === 2`)
- Focal points: clamped to 0-100 in `ImageRepositionSheet` (existing logic)
- No minimum images: 0 images is valid

## Testing Checklist

### Data Migration

- [ ] Existing section with old `imageUrl: "https://..."` displays as single image with centered focal point
- [ ] Existing section with `imageUrl: null` displays as empty (no images)
- [ ] New section starts with `images: []`
- [ ] Migrated focal points default to 50/50

### Image Upload

- [ ] Upload first image → appears in slot 1
- [ ] Upload second image → appears in slot 2
- [ ] Upload buttons disabled when 2 images exist
- [ ] HEIC images convert correctly
- [ ] Compression reduces file size
- [ ] Upload progress shows during save

### Focal Point Adjustment

- [ ] Click "Reposition" on image 1 → opens sheet with correct image
- [ ] Drag to adjust → live preview updates
- [ ] Click "Done" → focal point saved to local state
- [ ] Click "Reposition" on image 2 → independent adjustment works
- [ ] Both images display with different focal points correctly
- [ ] Save changes → focal points persist after page reload

### Display Testing

- [ ] 0 images: No image area in card
- [ ] 1 image: Single full-width image at top, focal point applied
- [ ] 2 images: Side-by-side, equal width, gap between, both focal points applied
- [ ] Focal point adjustments visible: off-center crops work correctly
- [ ] Mobile: side-by-side layout still works (may be narrow but acceptable)

### Remove Testing

- [ ] Remove first image when 2 exist → second becomes first (array shift)
- [ ] Remove second image when 2 exist → first remains
- [ ] Remove only image → returns to empty state
- [ ] Save after removal → Firestore updates correctly

### Save/Cancel Testing

- [ ] Upload images and save → persists correctly
- [ ] Adjust focal points and save → persists correctly
- [ ] Make changes and cancel → reverts to original
- [ ] Switch sections in editor → state resets properly (no stale data)

### Error Handling

- [ ] Network failure during upload → shows error, allows retry
- [ ] Network failure during save → shows error, keeps dialog open
- [ ] Broken image URL → shows placeholder background

## Implementation Files

### Modified Files

1. **src/lib/dogsitter.ts**
   - Add `ImageData` interface
   - Update `SectionData` interface
   - Update `DEFAULT_SETTINGS` with `images: []`
   - Add migration logic in `getDogSitterSettings()`
   - Update `updateSection()` signature (already supports `Partial<SectionData>`)

2. **src/components/dogsitter/SectionCard.tsx**
   - Update display logic to handle `data.images` array
   - Render 0/1/2 images appropriately
   - Apply focal points: `style={{ objectPosition: \`${img.focalX}% ${img.focalY}%\` }}`

3. **src/components/dogsitter/SectionEditor.tsx**
   - Update state to manage `images` array
   - Add image upload logic for multiple slots
   - Add "Reposition" button per image slot
   - Integrate `ImageRepositionSheet` with `repositioningIndex` state
   - Update save logic to save `images` array

### New Files

None - reuse existing `ImageRepositionSheet` from About page.

## Visual Design

### Card Display (2 Images)

```
┌───────────────────────────────────────┐
│  ┌────────────┐  ┌────────────┐       │
│  │   Image 1  │  │   Image 2  │  Edit │
│  │  (focal pt)│  │  (focal pt)│       │
│  └────────────┘  └────────────┘       │
├───────────────────────────────────────┤
│  Section Title                        │
│  Content text here...                 │
└───────────────────────────────────────┘
```

### Editor Dialog (2 Images)

```
┌─────────────────────────────────────────┐
│  Edit Section Title                     │
├─────────────────────────────────────────┤
│  Section Title: [input field]           │
│  Content: [textarea]                    │
│                                         │
│  Images:                                │
│  ┌─────────────┐   ┌─────────────┐    │
│  │ [preview 1] │   │ [preview 2] │    │
│  │   X         │   │   X         │    │
│  │ [Reposition]│   │ [Reposition]│    │
│  │ [Change Img]│   │ [Upload Img]│    │
│  └─────────────┘   └─────────────┘    │
│                                         │
│  [Cancel]  [Save Changes]              │
└─────────────────────────────────────────┘
```

## Backward Compatibility

- **Firestore:** Old `imageUrl` field remains in documents (no data loss)
- **Storage:** Old image files at `dogsitter/{sectionKey}.jpg` remain (can be cleaned up manually later)
- **Code:** Migration happens transparently at read-time
- **UI:** Users see existing images immediately in new format

## Future Enhancements (Out of Scope)

- Support for 3+ images
- Image captions per image
- Drag-to-reorder images
- Bulk focal point adjustment across all sections
- Image aspect ratio preservation options

## Performance Considerations

- Migration overhead: ~1ms per section (negligible)
- Two images per section: slightly more bandwidth, but acceptable (compressed JPEGs)
- Storage paths: clean suffix pattern, no collisions
- Firestore document size: minimal increase (2 images vs 1)

## Security

- Firebase Storage rules already cover `dogsitter/` path with public read, authenticated write
- New suffixed paths (`-1.jpg`, `-2.jpg`) covered by existing wildcard rule: `dogsitter/{allPaths=**}`
- No additional security changes needed
