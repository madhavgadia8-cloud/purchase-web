import { db, money } from "@/lib/db";
import AdminShell from "@/app/AdminShell";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  let entries = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data: rfqs = [] } = await supabase.from("rfqs").select("id,title,created_at").order("created_at", { ascending: false });
    const { data: items = [] } = await supabase.from("rfq_items").select("id,rfq_id,qty");
    const { data: quotes = [] } = await supabase.from("quotes").select("id,rfq_id,vendor_name");
    let lines = [];
    if (quotes.length) {
      const { data } = await supabase.from("quote_lines").select("quote_id,item_id,rate");
      lines = data || [];
    }
    const itemsByRfq = {};
    for (const it of items) (itemsByRfq[it.rfq_id] ||= []).push(it);
    const quotesByRfq = {};
    for (const q of quotes) (quotesByRfq[q.rfq_id] ||= []).push(q);
    const rate = {};
    for (const l of lines) (rate[l.quote_id] ||= {})[l.item_id] = Number(l.rate);

    for (const rfq of rfqs) {
      const its = itemsByRfq[rfq.id] || [];
      const qs = quotesByRfq[rfq.id] || [];
      if (!qs.length) continue;
      const best = {};
      for (const it of its) {
        let b = null;
        for (const q of qs) {
          const r = rate[q.id]?.[it.id];
          if (typeof r === "number" && (b === null || r < b.rate)) b = { quoteId: q.id, rate: r };
        }
        best[it.id] = b;
      }
      const byQuote = {};
      for (const it of its) {
        const b = best[it.id];
        if (!b) continue;
        (byQuote[b.quoteId] ||= { count: 0, total: 0 });
        byQuote[b.quoteId].count++;
        byQuote[b.quoteId].total += b.rate * Number(it.qty);
      }
      for (const [qid, info] of Object.entries(byQuote)) {
        const q = qs.find((x) => x.id === qid);
        entries.push({ rfqId: rfq.id, rfqTitle: rfq.title, quoteId: qid, vendor: q?.vendor_name || "—", count: info.count, total: info.total });
      }
    }
  } catch (e) {
    dbError = e.message;
  }

  return (
    <AdminShell>
      <h1 className="page-title">Purchase Orders</h1>
      <p className="page-sub">Issue a custom PO, or generate one from quotations you received.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <a className="btn" href="/purchase-orders/new" target="_blank" rel="noreferrer">+ Create custom PO</a>
        <a className="btn ghost" href="/requirements">Generate from a requirement</a>
      </div>

      <h2 style={{ margin: "0 0 12px" }}>POs from received quotations</h2>
      <div className="card">
        {dbError ? (
          <p className="muted">Could not load: {dbError}</p>
        ) : entries.length === 0 ? (
          <div className="empty">No POs from quotations yet. Add quotes to a requirement and award the cheapest — they appear here. Or use “Create custom PO” above.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Requirement</th><th>Awarded vendor</th><th className="num">Items</th><th className="num">Amount</th><th></th></tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.rfqTitle}</td>
                    <td><strong>{e.vendor}</strong></td>
                    <td className="num">{e.count}</td>
                    <td className="num">{money(e.total)}</td>
                    <td>
                      <a className="btn ghost sm" href={`/rfq/${e.rfqId}/po/${e.quoteId}`} target="_blank" rel="noreferrer">Open PO</a>
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
