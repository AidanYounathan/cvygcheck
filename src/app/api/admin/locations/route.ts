import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.geoLocation.findMany({ orderBy: { label: "asc" } }));
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { label, lat, lng, radius } = await request.json();
  if (!label || lat == null || lng == null) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const location = await prisma.geoLocation.create({
    data: { label, lat: parseFloat(lat), lng: parseFloat(lng), radius: parseInt(radius) || 150 },
  });
  return NextResponse.json(location);
}
