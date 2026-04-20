"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type FormField = {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  options: string | null;
  required: boolean;
};

type Status = "loading" | "claiming" | "ready" | "submitting" | "success" | "error";

function CheckInForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});

  const claimed = useRef(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg("No check-in token found. Please scan the QR code again.");
      setStatus("error");
      return;
    }
    if (claimed.current) return;
    claimed.current = true;
    setStatus("claiming");

    Promise.all([
      fetch(`/api/checkin/claim?token=${encodeURIComponent(token)}`).then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d.error ?? "CLAIM_FAILED"));
      }),
      import("@fingerprintjs/fingerprintjs").then((FP) =>
        FP.default.load().then((fp) => fp.get()).then((r) => r.visitorId)
      ),
      new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => reject("LOCATION_DENIED")
        );
      }),
      fetch("/api/form-config").then((r) => r.json()),
    ])
      .then(([, fingerprint, location, fields]) => {
        setDeviceId(fingerprint as string);
        setCoords(location as { latitude: number; longitude: number });
        setFormFields(fields as FormField[]);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        const msg = typeof err === "string" ? err : "Something went wrong. Please scan again.";
        setErrorMsg(friendlyError(msg));
        setStatus("error");
      });
  }, [token]);

  function setExtra(key: string, value: string) {
    setExtras((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coords || !deviceId || !token) return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          extras,
          deviceId,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "SUBMIT_FAILED");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(friendlyError(err instanceof Error ? err.message : "SUBMIT_FAILED"));
      setStatus("error");
    }
  }

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      TOKEN_ALREADY_CLAIMED: "This QR code has already been scanned. Please ask for a fresh one.",
      TOKEN_EXPIRED: "This QR code has expired. Please scan the kiosk again.",
      TOKEN_NOT_FOUND: "Invalid QR code. Please scan the kiosk again.",
      OUTSIDE_GEOFENCE: "You don't appear to be at the church. Check-in requires you to be on-site.",
      DEVICE_ALREADY_CHECKED_IN: "This device has already checked in today.",
      LOCATION_DENIED: "Location access is required. Please allow location and scan again.",
    };
    return map[code] ?? "Something went wrong. Please scan the QR code again.";
  }

  if (status === "success") {
    return (
      <div style={centered}>
        <div style={{ fontSize: "2.5rem", color: "#C8A84B", marginBottom: "1rem" }}>✓</div>
        <h2 style={heading}>You&rsquo;re checked in!</h2>
        <p style={sub}>Welcome, {firstName}. See you inside.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={centered}>
        <div style={{ fontSize: "2rem", color: "#c0392b", marginBottom: "1rem" }}>✗</div>
        <h2 style={{ ...heading, color: "#c0392b" }}>Check-in failed</h2>
        <p style={sub}>{errorMsg}</p>
      </div>
    );
  }

  if (status === "loading" || status === "claiming") {
    return (
      <div style={centered}>
        <p style={sub}>{status === "claiming" ? "Verifying code…" : "Loading…"}</p>
      </div>
    );
  }

  return (
    <div style={centered}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
        <div style={{ width: "1px", height: "2.5rem", backgroundColor: "#C8A84B" }} />
        <h1 style={heading}>Check In</h1>
        <div style={{ width: "1px", height: "2.5rem", backgroundColor: "#C8A84B" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
        <input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
        <input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />

        {formFields.map((field) => {
          if (field.type === "select") {
            const opts = field.options?.split(",").map((o) => o.trim()) ?? [];
            return (
              <select
                key={field.fieldKey}
                required={field.required}
                value={extras[field.fieldKey] ?? ""}
                onChange={(e) => setExtra(field.fieldKey, e.target.value)}
                style={{ ...inputStyle, color: extras[field.fieldKey] ? "#1B3664" : "#6B6B6B" }}
              >
                <option value="" disabled>{field.label}</option>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            );
          }
          return (
            <input
              key={field.fieldKey}
              required={field.required}
              type={field.type === "number" ? "number" : "text"}
              placeholder={field.label}
              min={field.type === "number" ? 1 : undefined}
              max={field.type === "number" ? 120 : undefined}
              value={extras[field.fieldKey] ?? ""}
              onChange={(e) => setExtra(field.fieldKey, e.target.value)}
              style={inputStyle}
            />
          );
        })}

        {!coords && (
          <p style={{ ...sub, fontSize: "0.7rem", color: "#999" }}>Waiting for location access…</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !coords}
          style={{
            marginTop: "0.5rem",
            padding: "1rem",
            backgroundColor: "#1B3664",
            color: "#FAF7F2",
            border: "none",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            cursor: status === "submitting" || !coords ? "not-allowed" : "pointer",
            opacity: status === "submitting" || !coords ? 0.6 : 1,
          }}
        >
          {status === "submitting" ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <Suspense fallback={<div style={centered}><p style={sub}>Loading…</p></div>}>
          <CheckInForm />
        </Suspense>
      </div>
    </div>
  );
}

const centered: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };
const heading: React.CSSProperties = { margin: 0, fontSize: "1.25rem", fontWeight: 300, letterSpacing: "0.2em", color: "#1B3664", textTransform: "uppercase" };
const sub: React.CSSProperties = { margin: 0, fontSize: "0.8rem", letterSpacing: "0.1em", color: "#6B6B6B" };
const inputStyle: React.CSSProperties = { padding: "0.85rem 1rem", border: "1px solid #E8E0D0", backgroundColor: "#fff", fontSize: "0.85rem", color: "#1B3664", outline: "none", width: "100%", boxSizing: "border-box" };
