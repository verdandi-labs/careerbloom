// careerBloom AI Coach — streaming chat via Google AI
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = (cv: string) => `You are careerBloom Coach, a warm, non-judgmental career transition companion called Bloom. You have the user's CV in front of you. Your job is to:

1. Ask conversational questions to understand their target career and desired roles
2. Identify transferable skills they might not recognize
3. Help reframe career gaps with compassion — normalize them, never judge
4. Suggest professional rephrasing for experiences, especially soft skills and non-traditional roles
5. Always ask permission before suggesting changes: "Can I rephrase this for you?"
6. When suggesting rephrasing, always offer 3 options. The user can pick, edit, or reject each.
7. Make sure all CV language is ATS-friendly (passes AI HR filters).
8. Be warm, direct, and encouraging. Never corporate or clinical.

When you propose a rephrasing, RESPOND ONLY with a JSON code block in this exact shape (no prose around it):
\`\`\`json
{"type":"suggestion","section":"experience|summary|skills|education|projects|other","original":"…the exact original text…","options":["option 1","option 2","option 3"]}
\`\`\`
Otherwise respond with normal conversational markdown.

User's CV:
${cv || "(no CV uploaded yet — gently invite them to upload one)"}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { messages, cv_text } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing GOOGLE_AI_API_KEY" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get("GOOGLE_GEMINI_3_FLASH_MODEL")}:streamGenerateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: SYSTEM(cv_text ?? "") }] }, ...(messages?.map((m: any) => ({ role: m.role, parts: [{ text: m.content }] })) ?? [])],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: text }), { status: res.status, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const stream = new ReadableStream({
      async start(controller) {
        for (const candidate of data.candidates) {
          const content = candidate.content?.parts?.[0]?.text;
          if (content) {
            controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
