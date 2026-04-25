import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AttendanceTable } from "../_components/AttendanceTable";

export default async function AttendancePage() {
  if (!(await requireAdmin())) {
    redirect("/admin/login");
  }

  const allCheckIns = await prisma.checkIn.findMany({
    select: { firstName: true, lastName: true, submittedAt: true },
    orderBy: { submittedAt: "asc" },
  });

  const map = new Map<string, { count: number; dates: Set<string>; lastSeen: Date }>();

  for (const ci of allCheckIns) {
    const name = `${ci.firstName} ${ci.lastName}`;
    const date = ci.submittedAt.toISOString().split("T")[0];
    const existing = map.get(name);
    if (existing) {
      existing.count++;
      existing.dates.add(date);
      if (ci.submittedAt > existing.lastSeen) existing.lastSeen = ci.submittedAt;
    } else {
      map.set(name, { count: 1, dates: new Set([date]), lastSeen: ci.submittedAt });
    }
  }

  const records = Array.from(map.entries()).map(([name, { count, dates, lastSeen }]) => ({
    name,
    count,
    dates: Array.from(dates),
    lastSeen: lastSeen.toISOString().split("T")[0],
  }));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2" }}>
      <div style={{ backgroundColor: "#1B3664", padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "#C8A84B" }} />
          <Link href="/admin" style={{ color: "#FAF7F2", fontSize: "0.8rem", letterSpacing: "0.25em", textTransform: "uppercase", textDecoration: "none" }}>
            CVYG Admin
          </Link>
          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "#C8A84B" }} />
          <span style={{ color: "#C8A84B", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Attendance
          </span>
        </div>
        <form method="POST" action="/api/admin/logout">
          <button type="submit" style={{ padding: "0.4rem 0.75rem", backgroundColor: "transparent", border: "1px solid #6B6B6B", color: "#aaa", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Logout</button>
        </form>
      </div>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <AttendanceTable records={records} />
      </div>
    </div>
  );
}
