import { NextRequest, NextResponse } from "next/server";
import { claimToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    await claimToken(token);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    const status =
      message === "TOKEN_NOT_FOUND"
        ? 404
        : message === "TOKEN_EXPIRED"
        ? 410
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
