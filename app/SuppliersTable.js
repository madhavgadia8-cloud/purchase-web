"use client";

import { useState } from "react";
import { updateSupplier, deleteSupplier } from "@/app/actions";

function Row({ s }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr>
        <td colSpan={6}>
          <form action={updateSupplier} style={{ width: "100%" }}>
            <input type="hidden" name="id" value={s.id} />
            <div className="row">
              <div style={{ flex: 2 }}>
                <label>Name *</label>
                <input name="name" defaultValue={s.name || ""} required />
              </div>
              <div>
                <label>Contact</label>
                <input name="contact_person" defaultValue={s.contact_person || ""} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <label>Email</label>
                <input name="email" defaultValue={s.email || ""} />
              </div>
              <div>
                <label>Phone</label>
                <input name="phone" defaultValue={s.phone || ""} />
              </div>
              <div>
                <label>Category</label>
                <input name="category" defaultValue={s.category || ""} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn sm" type="submit">Save</button>
              <button className="btn ghost sm" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td><strong>{s.name}</strong></td>
      <td>{s.contact_person || "—"}</td>
      <td>{s.email || "—"}</td>
      <td>{s.phone || "—"}</td>
      <td>{s.category || "—"}</td>
      <td>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost sm" type="button" onClick={() => setEditing(true)}>Edit</button>
          <form action={deleteSupplier}>
            <input type="hidden" name="id" value={s.id} />
            <button className="btn danger sm" type="submit">Delete</button>
          </form>
        </div>
      </td>
    </tr>
  );
}

export default function SuppliersTable({ suppliers = [] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Category</th><th></th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
