import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session");
  return session?.value === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await prisma.setting.findMany();
  return NextResponse.json(Object.fromEntries(settings.map((s) => [s.key, s.value])));
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body: Record<string, string> = await request.json();
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
  return NextResponse.json({ success: true });
}
