# Project Structure

← [[01 - Tech Stack]] | Next: [[03 - Database Schema]] →

---

## The File Tree

```
cvygcheck/
├── prisma/
│   └── schema.prisma          ← Database blueprint
├── src/
│   ├── lib/                   ← Shared utilities
│   │   ├── prisma.ts          ← Database client (singleton)
│   │   ├── tokens.ts          ← Token generation & claiming logic
│   │   └── geofence.ts        ← GPS distance math
│   └── app/                   ← Everything the user touches
│       ├── page.tsx           ← "/" — redirects to /kiosk
│       ├── kiosk/
│       │   └── page.tsx       ← The iPad display (rotating QR)
│       ├── checkin/
│       │   └── page.tsx       ← Phone form after scanning QR
│       ├── admin/
│       │   ├── page.tsx       ← Dashboard (daily stats + management)
│       │   ├── login/
│       │   │   └── page.tsx   ← Admin password page
│       │   ├── form/
│       │   │   └── page.tsx   ← Form builder
│       │   └── _components/   ← UI pieces used by admin pages
│       │       ├── Charts.tsx
│       │       ├── CheckInTable.tsx
│       │       ├── FormBuilder.tsx
│       │       ├── GeofenceToggle.tsx
│       │       ├── DeviceBypassToggle.tsx
│       │       └── LocationManager.tsx
│       └── api/               ← Backend endpoints
│           ├── token/         ← GET /api/token
│           ├── checkin/       ← POST /api/checkin + GET /api/checkin/claim
│           ├── form-config/   ← GET /api/form-config
│           └── admin/
│               ├── login/
│               ├── logout/
│               ├── form/
│               ├── checkin/
│               ├── settings/
│               └── locations/
├── next.config.ts             ← Next.js configuration
└── package.json               ← Dependencies & scripts
```

---

## How Next.js Routing Works

Next.js uses **file-based routing** — the folder structure *is* your URL structure.

| File path | URL |
|---|---|
| `src/app/page.tsx` | `/` |
| `src/app/kiosk/page.tsx` | `/kiosk` |
| `src/app/checkin/page.tsx` | `/checkin` |
| `src/app/admin/page.tsx` | `/admin` |
| `src/app/api/token/route.ts` | `/api/token` |
| `src/app/api/admin/locations/[id]/route.ts` | `/api/admin/locations/abc123` |

`[id]` in a folder name means "dynamic segment" — that part of the URL can be anything, and your code receives it as a parameter.

---

## Server vs. Client Components

Every `.tsx` file in `app/` is a **Server Component by default** — it runs on the server, can await database calls, and sends finished HTML to the browser.

To make a component run in the browser (so it can have state, click handlers, etc.), add this to the top of the file:

```ts
"use client";
```

### Examples in this project

| File | Type | Why |
|---|---|---|
| `admin/page.tsx` | Server | Needs to query database and check auth cookie |
| `checkin/page.tsx` | Client | Needs browser APIs (geolocation, device fingerprint) |
| `admin/_components/Charts.tsx` | Client | Recharts requires browser DOM |
| `admin/_components/GeofenceToggle.tsx` | Client | Needs button click state |

---

## The `src/lib/` Folder

This is where shared logic lives — code that multiple API routes and pages need.

- **`prisma.ts`** — Creates the database connection. Singleton pattern prevents creating thousands of connections during development (Next.js hot-reloads often).
- **`tokens.ts`** — All the logic for creating, claiming, and validating tokens. → [[04 - Token System]]
- **`geofence.ts`** — The math for checking if GPS coordinates are within a radius. → [[06 - Geofencing]]

---

## The `_components/` Convention

The underscore prefix (`_components`) is a Next.js convention for **co-located components** — files that belong to a specific route but aren't routes themselves. Next.js won't create a URL for any folder starting with `_`.

---

← [[01 - Tech Stack]] | Next: [[03 - Database Schema]] →
