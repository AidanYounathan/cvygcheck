"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const onAdmin = pathname.startsWith("/admin");
  return (
    <header
      style={{
        backgroundColor: "#1B3664",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "3rem",
        borderBottom: "1px solid rgba(200,168,75,0.3)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <div style={{ width: "1px", height: "1.25rem", backgroundColor: "#C8A84B", marginRight: "1.25rem" }} />
        <span style={{ color: "#FAF7F2", fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", marginRight: "2rem", opacity: 0.7 }}>
          CVYG
        </span>
        <nav style={{ display: "flex", height: "100%" }}>
          {[{ href: "/kiosk", label: "Kiosk" }].map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 1rem",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: active ? "#C8A84B" : "#FAF7F2",
                  borderBottom: active ? "2px solid #C8A84B" : "2px solid transparent",
                  opacity: active ? 1 : 0.65,
                  transition: "opacity 0.15s, color 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/admin"
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textDecoration: "none",
          color: onAdmin ? "#C8A84B" : "rgba(255,255,255,0.2)",
          transition: "color 0.15s",
        }}
      >
        ···
      </Link>
    </header>
  );
}
