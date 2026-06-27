import { db } from "@/lib/db";
import PoDocument from "@/app/rfq/[id]/po/[quoteId]/PoDocument";

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
    const amount = r * Number(it.qty);
    total += amount;
    return { id: it.id, n: idx + 1, description: it.description, qty: Number(it.qty), unit: it.unit || "", rate: r, amount };
  });
  const year = new Date().getFullYear();
  const poNo = `${year}-${(year + 1) % 100}/${String(quoteId).replace(/[^0-9]/g, "").slice(0, 3) || "001"}`;
  const date = new Date().toLocaleDateString("en-GB");

  return (
    <PoDocument
      poNo={poNo}
      date={date}
      supplier={{ name: thisQuote.vendor_name, contact: thisQuote.vendor_contact }}
      reference={rfq.title}
      rows={rows}
      total={total}
    />
  );
}
