"use client";

import { useState } from "react";
import { createRfq } from "@/app/actions";

export default function NewRfqForm({ products = [] }) {
  const [rows, setRows] = useState([{ d: "", q: "", u: "" }]);

  const update = (i, k, v) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  // When a description matches a saved product, auto-fill its unit.
  const onDesc = (i, v) => {
    const match = products.find((p) => p.name.toLowerCase() === v.trim().toLowerCase());
    setRows((r) =>
      r.map((row, idx) =>
        idx === i ? { ...row, d: v, u: match && match.unit ? match.unit : row.u } : row
      )
    );
  };

  const add = () => setRows((r) => [...r, { d: "", q: "", u: "" }]);
  const remove = (i) => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  return (
    <form action={createRfq}>
      <datalist id="product-list">
        {products.map((p) => (
          <option key={p.id} value={p.name}>
            {p.code ? `${p.code} · ` : ""}{p.unit ? `${p.unit}` : ""}
          </option>
        ))}
      </datalist>

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
      {products.length > 0 ? (
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
          Start typing in Description to pick from your {products.length} saved product(s) — the unit fills in automatically.
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
          Tip: add products in the Products tab and they&apos;ll appear here as pick-from suggestions.
        </div>
      )}
      {rows.map((row, i) => (
        <div className="itemrow" key={i}>
          <input
            className="d"
            name="desc"
            list="product-list"
            placeholder="Type or pick a product"
            value={row.d}
            onChange={(e) => onDesc(i, e.target.value)}
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
