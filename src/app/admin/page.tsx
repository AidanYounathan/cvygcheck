import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  const parishCounts = checkIns.reduce<Record<string, number>>((acc, ci) => {
    acc[ci.parish] = (acc[ci.parish] ?? 0) + 1;
    return acc;
  }, {});

  const sortedParishes = Object.entries(parishCounts).sort((a, b) => b[1] - a[1]);
  const total = checkIns.length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#1B3664",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
                letterSpacing: "0.05em",
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

      <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <StatCard label="Total Check-Ins" value={total} />
          <StatCard label="Parishes Represented" value={sortedParishes.length} />
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>

            {/* Parish breakdown */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", padding: "1.5rem" }}>
              <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
                By Parish
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sortedParishes.map(([parish, count]) => (
                  <div key={parish}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#1B3664" }}>{parish}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1B3664" }}>
                        {count} <span style={{ color: "#6B6B6B", fontWeight: 400 }}>({Math.round((count / total) * 100)}%)</span>
                      </span>
                    </div>
                    <div style={{ height: "3px", backgroundColor: "#E8E0D0", borderRadius: "2px" }}>
                      <div style={{
                        height: "100%",
                        width: `${(count / total) * 100}%`,
                        backgroundColor: "#C8A84B",
                        borderRadius: "2px",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Check-ins table */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E8E0D0" }}>
                <h2 style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
                  Check-Ins
                </h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#FAF7F2" }}>
                      {["Time", "Name", "Parish", "IP", "Device"].map((h) => (
                        <th key={h} style={{
                          padding: "0.6rem 1rem",
                          textAlign: "left",
                          fontSize: "0.65rem",
                          letterSpacing: "0.15em",
                          color: "#6B6B6B",
                          textTransform: "uppercase",
                          fontWeight: 400,
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #E8E0D0",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checkIns.map((ci, i) => (
                      <tr key={ci.id} style={{ borderBottom: i < checkIns.length - 1 ? "1px solid #F0EAE0" : "none" }}>
                        <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", whiteSpace: "nowrap" }}>
                          {ci.submittedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "0.7rem 1rem", color: "#1B3664", whiteSpace: "nowrap" }}>
                          {ci.firstName} {ci.lastName}
                        </td>
                        <td style={{ padding: "0.7rem 1rem", color: "#1B3664" }}>{ci.parish}</td>
                        <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {ci.ipAddress}
                        </td>
                        <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {ci.deviceId.slice(0, 8)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
      padding: "1.25rem 1.5rem",
      minWidth: "140px",
      borderTop: "3px solid #C8A84B",
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
