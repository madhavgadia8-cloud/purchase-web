import { db } from "@/lib/db";
import { submitQuote } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function VendorQuote({ params, searchParams }) {
  const { id } = params;
  const supabase = db();
  const { data: rfq } = await supabase.from("rfqs").select("*").eq("id", id).single();
  if (!rfq) {
    return (
      <div className="wrap">
        <div className="card"><h2>Link not found</h2><p className="muted">This quote link is invalid or has been removed.</p></div>
      </div>
    );
  }
  const { data: items = [] } = await supabase
    .from("rfq_items").select("*").eq("rfq_id", id).order("sort");
  const nameErr = searchParams?.e === "name";

  return (
    <>
      <div className="topbar"><h1>📦 Request for Quotation</h1></div>
      <div className="wrap">
        <div className="card">
          <h2>{rfq.title}</h2>
          <div className="muted">
            {rfq.required_by ? `Required by ${rfq.required_by}` : ""}
            {rfq.notes ? ` · ${rfq.notes}` : ""}
          </div>
          <div className="hint" style={{ marginTop: 12 }}>
            Please enter your rate for each item below and submit. Leave an item blank if you cannot supply it.
          </div>
        </div>

        <form action={submitQuote}>
          <input type="hidden" name="rfq_id" value={id} />
          <div className="card">
            <div className="row">
              <div>
                <label>Your company name *</label>
                <input name="vendor_name" required />
                {nameErr ? <div className="err">Please enter your company name.</div> : null}
              </div>
              <div>
                <label>Contact (email / phone)</label>
                <input name="vendor_contact" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Your rates</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Description</th><th className="num">Qty</th><th>Unit</th>
                    <th className="num">Your rate (per unit)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id}>
                      <td>{idx + 1}</td>
                      <td>{it.description}</td>
                      <td className="num">{Number(it.qty)}</td>
                      <td>{it.unit}</td>
                      <td className="num">
                        <input type="hidden" name="item_id" value={it.id} />
                        <input name="rate" type="number" min="0" step="any"
                               style={{ width: 120, textAlign: "right" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn" type="submit" style={{ marginTop: 14 }}>Submit quote</button>
          </div>
        </form>
      </div>
    </>
  );
}
