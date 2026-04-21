# Check-In Flow

← [[04 - Token System]] | Next: [[06 - Geofencing]] →

---

## The Full Journey

### Step 1 — Kiosk Display

The iPad at the entrance runs `cvygcheck.vercel.app` (which redirects to `/kiosk`).

Every 2 seconds, the kiosk polls `/api/token`. The response includes a token value like `550e8400e29b41d4a716446655440000`. The kiosk renders this as a QR code pointing to:

```
https://cvygcheck.vercel.app/checkin?token=550e8400e29b41d4a716446655440000
```

---

### Step 2 — Scan

The youth scans the QR code with their phone camera. iOS and Android both auto-detect QR codes and open the link in the browser.

---

### Step 3 — Page Loads, Everything Happens at Once

When `/checkin?token=...` opens, the page kicks off **four things in parallel**:

```ts
const [claimed, fp, position, fields] = await Promise.all([
  claimToken(token),      // 1. Tell server "I've got this token"
  getDeviceFingerprint(), // 2. Get device ID from FingerprintJS
  getGPSCoordinates(),    // 3. Request location from browser
  fetchFormConfig(),      // 4. Get the list of form questions
]);
```

Running these in parallel (instead of one after another) makes the form load as fast as possible.

---

### Step 4 — Fill the Form

The form shows:
- First name (always required)
- Last name (always required)
- Dynamic fields from the database (age, parish, etc.) — see [[07 - Dynamic Forms]]

The Submit button is disabled until GPS coordinates are available (browser must grant permission).

---

### Step 5 — Submit

When submitted, the phone sends a POST to `/api/checkin`:

```json
{
  "token": "550e8400...",
  "firstName": "John",
  "lastName": "Smith",
  "extras": { "age": "22", "parish": "Mar Addai" },
  "deviceId": "abc123fingerprint...",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

The server runs all checks (see [[09 - Security Model]]) and if everything passes, creates the CheckIn record.

---

### Step 6 — Success Screen

A success screen shows for ~3 seconds, then the form resets. The youth is checked in.

---

## Error Codes

When something goes wrong, the API returns an error code. The form translates these into human-readable messages.

| Error Code | What it means | What to do |
|---|---|---|
| `TOKEN_NOT_FOUND` | The token in the URL doesn't exist in the database | Re-scan the QR code |
| `TOKEN_NOT_CLAIMED` | Token exists but wasn't claimed before submitting | Rare — reload the page |
| `TOKEN_ALREADY_USED` | Someone already checked in with this token | You already checked in, or someone else used it |
| `TOKEN_EXPIRED` | 10 minutes passed since you scanned | Re-scan the QR code |
| `OUTSIDE_GEOFENCE` | Your GPS is outside all allowed locations | Must be at the physical location |
| `DEVICE_ALREADY_CHECKED_IN` | Same device checked in earlier today | You've already checked in today |
| `MISSING_FIELDS` | Form was submitted without required fields | Fill in all required fields |

---

## The Claim Step in Detail

The claim step (`/api/checkin/claim`) happens *before* the form is visible. It's a GET request with the token in the query string:

```
GET /api/checkin/claim?token=550e8400...
```

Why before the form? If the claim fails (token expired, already claimed), the user sees an error immediately instead of filling out the entire form only to be rejected at submission.

---

## GPS on Mobile

The browser's Geolocation API (`navigator.geolocation.getCurrentPosition`) asks the user for permission. On iOS/Android:
- On first visit: a permission dialog appears
- Browser remembers the choice
- **HTTPS is required** — browsers refuse to expose GPS on non-secure connections

This is why the app is deployed on Vercel (HTTPS) instead of run locally for real events.

---

## Device ID

`@fingerprintjs/fingerprintjs` generates a stable hash based on:
- Browser (Chrome, Safari, etc.)
- OS (iOS, Android, Mac, Windows)
- Screen resolution
- Timezone
- Hardware characteristics

This hash identifies a specific device without using cookies or storage. Even if the user clears their browser, the fingerprint stays the same.

→ See [[09 - Security Model#Device Deduplication]] for more.

---

← [[04 - Token System]] | Next: [[06 - Geofencing]] →
