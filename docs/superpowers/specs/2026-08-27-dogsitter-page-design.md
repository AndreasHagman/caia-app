# Dog Sitter Information Page Design

**Date:** 2026-08-27  
**Status:** Approved  
**URL:** `/dogsitter`  
**Navigation Label:** "Hundepass"

## Overview

A public, owner-editable page that provides dog sitters with practical information about Caia. The page contains seven sections covering feeding, walks, treats, training, behavior, health, and emergency contacts. Each section can have custom text content and an optional image uploaded by the owner.

## Purpose

To give dog sitters easy access to all the information they need to care for Caia - everything from meal amounts and walk duration to training commands and emergency contacts. Owners can update this information through an intuitive UI without touching code.

## Architecture & Data Model

### Firestore Structure

Single document at `settings/dogsitter`:

```typescript
{
  feeding: {
    title: string,           // e.g., "Feeding"
    content: string,         // Multiline text with meal details
    imageUrl: string | null  // Firebase Storage URL or null
  },
  walks: {
    title: string,           // e.g., "Walks & Exercise"
    content: string,
    imageUrl: string | null
  },
  treats: {
    title: string,           // e.g., "Treats & Rewards"
    content: string,
    imageUrl: string | null
  },
  training: {
    title: string,           // e.g., "Training"
    content: string,
    imageUrl: string | null
  },
  behavior: {
    title: string,           // e.g., "Behavior & Personality"
    content: string,
    imageUrl: string | null
  },
  health: {
    title: string,           // e.g., "Health & Care"
    content: string,
    imageUrl: string | null
  },
  emergency: {
    title: string,           // e.g., "Emergency Contacts"
    content: string,
    imageUrl: string | null
  }
}
```

### File Structure

```
src/
  app/
    (public)/
      dogsitter/
        page.tsx              # Main page component
  lib/
    dogsitter.ts              # Firestore CRUD functions
  components/
    dogsitter/
      SectionCard.tsx         # Display component for each section
      SectionEditor.tsx       # Modal editor (text + image upload)
```

### TypeScript Types

```typescript
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
```

## Page Layout & Components

### Main Page (`page.tsx`)

- Page title: "Dog Sitter Guide" or "Hundepass"
- Responsive grid layout:
  - Mobile: 1 column
  - Tablet/Desktop: 2 columns
- Renders 7 `SectionCard` components in order: feeding, walks, treats, training, behavior, health, emergency

### SectionCard Component

**Props:**
- `sectionKey: SectionKey`
- `data: SectionData`
- `onEdit: () => void`
- `isOwner: boolean`

**Layout:**
- Card container (consistent with existing About page styling)
- Optional image at top (if `imageUrl` exists)
- Section title (h3)
- Content text (preserves line breaks)
- Edit button (top-right corner, only visible if `isOwner`)
- Empty state: If no content, show placeholder text "Click edit to add information"

### SectionEditor Component

**Props:**
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `sectionKey: SectionKey`
- `initialData: SectionData`
- `onSave: (data: SectionData) => void`

**Layout:**
Dialog/modal containing:
- Text input for title (controlled, pre-filled)
- Textarea for content (multiline, controlled, pre-filled)
- Image upload section:
  - Current image preview (if exists)
  - "Upload Image" / "Change Image" button
  - "Remove Image" button (if image exists)
- Action buttons:
  - "Cancel" (close without saving)
  - "Save" (validate, upload image if changed, update Firestore, close)

**Image Upload Flow:**
- Reuse image cropping/compression logic from `AboutImageEditor`
- Upload to Firebase Storage at path: `dogsitter/{sectionKey}.jpg`
- Generate download URL and include in saved data

## Data Flow

### Initial Load

1. Page component calls `getDogSitterSettings()` on mount
2. If document doesn't exist, initialize with default structure:
   - All sections have default titles
   - All `content` fields are empty strings
   - All `imageUrl` fields are null
3. Store settings in component state
4. Render 7 SectionCards

### Edit Flow

1. User clicks edit button on SectionCard
2. SectionEditor dialog opens with pre-filled data
3. User modifies title, content, and/or image
4. User clicks Save:
   - If image changed: Upload to `dogsitter/{sectionKey}.jpg`, get URL
   - Call `updateSection(sectionKey, { title, content, imageUrl })`
   - Update local state with new data
   - Close dialog
   - SectionCard re-renders with updated content
5. If user clicks Cancel: Close dialog without changes

### Image Removal Flow

1. In SectionEditor, user clicks "Remove Image"
2. Set imageUrl to null in form state
3. On Save: Update Firestore with `imageUrl: null`
4. Optionally: Delete image from Storage (or leave for potential reuse)

## Library Functions (`src/lib/dogsitter.ts`)

```typescript
// Fetch all dog sitter settings
export async function getDogSitterSettings(): Promise<DogSitterSettings>

// Update a specific section
export async function updateSection(
  sectionKey: SectionKey,
  data: Partial<SectionData>
): Promise<void>
```

**Implementation Notes:**
- Follow pattern from `src/lib/about.ts`
- Use `merge: true` when updating to preserve other sections
- Return sensible defaults if document doesn't exist

## Error Handling & Edge Cases

### Loading States

- Show skeleton/loading UI while fetching initial data
- Disable Save button in editor while uploading/saving
- Show loading spinner during image upload

### Error Scenarios

- **Firestore read fails:** Show error message with retry button
- **Image upload fails:** Show toast notification, keep dialog open, allow retry
- **Firestore write fails:** Show toast notification, keep dialog open with user's changes intact

### Empty States

- Section with no content: Show placeholder "Click edit to add information"
- Section with no image: Don't render image container, just show title and content
- Entire page empty: All sections show placeholders (normal initial state)

### Image Handling

- Compress and crop images before upload (reuse existing logic)
- Store at predictable paths: `dogsitter/feeding.jpg`, `dogsitter/walks.jpg`, etc.
- Handle HEIC conversion if needed (existing infrastructure supports this)
- When removing image: Set imageUrl to null, optionally delete from Storage

### Validation

- No strict validation required
- Allow empty content (owner can skip irrelevant sections)
- Allow any length content (UI should handle long text gracefully with scrolling if needed)

## Navigation & Access

### Navigation

- Add to `publicLinks` array in `Navbar.tsx`:
  ```typescript
  { href: "/dogsitter", label: "Hundepass" }
  ```
- Position after "Hikes" in menu order
- Appears in both desktop and mobile navigation

### Access Control

- **View:** Public - anyone can view the page
- **Edit:** Owner-only - edit buttons only visible when `isOwner === true`
- Content is public (contains emergency contacts and care info intended for dog sitters)

## Visual Design

### Design System

- Follow existing cream/sage color scheme
- Use rounded cards (rounded-3xl) consistent with About page
- Consistent spacing and typography with rest of the app
- Use existing shadcn components (Card, Button, Dialog, Input, Textarea)

### Responsive Behavior

- Mobile: Single column, full-width cards
- Tablet/Desktop: 2-column grid with gap
- Images scale responsively within cards
- Edit buttons accessible on touch devices

## Testing Strategy

### Manual Testing Checklist

1. **Initial load:**
   - Page loads without errors
   - All 7 sections render (even if empty)
   - Grid layout responsive across screen sizes

2. **Edit flow (as owner):**
   - Click edit button opens dialog
   - Form pre-fills with existing data
   - Can modify title and content
   - Can upload new image (crop, compress, save)
   - Can remove existing image
   - Save updates Firestore and UI immediately
   - Cancel closes without changes

3. **Image handling:**
   - Upload JPG, PNG, HEIC images
   - Cropping tool works
   - Compression reduces file size
   - Image displays correctly in card
   - Remove image clears imageUrl

4. **Access control:**
   - As non-owner: Edit buttons hidden
   - As owner: Edit buttons visible

5. **Empty states:**
   - Sections without content show placeholder
   - Sections without images don't show broken image

6. **Mobile:**
   - Touch interactions work (edit button, dialog)
   - Grid collapses to single column
   - Text readable, images scale properly

7. **Error handling:**
   - Network failure shows error message
   - Failed upload shows toast, allows retry

## Default Section Titles

When initializing the document for the first time, use these default titles:

- `feeding`: "Feeding"
- `walks`: "Walks & Exercise"
- `treats`: "Treats & Rewards"
- `training`: "Training"
- `behavior`: "Behavior & Personality"
- `health`: "Health & Care"
- `emergency`: "Emergency Contacts"

Content and imageUrl start as empty string and null respectively.

## Future Enhancements (Out of Scope)

- Rich text editor for content formatting
- Multiple images per section
- Printable PDF export of care guide
- Checklist items within sections
- Version history / audit log

These are not part of this initial implementation.
