# Dynamic Forms

← [[06 - Geofencing]] | Next: [[08 - Admin Dashboard]] →

---

## The Problem

The check-in form needs different questions depending on the event. One week you want age and parish. Next week you might want a shirt size for a giveaway or a ministry they're interested in.

Hardcoding these fields in the React component would mean a code change + redeploy every time. Instead, the fields are stored in the database and the form reads them at runtime.

---

## How It Works

### 1. Admin defines fields in the Form Builder

At `/admin/form`, admins can create, reorder, activate, and delete fields. Each field has:
- **Label** — What the user sees ("Parish")
- **Field Key** — The JSON key for the answer (`"parish"`)
- **Type** — `text`, `number`, or `select`
- **Options** — For selects only, comma-separated: `"Mar Addai,Mor Aphrem,Saint Mary,Other"`
- **Required** — Whether the field must be filled
- **Active** — Whether it appears on the form

### 2. Form fetches the schema

When `/checkin` loads, it fetches `GET /api/form-config`. This returns an array of active fields, sorted by their `order` value:

```json
[
  { "fieldKey": "age", "label": "Age", "type": "number", "required": true },
  { "fieldKey": "parish", "label": "Parish", "type": "select", "options": "Mar Addai,Mor Aphrem,Saint Mary,Saint Joseph,Other", "required": true }
]
```

### 3. Form renders dynamically

The check-in form iterates over the fields and renders the right input type:

```tsx
{formFields.map((field) => (
  field.type === "select" ? (
    <select value={extras[field.fieldKey] ?? ""} onChange={...}>
      {field.options.split(",").map((opt) => <option key={opt}>{opt}</option>)}
    </select>
  ) : (
    <input type={field.type} value={extras[field.fieldKey] ?? ""} onChange={...} />
  )
))}
```

### 4. Answers stored in `extras` JSON

Instead of having a column for each field (`age INTEGER, parish VARCHAR`), all answers go into one JSON column:

```json
// CheckIn.extras
{ "age": "22", "parish": "Mar Addai" }
```

This means adding a new form field requires **zero database migrations** — the answer just gets a new key in the JSON object.

---

## Auto-Seeding Default Fields

The first time `GET /api/form-config` is called and the database is empty, it automatically creates two default fields:

```ts
const DEFAULT_FIELDS = [
  { label: "Age", fieldKey: "age", type: "number", required: true, active: true, order: 0 },
  { label: "Parish", fieldKey: "parish", type: "select", options: "Mar Addai,Mor Aphrem,Saint Mary,Saint Joseph,Other", required: true, active: true, order: 1 },
];
```

This means you don't have to manually set up fields on a fresh deploy.

---

## The Trade-offs of JSON Storage

**Advantages:**
- Add/remove fields without migrations
- Historical check-ins keep their original data even after fields are deleted
- Single flexible column instead of many nullable columns

**Disadvantages:**
- Can't easily query "all check-ins where age > 18" with standard SQL
- Type safety is lost (everything is a string in the JSON)
- Need to know the field keys to read the data

For an attendance system where you mostly read all data for a given day, this trade-off is worth it.

---

## Field Key Convention

Field keys are auto-generated from labels if not specified:
- Lowercase
- Spaces replaced with underscores
- Example: "Home Parish" → `"home_parish"`

**Keys must be unique** — the `fieldKey` column has a `@unique` constraint. If you try to create two fields with the same key, the API returns an error.

---

## First/Last Name Are Special

The form always shows First Name and Last Name fields. These are **not** FormField records in the database — they're hardcoded into the form component and stored in dedicated `firstName`/`lastName` columns on the CheckIn model.

The Form Builder shows a notice reminding you: "First name and last name are always included."

---

## Admin View

The check-in table in the admin dashboard uses `formFields` to render the right columns dynamically:

```tsx
// Admin CheckInTable.tsx
{formFields.map((field) => (
  <th key={field.fieldKey}>{field.label}</th>
))}

// For each row:
{formFields.map((field) => (
  <td key={field.fieldKey}>{row.extras[field.fieldKey] ?? "—"}</td>
))}
```

If you add a new field, it automatically appears as a new column in the admin table.

---

← [[06 - Geofencing]] | Next: [[08 - Admin Dashboard]] →
