import { db } from "@/lib/db";
import { extractQuote } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Pull an email address (or comma list) out of the many shapes inbound
// providers use: string, {address}, {email}, {text}, {value:[{address}]}, arrays.
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


// Best-effort: turn a raw MIME email into readable text for the AI.
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

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const d = (body && body.data) || body || {};

  const from = addrOf(d.from || d.sender || d.From);
  const to = addrOf(d.to || d.recipient || d.To);
  const subject = d.subject || d.Subject || "";
  const text =
    d.text ||
    d.plain ||
    d["body-plain"] ||
    (d.html ? String(d.html).replace(/<[^>]+>/g, " ") : "") ||
    (d.raw ? rawToText(d.raw) : "") ||
    "";

  // identify RFQ: "+<id>@" in the to-address, or "Ref/Reference <id>" in subject/body
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
    const { data } = await supabase
      .from("rfq_items").select("*").eq("rfq_id", rfqId).order("sort");
    items = data || [];
  }

  let ai = null;
  if (rfqId && items.length) {
    ai = await extractQuote({ items, emailText: String(text), fromEmail: from });
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
