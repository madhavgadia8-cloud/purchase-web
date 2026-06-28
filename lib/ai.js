// Extract supplier rates from an email body.
// Uses Google Gemini (free tier) when GEMINI_API_KEY is set, else Anthropic.
// Returns { vendor_name, currency, lines:[{item_id, rate}] } or null.

let lastDebug = null;
export function getAiDebug() {
  return lastDebug;
}

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
  const dbg = { provider: null, models: [], notes: [] };

  // --- Google Gemini (free) ---
  const geminiKey = process.env.GEMINI_API_KEY;
  dbg.hasGemini = !!geminiKey;
  dbg.hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (geminiKey) {
    // Try a list of current free-tier Flash models (1.5/2.0 are retired).
    const envModel = process.env.GEMINI_MODEL;
    const candidates = [
      ...(envModel ? [envModel] : []),
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
    ];
    for (const model of candidates) {
      try {
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
        const status = res.status;
        if (res.ok) {
          const data = await res.json();
          const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
          const parsed = parseJson(text);
          dbg.models.push({ model, status, ok: true, parsed: !!parsed });
          if (parsed) {
            dbg.provider = "gemini:" + model;
            lastDebug = dbg;
            return parsed;
          }
        } else {
          let errTxt = "";
          try { errTxt = (await res.text()).slice(0, 300); } catch {}
          dbg.models.push({ model, status, ok: false, err: errTxt });
        }
      } catch (e) {
        dbg.models.push({ model, err: String(e && e.message || e) });
      }
    }
  } else {
    dbg.notes.push("GEMINI_API_KEY not set");
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
        const parsed = parseJson(text);
        dbg.provider = "anthropic";
        lastDebug = dbg;
        return parsed;
      } else {
        let errTxt = "";
        try { errTxt = (await res.text()).slice(0, 300); } catch {}
        dbg.notes.push("anthropic status " + res.status + " " + errTxt);
      }
    } catch (e) {
      dbg.notes.push("anthropic error " + String(e && e.message || e));
    }
  }

  lastDebug = dbg;
  return null;
}
