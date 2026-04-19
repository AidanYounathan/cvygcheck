import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWithinGeofence } from "@/lib/geofence";
import { TOKEN_TTL_MS } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  let body: {
    token: string;
    firstName: string;
    lastName: string;
    parish: string;
    deviceId: string;
    latitude: number;
    longitude: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { token: tokenValue, firstName, lastName, parish, deviceId, latitude, longitude } = body;

  if (!tokenValue || !firstName || !lastName || !parish || !deviceId || latitude == null || longitude == null) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const token = await prisma.token.findUnique({ where: { value: tokenValue } });

  if (!token) return NextResponse.json({ error: "TOKEN_NOT_FOUND" }, { status: 404 });
  if (!token.claimed) return NextResponse.json({ error: "TOKEN_NOT_CLAIMED" }, { status: 400 });
  if (token.used) return NextResponse.json({ error: "TOKEN_ALREADY_USED" }, { status: 400 });

  // Security layer 2: token expiry
  if (Date.now() - token.createdAt.getTime() > TOKEN_TTL_MS) {
    return NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 410 });
  }

  // Security layer 3: geofence
  if (process.env.BYPASS_GEOFENCE !== "true") {
    try {
      if (!isWithinGeofence(latitude, longitude)) {
        return NextResponse.json({ error: "OUTSIDE_GEOFENCE" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "GEOFENCE_MISCONFIGURED" }, { status: 500 });
    }
  }

  // Security layer 4: one submission per device per day
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const duplicate = await prisma.checkIn.findFirst({
    where: { deviceId, submittedAt: { gte: startOfDay } },
  });

  if (duplicate) {
    return NextResponse.json({ error: "DEVICE_ALREADY_CHECKED_IN" }, { status: 409 });
  }

  // Security layer 5: write audit record, mark token used
  await prisma.$transaction([
    prisma.checkIn.create({
      data: {
        firstName,
        lastName,
        parish,
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
