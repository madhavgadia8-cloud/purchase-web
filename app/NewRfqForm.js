"use client";

import { useState } from "react";
import { createRfq } from "@/app/actions";

export default function NewRfqForm() {
  const [rows, setRows] = useState([{ d: "", q: "", u: "" }]);

  const update = (i, k, v) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const add = () => setRows((r) => [...r, { d: "", q: "", u: "" }]);
  const remove = (i) => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  return (
    <form action={createRfq}>
      <div className="row">
        <div style={{ flex: 2 }}>
          <label>Title / reference</label>
          <input name="title" placeholder="e.g. Office furniture – July" required />
        </div>
        <div>
          <label>Required by</label>
          <input name="required_by" type="date" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Notes (delivery, terms…)</label>
        <textarea name="notes" rows={2} />
      </div>

      <h3>Line items</h3>
      {rows.map((row, i) => (
        <div className="itemrow" key={i}>
          <input
            className="d"
            name="desc"
            placeholder="Description"
            value={row.d}
            onChange={(e) => update(i, "d", e.target.value)}
          />
          <input
            className="q"
            name="qty"
            type="number"
            min="0"
            step="any"
            placeholder="Qty"
            value={row.q}
            onChange={(e) => update(i, "q", e.target.value)}
          />
          <input
            className="u"
            name="unit"
            placeholder="Unit"
            value={row.u}
            onChange={(e) => update(i, "u", e.target.value)}
          />
          <button type="button" className="btn danger sm" onClick={() => remove(i)}>
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn ghost sm" onClick={add}>
          + Add item
        </button>
        <button type="submit" className="btn">
          Save requirement
        </button>
      </div>
    </form>
  );
}
