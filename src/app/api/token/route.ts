import { NextResponse } from "next/server";
import { getOrCreateActiveToken } from "@/lib/tokens";

export async function GET() {
  const token = await getOrCreateActiveToken();
  return NextResponse.json({ value: token.value });
}
