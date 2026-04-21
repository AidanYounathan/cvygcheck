# Token System

← [[03 - Database Schema]] | Next: [[05 - Check-In Flow]] →

---

## The Problem It Solves

Without a token system, the check-in URL would be static — `https://cvygcheck.vercel.app/checkin`. Anyone could bookmark it and check in from home without ever attending.

The token system ties each check-in attempt to a specific moment: you have to be at the kiosk *right now* to get the token, and the token expires in minutes.

---

## The Token Lifecycle

```
[Kiosk polls /api/token every 2s]
         ↓
   Token CREATED in DB
   (unclaimed, unused)
         ↓
   Kiosk shows QR code
   URL = /checkin?token=ABC123
         ↓
   [Person scans QR code]
         ↓
   Phone hits /api/checkin/claim?token=ABC123
   Token marked as CLAIMED ✓
   → New token created instantly for kiosk
         ↓
   Person fills out form
         ↓
   Phone hits POST /api/checkin
   Token marked as USED ✓
   CheckIn record created
```

---

## The Two Time Limits

There are two separate expiry windows:

### 1. Unclaimed TTL — 2 minutes

If a token sits on the kiosk for 2 minutes without being scanned, it's considered stale. The kiosk fetches a fresh one. This just means the QR code on the screen rotates roughly every 2 minutes even if no one scans it.

```ts
export const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes
```

### 2. Submission TTL — 10 minutes

Once you scan the QR code, you have **10 minutes** to fill out and submit the form. This window starts from `claimedAt` (the moment you scanned), not from when the token was created.

```ts
export const SUBMISSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
```

**Why separate windows?** Originally there was only one 2-minute window, but if the kiosk just rotated the QR, a person who just scanned had less than 2 minutes to fill the form. The fix was to give a longer window *after scanning*.

---

## Claim-on-Load (The Key Trick)

When your phone opens `/checkin?token=ABC123`, the very first thing it does is call `/api/checkin/claim`. This does two things *atomically* (in one database transaction):

1. Marks the current token as `claimed`
2. Creates a **new** token immediately

This means the kiosk sees a new QR code the moment someone scans — there's never a window where two people could scan the same code.

```ts
// From src/lib/tokens.ts
export async function claimToken(value: string) {
  return await prisma.$transaction(async (tx) => {
    const token = await tx.token.findUnique({ where: { value } });
    // ... validation ...
    const [claimed] = await Promise.all([
      tx.token.update({ where: { value }, data: { claimed: true, claimedAt: new Date() } }),
      tx.token.create({ data: { value: generateValue() } }), // ← new token for kiosk
    ]);
    return claimed;
  });
}
```

---

## What `getOrCreateActiveToken()` Does

The kiosk polls `/api/token` every 2 seconds. That endpoint calls `getOrCreateActiveToken()`:

```
Is there an unclaimed, unused, non-expired token?
  YES → return it (kiosk keeps showing same QR)
  NO  → create a fresh one and return it
```

This means the kiosk isn't constantly generating new tokens — it reuses the same one until it expires or gets claimed.

---

## Token Format

Tokens are random UUIDs without dashes:

```ts
function generateValue(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
// Example: "550e8400e29b41d4a716446655440000"
```

They're unguessable — 32 hex characters = 128 bits of randomness.

---

## Why Not Just Use a QR Code Scanner Library?

Some check-in systems just use a static QR that scans to a form. The problems:
- Anyone can share the link → remote check-ins
- No way to prevent someone checking in twice from different phones
- No audit trail

Our approach adds physical presence as a requirement: you must physically be at the kiosk to get a valid, unclaimed token.

---

← [[03 - Database Schema]] | Next: [[05 - Check-In Flow]] →
