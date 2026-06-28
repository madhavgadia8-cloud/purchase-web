import { db } from "@/lib/db";

// Loads all data and computes spend, savings, spend-by-vendor, monthly trend
// and price history. Pure read; derived entirely from existing tables.
export async function loadReports() {
  const supabase = db();
  const [{ data: rfqs = [] }, { data: items = [] }, { data: quotes = [] }] = await Promise.all([
    supabase.from("rfqs").select("id,title,created_at"),
    supabase.from("rfq_items").select("id,rfq_id,description,unit,qty"),
    supabase.from("quotes").select("id,rfq_id,vendor_name"),
  ]);

  let lines = [];
  if ((quotes || []).length) {
    const { data } = await supabase.from("quote_lines").select("quote_id,item_id,rate");
    lines = data || [];
  }

  const itemsByRfq = {};
  for (const it of items) (itemsByRfq[it.rfq_id] ||= []).push(it);
  const quotesByRfq = {};
  for (const q of quotes) (quotesByRfq[q.rfq_id] ||= []).push(q);
  const quoteById = {};
  for (const q of quotes) quoteById[q.id] = q;
  const itemById = {};
  for (const it of items) itemById[it.id] = it;

  // rate[quoteId][itemId]
  const rate = {};
  for (const l of lines) (rate[l.quote_id] ||= {})[l.item_id] = Number(l.rate);

  let totalSpend = 0;
  let totalSaving = 0;
  let rfqsWithQuotes = 0;
  const byVendor = {};   // vendor -> awarded amount
  const byMonth = {};    // YYYY-MM -> spend
  const awardedRows = []; // for export

  const monthKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  };

  for (const rfq of rfqs) {
    const its = itemsByRfq[rfq.id] || [];
    const qs = quotesByRfq[rfq.id] || [];
    if (!qs.length || !its.length) continue;

    // best (lowest) per item
    let bestTotal = 0;
    let rfqHasAward = false;
    for (const it of its) {
      let best = null;
      for (const q of qs) {
        const r = rate[q.id]?.[it.id];
        if (typeof r === "number" && (best === null || r < best.rate)) best = { q, rate: r };
      }
      if (best) {
        rfqHasAward = true;
        const amount = best.rate * Number(it.qty);
        bestTotal += amount;
        const vn = best.q.vendor_name || "—";
        byVendor[vn] = (byVendor[vn] || 0) + amount;
        awardedRows.push({
          requirement: rfq.title,
          item: it.description,
          qty: Number(it.qty),
          unit: it.unit || "",
          vendor: vn,
          rate: best.rate,
          amount,
          date: rfq.created_at,
        });
      }
    }
    if (!rfqHasAward) continue;
    rfqsWithQuotes++;

    // vendor totals (only quotes covering every item) for savings vs highest
    const vendorTotals = [];
    for (const q of qs) {
      let t = 0, complete = true;
      for (const it of its) {
        const r = rate[q.id]?.[it.id];
        if (typeof r !== "number") { complete = false; break; }
        t += r * Number(it.qty);
      }
      if (complete) vendorTotals.push(t);
    }
    const maxTotal = vendorTotals.length ? Math.max(...vendorTotals) : 0;
    const saving = maxTotal && bestTotal ? Math.max(0, maxTotal - bestTotal) : 0;

    totalSpend += bestTotal;
    totalSaving += saving;
    byMonth[monthKey(rfq.created_at)] = (byMonth[monthKey(rfq.created_at)] || 0) + bestTotal;
  }

  // Price history per item description
  const hist = {};
  for (const l of lines) {
    const it = itemById[l.item_id];
    const q = quoteById[l.quote_id];
    if (!it || !q) continue;
    const key = (it.description || "").trim().toLowerCase();
    if (!key) continue;
    const date = (rfqsById(rfqs)[q.rfq_id] || {}).created_at || null;
    (hist[key] ||= { desc: it.description, unit: it.unit || "", points: [] })
      .points.push({ rate: Number(l.rate), date });
  }
  const priceHistory = Object.values(hist).map((h) => {
    const rates = h.points.map((p) => p.rate).filter((r) => isFinite(r));
    const sorted = [...h.points].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1] || {};
    return {
      desc: h.desc,
      unit: h.unit,
      count: rates.length,
      low: rates.length ? Math.min(...rates) : 0,
      high: rates.length ? Math.max(...rates) : 0,
      avg: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
      latest: latest.rate || 0,
      latestDate: latest.date || null,
    };
  }).sort((a, b) => a.desc.localeCompare(b.desc));

  const vendorRows = Object.entries(byVendor)
    .map(([vendor, amount]) => ({ vendor, amount }))
    .sort((a, b) => b.amount - a.amount);
  const monthRows = Object.entries(byMonth)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalSpend,
    totalSaving,
    rfqsWithQuotes,
    quoteCount: (quotes || []).length,
    vendorRows,
    monthRows,
    priceHistory,
    awardedRows,
  };
}

function rfqsById(rfqs) {
  const m = {};
  for (const r of rfqs) m[r.id] = r;
  return m;
}
