// translate-text — translates a record of named text blocks to a target language
// via Google AI. Preserves formatting (line breaks, bullets, dashes) per block.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a professional translator for résumés and cover letters.
You receive a JSON object whose keys are field names and whose values are text blocks.
Translate EACH value into the target language. RULES:
- Preserve line breaks, bullet points, dashes, and indentation EXACTLY.
- Do not summarize, expand, reorder, or add commentary.
- Keep proper nouns, company names, brand names, and email/URLs unchanged.
- Translate dates and section labels to the target language (e.g. "Present" -> "Actualidad" for Spanish).
- Return the same JSON shape — same keys — with translated values. JSON only, no prose, no code fence.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { fields, target_lang } = await req.json();
    if (!fields || typeof fields !== "object") {
      return json({ error: "Missing fields" }, 400);
    }
    const lang = (target_lang as string) || "Spanish";

    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) return json({ error: "Missing GOOGLE_AI_API_KEY" }, 500);

    // Drop empty entries to save tokens; we'll merge back later.
    const nonEmpty: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === "string" && v.trim()) nonEmpty[k] = v;
    }
    if (Object.keys(nonEmpty).length === 0) {
      return json({});
    }

    const prompt = `Target language: ${lang}\n\nTranslate every value in this JSON object. Return JSON with the same keys.\n\n${JSON.stringify(nonEmpty)}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get("GOOGLE_GEMINI_2_5_FLASH_MODEL")}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "AI quota exceeded." }, 402);
      return json({ error: `AI service error: ${body}` }, 500);
    }

    const j = await res.json();
    const content: string = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(content); }
    catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
    }

    const out: Record<string, string> = {};
    for (const k of Object.keys(nonEmpty)) {
      const v = parsed[k];
      out[k] = typeof v === "string" ? v : nonEmpty[k];
    }
    return json(out);
  } catch (err) {
    console.error("translate-text error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
