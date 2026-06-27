import { db } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import SupplierForm from "@/app/SupplierForm";
import { deleteSupplier } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({ searchParams }) {
  let suppliers = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    suppliers = data || [];
  } catch (e) {
    dbError = e.message;
  }

  return (
    <AdminShell>
      <h1 className="page-title">Suppliers</h1>
      <p className="page-sub">Your supplier directory — keep contacts handy for sending quote links.</p>

      <div className="card">
        <h2>Add a supplier</h2>
        <SupplierForm error={searchParams?.e === "name"} />
      </div>

      <div className="card">
        <h2>All suppliers ({suppliers.length})</h2>
        {dbError ? (
          <p className="muted">
            Could not load suppliers: {dbError}. Did you run the latest schema SQL in Supabase?
          </p>
        ) : suppliers.length === 0 ? (
          <div className="empty">No suppliers yet. Add your first one above.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Category</th><th></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.contact_person || "—"}</td>
                    <td>{s.email || "—"}</td>
                    <td>{s.phone || "—"}</td>
                    <td>{s.category || "—"}</td>
                    <td>
                      <form action={deleteSupplier}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="btn danger sm" type="submit">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
