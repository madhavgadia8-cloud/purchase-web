// Extract supplier rates from an email body using the Anthropic API.
// Returns { vendor_name, currency, lines:[{item_id, rate}] } or null.
export async function extractQuote({ items, emailText, fromEmail }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  const itemList = (items || [])
    .map((it, i) => `${i + 1}. item_id=${it.id} | ${it.description} | qty ${it.qty} ${it.unit || ""}`)
    .join("\n");

  const system =
    "You extract supplier quotation rates from an email. Reply with ONLY valid minified JSON and nothing else.";
  const prompt =
    `Buyer requested quotes for these items:\n${itemList}\n\n` +
    `Supplier (${fromEmail || "unknown"}) replied:\n"""${(emailText || "").slice(0, 12000)}"""\n\n` +
    `Extract their per-unit rate for each item. Match each rate to the correct item_id above. ` +
    `Return JSON exactly: {"vendor_name": string|null, "currency": string|null, ` +
    `"lines": [{"item_id": string, "rate": number}]}. ` +
    `Only include lines where a clear numeric rate is present. Omit anything uncertain.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || []).map((c) => c.text || "").join("");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}
