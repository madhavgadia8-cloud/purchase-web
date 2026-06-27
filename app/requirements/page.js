import Link from "next/link";
import { db } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import NewRfqForm from "@/app/NewRfqForm";

export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  let rfqs = [];
  let products = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("rfqs")
      .select("id,title,required_by,created_at,rfq_items(count),quotes(count)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    rfqs = data || [];
    const { data: prods } = await supabase
      .from("products").select("id,name,code,unit").order("name");
    products = prods || [];
  } catch (e) {
    dbError = e.message;
  }

  return (
    <AdminShell>
      <h1 className="page-title">Requirements (RFQ)</h1>
      <p className="page-sub">Create a requirement, then share its quote link with suppliers.</p>

      {dbError ? (
        <div className="card">
          <h2>Setup needed</h2>
          <p className="muted">Could not reach the database: {dbError}</p>
        </div>
      ) : null}

      <div className="card">
        <h2>Create a purchase requirement</h2>
        <NewRfqForm products={products} />
      </div>

      <div className="card">
        <h2>Your requirements</h2>
        {rfqs.length === 0 ? (
          <div className="empty">No requirements yet. Create one above.</div>
        ) : (
          rfqs.map((r) => {
            const items = r.rfq_items?.[0]?.count ?? 0;
            const quotes = r.quotes?.[0]?.count ?? 0;
            return (
              <div className="listitem" key={r.id}>
                <div>
                  <strong>{r.title}</strong>
                  <div className="muted">
                    {items} item(s){r.required_by ? ` · by ${r.required_by}` : ""} ·{" "}
                    {quotes} quote(s) received
                  </div>
                </div>
                <Link className="btn ghost sm" href={`/rfq/${r.id}`}>Open</Link>
              </div>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
