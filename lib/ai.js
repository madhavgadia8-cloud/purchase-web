// Extract supplier rates from an email body.
// Uses Google Gemini (free tier) when GEMINI_API_KEY is set, else Anthropic.
// Returns { vendor_name, currency, lines:[{item_id, rate}] } or null.

function buildPrompt(items, emailText, fromEmail) {
  const itemList = (items || [])
    .map((it, i) => `${i + 1}. item_id=${it.id} | ${it.description} | qty ${it.qty} ${it.unit || ""}`)
    .join("\n");
  return (
    `You extract supplier quotation rates from an email. Reply with ONLY valid minified JSON and nothing else.\n\n` +
    `Buyer requested quotes for these items:\n${itemList}\n\n` +
    `Supplier (${fromEmail || "unknown"}) replied:\n"""${(emailText || "").slice(0, 12000)}"""\n\n` +
    `Extract their per-unit rate for each item. Match each rate to the correct item_id above. ` +
    `Return JSON exactly: {"vendor_name": string|null, "currency": string|null, ` +
    `"lines": [{"item_id": string, "rate": number}]}. ` +
    `Only include lines where a clear numeric rate is present. Omit anything uncertain.`
  );
}

function parseJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function extractQuote({ items, emailText, fromEmail }) {
  const prompt = buildPrompt(items, emailText, fromEmail);

  // --- Google Gemini (free) ---
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
        const parsed = parseJson(text);
        if (parsed) return parsed;
      }
    } catch (e) {
      // fall through
    }
  }

  // --- Anthropic (paid fallback) ---
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.content || []).map((c) => c.text || "").join("");
        return parseJson(text);
      }
    } catch (e) {
      // fall through
    }
  }

  return null;
}
