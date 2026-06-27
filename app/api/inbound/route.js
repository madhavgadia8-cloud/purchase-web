import { db } from "@/lib/db";
import { extractQuote } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req) {
  // simple shared-secret check (set INBOUND_SECRET and append ?key=... to the webhook URL)
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

  const from =
    (d.from && (d.from.address || d.from.email || d.from)) || d.sender || "";
  const toRaw = d.to || d.recipient || "";
  const to = Array.isArray(toRaw)
    ? toRaw.map((x) => x.address || x.email || x).join(",")
    : String(toRaw);
  const subject = d.subject || "";
  const text =
    d.text ||
    d.plain ||
    d["body-plain"] ||
    (d.html ? String(d.html).replace(/<[^>]+>/g, " ") : "") ||
    "";

  // identify RFQ: "+<id>@" in the to-address, or "Ref/Reference <id>" in subject/body
  let rfqId = null;
  const plus = String(to).match(/\+([0-9a-fA-F-]{8,})@/);
  if (plus) rfqId = plus[1];
  if (!rfqId) {
    const m = (subject + " " + text).match(/Ref(?:erence)?[:\s\[]+([0-9a-fA-F-]{8,})/i);
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
    ai = await extractQuote({ items, emailText: text, fromEmail: from });
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
