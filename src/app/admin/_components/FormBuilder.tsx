"use client";

import { useState } from "react";

export type FormFieldRow = {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  options: string | null;
  required: boolean;
  active: boolean;
  order: number;
};

export function FormBuilder({ initialFields }: { initialFields: FormFieldRow[] }) {
  const [fields, setFields] = useState(initialFields);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState("text");
  const [newOptions, setNewOptions] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive(field: FormFieldRow) {
    const updated = { ...field, active: !field.active };
    setFields((f) => f.map((x) => (x.id === field.id ? updated : x)));
    await fetch(`/api/admin/form/${field.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !field.active }),
    });
  }

  async function move(field: FormFieldRow, dir: -1 | 1) {
    const idx = fields.findIndex((f) => f.id === field.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= fields.length) return;

    const next = [...fields];
    const newOrder = next[swapIdx].order;
    const oldOrder = next[idx].order;

    next[idx] = { ...next[idx], order: newOrder };
    next[swapIdx] = { ...next[swapIdx], order: oldOrder };
    next.sort((a, b) => a.order - b.order);
    setFields(next);

    await Promise.all([
      fetch(`/api/admin/form/${next[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      }),
      fetch(`/api/admin/form/${next[swapIdx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: oldOrder }),
      }),
    ]);
  }

  async function deleteField(id: string) {
    if (!confirm("Delete this field? Existing check-in data will not be affected.")) return;
    setFields((f) => f.filter((x) => x.id !== id));
    await fetch(`/api/admin/form/${id}`, { method: "DELETE" });
  }

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const key = newKey || newLabel.toLowerCase().replace(/\s+/g, "_");
    if (fields.some((f) => f.fieldKey === key)) {
      setError("A field with that key already exists.");
      return;
    }

    setAdding(true);
    const res = await fetch("/api/admin/form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newLabel,
        fieldKey: key,
        type: newType,
        options: newType === "select" ? newOptions : null,
        required: newRequired,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setFields((f) => [...f, created]);
      setNewLabel("");
      setNewKey("");
      setNewType("text");
      setNewOptions("");
      setNewRequired(true);
    } else {
      setError("Failed to add field.");
    }
    setAdding(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Fixed fields notice */}
      <div style={{ padding: "1rem 1.25rem", backgroundColor: "#fff", border: "1px solid #E8E0D0", borderLeft: "3px solid #C8A84B" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#6B6B6B", letterSpacing: "0.05em" }}>
          <strong style={{ color: "#1B3664" }}>First name</strong> and <strong style={{ color: "#1B3664" }}>Last name</strong> always appear first and cannot be removed.
        </p>
      </div>

      {/* Field list */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E8E0D0" }}>
          <h2 style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
            Configurable Fields
          </h2>
        </div>

        {fields.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6B6B6B", fontSize: "0.8rem" }}>
            No fields yet. Add one below.
          </div>
        ) : (
          fields.map((field, i) => (
            <div key={field.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.9rem 1.5rem",
              borderBottom: i < fields.length - 1 ? "1px solid #F0EAE0" : "none",
              opacity: field.active ? 1 : 0.45,
            }}>
              {/* Order arrows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button onClick={() => move(field, -1)} disabled={i === 0} style={arrowBtn}>▲</button>
                <button onClick={() => move(field, 1)} disabled={i === fields.length - 1} style={arrowBtn}>▼</button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.85rem", color: "#1B3664", fontWeight: 500 }}>{field.label}</span>
                <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#6B6B6B" }}>
                  ({field.fieldKey})
                </span>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
                  <Badge>{field.type}</Badge>
                  {field.required && <Badge gold>required</Badge>}
                  {field.type === "select" && field.options && (
                    <span style={{ fontSize: "0.68rem", color: "#6B6B6B" }}>
                      {field.options.split(",").join(" · ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={field.active}
                    onChange={() => toggleActive(field)}
                    style={{ accentColor: "#1B3664", width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "#6B6B6B", letterSpacing: "0.05em" }}>Active</span>
                </label>
                <button onClick={() => deleteField(field.id)} style={deleteBtn}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add field form */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
          Add Field
        </h2>
        <form onSubmit={addField} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              required
              placeholder="Label (e.g. Grade)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Key (auto from label)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} style={inputStyle}>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select (dropdown)</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#1B3664" }}>
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                style={{ accentColor: "#1B3664" }}
              />
              Required
            </label>
          </div>

          {newType === "select" && (
            <input
              placeholder="Options, comma-separated (e.g. Option A,Option B)"
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              style={inputStyle}
            />
          )}

          {error && <p style={{ margin: 0, fontSize: "0.75rem", color: "#c0392b" }}>{error}</p>}

          <button type="submit" disabled={adding} style={{
            alignSelf: "flex-start",
            padding: "0.6rem 1.25rem",
            backgroundColor: "#1B3664",
            color: "#FAF7F2",
            border: "none",
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: adding ? "not-allowed" : "pointer",
            opacity: adding ? 0.6 : 1,
          }}>
            {adding ? "Adding…" : "Add Field"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Badge({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span style={{
      fontSize: "0.62rem",
      padding: "0.1rem 0.4rem",
      backgroundColor: gold ? "#FDF6E3" : "#F0EAE0",
      color: gold ? "#B8860B" : "#6B6B6B",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

const arrowBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#C8A84B",
  fontSize: "0.6rem",
  padding: "1px 3px",
  lineHeight: 1,
};

const deleteBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#c0392b",
  fontSize: "0.75rem",
  padding: "0.2rem 0.4rem",
};

const inputStyle: React.CSSProperties = {
  padding: "0.7rem 0.85rem",
  border: "1px solid #E8E0D0",
  backgroundColor: "#FAF7F2",
  fontSize: "0.82rem",
  color: "#1B3664",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
