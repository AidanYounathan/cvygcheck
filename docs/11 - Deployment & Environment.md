# Deployment & Environment

← [[10 - API Reference]] | Back to [[00 - Index]] →

---

## How Deployment Works

This project uses a **git-based deployment pipeline**:

```
You push code to GitHub
        ↓
Vercel detects the push automatically
        ↓
Vercel runs: npm install → prisma generate → next build
        ↓
New version goes live at cvygcheck.vercel.app
```

No manual steps. Every push to `main` deploys automatically.

---

## The Build Command

From `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

`prisma generate` runs before the build. It reads `prisma/schema.prisma` and generates the TypeScript types and query engine for the database. If you change the schema, you must also run `prisma generate` for the types to update.

---

## Environment Variables

Set these in **Vercel Dashboard → your project → Settings → Environment Variables**.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `ADMIN_PASSWORD` | ✅ | Password for `/admin` |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Full URL like `https://cvygcheck.vercel.app` |
| `CHURCH_LAT` | Optional | Fallback geofence latitude |
| `CHURCH_LNG` | Optional | Fallback geofence longitude |
| `GEOFENCE_RADIUS` | Optional | Fallback radius in meters (default 150) |
| `BYPASS_GEOFENCE` | Optional | Set to `"true"` to always bypass geofence |

**`NEXT_PUBLIC_` prefix:** Variables starting with `NEXT_PUBLIC_` are baked into the client-side JavaScript bundle at build time. `NEXT_PUBLIC_BASE_URL` is embedded in the kiosk page so it can construct the full QR URL.

**Regular env vars** (no prefix) are only available on the server. Never put secrets (passwords, DB URLs) in `NEXT_PUBLIC_` variables.

---

## The Neon Database

Neon is a serverless PostgreSQL database. Key things to know:

**Connection string format:**
```
postgresql://username:password@host/database?sslmode=require
```

**`prisma db push`** — Syncs your schema to the database. Adds new tables/columns. Does NOT delete data.

```bash
npx prisma db push
```

Run this whenever you change `schema.prisma` and want the change reflected in the actual database.

**`prisma studio`** — A visual database browser. Run locally to inspect data:

```bash
npx prisma studio
```

---

## Local Development

To run the app locally:

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Push schema to database
npx prisma db push

# 4. Start dev server
npm run dev
```

The dev server runs at `http://localhost:3000`.

**Testing on your phone (same wifi):**

The dev script runs on `0.0.0.0` (all network interfaces), so your phone can reach it via your computer's IP:
```
http://192.168.1.x:3000
```

The `allowedDevOrigins` setting in `next.config.ts` controls which IPs are allowed. Update it to your computer's LAN IP.

---

## After Schema Changes

If you add a model or change a field in `schema.prisma`, you need to:

1. **Update the database:** `npx prisma db push`
2. **Regenerate types:** `npx prisma generate` (db push does this too)
3. **Restart TypeScript server** in VS Code if the editor still shows errors:
   - Command Palette → "TypeScript: Restart TS Server"

---

## Common Commands

```bash
# Run dev server
npm run dev

# Type check (without building)
npx tsc --noEmit

# Push schema changes to DB
npx prisma db push

# Open visual DB browser
npx prisma studio

# Build for production (locally)
npm run build

# Check what's in git
git status
git log --oneline

# Push to GitHub (triggers Vercel deploy)
git add .
git commit -m "your message"
git push
```

---

## If the Deployment Fails

1. Go to Vercel Dashboard → Deployments → click the failed deployment
2. Click "Build Logs" to see what went wrong
3. Common causes:
   - TypeScript errors (run `npx tsc --noEmit` locally first)
   - Missing environment variables
   - `prisma generate` failed (check schema syntax)
   - `next build` failed (usually a type error or import issue)

---

## Vercel Free Tier Limits

Vercel's free tier (Hobby plan) limits:
- **100 GB bandwidth/month** — very generous for this use case
- **Serverless function execution:** 100 GB-hours/month
- **Deployments:** Unlimited

Neon free tier:
- **0.5 GB storage** — more than enough for attendance records
- **Compute hours:** Limited, but Neon scales to zero and wakes on demand

For a church attendance system with ~100 check-ins/event, you'll never hit these limits.

---

← [[10 - API Reference]] | Back to [[00 - Index]] →
