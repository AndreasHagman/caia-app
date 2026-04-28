# Hikes — Public Feature Design

**Date:** 2026-04-28  
**Status:** Approved

## Overview

Make the Hikes feature publicly accessible at `/hikes` and `/hikes/[id]` without requiring login. Mirrors the existing `/tricks` pattern but with a lightbox for full-screen image browsing. Owners get the same media-layout controls (focal point, height, cover image) as on tricks pages.

## Goals

- Any visitor (unauthenticated) can browse hikes at `/hikes` and view individual hikes at `/hikes/[id]`
- Owners can configure cover images, focal points, and image heights on hike pages
- Clicking a photo opens a full-screen lightbox with keyboard + swipe navigation
- Consistent look and feel with the rest of the site

## Data Model Changes

Extend `Hike` in `src/types/index.ts` with the same image-config fields `Trick` already has:

```ts
coverImageUrl?: string | null
coverHeightVh?: number
coverFocalX?: number
coverFocalY?: number
mediaSettings?: Record<string, { focalX?: number; focalY?: number; heightVh?: number }>
```

Existing Firestore documents require no migration — all new fields fall back to safe defaults (`focalX: 50`, `focalY: 50`, `heightVh: 40`).

## Firestore Rules

Change the `hikes` collection read rule from `isAuthenticated()` to `true` so unauthenticated users can read hikes.

```
match /hikes/{hikeId} {
  allow read: if true;          // was: if isAuthenticated()
  allow create, update: if canEdit();
  allow delete: if isOwner();
}
```

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useHike.ts` | Fetches a single hike by ID (mirrors `useTrick`) |
| `src/app/(public)/hikes/page.tsx` | Public list page |
| `src/app/(public)/hikes/[id]/page.tsx` | Public detail page |
| `src/components/hikes/HikeLightbox.tsx` | Lightbox component |

## Changed Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Extend `Hike` type with image-config fields |
| `src/lib/hikes.ts` | Add `getHike(id)` function (uses `getDoc`, mirrors `getTrick`) |
| `src/components/hikes/HikeCard.tsx` | Cover image + focal point rendering; card wraps in `Link` to `/hikes/[id]` on public pages (prop `href?`) |
| `src/components/layout/Navbar.tsx` | Add "Hikes" to `publicLinks` |
| `firestore.rules` | `hikes` read: `isAuthenticated()` → `true` |

## Page Designs

### `/hikes` — List Page

- Matches the structure of `/tricks`
- Grid of `HikeCard` components with cover image support (focal point, configurable height)
- Owner gets "Edit layout" button: reveals per-card height sliders and reposition controls
- No filter pills (hikes have no status enum)

### `/hikes/[id]` — Detail Page

**Hero section:**
- Full-width cover image with focal point and height configurable by owner
- Reposition button (owner only) via `ImageRepositionSheet`
- Title, date, location (with `MapPin` icon), and distance (with `Route` icon) displayed below the hero

**Notes section:**
- Rendered only when `hike.notes` is non-empty
- Styled as a subtle quote/body block

**Media gallery:**
- Grid of all `mediaUrls` with per-image focal point and height settings (same as trick detail)
- Owner gets "Edit layout" button, height sliders, and reposition controls
- Clicking any image opens `HikeLightbox`
- Videos play inline (no lightbox for video)

### `HikeLightbox` Component

Built on `@radix-ui/react-dialog` (already in the project).

- Full-screen dark overlay
- Displays one image at a time, centered and `object-contain`
- Navigation: left/right arrow buttons + keyboard `ArrowLeft`/`ArrowRight`/`Escape`
- Swipe support on mobile via `touchstart`/`touchend` events (threshold: 50 px)
- Image counter: `"3 / 7"` in top-right corner
- Videos are excluded from lightbox (they play inline in the grid)

## `useHike` Hook

```ts
// src/hooks/useHike.ts
// Fetches a single hike document by ID from Firestore.
// Returns { hike, loading, error } — same shape as useTrick.
```

Calls `getHike(id)` from `src/lib/hikes.ts`. No real-time subscription needed (consistent with `useTrick`).

## Navbar

Add `{ href: "/hikes", label: "Hikes" }` to the `publicLinks` array in `Navbar.tsx`, between "Tricks" and "Gallery".

## Out of Scope

- Lightbox for videos (videos play inline)
- Filtering/sorting hikes by location, distance, or date on the list page
- Adding a cover image selector UI in the edit form (the cover is derived from `mediaUrls[0]` unless `coverImageUrl` is explicitly set, matching how tricks work)
