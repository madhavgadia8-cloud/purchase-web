import Link from "next/link";
import { headers } from "next/headers";
import { db, money } from "@/lib/db";
import { deleteRfq, sendRfqEmail, approveInbound, rejectInbound, addManualQuote, deleteQuote } from "@/app/actions";
import CopyLink from "@/app/rfq/[id]/CopyLink";
import AdminShell from "@/app/AdminShell";
import SubmitButton from "@/app/SubmitButton";

export const dynamic = "force-dynamic";

export default async function RfqDetail({ params, searchParams }) {
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
  const { data: suppliers = [] } = await supabase
    .from("suppliers").select("*").order("name");
  const { data: inbound = [] } = await supabase
    .from("inbound_quotes").select("*").eq("rfq_id", id).eq("status", "pending").order("created_at");

  let lines = [];
  if (quotes.length) {
    const { data } = await supabase
      .from("quote_lines").select("*").in("quote_id", quotes.map((q) => q.id));
    lines = data || [];
  }

  const rate = {};
  for (const l of lines) {
    (rate[l.quote_id] ||= {})[l.item_id] = Number(l.rate);
  }

  const best = {};
  for (const it of items) {
    let b = null;
    for (const q of quotes) {
      const r = rate[q.id]?.[it.id];
      if (typeof r === "number" && (b === null || r < b.rate)) b = { quoteId: q.id, rate: r };
    }
    best[it.id] = b;
  }
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
  const winningQuoteIds = [...new Set(items.map((it) => best[it.id]?.quoteId).filter(Boolean))];

  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host");
  const vendorUrl = `${proto}://${host}/quote/${id}`;

  const quoteName = (qid) => quotes.find((q) => q.id === qid)?.vendor_name || "—";

  const waText =
    `Request for Quotation from Kalpana Industries\n\n` +
    `${rfq.title}${rfq.required_by ? ` (required by ${rfq.required_by})` : ""}\n` +
    `${items.length} item(s).\n\nPlease submit your quote here: ${vendorUrl}\nRef: ${id}`;
  const waHref = (phone) =>
    `https://wa.me/${String(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`;

  const sent = searchParams?.sent;
  const sentTo = searchParams?.to;
  let sentBanner = null;
  if (sent === "1")
    sentBanner = <div className="hint" style={{ background: "#eaf6df", borderColor: "#bfe3a0", color: "#2f6b16" }}>✓ Email sent{sentTo ? ` to ${sentTo}` : ""}.</div>;
  else if (sent === "config")
    sentBanner = <div className="err">Email isn&apos;t configured yet. Add RESEND_API_KEY and RFQ_FROM in Vercel, then redeploy.</div>;
  else if (sent === "fail")
    sentBanner = <div className="err">Could not send. Check the address and your Resend/domain setup.</div>;
  else if (sent === "noemail")
    sentBanner = <div className="err">Enter an email address.</div>;

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
          <h2>Send this RFQ to suppliers</h2>
          {sentBanner}
          <div className="hint" style={{ margin: "10px 0 14px" }}>
            <strong>Email</strong> sends the RFQ with a quote link from your domain.{" "}
            <strong>WhatsApp</strong> opens a pre-filled message you tap to send.
          </div>
          {suppliers.length === 0 ? (
            <div className="muted">No suppliers saved yet. Add them in the Suppliers tab for one-click sending — or use the manual email below.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Supplier</th><th>Email</th><th>Phone</th><th>Send</th></tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.email || "—"}</td>
                      <td>{s.phone || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {s.email ? (
                            <form action={sendRfqEmail}>
                              <input type="hidden" name="rfq_id" value={id} />
                              <input type="hidden" name="to" value={s.email} />
                              <button className="btn sm" type="submit">✉ Email</button>
                            </form>
                          ) : null}
                          {s.phone ? (
                            <a className="btn ghost sm" href={waHref(s.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>Or email any address</h3>
          <form action={sendRfqEmail} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="hidden" name="rfq_id" value={id} />
            <input name="to" type="email" placeholder="supplier@example.com" style={{ maxWidth: 280 }} />
            <button className="btn sm" type="submit">Send email</button>
          </form>
        </div>

        <div className="card">
          <h2>Add a quote manually</h2>
          <div className="hint" style={{ marginBottom: 12 }}>
            Got a price by phone, WhatsApp or email? Enter it here so it joins the comparison.
          </div>
          <form action={addManualQuote}>
            <input type="hidden" name="rfq_id" value={id} />
            <div className="row">
              <div><label>Vendor name *</label><input name="vendor_name" required /></div>
              <div><label>Contact (optional)</label><input name="vendor_contact" /></div>
            </div>
            <div style={{ marginTop: 10 }}><label>Notes (optional)</label><input name="notes" /></div>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table>
                <thead><tr><th>#</th><th>Item</th><th className="num">Qty</th><th>Unit</th><th className="num">Rate</th></tr></thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id}>
                      <td>{idx + 1}</td>
                      <td>{it.description}</td>
                      <td className="num">{Number(it.qty)}</td>
                      <td>{it.unit}</td>
                      <td className="num">
                        <input type="hidden" name="item_id" value={it.id} />
                        <input name="rate" type="number" step="any" style={{ width: 110, textAlign: "right" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SubmitButton className="btn" style={{ marginTop: 12 }} pendingText="Adding…">Add quote</SubmitButton>
          </form>
        </div>

        {(inbound || []).length > 0 ? (
          <div className="card">
            <h2>Email replies — AI drafts ({inbound.length})</h2>
            <div className="hint" style={{ marginBottom: 12 }}>
              These arrived from vendors replying by email. The AI read the rates below — check/fix them, then Approve to add to the comparison.
            </div>
            {inbound.map((ib) => {
              const ai = ib.ai_extracted || {};
              const aiLines = ai.lines || [];
              const rateFor = (itemId) => {
                const l = aiLines.find((x) => x.item_id === itemId);
                return l && l.rate != null ? l.rate : "";
              };
              return (
                <div key={ib.id} className="card" style={{ background: "#fafafa" }}>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    From <strong>{ib.from_email || "unknown"}</strong>
                    {ib.subject ? ` · ${ib.subject}` : ""} · {new Date(ib.created_at).toLocaleString()}
                  </div>
                  <form action={approveInbound}>
                    <input type="hidden" name="inbound_id" value={ib.id} />
                    <input type="hidden" name="rfq_id" value={id} />
                    <div className="row" style={{ marginBottom: 8 }}>
                      <div>
                        <label>Vendor name</label>
                        <input name="vendor_name" defaultValue={ai.vendor_name || ib.from_email || ""} />
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead><tr><th>#</th><th>Item</th><th className="num">Qty</th><th className="num">Rate (AI read)</th></tr></thead>
                        <tbody>
                          {items.map((it, idx) => (
                            <tr key={it.id}>
                              <td>{idx + 1}</td>
                              <td>{it.description}</td>
                              <td className="num">{Number(it.qty)}</td>
                              <td className="num">
                                <input type="hidden" name="item_id" value={it.id} />
                                <input name="rate" type="number" step="any" defaultValue={rateFor(it.id)} style={{ width: 110, textAlign: "right" }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <details style={{ margin: "10px 0" }}>
                      <summary className="muted">Show original email</summary>
                      <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#fff", border: "1px solid var(--line)", padding: 10, borderRadius: 8 }}>{ib.body_text}</pre>
                    </details>
                    <button className="btn" type="submit">Approve &rarr; add to comparison</button>
                  </form>
                  <form action={rejectInbound} style={{ marginTop: 6 }}>
                    <input type="hidden" name="inbound_id" value={ib.id} />
                    <input type="hidden" name="rfq_id" value={id} />
                    <button className="btn danger sm" type="submit">Reject</button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : null}

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

              <h3>Purchase Orders</h3>
              <div className="muted" style={{ marginBottom: 8 }}>
                One PO per winning vendor (lowest-price items). Opens a printable page — use Print / Save as PDF.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {winningQuoteIds.map((qid) => (
                  <a key={qid} className="btn ghost sm" href={`/rfq/${id}/po/${qid}`} target="_blank" rel="noreferrer">
                    PO — {quoteName(qid)}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3>Vendor contacts</h3>
          {quotes.length === 0 ? (
            <div className="muted">No submissions yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Vendor</th><th>Contact</th><th>Notes / spec</th><th>File</th><th>Submitted</th><th></th></tr></thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id}>
                      <td>{q.vendor_name}</td>
                      <td>{q.vendor_contact || "—"}</td>
                      <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>{q.notes || "—"}</td>
                      <td>
                        {q.attachment_url ? (
                          <a className="btn ghost sm" href={q.attachment_url} target="_blank" rel="noreferrer">View file</a>
                        ) : "—"}
                      </td>
                      <td>{new Date(q.submitted_at).toLocaleString()}</td>
                      <td>
                        <form action={deleteQuote}>
                          <input type="hidden" name="quote_id" value={q.id} />
                          <input type="hidden" name="rfq_id" value={id} />
                          <button className="btn danger sm" type="submit">Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
