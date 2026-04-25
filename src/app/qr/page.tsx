import Link from "next/link";

export default function QRPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F2", padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5rem", maxWidth: "28rem", width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 300, letterSpacing: "0.2em", color: "#1B3664", textTransform: "uppercase" }}>
            Scan to Check In
          </h1>
          <div style={{ width: "4rem", height: "1px", backgroundColor: "#C8A84B", marginTop: "0.25rem" }} />
        </div>

        <div style={{ padding: "1.5rem", backgroundColor: "#fff", border: "1px solid #E8E0D0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ width: "14rem", height: "14rem", backgroundColor: "#E8E0D0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: "#6B6B6B", textTransform: "uppercase" }}>QR Code</span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#6B6B6B", textTransform: "uppercase" }}>
          Point your camera at the code above
        </p>

        <Link href="/" style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "#1B3664", textTransform: "uppercase", textDecoration: "none" }}>
          ← Back
        </Link>
      </div>
    </div>
  );
}
