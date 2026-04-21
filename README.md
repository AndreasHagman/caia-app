# Caia

A personal web app for tracking the training journey of Caia, a Nova Scotia Duck Tolling Retriever. Log tricks, hikes, and training sessions — with photos and videos.

**Live:** [caia.andreashagman.no](https://caia.andreashagman.no)

---

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Firebase** — Auth, Firestore, Storage
- **Resend** — transactional email for invites
- **Tailwind CSS** + **shadcn/ui**
- **PWA** — installable on mobile

---

## Features

| Area | Details |
|------|---------|
| Public site | Landing page, tricks gallery, photo/video gallery, about page |
| Tricks | Create, edit, and track tricks with status, difficulty, media uploads |
| Training logs | Per-session notes linked to tricks |
| Hikes | Log hikes with route, distance, notes, and photos |
| Dashboard | Owner-only management UI with sub-navigation |
| Auth | Email + password sign-in, forgot password, invite-only registration |
| Invites | Owner sends email invite via Resend → invitee registers at `/register` with role auto-assigned |

---

## Local setup

### 1. Clone and install

```bash
git clone <repo-url>
cd caia-app
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project settings → Your apps |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Firebase setup

The project uses three Firebase services:

- **Auth** — Email/password sign-in enabled
- **Firestore** — Rules in `firestore.rules`
- **Storage** — Rules in `storage.rules`

Deploy rules:

```bash
firebase deploy --only firestore,storage --project caia-app-c0541
```

---

## User roles

| Role | Access |
|------|--------|
| `owner` | Full access — manage tricks, logs, hikes, users |
| `family` | Can create and edit content |

Roles are assigned from `pendingInvites` in Firestore when a user registers for the first time. The owner creates invites from `/dashboard/settings/users`.
