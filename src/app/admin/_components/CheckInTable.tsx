"use client";

import { useState } from "react";

export type FormFieldCol = {
  id: string;
  label: string;
  fieldKey: string;
  type: string;
  options: string | null;
};

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  extras: Record<string, string>;
  submittedAt: string;
  ipAddress: string;
  deviceId: string;
};

export function CheckInTable({
  initialRows,
  formFields,
}: {
  initialRows: Row[];
  formFields: FormFieldCol[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Row>>({});
  const [saving, setSaving] = useState(false);

  function startEdit(row: Row) {
    setEditing(row.id);
    setDraft({ firstName: row.firstName, lastName: row.lastName, extras: { ...row.extras } });
  }

  function cancelEdit() {
    setEditing(null);
    setDraft({});
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/checkin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...draft } : r)));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function setDraftExtra(key: string, value: string) {
    setDraft((d) => ({ ...d, extras: { ...(d.extras ?? {}), [key]: value } }));
  }

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D0", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #E8E0D0" }}>
        <h2 style={{ margin: 0, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#C8A84B", textTransform: "uppercase" }}>
          Check-Ins
        </h2>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#FAF7F2" }}>
              {["Time", "Name", ...formFields.map((f) => f.label), "IP", "Device", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "0.6rem 1rem",
                  textAlign: "left",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid #E8E0D0",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isEditing = editing === row.id;
              const border = i < rows.length - 1 ? "1px solid #F0EAE0" : "none";

              return (
                <tr key={row.id} style={{ borderBottom: border, backgroundColor: isEditing ? "#FDFAF5" : "transparent" }}>
                  <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", whiteSpace: "nowrap" }}>
                    {new Date(row.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </td>

                  <td style={{ padding: "0.7rem 1rem", whiteSpace: "nowrap" }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <input value={draft.firstName ?? ""} onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))} style={{ ...inputSm, width: "80px" }} placeholder="First" />
                        <input value={draft.lastName ?? ""} onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))} style={{ ...inputSm, width: "80px" }} placeholder="Last" />
                      </div>
                    ) : (
                      <span style={{ color: "#1B3664" }}>{row.firstName} {row.lastName}</span>
                    )}
                  </td>

                  {formFields.map((field) => (
                    <td key={field.fieldKey} style={{ padding: "0.7rem 1rem" }}>
                      {isEditing ? (
                        field.type === "select" ? (
                          <select
                            value={draft.extras?.[field.fieldKey] ?? ""}
                            onChange={(e) => setDraftExtra(field.fieldKey, e.target.value)}
                            style={inputSm}
                          >
                            {field.options?.split(",").map((o) => (
                              <option key={o.trim()} value={o.trim()}>{o.trim()}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            value={draft.extras?.[field.fieldKey] ?? ""}
                            onChange={(e) => setDraftExtra(field.fieldKey, e.target.value)}
                            style={{ ...inputSm, width: field.type === "number" ? "64px" : "100px" }}
                          />
                        )
                      ) : (
                        <span style={{ color: "#1B3664" }}>{row.extras?.[field.fieldKey] ?? "—"}</span>
                      )}
                    </td>
                  ))}

                  <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", fontFamily: "monospace", fontSize: "0.75rem" }}>{row.ipAddress}</td>
                  <td style={{ padding: "0.7rem 1rem", color: "#6B6B6B", fontFamily: "monospace", fontSize: "0.75rem" }}>{row.deviceId.slice(0, 8)}…</td>

                  <td style={{ padding: "0.7rem 1rem", whiteSpace: "nowrap" }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => saveEdit(row.id)} disabled={saving} style={btnPrimary}>{saving ? "…" : "Save"}</button>
                        <button onClick={cancelEdit} style={btnGhost}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(row)} style={btnGhost}>Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputSm: React.CSSProperties = { padding: "0.3rem 0.5rem", border: "1px solid #E8E0D0", fontSize: "0.78rem", color: "#1B3664", backgroundColor: "#fff", outline: "none" };
const btnPrimary: React.CSSProperties = { padding: "0.3rem 0.65rem", backgroundColor: "#1B3664", color: "#FAF7F2", border: "none", fontSize: "0.7rem", cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "0.3rem 0.65rem", backgroundColor: "transparent", color: "#6B6B6B", border: "1px solid #E8E0D0", fontSize: "0.7rem", cursor: "pointer" };
