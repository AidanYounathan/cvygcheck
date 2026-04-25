"use client";

import { useState } from "react";

export type AttendanceRecord = {
  name: string;
  count: number;
  dates: string[];
  lastSeen: string;
};

export function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "count">("count");

  const filtered = records
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === "count"
        ? b.count - a.count
        : a.name.localeCompare(b.name)
    );

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E8E0D0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
          All-Time Attendance ({records.length} people)
        </h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            placeholder="Search name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "0.4rem 0.75rem", border: "1px solid #E8E0D0", fontSize: "0.78rem", color: "#1B3664", backgroundColor: "#FAF7F2", outline: "none", width: "180px" }}
          />
          <div style={{ display: "flex", gap: "0" }}>
            {(["count", "name"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "1px solid #E8E0D0",
                  borderLeft: key === "name" ? "none" : "1px solid #E8E0D0",
                  backgroundColor: sortBy === key ? "#1B3664" : "#fff",
                  color: sortBy === key ? "#FAF7F2" : "#6B6B6B",
                  cursor: "pointer",
                }}
              >
                {key === "count" ? "By Count" : "By Name"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#FAF7F2" }}>
              {["Name", "Check-Ins", "Last Seen", "Dates"].map((h) => (
                <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.65rem", letterSpacing: "0.15em", color: "#6B6B6B", textTransform: "uppercase", fontWeight: 400, whiteSpace: "nowrap", borderBottom: "1px solid #E8E0D0" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#6B6B6B", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                  No results
                </td>
              </tr>
            ) : filtered.map((r, i) => (
              <tr key={r.name} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F0EAE0" : "none" }}>
                <td style={{ padding: "0.7rem 1rem", color: "#1B3664", fontWeight: 500, whiteSpace: "nowrap" }}>{r.name}</td>
                <td style={{ padding: "0.7rem 1rem" }}>
                  <span style={{ display: "inline-block", backgroundColor: "#1B3664", color: "#FAF7F2", fontSize: "0.7rem", padding: "0.15rem 0.5rem", minWidth: "1.5rem", textAlign: "center" }}>
                    {r.count}
                  </span>
                </td>
                <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", whiteSpace: "nowrap" }}>{r.lastSeen}</td>
                <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", fontSize: "0.72rem" }}>
                  {r.dates.join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
