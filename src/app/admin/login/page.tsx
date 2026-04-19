"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid password");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#FAF7F2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: "360px", padding: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem" }}>
          <div style={{ width: "1px", height: "2.5rem", backgroundColor: "#C8A84B" }} />
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 300, letterSpacing: "0.25em", color: "#1B3664", textTransform: "uppercase" }}>
            Admin
          </h1>
          <div style={{ width: "1px", height: "2.5rem", backgroundColor: "#C8A84B" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "0.85rem 1rem",
              border: "1px solid #E8E0D0",
              backgroundColor: "#fff",
              fontSize: "0.85rem",
              color: "#1B3664",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#c0392b", textAlign: "center" }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "1rem",
              backgroundColor: "#1B3664",
              color: "#FAF7F2",
              border: "none",
              fontSize: "0.75rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
