import { db } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import SupplierForm from "@/app/SupplierForm";
import SuppliersTable from "@/app/SuppliersTable";

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
          <SuppliersTable suppliers={suppliers} />
        )}
      </div>
    </AdminShell>
  );
}
