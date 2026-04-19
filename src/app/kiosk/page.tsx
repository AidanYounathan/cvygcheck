"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

export default function KioskPage() {
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/token");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active && data.value) {
          setTokenValue(data.value);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const checkInUrl = tokenValue
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/checkin?token=${tokenValue}`
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF7F2",
        gap: "2.5rem",
        padding: "2rem",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "1px", height: "3rem", backgroundColor: "#C8A84B" }} />
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 300,
            letterSpacing: "0.3em",
            color: "#1B3664",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          CVYG Check-In
        </h1>
        <div style={{ width: "1px", height: "3rem", backgroundColor: "#C8A84B" }} />
      </div>

      <div
        style={{
          padding: "2rem",
          backgroundColor: "#fff",
          border: "1px solid #E8E0D0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {error && (
          <div
            style={{
              width: 220,
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Connection error
          </div>
        )}

        {!error && !checkInUrl && (
          <div
            style={{
              width: 220,
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C8A84B",
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Loading…
          </div>
        )}

        {checkInUrl && <QRCode value={checkInUrl} size={220} />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            color: "#6B6B6B",
            textTransform: "uppercase",
          }}
        >
          Scan with your phone to check in
        </p>
        <div style={{ width: "3rem", height: "1px", backgroundColor: "#C8A84B" }} />
      </div>
    </div>
  );
}
