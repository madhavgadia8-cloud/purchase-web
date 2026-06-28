import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "@/lib/db";
import { extractQuote } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  const url = new URL(req.url);
  if (process.env.POLL_SECRET && url.searchParams.get("key") !== process.env.POLL_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASS;
  if (!host || !user || !pass) {
    return new Response("IMAP not configured (set IMAP_HOST, IMAP_USER, IMAP_PASS)", { status: 200 });
  }

  const client = new ImapFlow({
    host,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  let processed = 0;
  let note = "";
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const supabase = db();
      const unseen = await client.search({ seen: false });
      const ids = (unseen || []).slice(-5); // process up to 5 newest unseen per run
      for (const seq of ids) {
        const msg = await client.fetchOne(seq, { source: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const from = (parsed.from && parsed.from.text) || "";
        const subject = parsed.subject || "";
        const text = parsed.text || (parsed.html ? String(parsed.html).replace(/<[^>]+>/g, " ") : "") || "";

        let rfqId = null;
        const m = (subject + " " + text).match(/Ref(?:erence)?[:\s\[]+([0-9a-fA-F-]{8,})/i);
        if (m) rfqId = m[1];

        let items = [];
        if (rfqId) {
          const { data } = await supabase.from("rfq_items").select("*").eq("rfq_id", rfqId).order("sort");
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
        await client.messageFlagsAdd(seq, ["\\Seen"]);
        processed++;
      }
    } finally {
      lock.release();
    }
  } catch (e) {
    note =
      "error: " + (e.responseText || e.message || String(e)) +
      (e.authenticationFailed ? " [auth failed - check IMAP_PASS]" : "") +
      (e.serverResponseCode ? " [" + e.serverResponseCode + "]" : "") +
      (e.code ? " {" + e.code + "}" : "");
  } finally {
    try { await client.logout(); } catch {}
  }
  return new Response(`ok processed=${processed} ${note}`, { status: 200 });
}
