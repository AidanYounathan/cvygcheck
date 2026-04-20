import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HourlyChart, ParishChart } from "./_components/Charts";
import { CheckInTable } from "./_components/CheckInTable";

export default async function AdminPage(props: {
  searchParams: Promise<{ date?: string }>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session");
  if (!session || session.value !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  const { date: dateParam } = await props.searchParams;
  const dateStr = dateParam ?? new Date().toISOString().split("T")[0];
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const checkIns = await prisma.checkIn.findMany({
    where: { submittedAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { submittedAt: "desc" },
  });

  const total = checkIns.length;

  // Parish chart data
  const parishMap = checkIns.reduce<Record<string, number>>((acc, ci) => {
    acc[ci.parish] = (acc[ci.parish] ?? 0) + 1;
    return acc;
  }, {});
  const parishData = Object.entries(parishMap)
    .map(([parish, count]) => ({ parish, count }))
    .sort((a, b) => b.count - a.count);

  // Hourly chart data
  const hourlyMap = checkIns.reduce<Record<number, number>>((acc, ci) => {
    const h = ci.submittedAt.getUTCHours();
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, {});
  const hourlyData = Object.entries(hourlyMap)
    .map(([h, count]) => ({
      hour: `${String(parseInt(h) % 12 || 12)}${parseInt(h) < 12 ? "am" : "pm"}`,
      count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // Serialize for client components
  const serialized = checkIns.map((ci) => ({
    id: ci.id,
    firstName: ci.firstName,
    lastName: ci.lastName,
    parish: ci.parish,
    submittedAt: ci.submittedAt.toISOString(),
    ipAddress: ci.ipAddress,
    deviceId: ci.deviceId,
  }));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#1B3664",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "#C8A84B" }} />
          <span style={{ color: "#FAF7F2", fontSize: "0.8rem", letterSpacing: "0.25em", textTransform: "uppercase" }}>
            CVYG Admin
          </span>
          <div style={{ width: "1px", height: "1.5rem", backgroundColor: "#C8A84B" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <form method="GET" action="/admin" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="date"
              name="date"
              defaultValue={dateStr}
              style={{
                padding: "0.4rem 0.75rem",
                backgroundColor: "transparent",
                border: "1px solid #C8A84B",
                color: "#FAF7F2",
                fontSize: "0.75rem",
                colorScheme: "dark",
              }}
            />
            <button type="submit" style={{
              padding: "0.4rem 0.75rem",
              backgroundColor: "#C8A84B",
              border: "none",
              color: "#1B3664",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}>Go</button>
          </form>

          <form method="POST" action="/api/admin/logout">
            <button type="submit" style={{
              padding: "0.4rem 0.75rem",
              backgroundColor: "transparent",
              border: "1px solid #6B6B6B",
              color: "#aaa",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}>Logout</button>
          </form>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <StatCard label="Total Check-Ins" value={total} />
          <StatCard label="Parishes" value={parishData.length} />
          <StatCard label="Date" value={dateStr} small />
        </div>

        {total === 0 ? (
          <div style={{
            padding: "3rem",
            backgroundColor: "#fff",
            border: "1px solid #E8E0D0",
            textAlign: "center",
            color: "#6B6B6B",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            No check-ins on this date
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <HourlyChart data={hourlyData} />
              <ParishChart data={parishData} />
            </div>

            {/* Table */}
            <CheckInTable initialRows={serialized} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div style={{
      backgroundColor: "#fff",
      border: "1px solid #E8E0D0",
      borderTop: "3px solid #C8A84B",
      padding: "1.25rem 1.5rem",
      minWidth: "140px",
    }}>
      <div style={{ fontSize: small ? "1rem" : "2rem", fontWeight: 300, color: "#1B3664", marginBottom: "0.25rem" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#6B6B6B", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}
