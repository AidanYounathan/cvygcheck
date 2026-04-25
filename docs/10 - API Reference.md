# API Reference

← [[09 - Security Model]] | Next: [[11 - Deployment & Environment]] →

---

## Public Endpoints

These endpoints are called by the kiosk and check-in form. No auth required.

---

### `GET /api/token`

Returns the current active token for the kiosk to display.

**Response:**
```json
{ "value": "550e8400e29b41d4a716446655440000" }
```

**Logic:** Returns an existing unclaimed, unused, non-expired token if one exists. Otherwise creates and returns a new one.

**Used by:** Kiosk page (polled every 2 seconds)

---

### `GET /api/checkin/claim?token=<value>`

Claims a token — marks it as "in use" and creates the next kiosk token simultaneously.

**Query params:** `token` — the token value from the QR URL

**Success response:**
```json
{ "success": true, "token": { "id": "...", "value": "...", "claimedAt": "..." } }
```

**Error responses:**

| Status | Body | Meaning |
|---|---|---|
| 404 | `{ "error": "TOKEN_NOT_FOUND" }` | Token doesn't exist |
| 400 | `{ "error": "TOKEN_ALREADY_CLAIMED" }` | Already claimed |
| 410 | `{ "error": "TOKEN_EXPIRED" }` | 2-min unclaimed TTL passed |

**Used by:** Check-in page on load

---

### `POST /api/checkin`

Submit a completed check-in.

**Request body:**
```json
{
  "token": "550e8400e29b41d4a716446655440000",
  "firstName": "John",
  "lastName": "Smith",
  "extras": { "age": "22", "parish": "Mar Addai" },
  "deviceId": "abc123...",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Success response:**
```json
{ "success": true }
```

**Error responses:**

| Status | Body | Meaning |
|---|---|---|
| 400 | `MISSING_FIELDS` | Required fields not provided |
| 400 | `TOKEN_NOT_CLAIMED` | Token was never claimed |
| 400 | `TOKEN_ALREADY_USED` | Token was already used for a check-in |
| 403 | `OUTSIDE_GEOFENCE` | GPS outside all allowed locations |
| 404 | `TOKEN_NOT_FOUND` | Token doesn't exist |
| 409 | `DEVICE_ALREADY_CHECKED_IN` | This device already checked in today |
| 410 | `TOKEN_EXPIRED` | 10-min submission window passed |

---

### `GET /api/form-config`

Returns the active form fields in display order.

**Response:**
```json
[
  { "id": "...", "label": "Age", "fieldKey": "age", "type": "number", "options": "", "required": true, "active": true, "order": 0 },
  { "id": "...", "label": "Parish", "fieldKey": "parish", "type": "select", "options": "Mar Addai,Mor Aphrem,Saint Mary,Saint Joseph,Other", "required": true, "active": true, "order": 1 }
]
```

**Note:** Auto-seeds default fields (Age, Parish) if the database has none.

---

## Admin Endpoints

All admin endpoints require a valid `admin-session` cookie. Returns `401 { "error": "Unauthorized" }` if missing or wrong.

---

### `POST /api/admin/login`

Authenticate and set session cookie.

**Request body:** `{ "password": "your-password" }`

**Success:** Sets `admin-session` cookie, returns `{ "success": true }`

**Failure:** `{ "error": "Invalid password" }` with status 401

---

### `POST /api/admin/logout`

Clears the session cookie and redirects to `/admin/login`.

---

### `GET /api/admin/settings`

Returns current settings.

**Response:** `{ "bypass_geofence": "false", "bypass_device_limit": "false" }`

---

### `PATCH /api/admin/settings`

Update one or more settings.

**Request body:** `{ "bypass_geofence": "true" }`

**Response:** Updated settings object. Uses upsert — creates the key if it doesn't exist.

---

### `GET /api/admin/locations`

List all geofence locations.

**Response:** Array of GeoLocation objects, sorted by label.

---

### `POST /api/admin/locations`

Create a new geofence location.

**Request body:**
```json
{ "label": "Mar Addai Parish", "lat": 40.7128, "lng": -74.0060, "radius": 150 }
```

**Response:** The created GeoLocation object.

---

### `PATCH /api/admin/locations/[id]`

Update a location (e.g., toggle active).

**Request body:** Any subset of GeoLocation fields: `{ "active": false }`

---

### `DELETE /api/admin/locations/[id]`

Remove a location.

**Response:** `{ "success": true }`

---

### `GET /api/admin/form`

List all form fields (including inactive ones).

---

### `POST /api/admin/form`

Create a new form field.

**Request body:**
```json
{
  "label": "Ministry",
  "fieldKey": "ministry",
  "type": "select",
  "options": "Youth Group,Choir,Altar Servers",
  "required": false
}
```

**Note:** `fieldKey` is auto-generated from `label` if not provided.

---

### `PATCH /api/admin/form/[id]`

Update a form field.

**Request body:** Any subset: `{ "active": false }` or `{ "order": 2 }`.

---

### `DELETE /api/admin/form/[id]`

Delete a form field. Historical check-in data is preserved.

---

### `PATCH /api/admin/checkin/[id]`

Edit a submitted check-in record.

**Request body:**
```json
{
  "firstName": "Jonathan",
  "lastName": "Smith",
  "extras": { "age": "23", "parish": "Mor Aphrem" }
}
```

---

## HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (admin auth failed) |
| 403 | Forbidden (geofence check failed) |
| 404 | Not found |
| 409 | Conflict (duplicate device) |
| 410 | Gone (token expired) |

---

← [[09 - Security Model]] | Next: [[11 - Deployment & Environment]] →
