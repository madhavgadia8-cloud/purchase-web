"use client";

import { useState } from "react";
import Logo from "@/app/Logo";

function money(n) {
  const v = Number(n);
  return (isFinite(v) ? v : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
let _seq = 0;
const uid = () => `${++_seq}_${Math.random().toString(36).slice(2, 6)}`;

const X = ({ onClick }) => (
  <button type="button" className="no-print" onClick={onClick}
    title="Remove"
    style={{ border: "1px solid #fecaca", background: "#fff", color: "#dc2626", borderRadius: 6, cursor: "pointer", lineHeight: 1, padding: "2px 7px", fontWeight: 700 }}>✕</button>
);
const AddBtn = ({ onClick, children }) => (
  <button type="button" className="btn ghost sm no-print" onClick={onClick} style={{ marginTop: 8 }}>{children}</button>
);

export default function PoDocument({ poNo, date, supplier, reference, rows }) {
  const [poNumber, setPoNumber] = useState(poNo);
  const [poDate, setPoDate] = useState(date);
  const [supName, setSupName] = useState(supplier.name ? `M/s ${supplier.name}` : "");
  const [supAddr, setSupAddr] = useState(supplier.contact || "");
  const [ref, setRef] = useState(reference);
  const [gst, setGst] = useState("08AABFK3333R1Z0");
  const [pan, setPan] = useState("AABFK3333R");
  const [banker, setBanker] = useState("State Bank of India, Sardool Market, Jhunjhunu");
  const [intro, setIntro] = useState("Dear Sir, With reference to your quotation as per above reference, please supply the under-mentioned articles to us as per the terms & conditions mentioned below:");

  const [items, setItems] = useState(
    rows.map((r) => ({ id: uid(), description: r.description, delivery: "", qty: String(r.qty), unit: r.unit, rate: String(r.rate) }))
  );
  const [terms, setTerms] = useState([
    { id: uid(), label: "Payment", value: "Advance with PO, balance against PI before dispatch / after installation" },
    { id: uid(), label: "Taxes", value: "18% GST Extra" },
    { id: uid(), label: "Warranty", value: "1 Year from the date of Successful Installation" },
    { id: uid(), label: "Installation", value: "On your scope with your man power" },
    { id: uid(), label: "Packing", value: "On your scope" },
    { id: uid(), label: "Freight & Insurance", value: "In our scope" },
    { id: uid(), label: "Delivery", value: "" },
    { id: uid(), label: "Dispatch Through", value: "By Road Transport at Jhunjhunu (Raj.)" },
  ]);
  const [remarks, setRemarks] = useState([
    "Bills should accompany the test certificate for the material supplied.",
    "Invoice complete in all respects as per GST rules to enable us to take GST credit.",
    "Material is subject to acceptance after verification at our end.",
  ]);

  const amt = (it) => (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
  const total = items.reduce((s, it) => s + amt(it), 0);

  const setItem = (id, k, v) => setItems((a) => a.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  const setTerm = (id, k, v) => setTerms((a) => a.map((t) => (t.id === id ? { ...t, [k]: v } : t)));

  return (
    <div className="wrap po" style={{ maxWidth: 880 }}>
      <div className="hint no-print" style={{ marginBottom: 12 }}>
        Edit anything below — line items, terms, remarks. Use ✕ to remove a row and the “+ Add” buttons to add new ones. When ready, click <strong>Print / Save as PDF</strong>; all the edit controls disappear in the printout.
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Letterhead */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 22px", borderBottom: "3px solid var(--brand)" }}>
          <div>
            <Logo size={72} />
            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8, lineHeight: 1.55 }}>
              <div>Manufacturers: Distribution &amp; Power Transformers</div>
              <div>Works: F-11, Industrial Area, Jhunjhunu-333 001 (Raj.)</div>
              <div>Phone: 9414080577</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#374151" }}>PURCHASE ORDER</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "#6b7280" }}>No.</span>
                <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} style={{ width: 150, fontWeight: 700 }} />
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                <span style={{ color: "#6b7280" }}>Date</span>
                <input value={poDate} onChange={(e) => setPoDate(e.target.value)} style={{ width: 150 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 22px" }}>
          <div style={{ display: "flex", gap: 24, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280" }}>To,</div>
              <input value={supName} onChange={(e) => setSupName(e.target.value)} style={{ fontWeight: 700, width: "100%" }} />
              <textarea value={supAddr} onChange={(e) => setSupAddr(e.target.value)} rows={2} placeholder="Address / contact" style={{ width: "100%", marginTop: 4 }} />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280" }}>Reference</div>
              <input value={ref} onChange={(e) => setRef(e.target.value)} style={{ width: "100%" }} />
              <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 8px", alignItems: "center" }}>
                <strong>GST No.</strong><input value={gst} onChange={(e) => setGst(e.target.value)} />
                <strong>PAN</strong><input value={pan} onChange={(e) => setPan(e.target.value)} />
                <strong>Banker</strong><input value={banker} onChange={(e) => setBanker(e.target.value)} />
              </div>
            </div>
          </div>

          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} style={{ width: "100%", margin: "14px 0 8px", fontSize: 13 }} />

          {/* Items */}
          <table>
            <thead>
              <tr>
                <th>Sl.</th><th>Description</th><th>Delivery</th>
                <th className="num">Qty</th><th>Unit</th><th className="num">Rate</th><th className="num">Amount</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id}>
                  <td>{idx + 1}</td>
                  <td><input value={it.description} onChange={(e) => setItem(it.id, "description", e.target.value)} style={{ width: "100%" }} /></td>
                  <td><input value={it.delivery} onChange={(e) => setItem(it.id, "delivery", e.target.value)} style={{ width: 90 }} /></td>
                  <td className="num"><input value={it.qty} onChange={(e) => setItem(it.id, "qty", e.target.value)} style={{ width: 60, textAlign: "right" }} /></td>
                  <td><input value={it.unit} onChange={(e) => setItem(it.id, "unit", e.target.value)} style={{ width: 60 }} /></td>
                  <td className="num"><input value={it.rate} onChange={(e) => setItem(it.id, "rate", e.target.value)} style={{ width: 100, textAlign: "right" }} /></td>
                  <td className="num">{money(amt(it))}</td>
                  <td className="no-print"><X onClick={() => setItems((a) => a.filter((x) => x.id !== it.id))} /></td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} style={{ textAlign: "right", fontWeight: 800 }}>TOTAL</td>
                <td className="num" style={{ fontWeight: 800 }}>{money(total)}</td>
                <td className="no-print"></td>
              </tr>
            </tbody>
          </table>
          <AddBtn onClick={() => setItems((a) => [...a, { id: uid(), description: "", delivery: "", qty: "", unit: "", rate: "" }])}>+ Add item</AddBtn>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
            References of the purchase order should be indicated in all the Bill / Dispatch advice etc. relating to this order.
          </p>

          {/* Terms */}
          <h3>Terms &amp; Conditions</h3>
          <table>
            <tbody>
              {terms.map((t) => (
                <tr key={t.id}>
                  <td style={{ width: 200, background: "var(--soft)" }}>
                    <input value={t.label} onChange={(e) => setTerm(t.id, "label", e.target.value)} style={{ width: "100%", fontWeight: 700 }} />
                  </td>
                  <td><input value={t.value} onChange={(e) => setTerm(t.id, "value", e.target.value)} style={{ width: "100%" }} /></td>
                  <td className="no-print" style={{ width: 1 }}><X onClick={() => setTerms((a) => a.filter((x) => x.id !== t.id))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <AddBtn onClick={() => setTerms((a) => [...a, { id: uid(), label: "", value: "" }])}>+ Add term / condition</AddBtn>

          {/* Remarks */}
          <h3>Remarks</h3>
          {remarks.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "#6b7280" }}>{i + 1}.</span>
              <input value={r} onChange={(e) => setRemarks((a) => a.map((x, idx) => (idx === i ? e.target.value : x)))} style={{ flex: 1 }} />
              <X onClick={() => setRemarks((a) => a.filter((_, idx) => idx !== i))} />
            </div>
          ))}
          <AddBtn onClick={() => setRemarks((a) => [...a, ""])}>+ Add remark</AddBtn>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 56 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, marginBottom: 52 }}>For KALPANA INDUSTRIES</div>
              <div style={{ borderTop: "1px solid #6b7280", paddingTop: 4, fontSize: 12, color: "#374151", minWidth: 230 }}>Authorised Signatory</div>
            </div>
          </div>

          <div style={{ marginTop: 28, borderTop: "2px solid var(--brand)", paddingTop: 8, textAlign: "center", fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "#374151" }}>KALPANA INDUSTRIES &mdash; Engineered Power Solutions</div>
            <div>Works: F-11, Industrial Area, Jhunjhunu-333 001 (Raj.)&nbsp; | &nbsp;Phone: 9414080577&nbsp; | &nbsp;GST: 08AABFK3333R1Z0</div>
            <div>Subject to Jhunjhunu (Raj.) Jurisdiction. This is a computer-generated purchase order.</div>
          </div>

          <div className="no-print" style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => window.print()}>Print / Save as PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
