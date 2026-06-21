import { describe, it, expect } from "vitest";
import { haversineDistance, isWithinAny } from "@/lib/geofence";

const CENTER = { lat: 33.749, lng: -84.388 }; // Atlanta, GA — arbitrary real coordinates

// ─── haversineDistance ───────────────────────────────────────────────────────

describe("haversineDistance", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistance(CENTER.lat, CENTER.lng, CENTER.lat, CENTER.lng)).toBe(0);
  });

  it("returns a positive number for two different points", () => {
    expect(haversineDistance(0, 0, 1, 0)).toBeGreaterThan(0);
  });

  it("is symmetric — distance A→B equals distance B→A", () => {
    const d1 = haversineDistance(CENTER.lat, CENTER.lng, 40.712, -74.006);
    const d2 = haversineDistance(40.712, -74.006, CENTER.lat, CENTER.lng);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

// ─── isWithinAny ─────────────────────────────────────────────────────────────

describe("isWithinAny", () => {
  it("returns false for an empty locations array", () => {
    expect(isWithinAny(CENTER.lat, CENTER.lng, [])).toBe(false);
  });

  it("returns true when user is at the center of a geofence", () => {
    const locations = [{ lat: CENTER.lat, lng: CENTER.lng, radius: 150 }];
    expect(isWithinAny(CENTER.lat, CENTER.lng, locations)).toBe(true);
  });

  it("returns true when user is exactly at the radius edge", () => {
    // Compute the real distance to a nearby point, then set radius to match exactly.
    // This guarantees haversineDistance(...) === radius, so <= is true.
    const userLat = CENTER.lat + 0.001; // ~111m north
    const userLng = CENTER.lng;
    const exactDistance = haversineDistance(CENTER.lat, CENTER.lng, userLat, userLng);
    const locations = [{ lat: CENTER.lat, lng: CENTER.lng, radius: exactDistance }];
    expect(isWithinAny(userLat, userLng, locations)).toBe(true);
  });

  it("returns false when user is just outside the radius edge", () => {
    const userLat = CENTER.lat + 0.001;
    const userLng = CENTER.lng;
    const exactDistance = haversineDistance(CENTER.lat, CENTER.lng, userLat, userLng);
    // Radius is 1m less than the actual distance — user is outside
    const locations = [{ lat: CENTER.lat, lng: CENTER.lng, radius: exactDistance - 1 }];
    expect(isWithinAny(userLat, userLng, locations)).toBe(false);
  });

  it("returns true if user is within any one of multiple geofences", () => {
    const farAway = { lat: 40.712, lng: -74.006, radius: 150 }; // NYC — user is not here
    const nearby  = { lat: CENTER.lat, lng: CENTER.lng, radius: 150 }; // Atlanta — user is here
    expect(isWithinAny(CENTER.lat, CENTER.lng, [farAway, nearby])).toBe(true);
  });

  it("returns false if user is outside all geofences", () => {
    const loc1 = { lat: 40.712, lng: -74.006, radius: 150 }; // NYC
    const loc2 = { lat: 51.505, lng: -0.09,   radius: 150 }; // London
    expect(isWithinAny(CENTER.lat, CENTER.lng, [loc1, loc2])).toBe(false);
  });
});
