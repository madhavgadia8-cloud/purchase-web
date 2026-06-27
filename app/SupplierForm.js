"use client";

import { createSupplier } from "@/app/actions";

export default function SupplierForm({ error }) {
  return (
    <form action={createSupplier}>
      <div className="row">
        <div style={{ flex: 2 }}>
          <label>Supplier name *</label>
          <input name="name" placeholder="e.g. ABC Traders" required />
          {error ? <div className="err">Please enter a supplier name.</div> : null}
        </div>
        <div>
          <label>Contact person</label>
          <input name="contact_person" placeholder="Optional" />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <div>
          <label>Email</label>
          <input name="email" placeholder="Optional" />
        </div>
        <div>
          <label>Phone</label>
          <input name="phone" placeholder="Optional" />
        </div>
        <div>
          <label>Category</label>
          <input name="category" placeholder="e.g. Stationery" />
        </div>
      </div>
      <button className="btn" type="submit" style={{ marginTop: 14 }}>Add supplier</button>
    </form>
  );
}
