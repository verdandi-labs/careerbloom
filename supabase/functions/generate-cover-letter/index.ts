// Generates a warm, ATS-friendly cover letter draft in EN and ES via Google AI.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { job_title, company, job_description, cv_text } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GOOGLE_AI_API_KEY" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const system = `You are careerBloom's warm cover-letter writer. Write a single concise cover letter (250-350 words) that is human, specific, and ATS-friendly. No clichés. No "I am writing to apply". Open with a hook tied to the company. Close with quiet confidence. Return ONLY JSON: {"content_en":"...","content_es":"..."} — content_es is a natural Spanish translation, not literal.`;

    const user = `Job title: ${job_title}
Company: ${company}
Job description: ${job_description || "(none provided)"}

Candidate CV:
${cv_text || "(no CV available — write a thoughtful, generic letter)"}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get("GOOGLE_GEMINI_3_FLASH_MODEL")}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${system}\n\n${user}` }] }
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: t }), {
        status: res.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: { content_en?: string; content_es?: string } = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }

    return new Response(JSON.stringify({
      content_en: parsed.content_en ?? raw,
      content_es: parsed.content_es ?? "",
    }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
