# Database Schema

← [[02 - Project Structure]] | Next: [[04 - Token System]] →

---

## What Is a Schema?

A schema is the blueprint for your database. It defines what tables exist, what columns are in each table, and the rules each column follows (required? unique? default value?).

We define ours in `prisma/schema.prisma` using Prisma's schema language.

---

## The Five Models

### 1. Token

```prisma
model Token {
  id         String    @id @default(cuid())
  value      String    @unique
  claimed    Boolean   @default(false)
  claimedAt  DateTime?
  used       Boolean   @default(false)
  usedAt     DateTime?
  createdAt  DateTime  @default(now())
  checkIn    CheckIn?
}
```

**Purpose:** Represents one QR code. Tokens are created constantly by the kiosk, claimed when someone scans, and used when they submit the form.

**Lifecycle:** `created → claimed → used`

→ Full explanation in [[04 - Token System]]

---

### 2. CheckIn

```prisma
model CheckIn {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  extras      Json     @default("{}")
  deviceId    String
  userAgent   String
  ipAddress   String
  latitude    Float
  longitude   Float
  submittedAt DateTime @default(now())
  tokenId     String   @unique
  token       Token    @relation(fields: [tokenId], references: [id])
}
```

**Purpose:** One record per check-in. Stores who checked in, when, where (GPS), and from what device.

**The `extras` field** is a JSON object — it stores all the dynamic form fields (age, parish, etc.) without needing new database columns. Example:
```json
{ "age": "22", "parish": "Mar Addai" }
```

→ See [[07 - Dynamic Forms]] for how this works.

**`tokenId @unique`** means one token = one check-in. You can't check in twice with the same token.

---

### 3. Setting

```prisma
model Setting {
  key   String @id
  value String
}
```

**Purpose:** A simple key-value store for toggles and configuration.

**Current keys in use:**

| Key | Meaning |
|---|---|
| `bypass_geofence` | `"true"` disables GPS location check |
| `bypass_device_limit` | `"true"` allows same device to check in multiple times |

This model lets admins change runtime behavior without touching code or environment variables. → [[08 - Admin Dashboard#Toggle Switches]]

---

### 4. GeoLocation

```prisma
model GeoLocation {
  id     String  @id @default(cuid())
  label  String
  lat    Float
  lng    Float
  radius Int     @default(150)
  active Boolean @default(true)
}
```

**Purpose:** Defines an allowed check-in zone. A check-in is valid if the user's GPS is within `radius` meters of (`lat`, `lng`).

**Why multiple locations?** CVYG events happen at different parishes. You add each church as a GeoLocation. If someone checks in from Mar Addai, they're within *that* location's radius even if they're not near Mor Aphrem.

→ Full explanation in [[06 - Geofencing]]

---

### 5. FormField

```prisma
model FormField {
  id       String  @id @default(cuid())
  label    String
  fieldKey String  @unique
  type     String  // "text" | "number" | "select"
  options  String  // "Option A,Option B,Option C"
  required Boolean @default(true)
  active   Boolean @default(true)
  order    Int     @default(0)
}
```

**Purpose:** Defines what questions appear on the check-in form. Admins can add, reorder, and deactivate fields without touching code.

**`fieldKey`** is the JSON key used to store the answer in `CheckIn.extras`. For "Parish" it would be `"parish"`, and the stored value would be `{ "parish": "Mar Addai" }`.

**`options`** is a comma-separated string for select fields: `"Mar Addai,Mor Aphrem,Saint Mary,Saint Joseph,Other"`.

→ Full explanation in [[07 - Dynamic Forms]]

---

## How Tables Relate

```
Token ──(1:1)── CheckIn
```

Every CheckIn must have exactly one Token. Every Token can have at most one CheckIn. This is enforced by `tokenId @unique` on the CheckIn model.

Everything else (FormField, Setting, GeoLocation) is independent — they don't have foreign keys to Token or CheckIn.

---

## Common Prisma Operations

```ts
// Create a record
await prisma.checkIn.create({ data: { firstName: "John", ... } });

// Find one by unique field
await prisma.token.findUnique({ where: { value: "abc123" } });

// Find many with a filter
await prisma.checkIn.findMany({
  where: { submittedAt: { gte: dayStart, lte: dayEnd } },
  orderBy: { submittedAt: "desc" },
});

// Update a record
await prisma.token.update({ where: { id }, data: { used: true } });

// Upsert (create if missing, update if exists)
await prisma.setting.upsert({
  where: { key: "bypass_geofence" },
  update: { value: "true" },
  create: { key: "bypass_geofence", value: "true" },
});

// Transaction (multiple operations that either all succeed or all fail)
await prisma.$transaction([
  prisma.checkIn.create({ data: { ... } }),
  prisma.token.update({ where: { id }, data: { used: true } }),
]);
```

---

← [[02 - Project Structure]] | Next: [[04 - Token System]] →
