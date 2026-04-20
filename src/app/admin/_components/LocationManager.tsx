"use client";

import { useState } from "react";

type Location = { id: string; label: string; lat: number; lng: number; radius: number; active: boolean };

export function LocationManager({ initial }: { initial: Location[] }) {
  const [locations, setLocations] = useState(initial);
  const [label, setLabel] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("150");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive(loc: Location) {
    const updated = { ...loc, active: !loc.active };
    setLocations((l) => l.map((x) => (x.id === loc.id ? updated : x)));
    await fetch(`/api/admin/locations/${loc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !loc.active }),
    });
  }

  async function deleteLocation(id: string) {
    if (!confirm("Remove this location?")) return;
    setLocations((l) => l.filter((x) => x.id !== id));
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
  }

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) { setError("Invalid coordinates."); return; }
    setAdding(true);
    const res = await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, lat: parsedLat, lng: parsedLng, radius: parseInt(radius) || 150 }),
    });
    if (res.ok) {
      const newLoc = await res.json();
      setLocations((l) => [...l, newLoc]);
      setLabel(""); setLat(""); setLng(""); setRadius("150");
    } else {
      setError("Failed to add location.");
    }
    setAdding(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Location list */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E8E0D0" }}>
          <h2 style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
            Allowed Locations
          </h2>
        </div>

        {locations.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6B6B6B", fontSize: "0.8rem" }}>
            No locations added. Using env var coordinates as fallback.
          </div>
        ) : (
          locations.map((loc, i) => (
            <div key={loc.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.85rem 1.5rem",
              borderBottom: i < locations.length - 1 ? "1px solid #F0EAE0" : "none",
              opacity: loc.active ? 1 : 0.45,
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.85rem", color: "#1B3664", fontWeight: 500 }}>{loc.label}</span>
                <div style={{ fontSize: "0.7rem", color: "#6B6B6B", marginTop: "0.2rem", fontFamily: "monospace" }}>
                  {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)} · {loc.radius}m radius
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                <input type="checkbox" checked={loc.active} onChange={() => toggleActive(loc)} style={{ accentColor: "#1B3664", width: 14, height: 14 }} />
                <span style={{ fontSize: "0.7rem", color: "#6B6B6B" }}>Active</span>
              </label>
              <button onClick={() => deleteLocation(loc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* Add location form */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
          Add Location
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", color: "#6B6B6B" }}>
          Find coordinates by right-clicking a location on Google Maps → &ldquo;What&apos;s here?&rdquo;
        </p>
        <form onSubmit={addLocation} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input required placeholder="Label (e.g. Mar Addai Parish)" value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "0.75rem" }}>
            <input required placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} style={inputStyle} />
            <input required placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} style={inputStyle} />
            <input placeholder="Radius (m)" value={radius} onChange={(e) => setRadius(e.target.value)} style={inputStyle} />
          </div>
          {error && <p style={{ margin: 0, fontSize: "0.75rem", color: "#c0392b" }}>{error}</p>}
          <button type="submit" disabled={adding} style={{ alignSelf: "flex-start", padding: "0.6rem 1.25rem", backgroundColor: "#1B3664", color: "#FAF7F2", border: "none", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.6 : 1 }}>
            {adding ? "Adding…" : "Add Location"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "0.7rem 0.85rem", border: "1px solid #E8E0D0", backgroundColor: "#FAF7F2", fontSize: "0.82rem", color: "#1B3664", outline: "none", width: "100%", boxSizing: "border-box" };
