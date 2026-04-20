import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormBuilder } from "../_components/FormBuilder";
import Link from "next/link";

export default async function AdminFormPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session");
  if (!session || session.value !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  const fields = await prisma.formField.findMany({ orderBy: { order: "asc" } });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2" }}>
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

        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/admin" style={navLink}>← Check-Ins</Link>
          <form method="POST" action="/api/admin/logout">
            <button type="submit" style={navLink as React.CSSProperties}>Logout</button>
          </form>
        </div>
      </div>

      <div style={{ padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 300, letterSpacing: "0.2em", color: "#1B3664", textTransform: "uppercase" }}>
            Form Builder
          </h1>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6B6B6B" }}>
            Changes take effect immediately on the next QR scan.
          </p>
        </div>

        <FormBuilder initialFields={fields} />
      </div>
    </div>
  );
}

const navLink = {
  color: "#aaa",
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  textDecoration: "none",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
} as const;
