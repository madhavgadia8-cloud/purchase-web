import Link from "next/link";
import { headers } from "next/headers";
import { db, money } from "@/lib/db";
import { deleteRfq } from "@/app/actions";
import CopyLink from "@/app/rfq/[id]/CopyLink";
import AdminShell from "@/app/AdminShell";

export const dynamic = "force-dynamic";

export default async function RfqDetail({ params }) {
  const { id } = params;
  const supabase = db();

  const { data: rfq } = await supabase.from("rfqs").select("*").eq("id", id).single();
  if (!rfq) {
    return (
      <div className="wrap">
        <div className="card">Requirement not found. <Link href="/">Back</Link></div>
      </div>
    );
  }
  const { data: items = [] } = await supabase
    .from("rfq_items").select("*").eq("rfq_id", id).order("sort");
  const { data: quotes = [] } = await supabase
    .from("quotes").select("*").eq("rfq_id", id).order("submitted_at");

  let lines = [];
  if (quotes.length) {
    const { data } = await supabase
      .from("quote_lines").select("*").in("quote_id", quotes.map((q) => q.id));
    lines = data || [];
  }

  // rate[quoteId][itemId]
  const rate = {};
  for (const l of lines) {
    (rate[l.quote_id] ||= {})[l.item_id] = Number(l.rate);
  }

  // cheapest per item
  const best = {}; // itemId -> {quoteId, rate}
  for (const it of items) {
    let b = null;
    for (const q of quotes) {
      const r = rate[q.id]?.[it.id];
      if (typeof r === "number" && (b === null || r < b.rate)) b = { quoteId: q.id, rate: r };
    }
    best[it.id] = b;
  }
  // totals
  const qTotal = {};
  for (const q of quotes) {
    let t = 0;
    for (const it of items) {
      const r = rate[q.id]?.[it.id];
      if (typeof r === "number") t += r * Number(it.qty);
    }
    qTotal[q.id] = t;
  }
  let bestTotal = 0, missing = false;
  for (const it of items) {
    const b = best[it.id];
    if (b) bestTotal += b.rate * Number(it.qty);
    else missing = true;
  }
  const fullTotals = quotes.map((q) => qTotal[q.id]).filter((t) => t > 0);
  const maxTotal = fullTotals.length ? Math.max(...fullTotals) : 0;
  const saving = maxTotal && bestTotal ? maxTotal - bestTotal : 0;
  const minTotal = fullTotals.length ? Math.min(...fullTotals) : 0;

  // vendor link
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host");
  const vendorUrl = `${proto}://${host}/quote/${id}`;

  const quoteName = (qid) => quotes.find((q) => q.id === qid)?.vendor_name || "—";

  return (
    <AdminShell>
      <div style={{ marginBottom: 14 }}>
        <Link href="/requirements" className="muted">← All requirements</Link>
      </div>
      <div>
        <div className="card">
          <h2>{rfq.title}</h2>
          <div className="muted">
            {items.length} items{rfq.required_by ? ` · required by ${rfq.required_by}` : ""}
            {rfq.notes ? ` · ${rfq.notes}` : ""}
          </div>

          <h3>Share this link with vendors</h3>
          <div className="hint" style={{ marginBottom: 8 }}>
            Anyone with the link can submit a quote for this requirement. They only see the item
            list — never other vendors&apos; prices.
          </div>
          <CopyLink url={vendorUrl} />
        </div>

        <div className="card">
          <h2>Quotes &amp; comparison</h2>
          {quotes.length === 0 ? (
            <div className="empty">No quotes yet. Share the link above; submissions appear here.</div>
          ) : (
            <>
              <div className="kpi">
                <div className="box">
                  <div className="l">Best-case total (item-wise)</div>
                  <div className="v">{money(bestTotal)}</div>
                </div>
                <div className="box">
                  <div className="l">Potential saving</div>
                  <div className="v" style={{ color: "var(--good)" }}>{money(saving)}</div>
                </div>
                <div className="box">
                  <div className="l">Quotes received</div>
                  <div className="v">{quotes.length}</div>
                </div>
              </div>
              {missing ? (
                <div className="muted" style={{ marginBottom: 8 }}>
                  ⚠ Some items have no quotes yet — totals are partial.
                </div>
              ) : null}

              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th className="num">Qty</th>
                      <th>Unit</th>
                      {quotes.map((q) => (
                        <th key={q.id} className="num">{q.vendor_name}</th>
                      ))}
                      <th>Cheapest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const b = best[it.id];
                      return (
                        <tr key={it.id}>
                          <td>{idx + 1}</td>
                          <td>{it.description}</td>
                          <td className="num">{Number(it.qty)}</td>
                          <td>{it.unit}</td>
                          {quotes.map((q) => {
                            const r = rate[q.id]?.[it.id];
                            const isBest = b && b.quoteId === q.id;
                            return (
                              <td key={q.id} className={"num" + (isBest ? " cheapest" : "")}>
                                {typeof r === "number" ? money(r) : "—"}
                              </td>
                            );
                          })}
                          <td>
                            {b ? (
                              <span className="pill green">
                                {quoteName(b.quoteId)} @ {money(b.rate)}
                              </span>
                            ) : (
                              <span className="pill grey">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>Vendor total</td>
                      {quotes.map((q) => (
                        <td key={q.id} className={"num" + (qTotal[q.id] > 0 && qTotal[q.id] === minTotal ? " cheapest" : "")}
                            style={{ fontWeight: 700 }}>
                          {qTotal[q.id] > 0 ? money(qTotal[q.id]) : "—"}
                        </td>
                      ))}
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Award summary (lowest price per item)</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Item</th><th className="num">Qty</th>
                    <th>Awarded vendor</th><th className="num">Rate</th><th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const b = best[it.id];
                    return (
                      <tr key={it.id}>
                        <td>{idx + 1}</td>
                        <td>{it.description}</td>
                        <td className="num">{Number(it.qty)}</td>
                        <td>{b ? quoteName(b.quoteId) : "—"}</td>
                        <td className="num">{b ? money(b.rate) : "—"}</td>
                        <td className="num">{b ? money(b.rate * Number(it.qty)) : "—"}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right", fontWeight: 700 }}>Best-case total</td>
                    <td className="num" style={{ fontWeight: 700 }}>{money(bestTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="card">
          <h3>Vendor contacts</h3>
          {quotes.length === 0 ? (
            <div className="muted">No submissions yet.</div>
          ) : (
            <table>
              <thead><tr><th>Vendor</th><th>Contact</th><th>Submitted</th></tr></thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td>{q.vendor_name}</td>
                    <td>{q.vendor_contact || "—"}</td>
                    <td>{new Date(q.submitted_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form action={deleteRfq} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={id} />
            <button className="btn danger sm" type="submit">Delete this requirement</button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
