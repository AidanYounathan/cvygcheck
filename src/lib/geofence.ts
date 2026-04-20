const EARTH_RADIUS_M = 6_371_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a));
}

export type GeoFenceLocation = { lat: number; lng: number; radius: number };

export function isWithinAny(userLat: number, userLng: number, locations: GeoFenceLocation[]): boolean {
  if (locations.length === 0) return false;
  return locations.some((loc) => haversineDistance(userLat, userLng, loc.lat, loc.lng) <= loc.radius);
}

// Fallback for env-var-only config (used if DB has no locations)
export function isWithinGeofence(lat: number, lng: number): boolean {
  const churchLat = parseFloat(process.env.CHURCH_LAT!);
  const churchLng = parseFloat(process.env.CHURCH_LNG!);
  if (isNaN(churchLat) || isNaN(churchLng)) throw new Error("CHURCH_LAT or CHURCH_LNG not set");
  return haversineDistance(lat, lng, churchLat, churchLng) <= 150;
}
