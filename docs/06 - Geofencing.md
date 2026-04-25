# Geofencing

← [[05 - Check-In Flow]] | Next: [[07 - Dynamic Forms]] →

---

## What Is a Geofence?

A geofence is a virtual boundary around a real-world location. When a user's GPS coordinates are inside the boundary, they're "within the geofence." Outside it, they're not.

In this project, a geofence is defined by:
- **A center point** (latitude + longitude)
- **A radius** in meters (default: 150m)

If your GPS is within `radius` meters of the center point, you're allowed to check in.

---

## The Math — Haversine Distance

The Earth is a sphere. You can't just subtract coordinates to find distance (a degree of longitude near the equator is much wider than near the poles). Instead, we use the **Haversine formula** — the standard way to calculate the great-circle distance between two GPS coordinates.

```ts
// From src/lib/geofence.ts
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

This returns the distance in meters. If it's less than `radius`, the user is inside the geofence.

---

## Multiple Locations

CVYG events happen at different parishes. The system supports multiple GeoLocation records in the database. A check-in passes if the user is within **any** active location's radius:

```ts
export function isWithinAny(userLat: number, userLng: number, locations: GeoFenceLocation[]): boolean {
  return locations.some((loc) =>
    haversineDistance(userLat, userLng, loc.lat, loc.lng) <= loc.radius
  );
}
```

The `some()` method returns `true` as soon as it finds one location that matches — it stops checking after the first match.

---

## Fallback: Environment Variables

If there are **no active GeoLocations in the database**, the system falls back to environment variables:

```ts
// From src/lib/geofence.ts
export function isWithinGeofence(lat: number, lng: number): boolean {
  const churchLat = parseFloat(process.env.CHURCH_LAT ?? "");
  const churchLng = parseFloat(process.env.CHURCH_LNG ?? "");
  const radius = parseFloat(process.env.GEOFENCE_RADIUS ?? "150");
  // ...
  return haversineDistance(lat, lng, churchLat, churchLng) <= radius;
}
```

**Order of precedence:**
1. DB locations (active ones) — if any exist, use only these
2. Env vars — if no active DB locations exist
3. Bypass setting — if set to true in DB or env, skip all checks

---

## Finding Coordinates

To get a location's coordinates:
1. Open [Google Maps](https://maps.google.com)
2. Navigate to the church/location
3. Right-click on the exact spot → "What's here?"
4. Coordinates appear at the bottom of the screen: `40.712800, -74.006000`

Paste these into the Location Manager in the admin dashboard.

---

## Bypass Toggle

The admin dashboard has a **Disable Geofence** toggle. When enabled, all GPS checks are skipped — anyone from anywhere can check in. This is used:
- During remote events
- For testing from home
- When GPS permission is denied by attendees

→ See [[08 - Admin Dashboard#Toggle Switches]]

**Important:** Remember to turn the bypass off after testing. It's stored in the database so it persists across server restarts.

---

## GPS Accuracy

Phone GPS is not perfect. Accuracy varies:
- **Outdoors with clear sky:** ±3–5 meters
- **Indoors:** ±20–50 meters
- **Dense urban/underground:** ±100m or worse

The default radius of **150 meters** is intentionally generous to account for indoor GPS drift. You can increase it for large buildings or decrease it for tighter enforcement.

---

## Coordinate Format

Coordinates use **decimal degrees** format:
- Latitude: positive = North, negative = South (range: -90 to 90)
- Longitude: positive = East, negative = West (range: -180 to 180)

Example: `40.7128, -74.0060` = New York City (40.7° North, 74° West)

---

← [[05 - Check-In Flow]] | Next: [[07 - Dynamic Forms]] →
