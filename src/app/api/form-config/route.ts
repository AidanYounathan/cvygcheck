import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_FIELDS = [
  { label: "Age", fieldKey: "age", type: "number", options: null, required: true, active: true, order: 0 },
  {
    label: "Parish",
    fieldKey: "parish",
    type: "select",
    options: "Mar Addai,Mor Aphrem,Saint Mary,Saint Joseph,Other",
    required: true,
    active: true,
    order: 1,
  },
];

export async function GET() {
  const count = await prisma.formField.count();

  if (count === 0) {
    await prisma.formField.createMany({ data: DEFAULT_FIELDS });
  }

  const fields = await prisma.formField.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(fields);
}
