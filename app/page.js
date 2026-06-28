import Link from "next/link";
import { db } from "@/lib/db";
import AdminShell from "@/app/AdminShell";

export const dynamic = "force-dynamic";

async function counts(supabase, table) {
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count || 0;
}

export default async function Dashboard({ searchParams }) {
  const denied = searchParams?.denied === "1";
  let dbError = null;
  let rfqCount = 0, quoteCount = 0, productCount = 0, supplierCount = 0, openCount = 0;
  let recent = [];
  try {
    const supabase = db();
    [rfqCount, quoteCount, productCount, supplierCount] = await Promise.all([
      counts(supabase, "rfqs"),
      counts(supabase, "quotes"),
      counts(supabase, "products"),
      counts(supabase, "suppliers"),
    ]);
    const { data } = await supabase
      .from("rfqs")
      .select("id,title,required_by,created_at,rfq_items(count),quotes(count)")
      .order("created_at", { ascending: false })
      .limit(6);
    recent = data || [];
    openCount = recent.filter((r) => (r.quotes?.[0]?.count ?? 0) === 0).length;
  } catch (e) {
    dbError = e.message;
  }

  const Kpi = ({ label, value, color }) => (
    <div className="box">
      <div className="l">{label}</div>
      <div className="v" style={color ? { color } : null}>{value}</div>
    </div>
  );

  return (
    <AdminShell>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Overview of your purchasing activity.</p>

      {denied ? (
        <div className="err" style={{ marginBottom: 14 }}>
          That action needs an Admin account. Your role is read-only (Viewer).
        </div>
      ) : null}

      {dbError ? (
        <div className="card">
          <h2>Setup needed</h2>
          <p className="muted">
            Could not reach the database: {dbError}. Make sure you ran the latest schema SQL in
            Supabase and that the <code>SUPABASE_SERVICE_ROLE_KEY</code> is the secret key.
          </p>
        </div>
      ) : (
        <>
          <div className="kpi">
            <Kpi label="Requirements (RFQs)" value={rfqCount} />
            <Kpi label="Quotes received" value={quoteCount} color="var(--good)" />
            <Kpi label="Awaiting quotes" value={openCount} color="#b45309" />
            <Kpi label="Products" value={productCount} />
            <Kpi label="Suppliers" value={supplierCount} />
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Recent requirements</h2>
              <Link className="btn sm" href="/requirements">+ New requirement</Link>
            </div>
            <div style={{ marginTop: 14 }}>
              {recent.length === 0 ? (
                <div className="empty">No requirements yet. Create your first one.</div>
              ) : (
                recent.map((r) => {
                  const items = r.rfq_items?.[0]?.count ?? 0;
                  const quotes = r.quotes?.[0]?.count ?? 0;
                  return (
                    <div className="listitem" key={r.id}>
                      <div>
                        <strong>{r.title}</strong>
                        <div className="muted">
                          {items} item(s){r.required_by ? ` · by ${r.required_by}` : ""} ·{" "}
                          {quotes > 0 ? (
                            <span className="pill green">{quotes} quote(s)</span>
                          ) : (
                            <span className="pill grey">awaiting quotes</span>
                          )}
                        </div>
                      </div>
                      <Link className="btn ghost sm" href={`/rfq/${r.id}`}>Open</Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card">
            <h2>Quick actions</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href="/requirements">Create a requirement</Link>
              <Link className="btn ghost" href="/products">Add a product</Link>
              <Link className="btn ghost" href="/suppliers">Add a supplier</Link>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
