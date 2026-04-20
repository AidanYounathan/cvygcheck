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
  const fields = await prisma.formField.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(fields);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, fieldKey, type, options, required } = await request.json();

  if (!label || !fieldKey || !type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const maxOrder = await prisma.formField.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;

  const field = await prisma.formField.create({
    data: { label, fieldKey, type, options: options || null, required: !!required, active: true, order },
  });

  return NextResponse.json(field);
}
