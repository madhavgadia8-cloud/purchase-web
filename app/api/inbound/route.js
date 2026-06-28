import { db } from "@/lib/db";
import { extractQuote, getAiDebug } from "@/lib/ai";

export const dynamic = "force-dynamic";

function addrOf(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (Array.isArray(x)) return x.map(addrOf).filter(Boolean).join(",");
  if (x.address) return x.address;
  if (x.email) return x.email;
  if (x.value) return addrOf(x.value);
  if (x.text) return x.text;
  return "";
}
function hget(h, name) {
  if (!h || typeof h !== "object") return "";
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] : "";
}
function rawToText(raw) {
  let s = String(raw || "");
  s = s.replace(/=\r?\n/g, "");
  s = s.replace(/=([0-9A-Fa-f]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/[ \t]+/g, " ");
  return s;
}

export async function POST(req) {
  const url = new URL(req.url);
  const secret = process.env.INBOUND_SECRET;
  if (secret && url.searchParams.get("key") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  // Accept JSON or form-encoded (CloudMailin can send either)
  let d = {};
  const ctype = req.headers.get("content-type") || "";
  try {
    if (ctype.includes("application/json")) {
      d = await req.json();
    } else {
      const form = await req.formData();
      d = {};
      for (const [k, v] of form.entries()) d[k] = typeof v === "string" ? v : (v && v.name) || "";
    }
  } catch (e) {
    try { d = await req.json(); } catch { d = {}; }
  }
  d = (d && d.data) || d || {};

  const headers = d.headers || {};
  const envelope = d.envelope || {};
  const from = addrOf(d.from || envelope.from || hget(headers, "from") || d.sender || d["envelope[from]"] || d["headers[from]"]);
  const to = addrOf(d.to || envelope.to || hget(headers, "to") || d.recipient || d["envelope[to]"] || d["headers[to]"]);
  const subject = d.subject || hget(headers, "subject") || d["headers[subject]"] || "";
  const text =
    d.plain || d.text || d["body-plain"] || d.reply_plain ||
    (d.html ? String(d.html).replace(/<[^>]+>/g, " ") : "") ||
    (d.raw ? rawToText(d.raw) : "") || "";

  let rfqId = null;
  const plus = String(to).match(/\+([0-9a-fA-F-]{8,})@/);
  if (plus) rfqId = plus[1];
  if (!rfqId) {
    const m = (String(subject) + " " + String(text)).match(/Ref(?:erence)?[:\s\[]+([0-9a-fA-F-]{8,})/i);
    if (m) rfqId = m[1];
  }

  const supabase = db();
  let items = [];
  if (rfqId) {
    const { data } = await supabase.from("rfq_items").select("*").eq("rfq_id", rfqId).order("sort");
    items = data || [];
  }
  let ai = null;
  if (rfqId && items.length) {
    ai = await extractQuote({ items, emailText: String(text), fromEmail: from });
  }

  const debug = url.searchParams.get("debug") === "1";
  if (debug) {
    return new Response(
      JSON.stringify({ rfqId, itemCount: items.length, ai, aiDebug: getAiDebug(), from, subject, textPreview: String(text).slice(0, 200) }, null, 2),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  await supabase.from("inbound_quotes").insert({
    rfq_id: rfqId,
    from_email: String(from).slice(0, 300),
    subject: String(subject).slice(0, 500),
    body_text: String(text).slice(0, 20000),
    ai_extracted: ai,
    status: "pending",
  });

  return new Response("ok", { status: 200 });
}
