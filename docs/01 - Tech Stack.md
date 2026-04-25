# Tech Stack

← [[00 - Index]] | Next: [[02 - Project Structure]] →

---

## The Big Picture

This app is built with **Next.js** — a React framework that handles both the frontend (what users see) and the backend (the server/API) in one codebase. You don't need a separate Express server or separate React app. Everything lives together.

---

## Layer by Layer

### Frontend — React + Next.js 16

**React** is a JavaScript library for building user interfaces. You write components (reusable UI pieces) and React handles updating the screen when data changes.

**Next.js** adds:
- **App Router** — File-based routing. Create `src/app/checkin/page.tsx` and `/checkin` becomes a real URL automatically.
- **Server Components** — Components that run on the server (faster initial load, can query the database directly)
- **Client Components** — Components that run in the browser (can use React state, event listeners, etc.)

> **Rule of thumb:** Server components for data fetching. Client components for interactivity (buttons, forms, toggling).

### Backend — Next.js API Routes

Instead of a separate server, we write API endpoints inside the same Next.js project. A file at `src/app/api/checkin/route.ts` becomes the `/api/checkin` endpoint.

### Database — Neon PostgreSQL + Prisma

**Neon** is a serverless PostgreSQL database hosted in the cloud. It's free for small projects and connects via a connection string.

**Prisma** is an ORM (Object-Relational Mapper) — it lets you talk to the database using TypeScript instead of raw SQL:

```ts
// Without Prisma (raw SQL — error-prone):
const result = await db.query("SELECT * FROM check_ins WHERE id = $1", [id]);

// With Prisma (type-safe TypeScript):
const checkIn = await prisma.checkIn.findUnique({ where: { id } });
```

Prisma also generates TypeScript types from your schema, so your editor knows what fields exist.

→ See [[03 - Database Schema]] for the full schema.

### Deployment — Vercel

Vercel is the company that made Next.js, and their hosting platform is perfectly suited for it. Push to GitHub → Vercel auto-deploys. Environment variables are set in the Vercel dashboard.

→ See [[11 - Deployment & Environment]] for setup details.

---

## Key Libraries

| Library | What it does | Used where |
|---|---|---|
| `@prisma/client` | TypeScript ORM for PostgreSQL | All API routes and server pages |
| `react-qr-code` | Renders a QR code as SVG | Kiosk page |
| `recharts` | Charts and graphs | Admin dashboard |
| `@fingerprintjs/fingerprintjs` | Device fingerprinting | Check-in form |

### What is device fingerprinting?

When a browser visits your site, it exposes hundreds of tiny details: screen resolution, installed fonts, GPU info, timezone, OS version, etc. FingerprintJS combines these into a single hash — a unique ID for that device. We use this to prevent the same person from checking in twice on different devices in one day.

→ See [[09 - Security Model#Device Deduplication]] for more.

---

## TypeScript

All the code is written in **TypeScript** — JavaScript with types. Types let you say "this variable must be a string" or "this function returns a number," and your editor will warn you if you break the rules. It catches bugs before they happen.

```ts
// JavaScript — no safety:
function greet(name) { return "Hello, " + name; }

// TypeScript — safe:
function greet(name: string): string { return "Hello, " + name; }
greet(42); // Error: Argument of type 'number' is not assignable to type 'string'
```

---

← [[00 - Index]] | Next: [[02 - Project Structure]] →
