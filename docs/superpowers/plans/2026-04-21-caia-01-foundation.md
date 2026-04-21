# Caia App – Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Next.js project with Firebase, authentication, role system, and all public-facing pages.

**Architecture:** Next.js 15 App Router with TypeScript. Firebase Auth handles login; user roles (`owner` | `family`) are stored in Firestore's `users` collection and loaded into a React context. Public routes are fully open; `/dashboard/*` redirects unauthenticated users to `/login`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v3, shadcn/ui, Firebase v11 (Auth + Firestore + Storage), Vercel

---

## File Map

| File | Responsibility |
|------|---------------|
| `.env.local.example` | Template with all required env vars |
| `src/lib/firebase.ts` | Firebase app init, exports `auth`, `db`, `storage` |
| `src/lib/utils.ts` | `cn()` helper, `calculateAge()`, `calculateProgress()` |
| `src/types/index.ts` | All shared TypeScript types |
| `src/contexts/AuthContext.tsx` | Firebase auth state + Firestore role, provides `useAuth()` |
| `src/app/layout.tsx` | Root layout with `AuthProvider`, fonts |
| `src/app/(public)/layout.tsx` | Shared shell for public pages (Navbar + Footer) |
| `src/app/(public)/page.tsx` | Landing page (`/`) |
| `src/app/(public)/about/page.tsx` | About Caia page |
| `src/app/(public)/tricks/page.tsx` | Public tricks list (stub — full impl in Plan 2) |
| `src/app/(public)/gallery/page.tsx` | Gallery stub |
| `src/app/login/page.tsx` | Login page (email/password) |
| `src/app/dashboard/layout.tsx` | Auth guard — redirects to `/login` if not authenticated |
| `src/app/dashboard/page.tsx` | Dashboard stub |
| `src/components/layout/Navbar.tsx` | Top nav, mobile-responsive |
| `src/components/layout/Footer.tsx` | Minimal footer |
| `src/components/auth/AuthProvider.tsx` | Re-export of context provider |
| `tailwind.config.ts` | Custom color palette (cream, sage) |

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: project root (all scaffold files)

- [ ] **Step 1: Scaffold project**

Run from `C:/Dev/HomemadeApplications/`:
```bash
npx create-next-app@latest caia-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```
Answer prompts: all defaults.

- [ ] **Step 2: Enter project and install Firebase**

```bash
cd caia-app
npm install firebase
```

Expected output: `added X packages`

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 4: Add shadcn components**

```bash
npx shadcn@latest add button card badge dialog form input label textarea progress tabs avatar sheet skeleton sonner separator
```

- [ ] **Step 5: Install date-fns**

```bash
npm install date-fns
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready - started server on http://localhost:3000`

Stop the server (`Ctrl+C`).

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 15 project with shadcn/ui and Firebase"
```

---

## Task 2: Configure Tailwind with Custom Palette

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update tailwind.config.ts**

Replace the entire file content with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFCFA",
          100: "#FAF8F5",
          200: "#F5F0E8",
        },
        sage: {
          50: "#F2F5F0",
          100: "#E4EBE0",
          200: "#C8D9C2",
          500: "#7A9E7E",
          600: "#5F8663",
          700: "#4A6B4E",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 2: Update globals.css**

Replace the `:root` block in `src/app/globals.css` to set background to cream:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 40 33% 98%;
    --foreground: 30 10% 15%;
    --card: 0 0% 100%;
    --card-foreground: 30 10% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 30 10% 15%;
    --primary: 128 14% 47%;
    --primary-foreground: 0 0% 100%;
    --secondary: 40 20% 94%;
    --secondary-foreground: 30 10% 25%;
    --muted: 40 15% 93%;
    --muted-foreground: 30 8% 46%;
    --accent: 128 14% 91%;
    --accent-foreground: 128 14% 30%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 40 15% 88%;
    --input: 40 15% 88%;
    --ring: 128 14% 47%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-cream-100 text-foreground;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "style: configure cream/sage color palette"
```

---

## Task 3: Environment Variables & Firebase Config

**Files:**
- Create: `.env.local.example`
- Create: `src/lib/firebase.ts`

- [ ] **Step 1: Create .env.local.example**

```bash
# .env.local.example
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Create the file at `.env.local.example` with the content above.

Copy it to `.env.local` and fill in values from Firebase Console → Project Settings → Your apps.

- [ ] **Step 2: Add .env.local to .gitignore**

Verify `.gitignore` already contains `.env.local` (it does by default in Next.js). If not, add it:

```
.env.local
```

- [ ] **Step 3: Create src/lib/firebase.ts**

```ts
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

- [ ] **Step 4: Commit**

```bash
git add .env.local.example src/lib/firebase.ts
git commit -m "feat: add Firebase config and env template"
```

---

## Task 4: Shared Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create src/types/index.ts**

```ts
export type UserRole = "owner" | "family";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
}

export type TrickStatus = "not_started" | "learning" | "almost" | "mastered";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface Trick {
  id: string;
  name: string;
  description: string;
  status: TrickStatus;
  checklist: ChecklistItem[];
  progress: number;
  progressOverride: boolean;
  mediaUrls: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingLog {
  id: string;
  date: Date;
  notes: string;
  tags: string[];
  relatedTricks: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Hike {
  id: string;
  title: string;
  location: string;
  distance?: number;
  notes: string;
  mediaUrls: string[];
  date: Date;
  createdBy: string;
  createdAt: Date;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 5: Utility Functions

**Files:**
- Create: `src/lib/utils.ts` (replace the shadcn-generated one)

- [ ] **Step 1: Replace src/lib/utils.ts**

```ts
import { clsx, type ClassValue } from "clsx";
import { differenceInMonths, differenceInYears } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { ChecklistItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CAIA_BIRTH_DATE = new Date("2025-03-16");

export function calculateAge(): string {
  const now = new Date();
  const years = differenceInYears(now, CAIA_BIRTH_DATE);
  const months = differenceInMonths(now, CAIA_BIRTH_DATE) % 12;

  if (years === 0) {
    return `${differenceInMonths(now, CAIA_BIRTH_DATE)} months old`;
  }
  return months > 0 ? `${years}y ${months}m old` : `${years} years old`;
}

export function calculateProgress(
  checklist: ChecklistItem[],
  override?: number
): number {
  if (override !== undefined) return override;
  if (checklist.length === 0) return 0;
  const completed = checklist.filter((item) => item.completed).length;
  return Math.round((completed / checklist.length) * 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nb-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add utility functions (age calc, progress calc, date format)"
```

---

## Task 6: Auth Context

**Files:**
- Create: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create src/contexts/AuthContext.tsx**

```tsx
"use client";

import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

  // New user — default to no role. Owner must assign role via dashboard.
  const newUser: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    role: "family",
    displayName: firebaseUser.displayName ?? undefined,
  };
  await setDoc(ref, newUser);
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isOwner, isFamily, canEdit }}>
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

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add Firebase auth context with role support"
```

---

## Task 7: Root Layout & Auth Provider

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Caia",
  description: "Nova Scotia Duck Tolling Retriever – training, tricks, and memories",
  metadataBase: new URL("https://caia.andreashagman.no"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={geist.variable}>
      <body className="min-h-screen bg-cream-100 antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap root layout with AuthProvider and Toaster"
```

---

## Task 8: Navbar Component

**Files:**
- Create: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Create src/components/layout/Navbar.tsx**

```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tricks", label: "Tricks" },
  { href: "/gallery", label: "Gallery" },
];

export function Navbar() {
  const { user, signOut, canEdit } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = canEdit
    ? [...publicLinks, { href: "/dashboard", label: "Dashboard" }]
    : publicLinks;

  return (
    <header className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur-sm border-b border-cream-200">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Caia 🐾
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors hover:text-sage-700",
                pathname === link.href ? "text-sage-700 font-medium" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-cream-100">
            <div className="flex flex-col gap-4 mt-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-base py-2 transition-colors",
                    pathname === link.href ? "text-sage-700 font-medium" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Button variant="ghost" className="justify-start px-0" onClick={() => { signOut(); setOpen(false); }}>
                  Sign out
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create src/components/layout/Footer.tsx**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-cream-200 mt-auto py-8">
      <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
        Caia — Nova Scotia Duck Tolling Retriever
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/layout/Footer.tsx
git commit -m "feat: add responsive Navbar and Footer components"
```

---

## Task 9: Public Route Group Layout

**Files:**
- Create: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Create src/app/(public)/layout.tsx**

```tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/layout.tsx
git commit -m "feat: add public route group layout with Navbar and Footer"
```

---

## Task 10: Landing Page

**Files:**
- Create: `src/app/(public)/page.tsx`

Note: move the existing `src/app/page.tsx` into `src/app/(public)/page.tsx` (delete the original).

- [ ] **Step 1: Delete src/app/page.tsx**

```bash
rm src/app/page.tsx
```

- [ ] **Step 2: Create src/app/(public)/page.tsx**

```tsx
import { calculateAge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar } from "lucide-react";

export default function LandingPage() {
  const age = calculateAge();

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-4 bg-sage-100 text-sage-700">
          Nova Scotia Duck Tolling Retriever
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
          Caia
        </h1>
        <p className="text-xl text-muted-foreground mb-2">{age}</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Follow along on the training journey — tricks, adventures, and memories.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg" className="bg-sage-600 hover:bg-sage-700">
            <Link href="/tricks">
              See tricks <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">About Caia</Link>
          </Button>
        </div>
      </section>

      {/* Hero image placeholder */}
      <section className="rounded-3xl overflow-hidden bg-sage-100 aspect-video md:aspect-[16/7] mb-16 flex items-center justify-center">
        <p className="text-sage-500 text-sm">Hero image goes here</p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { icon: <Calendar className="h-5 w-5" />, label: "Born", value: "March 16, 2025" },
          { icon: <MapPin className="h-5 w-5" />, label: "Breed", value: "Toller" },
          { label: "Tricks", value: "Loading…" },
          { label: "Status", value: "In training" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200 flex flex-col gap-1"
          >
            {stat.icon && <span className="text-sage-600">{stat.icon}</span>}
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "feat: add landing page with hero section and stats"
```

---

## Task 11: About Page

**Files:**
- Create: `src/app/(public)/about/page.tsx`

- [ ] **Step 1: Create src/app/(public)/about/page.tsx**

```tsx
import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const BIRTH_DATE = new Date("2025-03-16");

const traits = [
  { label: "Energy", value: "Very high" },
  { label: "Intelligence", value: "Extremely smart" },
  { label: "Affection", value: "Loves people" },
  { label: "Playfulness", value: "Always ready" },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">About Caia</h1>
      <p className="text-muted-foreground mb-10">{calculateAge()}</p>

      {/* Profile card */}
      <Card className="rounded-3xl shadow-sm mb-8 overflow-hidden">
        <div className="bg-sage-100 aspect-[4/3] flex items-center justify-center">
          <span className="text-sage-400 text-sm">Photo goes here</span>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Full name</span>
              <span className="font-medium">Caia</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Breed</span>
              <span className="font-medium">Nova Scotia Duck Tolling Retriever</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Born</span>
              <span className="font-medium">{formatDate(BIRTH_DATE)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Age</span>
              <span className="font-medium">{calculateAge()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality traits */}
      <h2 className="text-xl font-semibold mb-4">Personality</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {traits.map((t) => (
          <div
            key={t.label}
            className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
              {t.label}
            </span>
            <Badge variant="secondary" className="bg-sage-100 text-sage-700">
              {t.value}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/about/page.tsx
git commit -m "feat: add About page"
```

---

## Task 12: Tricks Public Stub & Gallery Stub

**Files:**
- Create: `src/app/(public)/tricks/page.tsx`
- Create: `src/app/(public)/gallery/page.tsx`

These are stubs — full implementation is in Plan 2.

- [ ] **Step 1: Create src/app/(public)/tricks/page.tsx**

```tsx
export default function TricksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Tricks</h1>
      <p className="text-muted-foreground">Coming soon — check back after Plan 2 is implemented.</p>
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/(public)/gallery/page.tsx**

```tsx
export default function GalleryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Gallery</h1>
      <p className="text-muted-foreground">Photos and videos coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/tricks/page.tsx src/app/(public)/gallery/page.tsx
git commit -m "feat: add public tricks and gallery stub pages"
```

---

## Task 13: Login Page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create src/app/login/page.tsx**

```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">Caia 🐾</Link>
        </div>
        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access the training dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-sage-600 hover:bg-sage-700"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:text-sage-700">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login page"
```

---

## Task 14: Dashboard Auth Guard & Stub

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create src/app/dashboard/layout.tsx**

```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/dashboard/page.tsx**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Tricks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Training logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Hikes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx src/app/dashboard/page.tsx
git commit -m "feat: add dashboard auth guard and stub page"
```

---

## Task 15: Firestore Security Rules

**Files:**
- Create: `firestore.rules`

- [ ] **Step 1: Create firestore.rules**

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
  }
}
```

- [ ] **Step 2: Deploy rules**

In Firebase Console → Firestore → Rules tab, paste and publish the rules above.

Or if you have Firebase CLI installed:
```bash
firebase deploy --only firestore:rules
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore security rules with role-based access"
```

---

## Task 16: Vercel Config & First Deploy

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "framework": "nextjs",
  "regions": ["arn1"]
}
```

(`arn1` = Stockholm region — closest to Norway)

- [ ] **Step 2: Push to GitHub**

Create a new GitHub repository named `caia-app`, then:

```bash
git remote add origin https://github.com/<your-username>/caia-app.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Connect to Vercel**

1. Go to vercel.com → New Project → Import `caia-app`
2. Add all environment variables from `.env.local` in Vercel project settings
3. Deploy

- [ ] **Step 4: Set custom domain**

In Vercel project → Settings → Domains → add `caia.andreashagman.no`.

Follow DNS instructions to point the subdomain to Vercel.

- [ ] **Step 5: Commit vercel.json**

```bash
git add vercel.json
git commit -m "chore: add Vercel config targeting Stockholm region"
git push
```

---

## Self-Review Checklist

- [x] Firebase config + env template — Task 3
- [x] Auth with roles (owner/family) — Task 6
- [x] Public routes (landing, about, tricks stub, gallery stub) — Tasks 10–12
- [x] Login page — Task 13
- [x] Dashboard auth guard — Task 14
- [x] Firestore security rules — Task 15
- [x] Mobile-first navbar with Sheet — Task 8
- [x] Age auto-calculation from March 16, 2025 — Task 5
- [x] Cream/sage color palette — Task 2
- [x] Vercel deploy — Task 16

**Not in this plan (covered by Plans 2 & 3):**
- Full tricks CRUD with media
- Training logs
- Hike logs
- Dashboard stats/activity feed
- User invite system
