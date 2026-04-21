# Caia App – Plan 3: Logs, Hikes, Dashboard & User Invites

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build training logs, hike logs, a full activity-feed dashboard, and the owner's user invite system.

**Architecture:** Training logs and hikes follow the same Firestore + client-hook pattern established in Plan 2. The dashboard aggregates data from all three collections (tricks, trainingLogs, hikes) and shows an activity feed sorted by date. The invite system stores a `pendingInvites` collection; when a user with a matching email signs in, the AuthContext (updated here) assigns them the stored role automatically.

**Tech Stack:** Firebase Firestore, Firebase Storage (hike media), Next.js App Router, shadcn/ui, Tailwind

**Prerequisite:** Plans 1 and 2 must be complete. All types, Firebase exports, and auth context from those plans are assumed to exist.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/logs.ts` | Firestore CRUD for trainingLogs collection |
| `src/lib/hikes.ts` | Firestore CRUD for hikes collection |
| `src/lib/invites.ts` | Firestore CRUD for pendingInvites collection |
| `src/hooks/useLogs.ts` | React hook — loads all training logs |
| `src/hooks/useHikes.ts` | React hook — loads all hikes |
| `src/components/logs/LogForm.tsx` | Create/edit training log form |
| `src/components/logs/LogCard.tsx` | Card for a single training log |
| `src/components/hikes/HikeForm.tsx` | Create/edit hike form |
| `src/components/hikes/HikeCard.tsx` | Card for a single hike |
| `src/components/dashboard/ActivityFeed.tsx` | Merged activity feed from all collections |
| `src/app/dashboard/logs/page.tsx` | Dashboard training logs list |
| `src/app/dashboard/logs/new/page.tsx` | Create training log |
| `src/app/dashboard/logs/[id]/edit/page.tsx` | Edit training log |
| `src/app/dashboard/hikes/page.tsx` | Dashboard hikes list |
| `src/app/dashboard/hikes/new/page.tsx` | Create hike |
| `src/app/dashboard/hikes/[id]/edit/page.tsx` | Edit hike |
| `src/app/dashboard/settings/users/page.tsx` | Owner-only user invite management |
| `src/app/dashboard/page.tsx` | Full dashboard with stats + activity feed (replaces Plan 2 version) |
| `src/contexts/AuthContext.tsx` | Updated to check pendingInvites on sign-in |

---

## Task 1: Firestore Logs Library

**Files:**
- Create: `src/lib/logs.ts`

- [ ] **Step 1: Create src/lib/logs.ts**

```ts
import { db } from "@/lib/firebase";
import type { TrainingLog } from "@/types";
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

function fromFirestore(id: string, data: Record<string, unknown>): TrainingLog {
  return {
    ...(data as Omit<TrainingLog, "id" | "date" | "createdAt">),
    id,
    date: (data.date as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
    createdAt: (data.createdAt as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
  };
}

export async function getLogs(): Promise<TrainingLog[]> {
  const q = query(collection(db, "trainingLogs"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function createLog(
  data: Omit<TrainingLog, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "trainingLogs"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLog(
  id: string,
  data: Partial<Omit<TrainingLog, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "trainingLogs", id), data);
}

export async function deleteLog(id: string): Promise<void> {
  await deleteDoc(doc(db, "trainingLogs", id));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/logs.ts
git commit -m "feat: add Firestore training logs CRUD library"
```

---

## Task 2: Firestore Hikes Library

**Files:**
- Create: `src/lib/hikes.ts`

- [ ] **Step 1: Create src/lib/hikes.ts**

```ts
import { db } from "@/lib/firebase";
import type { Hike } from "@/types";
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

function fromFirestore(id: string, data: Record<string, unknown>): Hike {
  return {
    ...(data as Omit<Hike, "id" | "date" | "createdAt">),
    id,
    date: (data.date as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
    createdAt: (data.createdAt as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
  };
}

export async function getHikes(): Promise<Hike[]> {
  const q = query(collection(db, "hikes"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function createHike(
  data: Omit<Hike, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "hikes"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHike(
  id: string,
  data: Partial<Omit<Hike, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "hikes", id), data);
}

export async function deleteHike(id: string): Promise<void> {
  await deleteDoc(doc(db, "hikes", id));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hikes.ts
git commit -m "feat: add Firestore hikes CRUD library"
```

---

## Task 3: Firestore Invites Library & AuthContext Update

**Files:**
- Create: `src/lib/invites.ts`
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create src/lib/invites.ts**

```ts
import { db } from "@/lib/firebase";
import type { UserRole } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export interface PendingInvite {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export async function createInvite(email: string, role: UserRole): Promise<void> {
  await addDoc(collection(db, "pendingInvites"), {
    email: email.toLowerCase(),
    role,
    createdAt: new Date(),
  });
}

export async function getInvites(): Promise<PendingInvite[]> {
  const snap = await getDocs(collection(db, "pendingInvites"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PendingInvite, "id">),
  }));
}

export async function findInviteByEmail(email: string): Promise<PendingInvite | null> {
  const q = query(
    collection(db, "pendingInvites"),
    where("email", "==", email.toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<PendingInvite, "id">) };
}

export async function deleteInvite(id: string): Promise<void> {
  await deleteDoc(doc(db, "pendingInvites", id));
}
```

- [ ] **Step 2: Update src/contexts/AuthContext.tsx**

Replace the `fetchOrCreateUserDoc` function with a version that checks pending invites:

```tsx
"use client";

import { auth, db } from "@/lib/firebase";
import { findInviteByEmail, deleteInvite } from "@/lib/invites";
import type { AppUser } from "@/types";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isOwner: boolean;
  isFamily: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchOrCreateUserDoc(firebaseUser: User): Promise<AppUser> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as AppUser;
  }

  // Check if there is a pending invite for this email
  const email = firebaseUser.email ?? "";
  const invite = await findInviteByEmail(email);
  const role = invite?.role ?? "family";

  const newUser: AppUser = {
    uid: firebaseUser.uid,
    email,
    role,
    displayName: firebaseUser.displayName ?? undefined,
  };
  await setDoc(ref, newUser);

  // Consume the invite so it cannot be reused
  if (invite) {
    await deleteInvite(invite.id);
  }

  return newUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await fetchOrCreateUserDoc(firebaseUser);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
  }

  const isOwner = user?.role === "owner";
  const isFamily = user?.role === "family";
  const canEdit = isOwner || isFamily;

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, isOwner, isFamily, canEdit }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Update Firestore security rules**

Add `pendingInvites` rules to `firestore.rules` (replace the entire file):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }

    function canEdit() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'family'];
    }

    match /users/{uid} {
      allow read: if isAuthenticated() && request.auth.uid == uid;
      allow write: if isOwner();
      allow create: if isAuthenticated() && request.auth.uid == uid;
    }

    match /tricks/{trickId} {
      allow read: if true;
      allow create, update: if canEdit();
      allow delete: if isOwner();
    }

    match /trainingLogs/{logId} {
      allow read: if isAuthenticated();
      allow create, update: if canEdit();
      allow delete: if isOwner();
    }

    match /hikes/{hikeId} {
      allow read: if isAuthenticated();
      allow create, update: if canEdit();
      allow delete: if isOwner();
    }

    match /pendingInvites/{inviteId} {
      // Any authenticated user can read to check their own invite on sign-in
      allow read: if isAuthenticated();
      allow create, delete: if isOwner();
    }
  }
}
```

Deploy updated rules in Firebase Console → Firestore → Rules tab.

- [ ] **Step 4: Commit**

```bash
git add src/lib/invites.ts src/contexts/AuthContext.tsx firestore.rules
git commit -m "feat: add invite system and update auth context to consume invites on sign-in"
```

---

## Task 4: Data Hooks for Logs & Hikes

**Files:**
- Create: `src/hooks/useLogs.ts`
- Create: `src/hooks/useHikes.ts`

- [ ] **Step 1: Create src/hooks/useLogs.ts**

```ts
"use client";

import { getLogs } from "@/lib/logs";
import type { TrainingLog } from "@/types";
import { useEffect, useState } from "react";

export function useLogs() {
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch(() => setError("Failed to load logs"))
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    getLogs()
      .then(setLogs)
      .catch(() => setError("Failed to load logs"))
      .finally(() => setLoading(false));
  }

  return { logs, loading, error, refresh };
}
```

- [ ] **Step 2: Create src/hooks/useHikes.ts**

```ts
"use client";

import { getHikes } from "@/lib/hikes";
import type { Hike } from "@/types";
import { useEffect, useState } from "react";

export function useHikes() {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHikes()
      .then(setHikes)
      .catch(() => setError("Failed to load hikes"))
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    getHikes()
      .then(setHikes)
      .catch(() => setError("Failed to load hikes"))
      .finally(() => setLoading(false));
  }

  return { hikes, loading, error, refresh };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLogs.ts src/hooks/useHikes.ts
git commit -m "feat: add useLogs and useHikes hooks"
```

---

## Task 5: LogForm & LogCard Components

**Files:**
- Create: `src/components/logs/LogForm.tsx`
- Create: `src/components/logs/LogCard.tsx`

- [ ] **Step 1: Create src/components/logs/LogForm.tsx**

```tsx
"use client";

import type { TrainingLog, Trick } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { useTricks } from "@/hooks/useTricks";
import { format } from "date-fns";

interface Props {
  log?: TrainingLog;
  onSubmit: (data: Partial<TrainingLog>) => Promise<void>;
  submitLabel?: string;
}

export function LogForm({ log, onSubmit, submitLabel = "Save" }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(
    log ? format(log.date, "yyyy-MM-dd") : today
  );
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [tags, setTags] = useState<string[]>(log?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [relatedTricks, setRelatedTricks] = useState<string[]>(log?.relatedTricks ?? []);
  const [saving, setSaving] = useState(false);
  const { tricks } = useTricks();

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function toggleTrick(id: string) {
    setRelatedTricks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      date: new Date(date),
      notes,
      tags,
      relatedTricks,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Session notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you work on? How did it go?"
          rows={4}
          required
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 bg-sage-100 text-sage-700">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. obedience, agility…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="text-sm"
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Related tricks */}
      {tricks.length > 0 && (
        <div className="space-y-2">
          <Label>Related tricks</Label>
          <div className="flex flex-wrap gap-2">
            {tricks.map((trick) => (
              <button
                key={trick.id}
                type="button"
                onClick={() => toggleTrick(trick.id)}
              >
                <Badge
                  variant={relatedTricks.includes(trick.id) ? "default" : "outline"}
                  className={
                    relatedTricks.includes(trick.id)
                      ? "bg-sage-600 hover:bg-sage-700 cursor-pointer"
                      : "cursor-pointer"
                  }
                >
                  {trick.name}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" className="w-full bg-sage-600 hover:bg-sage-700" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create src/components/logs/LogCard.tsx**

```tsx
import type { TrainingLog, Trick } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Props {
  log: TrainingLog;
  tricks?: Trick[];
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export function LogCard({ log, tricks = [], showActions = false, onDelete }: Props) {
  const relatedTrickNames = log.relatedTricks
    .map((id) => tricks.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <time className="text-sm font-medium">{formatDate(log.date)}</time>
        {showActions && (
          <div className="flex gap-1 shrink-0">
            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
              <Link href={`/dashboard/logs/${log.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(log.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{log.notes}</p>
      <div className="flex flex-wrap gap-1.5">
        {log.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs bg-sage-50 text-sage-600">
            {tag}
          </Badge>
        ))}
        {relatedTrickNames.map((name) => (
          <Badge key={name} variant="outline" className="text-xs">
            {name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/logs/LogForm.tsx src/components/logs/LogCard.tsx
git commit -m "feat: add LogForm and LogCard components"
```

---

## Task 6: HikeForm & HikeCard Components

**Files:**
- Create: `src/components/hikes/HikeForm.tsx`
- Create: `src/components/hikes/HikeCard.tsx`

- [ ] **Step 1: Create src/components/hikes/HikeForm.tsx**

```tsx
"use client";

import type { Hike } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/tricks/MediaUploader";
import { useState } from "react";
import { format } from "date-fns";

interface Props {
  hike?: Hike;
  onSubmit: (data: Partial<Hike>) => Promise<void>;
  submitLabel?: string;
  hikeId?: string;
}

export function HikeForm({ hike, onSubmit, submitLabel = "Save", hikeId }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [title, setTitle] = useState(hike?.title ?? "");
  const [location, setLocation] = useState(hike?.location ?? "");
  const [distance, setDistance] = useState<string>(
    hike?.distance !== undefined ? String(hike.distance) : ""
  );
  const [date, setDate] = useState(hike ? format(hike.date, "yyyy-MM-dd") : today);
  const [notes, setNotes] = useState(hike?.notes ?? "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(hike?.mediaUrls ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      title,
      location,
      distance: distance ? parseFloat(distance) : undefined,
      date: new Date(date),
      notes,
      mediaUrls,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning walk at Nordmarka"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nordmarka"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distance">Distance (km)</Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            min="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="5.2"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was it? Any highlights?"
          rows={3}
        />
      </div>

      {hikeId && (
        <div className="space-y-2">
          <Label>Photos & videos</Label>
          <MediaUploader
            trickId={`hike-${hikeId}`}
            mediaUrls={mediaUrls}
            onUrlsChange={setMediaUrls}
          />
        </div>
      )}

      <Button type="submit" className="w-full bg-sage-600 hover:bg-sage-700" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create src/components/hikes/HikeCard.tsx**

```tsx
import type { Hike } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Props {
  hike: Hike;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export function HikeCard({ hike, showActions = false, onDelete }: Props) {
  const thumbnail = hike.mediaUrls[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
      {thumbnail && (
        <div className="aspect-video bg-sage-50 overflow-hidden">
          <img
            src={thumbnail}
            alt={hike.title}
            className="w-full h-full object-cover"
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
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/hikes/HikeForm.tsx src/components/hikes/HikeCard.tsx
git commit -m "feat: add HikeForm and HikeCard components"
```

---

## Task 7: Dashboard Training Logs Pages

**Files:**
- Create: `src/app/dashboard/logs/page.tsx`
- Create: `src/app/dashboard/logs/new/page.tsx`
- Create: `src/app/dashboard/logs/[id]/edit/page.tsx`

- [ ] **Step 1: Create src/app/dashboard/logs/page.tsx**

```tsx
"use client";

import { useLogs } from "@/hooks/useLogs";
import { useTricks } from "@/hooks/useTricks";
import { deleteLog } from "@/lib/logs";
import { useAuth } from "@/contexts/AuthContext";
import { LogCard } from "@/components/logs/LogCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardLogsPage() {
  const { logs, loading, refresh } = useLogs();
  const { tricks } = useTricks();
  const { isOwner, canEdit } = useAuth();

  async function handleDelete(id: string) {
    if (!confirm("Delete this log entry?")) return;
    try {
      await deleteLog(id);
      toast.success("Log deleted");
      refresh();
    } catch {
      toast.error("Failed to delete log");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Training logs</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700">
            <Link href="/dashboard/logs/new">
              <Plus className="mr-2 h-4 w-4" />
              New log
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No logs yet. Start tracking your training sessions!</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              tricks={tricks}
              showActions
              onDelete={isOwner ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/dashboard/logs/new/page.tsx**

```tsx
"use client";

import { LogForm } from "@/components/logs/LogForm";
import { createLog } from "@/lib/logs";
import { useAuth } from "@/contexts/AuthContext";
import type { TrainingLog } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewLogPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(data: Partial<TrainingLog>) {
    if (!user) return;
    try {
      await createLog({
        date: data.date ?? new Date(),
        notes: data.notes ?? "",
        tags: data.tags ?? [],
        relatedTricks: data.relatedTricks ?? [],
        createdBy: user.uid,
      });
      toast.success("Log entry saved");
      router.push("/dashboard/logs");
    } catch {
      toast.error("Failed to save log");
    }
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/logs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to logs
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">New training log</h1>
      <LogForm onSubmit={handleSubmit} submitLabel="Save log" />
    </div>
  );
}
```

- [ ] **Step 3: Create src/app/dashboard/logs/[id]/edit/page.tsx**

```tsx
"use client";

import { useLogs } from "@/hooks/useLogs";
import { updateLog } from "@/lib/logs";
import { LogForm } from "@/components/logs/LogForm";
import type { TrainingLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use } from "react";

export default function EditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { logs, loading } = useLogs();
  const log = logs.find((l) => l.id === id);
  const router = useRouter();

  async function handleSubmit(data: Partial<TrainingLog>) {
    try {
      await updateLog(id, data);
      toast.success("Log updated");
      router.push("/dashboard/logs");
    } catch {
      toast.error("Failed to update log");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Log not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/logs">Back to logs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/logs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to logs
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit log</h1>
      <LogForm log={log} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/logs/
git commit -m "feat: add dashboard training logs pages (list, create, edit)"
```

---

## Task 8: Dashboard Hikes Pages

**Files:**
- Create: `src/app/dashboard/hikes/page.tsx`
- Create: `src/app/dashboard/hikes/new/page.tsx`
- Create: `src/app/dashboard/hikes/[id]/edit/page.tsx`

- [ ] **Step 1: Create src/app/dashboard/hikes/page.tsx**

```tsx
"use client";

import { useHikes } from "@/hooks/useHikes";
import { deleteHike } from "@/lib/hikes";
import { useAuth } from "@/contexts/AuthContext";
import { HikeCard } from "@/components/hikes/HikeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardHikesPage() {
  const { hikes, loading, refresh } = useHikes();
  const { isOwner, canEdit } = useAuth();

  async function handleDelete(id: string) {
    if (!confirm("Delete this hike?")) return;
    try {
      await deleteHike(id);
      toast.success("Hike deleted");
      refresh();
    } catch {
      toast.error("Failed to delete hike");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Hikes & adventures</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700">
            <Link href="/dashboard/hikes/new">
              <Plus className="mr-2 h-4 w-4" />
              New hike
            </Link>
          </Button>
        )}
      </div>

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
          {hikes.map((hike) => (
            <HikeCard
              key={hike.id}
              hike={hike}
              showActions
              onDelete={isOwner ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/dashboard/hikes/new/page.tsx**

```tsx
"use client";

import { HikeForm } from "@/components/hikes/HikeForm";
import { createHike } from "@/lib/hikes";
import { useAuth } from "@/contexts/AuthContext";
import type { Hike } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewHikePage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(data: Partial<Hike>) {
    if (!user) return;
    try {
      const id = await createHike({
        title: data.title ?? "",
        location: data.location ?? "",
        distance: data.distance,
        date: data.date ?? new Date(),
        notes: data.notes ?? "",
        mediaUrls: [],
        createdBy: user.uid,
      });
      toast.success("Hike saved! You can now add photos.");
      router.push(`/dashboard/hikes/${id}/edit`);
    } catch {
      toast.error("Failed to save hike");
    }
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/hikes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to hikes
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Log a hike</h1>
      <HikeForm onSubmit={handleSubmit} submitLabel="Save hike" />
    </div>
  );
}
```

- [ ] **Step 3: Create src/app/dashboard/hikes/[id]/edit/page.tsx**

```tsx
"use client";

import { useHikes } from "@/hooks/useHikes";
import { updateHike } from "@/lib/hikes";
import { HikeForm } from "@/components/hikes/HikeForm";
import type { Hike } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use } from "react";

export default function EditHikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hikes, loading } = useHikes();
  const hike = hikes.find((h) => h.id === id);
  const router = useRouter();

  async function handleSubmit(data: Partial<Hike>) {
    try {
      await updateHike(id, data);
      toast.success("Hike updated");
      router.push("/dashboard/hikes");
    } catch {
      toast.error("Failed to update hike");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!hike) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Hike not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/hikes">Back to hikes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/hikes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to hikes
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit: {hike.title}</h1>
      <HikeForm hike={hike} onSubmit={handleSubmit} submitLabel="Save changes" hikeId={id} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/hikes/
git commit -m "feat: add dashboard hikes pages (list, create, edit)"
```

---

## Task 9: ActivityFeed Component

**Files:**
- Create: `src/components/dashboard/ActivityFeed.tsx`

- [ ] **Step 1: Create src/components/dashboard/ActivityFeed.tsx**

```tsx
import type { Hike, TrainingLog, Trick } from "@/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrickStatusBadge } from "@/components/tricks/TrickStatusBadge";
import { MapPin } from "lucide-react";
import Link from "next/link";

type ActivityItem =
  | { type: "trick"; date: Date; data: Trick }
  | { type: "log"; date: Date; data: TrainingLog }
  | { type: "hike"; date: Date; data: Hike };

interface Props {
  tricks: Trick[];
  logs: TrainingLog[];
  hikes: Hike[];
  limit?: number;
}

export function ActivityFeed({ tricks, logs, hikes, limit = 10 }: Props) {
  const items: ActivityItem[] = [
    ...tricks.map((t): ActivityItem => ({ type: "trick", date: t.createdAt, data: t })),
    ...logs.map((l): ActivityItem => ({ type: "log", date: l.date, data: l })),
    ...hikes.map((h): ActivityItem => ({ type: "hike", date: h.date, data: h })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-cream-200"
        >
          <div className="mt-0.5 text-xl shrink-0">
            {item.type === "trick" ? "🐾" : item.type === "log" ? "📓" : "🥾"}
          </div>
          <div className="flex-1 min-w-0">
            {item.type === "trick" && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/dashboard/tricks/${item.data.id}/edit`}
                    className="font-medium hover:text-sage-700 text-sm"
                  >
                    {item.data.name}
                  </Link>
                  <TrickStatusBadge status={item.data.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Trick added · {formatDate(item.date)}</p>
              </>
            )}
            {item.type === "log" && (
              <>
                <p className="text-sm font-medium">Training session</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.data.notes}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.data.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-sage-50 text-sage-600">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
              </>
            )}
            {item.type === "hike" && (
              <>
                <p className="text-sm font-medium">{item.data.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.data.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {item.data.location}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ActivityFeed.tsx
git commit -m "feat: add ActivityFeed component merging tricks, logs, and hikes"
```

---

## Task 10: Full Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx` (replaces Plan 2 version)

- [ ] **Step 1: Replace src/app/dashboard/page.tsx**

```tsx
"use client";

import { useTricks } from "@/hooks/useTricks";
import { useLogs } from "@/hooks/useLogs";
import { useHikes } from "@/hooks/useHikes";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TrickCard } from "@/components/tricks/TrickCard";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { tricks } = useTricks();
  const { logs } = useLogs();
  const { hikes } = useHikes();
  const { canEdit } = useAuth();

  const activeTricks = tricks.filter((t) => t.status !== "mastered");
  const masteredCount = tricks.filter((t) => t.status === "mastered").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700" size="sm">
            <Link href="/dashboard/tricks/new">
              <Plus className="mr-2 h-4 w-4" />
              New trick
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total tricks", value: tricks.length, href: "/dashboard/tricks" },
          { label: "Mastered", value: masteredCount, href: "/dashboard/tricks" },
          { label: "Training logs", value: logs.length, href: "/dashboard/logs" },
          { label: "Hikes", value: hikes.length, href: "/dashboard/hikes" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active tricks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">In progress</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/tricks">View all</Link>
            </Button>
          </div>
          {activeTricks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active tricks.</p>
          ) : (
            <div className="space-y-3">
              {activeTricks.slice(0, 3).map((trick) => (
                <TrickCard
                  key={trick.id}
                  trick={trick}
                  href={`/dashboard/tricks/${trick.id}/edit`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent activity</h2>
          <ActivityFeed tricks={tricks} logs={logs} hikes={hikes} limit={8} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: full dashboard with stats, active tricks, and activity feed"
```

---

## Task 11: User Invite Management (Owner Only)

**Files:**
- Create: `src/app/dashboard/settings/users/page.tsx`

- [ ] **Step 1: Create src/app/dashboard/settings/users/page.tsx**

```tsx
"use client";

import { createInvite, deleteInvite, getInvites, type PendingInvite } from "@/lib/invites";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UsersSettingsPage() {
  const { isOwner } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("family");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOwner) {
      router.push("/dashboard");
      return;
    }
    getInvites().then(setInvites);
  }, [isOwner, router]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createInvite(email, role);
      toast.success(`Invite created for ${email}`);
      setEmail("");
      const updated = await getInvites();
      setInvites(updated);
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string, inviteEmail: string) {
    if (!confirm(`Revoke invite for ${inviteEmail}?`)) return;
    try {
      await deleteInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  }

  if (!isOwner) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Invite family members by email. They will get the assigned role automatically when they sign in for the first time.
      </p>

      <form onSubmit={handleInvite} className="space-y-4 mb-10">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="family">Family (can create & edit)</SelectItem>
              <SelectItem value="owner">Owner (full access)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="bg-sage-600 hover:bg-sage-700" disabled={saving}>
          <UserPlus className="mr-2 h-4 w-4" />
          {saving ? "Creating…" : "Create invite"}
        </Button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Pending invites</h2>
      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending invites.</p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between bg-white rounded-2xl p-3 border border-cream-200 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium">{invite.email}</p>
                <Badge
                  variant="secondary"
                  className="text-xs mt-1 bg-sage-100 text-sage-700"
                >
                  {invite.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleRevoke(invite.id, invite.email)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Settings link to Navbar**

In `src/components/layout/Navbar.tsx`, update the `links` construction to add a settings link for owners:

```tsx
// Replace this block in Navbar.tsx:
const links = canEdit
  ? [...publicLinks, { href: "/dashboard", label: "Dashboard" }]
  : publicLinks;

// With this:
const { user, signOut, canEdit, isOwner } = useAuth();
const links = canEdit
  ? [
      ...publicLinks,
      { href: "/dashboard", label: "Dashboard" },
      ...(isOwner ? [{ href: "/dashboard/settings/users", label: "Users" }] : []),
    ]
  : publicLinks;
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/settings/users/page.tsx src/components/layout/Navbar.tsx
git commit -m "feat: add user invite management page for owner"
```

---

## Task 12: Update Firestore Rules for pendingInvites read

The Firestore rules for `pendingInvites` already allow any authenticated user to `read`. However, `findInviteByEmail` queries the collection with a `where` clause. This requires a Firestore composite index.

- [ ] **Step 1: Create the index**

In Firebase Console → Firestore → Indexes → Add index:
- Collection: `pendingInvites`
- Field 1: `email` (Ascending)
- Query scope: Collection

Or add it to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "pendingInvites",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 2: Commit**

```bash
git add firestore.indexes.json
git commit -m "chore: add Firestore index for pendingInvites email query"
```

---

## Self-Review Checklist

- [x] Training logs CRUD (create, list, edit, delete) — Tasks 1, 4, 7
- [x] Hike logs CRUD (create, list, edit, delete with media) — Tasks 2, 4, 8
- [x] Logs linked to tricks — Task 5 (LogForm)
- [x] Tags on training logs — Task 5 (LogForm)
- [x] Hike media upload (reuses MediaUploader) — Task 6 (HikeForm)
- [x] Activity feed merging all collections — Task 9
- [x] Full dashboard with stats + active tricks + activity — Task 10
- [x] Owner-only invite system — Task 11
- [x] Invite auto-consumed on user sign-in — Task 3 (AuthContext update)
- [x] Firestore index for invite query — Task 12
- [x] Owner-only delete across all entities — Tasks 7, 8
- [x] Navbar updated with Users link for owner — Task 11
