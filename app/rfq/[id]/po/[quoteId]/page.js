import { db, money } from "@/lib/db";
import Logo from "@/app/Logo";
import PrintButton from "@/app/rfq/[id]/po/[quoteId]/PrintButton";

export const dynamic = "force-dynamic";

export default async function PurchaseOrder({ params }) {
  const { id, quoteId } = params;
  const supabase = db();
  const { data: rfq } = await supabase.from("rfqs").select("*").eq("id", id).single();
  const { data: items = [] } = await supabase
    .from("rfq_items").select("*").eq("rfq_id", id).order("sort");
  const { data: quotes = [] } = await supabase.from("quotes").select("*").eq("rfq_id", id);
  let lines = [];
  if (quotes.length) {
    const { data } = await supabase.from("quote_lines").select("*").in("quote_id", quotes.map((q) => q.id));
    lines = data || [];
  }
  const rate = {};
  for (const l of lines) (rate[l.quote_id] ||= {})[l.item_id] = Number(l.rate);
  const best = {};
  for (const it of items) {
    let b = null;
    for (const q of quotes) {
      const r = rate[q.id]?.[it.id];
      if (typeof r === "number" && (b === null || r < b.rate)) b = { quoteId: q.id, rate: r };
    }
    best[it.id] = b;
  }
  const thisQuote = quotes.find((q) => q.id === quoteId);
  if (!rfq || !thisQuote) {
    return <div className="wrap"><div className="card">Purchase order not found.</div></div>;
  }
  const won = items.filter((it) => best[it.id] && best[it.id].quoteId === quoteId);
  let total = 0;
  const rows = won.map((it, idx) => {
    const r = rate[quoteId][it.id];
    const amt = r * Number(it.qty);
    total += amt;
    return { n: idx + 1, it, r, amt };
  });
  const poNo = `PO-${String(id).slice(0, 4)}-${String(quoteId).slice(0, 4)}`.toUpperCase();
  const today = new Date().toLocaleDateString();

  return (
    <div className="wrap" style={{ maxWidth: 800 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--brand)", paddingBottom: 14, marginBottom: 16 }}>
          <Logo size={48} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#374151" }}>PURCHASE ORDER</div>
            <div className="muted">{poNo}</div>
            <div className="muted">Date: {today}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14 }}>
          <div>
            <div className="muted" style={{ textTransform: "uppercase", fontSize: 11 }}>Supplier</div>
            <div style={{ fontWeight: 700 }}>{thisQuote.vendor_name}</div>
            <div className="muted">{thisQuote.vendor_contact || ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ textTransform: "uppercase", fontSize: 11 }}>Reference</div>
            <div>{rfq.title}</div>
            {rfq.required_by ? <div className="muted">Required by {rfq.required_by}</div> : null}
          </div>
        </div>

        <table>
          <thead>
            <tr><th>#</th><th>Description</th><th className="num">Qty</th><th>Unit</th><th className="num">Rate</th><th className="num">Amount</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.it.id}>
                <td>{row.n}</td>
                <td>{row.it.description}</td>
                <td className="num">{Number(row.it.qty)}</td>
                <td>{row.it.unit}</td>
                <td className="num">{money(row.r)}</td>
                <td className="num">{money(row.amt)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
              <td className="num" style={{ fontWeight: 700 }}>{money(total)}</td>
            </tr>
          </tbody>
        </table>

        {rfq.notes ? <p className="muted" style={{ marginTop: 12 }}>Notes: {rfq.notes}</p> : null}
        <p className="muted" style={{ marginTop: 24, fontSize: 12 }}>
          Kalpana Industries — Engineered Power Solutions. This PO is generated from the lowest-price award for the above requirement.
        </p>
        <div style={{ marginTop: 16 }} className="no-print">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
