"use client";

import { createProduct } from "@/app/actions";

export default function ProductForm({ error }) {
  return (
    <form action={createProduct}>
      <div className="row">
        <div style={{ flex: 2 }}>
          <label>Product name *</label>
          <input name="name" placeholder="e.g. A4 Copier paper" required />
          {error ? <div className="err">Please enter a product name.</div> : null}
        </div>
        <div>
          <label>Code / SKU</label>
          <input name="code" placeholder="Optional" />
        </div>
        <div>
          <label>Unit</label>
          <input name="unit" placeholder="pcs / kg / box" />
        </div>
        <div>
          <label>Category</label>
          <input name="category" placeholder="Optional" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Notes</label>
        <input name="notes" placeholder="Optional" />
      </div>
      <button className="btn" type="submit" style={{ marginTop: 14 }}>Add product</button>
    </form>
  );
}
