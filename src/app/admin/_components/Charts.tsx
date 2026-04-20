"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type HourlyPoint = { hour: string; count: number };
type ParishPoint = { parish: string; count: number };

export function HourlyChart({ data }: { data: HourlyPoint[] }) {
  if (data.length === 0) return null;
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", padding: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
        Arrivals by Hour
      </h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE0" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#6B6B6B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#6B6B6B" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ border: "1px solid #E8E0D0", borderRadius: 0, fontSize: 12 }}
            cursor={{ fill: "#FAF7F2" }}
          />
          <Bar dataKey="count" fill="#1B3664" radius={[2, 2, 0, 0]} name="Check-ins" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ParishChart({ data }: { data: ParishPoint[] }) {
  if (data.length === 0) return null;
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", padding: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
        By Parish
      </h2>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#6B6B6B" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="parish" tick={{ fontSize: 11, fill: "#1B3664" }} axisLine={false} tickLine={false} width={90} />
          <Tooltip
            contentStyle={{ border: "1px solid #E8E0D0", borderRadius: 0, fontSize: 12 }}
            cursor={{ fill: "#FAF7F2" }}
          />
          <Bar dataKey="count" fill="#C8A84B" radius={[0, 2, 2, 0]} name="Check-ins" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
