import { loadReports } from "@/lib/reports";
import { fmtDate } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function GET() {
  let rows = [];
  try {
    const r = await loadReports();
    rows = r.awardedRows || [];
  } catch (e) {
    return new Response("error," + e.message, { status: 500 });
  }
  const header = ["Requirement", "Item", "Qty", "Unit", "Awarded vendor", "Rate", "Amount", "Date"];
  const lines = [header.join(",")];
  for (const a of rows) {
    lines.push([
      a.requirement, a.item, a.qty, a.unit, a.vendor,
      a.rate, a.amount, a.date ? fmtDate(a.date) : "",
    ].map(csvCell).join(","));
  }
  const csv = "﻿" + lines.join("\r\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="awarded-items.csv"',
    },
  });
}
