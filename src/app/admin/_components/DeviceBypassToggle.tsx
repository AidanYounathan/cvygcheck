"use client";

import { useState } from "react";

export function DeviceBypassToggle({ initial }: { initial: boolean }) {
  const [bypassed, setBypassed] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !bypassed;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bypass_device_limit: String(next) }),
    });
    setBypassed(next);
    setSaving(false);
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: bypassed ? "#FFF8E7" : "#fff",
      border: `1px solid ${bypassed ? "#C8A84B" : "#E8E0D0"}`,
      borderLeft: `3px solid ${bypassed ? "#C8A84B" : "#E8E0D0"}`,
      padding: "0.9rem 1.25rem",
    }}>
      <div>
        <span style={{ fontSize: "0.8rem", color: "#1B3664", fontWeight: 500 }}>Device Limit Bypass</span>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.7rem", color: "#6B6B6B" }}>
          {bypassed ? "⚠ Device limit is OFF — same device can check in multiple times." : "Device limit is active — one check-in per device per day."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        style={{
          padding: "0.4rem 1rem",
          backgroundColor: bypassed ? "#C8A84B" : "#1B3664",
          color: "#FAF7F2",
          border: "none",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {saving ? "…" : bypassed ? "Turn Off" : "Turn On"}
      </button>
    </div>
  );
}
