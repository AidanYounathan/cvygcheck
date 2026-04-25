import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { firstName, lastName, extras } = await request.json();

  const updated = await prisma.checkIn.update({
    where: { id },
    data: { firstName, lastName, extras },
  });

  return NextResponse.json(updated);
}
