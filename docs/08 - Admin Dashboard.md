# Admin Dashboard

← [[07 - Dynamic Forms]] | Next: [[09 - Security Model]] →

---

## Access

URL: `cvygcheck.vercel.app/admin`

On first visit, you're redirected to `/admin/login`. Enter the `ADMIN_PASSWORD` environment variable. A cookie is set that lasts 8 hours.

---

## Dashboard Layout

### Header
- Date picker — filter check-ins by day (defaults to today)
- "Form Builder" link → `/admin/form`
- Logout button

### Controls (top section)
- [[#Toggle Switches]] — Geofence bypass and device limit bypass
- [[#Location Manager]] — Add/manage geofence locations

### Stats Cards
- **Total Check-Ins** for the selected date
- **Parish count** (distinct values of the first select-type field)
- **Date** currently viewing

### Charts
- **All-Time Chart** — Line chart showing daily check-in counts across all time
- **Hourly Chart** — Bar chart of arrivals by hour for the selected date
- **Parish Chart** — Horizontal bar chart of how many per parish

### Data
- **Check-In Table** — Inline-editable table of all check-ins for the day
- **Device List** — All devices that checked in today with names

---

## Toggle Switches

### Disable Geofence

When turned on: GPS location check is skipped entirely. Anyone can check in from anywhere.

**Use when:** Holding a remote event, testing, or when attendees are having GPS permission issues.

**Implementation:** PATCH `/api/admin/settings` with `{ bypass_geofence: "true" }`. Stored in the `Setting` table. Checked in `/api/checkin` route on every submission.

### Bypass Device Limit

When turned on: The "one device per day" rule is disabled. Same device can check in multiple times.

**Use when:** Testing multiple check-ins in a row, or someone needs to re-register.

**Implementation:** Same pattern as geofence bypass — PATCH `/api/admin/settings` with `{ bypass_device_limit: "true" }`.

> **Warning:** Both toggles persist in the database. They survive server restarts and new deployments. Always turn them off after testing.

---

## Location Manager

Found below the toggle switches. Manages the list of allowed check-in locations.

**Adding a location:**
1. Find the lat/lng by right-clicking in Google Maps → "What's here?"
2. Enter the label, coordinates, and radius (meters)
3. Click "Add Location"

**Managing locations:**
- **Active checkbox** — Toggle a location on/off without deleting it. Useful for seasonal events.
- **✕ button** — Delete a location permanently (with confirmation).

**How it interacts with check-in:**
- If any active locations exist in DB → user must be within one of them
- If no active locations in DB → falls back to `CHURCH_LAT`/`CHURCH_LNG` env vars

→ See [[06 - Geofencing]] for the full logic.

---

## Check-In Table

Shows all check-ins for the selected date. Columns:
- Time (displayed in your local timezone)
- First Name / Last Name
- One column per active form field (Age, Parish, etc.)
- IP Address
- Device ID (first 8 characters)

**Inline Editing:**
1. Click "Edit" on any row
2. Modify first name, last name, or any form field value
3. Click "Save" → PATCH `/api/admin/checkin/[id]`

This is useful for correcting typos entered during check-in.

---

## All-Time Chart

Shows the trend of check-ins over time — every day that had at least one check-in appears as a data point. Good for spotting attendance patterns (which months are busiest, which events draw the most people).

---

## Form Builder (`/admin/form`)

Separate page linked from the header. → Full details in [[07 - Dynamic Forms]]

**Key operations:**
- **Toggle Active** — Deactivate a field so it disappears from the form (answers are preserved)
- **Up/Down arrows** — Change the display order
- **Delete** — Remove a field (historical data is preserved in `extras` JSON)
- **Add Field** — New question with label, type, and optional key

---

## How Auth Works

The admin session is a simple httpOnly cookie:
- Name: `admin-session`
- Value: the admin password itself (yes, the actual password)
- `HttpOnly`: JavaScript can't read it (prevents XSS theft)
- `SameSite=Lax`: Browser won't send it on cross-site requests (prevents CSRF)
- `Secure`: Only sent over HTTPS in production
- Expires: 8 hours

Every admin API route checks:
```ts
async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session");
  return session?.value === process.env.ADMIN_PASSWORD;
}
```

→ See [[09 - Security Model]] for full security details.

---

## Changing the Password

1. Go to Vercel Dashboard → your project → Settings → Environment Variables
2. Update `ADMIN_PASSWORD`
3. Redeploy (or the old value stays until next deploy)

There are no user accounts — one password for all admins. If it gets compromised, change the env var and redeploy.

---

← [[07 - Dynamic Forms]] | Next: [[09 - Security Model]] →
