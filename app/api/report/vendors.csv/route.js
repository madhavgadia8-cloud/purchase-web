import { loadReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function GET() {
  let r;
  try {
    r = await loadReports();
  } catch (e) {
    return new Response("error," + e.message, { status: 500 });
  }
  const lines = [["Vendor", "Awarded spend"].join(",")];
  for (const v of r.vendorRows || []) {
    lines.push([v.vendor, v.amount].map(csvCell).join(","));
  }
  lines.push("");
  lines.push(["Total spend", r.totalSpend].map(csvCell).join(","));
  lines.push(["Savings achieved", r.totalSaving].map(csvCell).join(","));
  const csv = "﻿" + lines.join("\r\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="spend-by-vendor.csv"',
    },
  });
}
