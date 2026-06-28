import { money, fmtDate } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import { loadReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

function Bar({ label, value, max, suffix }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
        <span>{label}</span>
        <strong>{suffix ? suffix + " " : ""}{money(value)}</strong>
      </div>
      <div style={{ background: "#eef0f3", borderRadius: 6, height: 14 }}>
        <div style={{ width: pct + "%", height: 14, borderRadius: 6, background: "var(--brand, #F7941E)" }} />
      </div>
    </div>
  );
}

const monthName = (ym) => {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-GB", { month: "short" }) + " " + y;
};

export default async function ReportsPage() {
  let r = null;
  let dbError = null;
  try {
    r = await loadReports();
  } catch (e) {
    dbError = e.message;
  }

  if (dbError) {
    return (
      <AdminShell>
        <h1 className="page-title">Reports</h1>
        <div className="card"><p className="muted">Could not load reports: {dbError}</p></div>
      </AdminShell>
    );
  }

  const vendorMax = Math.max(1, ...r.vendorRows.map((v) => v.amount));
  const monthMax = Math.max(1, ...r.monthRows.map((m) => m.amount));

  return (
    <AdminShell>
      <h1 className="page-title">Reports &amp; analytics</h1>
      <p className="page-sub">Spend, savings and price trends — based on the lowest-quoted (awarded) prices.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <a className="btn" href="/api/report/awarded.csv" target="_blank" rel="noreferrer">⬇ Download awarded items (Excel)</a>
        <a className="btn ghost" href="/api/report/vendors.csv" target="_blank" rel="noreferrer">⬇ Spend by vendor (Excel)</a>
      </div>

      <div className="kpi">
        <div className="box">
          <div className="l">Total spend (awarded)</div>
          <div className="v">{money(r.totalSpend)}</div>
        </div>
        <div className="box">
          <div className="l">Savings achieved</div>
          <div className="v" style={{ color: "var(--good)" }}>{money(r.totalSaving)}</div>
        </div>
        <div className="box">
          <div className="l">Requirements awarded</div>
          <div className="v">{r.rfqsWithQuotes}</div>
        </div>
        <div className="box">
          <div className="l">Quotes received</div>
          <div className="v">{r.quoteCount}</div>
        </div>
      </div>

      <div className="card">
        <h2>Spend by vendor</h2>
        {r.vendorRows.length === 0 ? (
          <div className="empty">No awarded spend yet.</div>
        ) : (
          r.vendorRows.map((v) => <Bar key={v.vendor} label={v.vendor} value={v.amount} max={vendorMax} />)
        )}
      </div>

      <div className="card">
        <h2>Monthly spend</h2>
        {r.monthRows.length === 0 ? (
          <div className="empty">No spend recorded yet.</div>
        ) : (
          r.monthRows.map((m) => <Bar key={m.month} label={monthName(m.month)} value={m.amount} max={monthMax} />)
        )}
      </div>

      <div className="card">
        <h2>Price history (per item)</h2>
        {r.priceHistory.length === 0 ? (
          <div className="empty">No quote prices yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th><th>Unit</th><th className="num">Quotes</th>
                  <th className="num">Lowest</th><th className="num">Highest</th>
                  <th className="num">Average</th><th className="num">Latest</th><th>Last quoted</th>
                </tr>
              </thead>
              <tbody>
                {r.priceHistory.map((h) => (
                  <tr key={h.desc}>
                    <td><strong>{h.desc}</strong></td>
                    <td>{h.unit || "—"}</td>
                    <td className="num">{h.count}</td>
                    <td className="num">{money(h.low)}</td>
                    <td className="num">{money(h.high)}</td>
                    <td className="num">{money(h.avg)}</td>
                    <td className="num">{money(h.latest)}</td>
                    <td>{h.latestDate ? fmtDate(h.latestDate) : "—"}</td>
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
