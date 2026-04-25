import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWithinAny, isWithinGeofence } from "@/lib/geofence";
import { SUBMISSION_TTL_MS } from "@/lib/tokens";

// Per-instance rate limit: 10 attempts per IP per 10 minutes.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
  }

  const userAgent = request.headers.get("user-agent") ?? "unknown";

  let body: {
    token: string;
    firstName: string;
    lastName: string;
    extras: Record<string, string>;
    deviceId: string;
    latitude: number;
    longitude: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { token: tokenValue, firstName, lastName, extras, deviceId, latitude, longitude } = body;

  if (!tokenValue || !firstName || !lastName || !deviceId || latitude == null || longitude == null) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (firstName.trim().length > 50 || lastName.trim().length > 50 || deviceId.length > 128) {
    return NextResponse.json({ error: "INVALID_FIELDS" }, { status: 400 });
  }

  const token = await prisma.token.findUnique({ where: { value: tokenValue } });

  if (!token) return NextResponse.json({ error: "TOKEN_NOT_FOUND" }, { status: 404 });
  if (!token.claimed) return NextResponse.json({ error: "TOKEN_NOT_CLAIMED" }, { status: 400 });
  if (token.used) return NextResponse.json({ error: "TOKEN_ALREADY_USED" }, { status: 400 });

  const claimedAt = token.claimedAt ?? token.createdAt;
  if (Date.now() - claimedAt.getTime() > SUBMISSION_TTL_MS) {
    return NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 410 });
  }

  const [geofenceSetting, deviceBypassSetting, dbLocations] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "bypass_geofence" } }),
    prisma.setting.findUnique({ where: { key: "bypass_device_limit" } }),
    prisma.geoLocation.findMany({ where: { active: true } }),
  ]);
  const bypassGeofence = process.env.BYPASS_GEOFENCE === "true" || geofenceSetting?.value === "true";
  const bypassDeviceLimit = deviceBypassSetting?.value === "true";

  if (!bypassGeofence) {
    const allowed = dbLocations.length > 0
      ? isWithinAny(latitude, longitude, dbLocations)
      : (() => { try { return isWithinGeofence(latitude, longitude); } catch { return false; } })();

    if (!allowed) {
      return NextResponse.json({ error: "OUTSIDE_GEOFENCE" }, { status: 403 });
    }
  }

  if (!bypassDeviceLimit) {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const duplicate = await prisma.checkIn.findFirst({
      where: { deviceId, submittedAt: { gte: startOfDay } },
    });

    if (duplicate) {
      return NextResponse.json({ error: "DEVICE_ALREADY_CHECKED_IN" }, { status: 409 });
    }
  }

  await prisma.$transaction([
    prisma.checkIn.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        extras: extras ?? {},
        deviceId,
        userAgent,
        ipAddress: ip,
        latitude,
        longitude,
        tokenId: token.id,
      },
    }),
    prisma.token.update({
      where: { id: token.id },
      data: { used: true, usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
