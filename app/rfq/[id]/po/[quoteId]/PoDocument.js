"use client";

import Logo from "@/app/Logo";

function money(n) {
  const v = Number(n);
  return (isFinite(v) ? v : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PoDocument({ poNo, date, supplier, reference, rows, total }) {
  return (
    <div className="wrap po" style={{ maxWidth: 860 }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Letterhead */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 22px", borderBottom: "3px solid var(--brand)" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Logo size={54} showText={false} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F7941E", letterSpacing: ".04em" }}>KALPANA INDUSTRIES</div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>Manufacturers: Distribution &amp; Power Transformers</div>
              <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>Works: F-11, Industrial Area, Jhunjhunu-333 001 (Raj.)</div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>Phone: 9414080577</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#374151" }}>PURCHASE ORDER</div>
            <table style={{ width: "auto", marginLeft: "auto", marginTop: 6, border: "none" }}>
              <tbody>
                <tr><td style={{ border: "none", padding: "2px 6px", fontSize: 12, color: "#6b7280" }}>No.</td>
                  <td style={{ border: "none", padding: "2px 0" }}><input defaultValue={poNo} style={{ width: 150, fontWeight: 700 }} /></td></tr>
                <tr><td style={{ border: "none", padding: "2px 6px", fontSize: 12, color: "#6b7280" }}>Date</td>
                  <td style={{ border: "none", padding: "2px 0" }}><input defaultValue={date} style={{ width: 150 }} /></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: "16px 22px" }}>
          {/* To + Reference + statutory */}
          <div style={{ display: "flex", gap: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280" }}>To,</div>
              <input defaultValue={`M/s ${supplier.name}`} style={{ fontWeight: 700, width: "100%" }} />
              <textarea defaultValue={supplier.contact || ""} rows={2} placeholder="Address / contact" style={{ width: "100%", marginTop: 4 }} />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280" }}>Reference</div>
              <input defaultValue={reference} style={{ width: "100%" }} />
              <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8, lineHeight: 1.6 }}>
                <div><strong>GST No.:</strong> 08AABFK3333R1Z0</div>
                <div><strong>PAN:</strong> AABFK3333R</div>
                <div><strong>Banker:</strong> State Bank of India, Sardool Market, Jhunjhunu</div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#374151", margin: "14px 0 8px" }}>
            Dear Sir, With reference to your quotation as per above reference, please supply the under-mentioned articles to us as per the terms &amp; conditions mentioned below:
          </p>

          {/* Items */}
          <table>
            <thead>
              <tr>
                <th>Sl. No</th><th>Description</th><th>Delivery</th>
                <th className="num">Qty</th><th>Unit</th><th className="num">Rate</th><th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.n}</td>
                  <td>{r.description}</td>
                  <td><input style={{ width: 90 }} placeholder="" /></td>
                  <td className="num">{r.qty}</td>
                  <td>{r.unit}</td>
                  <td className="num">{money(r.rate)}</td>
                  <td className="num">{money(r.amount)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} style={{ textAlign: "right", fontWeight: 800 }}>TOTAL</td>
                <td className="num" style={{ fontWeight: 800 }}>{money(total)}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
            References of the purchase order should be indicated in all the Bill / Dispatch advice etc. relating to this order.
          </p>

          {/* Terms */}
          <table style={{ marginTop: 14 }}>
            <tbody>
              {[
                ["Payment", "Advance with PO, balance against PI before dispatch / after installation"],
                ["Taxes", "18% GST Extra"],
                ["Warranty", "1 Year from the date of Successful Installation"],
                ["Installation", "On your scope with your man power"],
                ["Packing", "On your scope"],
                ["Freight & Insurance", "In our scope"],
                ["Delivery", "____ Days / Months"],
                ["Dispatch Through", "By Road Transport at Jhunjhunu (Raj.)"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ width: 180, fontWeight: 700, background: "var(--soft)" }}>{k}</td>
                  <td><input defaultValue={v} style={{ width: "100%" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Remarks:</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
              <li>Bills should accompany the test certificate for the material supplied.</li>
              <li>Invoice complete in all respects as per GST rules to enable us to take GST credit.</li>
              <li>Material is subject to acceptance after verification at our end.</li>
            </ol>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700 }}>For KALPANA INDUSTRIES</div>
              <div style={{ height: 48 }} />
              <div style={{ borderTop: "1px solid #9ca3af", paddingTop: 4, fontSize: 12, color: "#4b5563", minWidth: 200 }}>Authorised Signatory</div>
            </div>
          </div>

          <div className="no-print" style={{ marginTop: 18, display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => window.print()}>Print / Save as PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
