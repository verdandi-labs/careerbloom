// parse-cv — turns raw CV text into structured CV fields via Google AI.
// Returns: { name, title, contact, summary, experience, education, skills,
//            languages, certifications, projects, volunteer, awards,
//            publications, references, other }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a careful résumé/CV parser. You receive raw text extracted from a PDF or DOCX and return a single JSON object with the document split into labeled sections.

TREAT THE DOCUMENT AS A SEQUENCE OF SECTIONS.
Walk top-to-bottom. When you detect a known section header, EVERYTHING that follows belongs to that section until the NEXT recognized header appears. Do not cut a section short. Do not summarise. Do not reorder.

Recognized section headers (case-insensitive, match common variations and translations like "Experiencia", "Educación", etc.):
- Name / Contact: usually the first lines — full name, email, phone, location, LinkedIn, portfolio URL
- Summary / Profile / About / Objective / Personal Statement
- Experience / Work Experience / Professional Experience / Employment History / Career History / Work History
- Education / Academic Background / Academic History / Studies / Qualifications
- Skills / Technical Skills / Core Competencies / Key Skills / Areas of Expertise / Tools & Technologies
- Languages / Language Skills
- Certifications / Certificates / Licenses / Accreditations
- Projects / Personal Projects / Side Projects / Portfolio
- Volunteer / Volunteering / Community Involvement
- Awards / Honors / Achievements / Recognition
- Publications / Research
- References / Available upon request

PARSING RULES — follow exactly:
1. Everything between one recognized header and the next belongs entirely to the first section. Capture it verbatim.
2. Preserve bullet points, line breaks, indentation, dashes, and inline formatting inside each section. Do not rewrite, shorten, or "clean up" bullets.
3. If a line LOOKS like a header but is NOT in the recognized list (e.g. a company name in bold, a project title), treat it as CONTENT of the current section — do not start a new section.
4. If the document has no clear headers, infer sections from content patterns:
   - dates + company names + role titles → experience
   - degree names + institutions + years → education
   - comma-separated nouns / short keywords → skills
   - language + proficiency level → languages
5. NEVER discard content. Anything that does not fit a known section goes verbatim into the "other" field, with its original line breaks.
6. The "name", "title", and "contact" fields come from the top of the document (the Name / Contact block):
   - "name": full name only
   - "title": current or most recent role/headline, if shown under the name (one line)
   - "contact": email, phone, location, LinkedIn, portfolio — one per line, in the order they appear
7. "summary" comes from a Summary/Profile/About/Objective section if present. If absent, leave it empty — do NOT invent one.
8. Do not duplicate content across sections. The Name/Contact block is NOT also included in "other".

OUTPUT — JSON ONLY, this exact shape, no markdown, no code fence, no prose:
{
  "name": string,
  "title": string,
  "contact": string,
  "summary": string,
  "experience": string,
  "education": string,
  "skills": string,
  "languages": string,
  "certifications": string,
  "projects": string,
  "volunteer": string,
  "awards": string,
  "publications": string,
  "references": string,
  "other": string
}

Empty string for any section that is not present in the document.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GOOGLE_AI_API_KEY" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Cap to keep token usage reasonable — most CVs fit well under this.
    const trimmed = text.length > 32000 ? text.slice(0, 32000) : text;

    const prompt = `Parse this résumé text. Preserve everything.\n\n---\n${trimmed}\n---`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get("GOOGLE_GEMINI_2_5_FLASH_MODEL")}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit — please try again in a moment." }), {
          status: 429, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI quota exceeded. Please check your Google AI API usage." }), {
          status: 402, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI service error: ${body}` }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const content: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
      }
    }

    const str = (v: unknown) => String(v ?? "").trim();
    const out = {
      name: str(parsed.name),
      title: str(parsed.title),
      contact: str(parsed.contact),
      summary: str(parsed.summary),
      experience: str(parsed.experience),
      education: str(parsed.education),
      skills: str(parsed.skills),
      languages: str(parsed.languages),
      certifications: str(parsed.certifications),
      projects: str(parsed.projects),
      volunteer: str(parsed.volunteer),
      awards: str(parsed.awards),
      publications: str(parsed.publications),
      references: str(parsed.references),
      other: str(parsed.other),
    };

    return new Response(JSON.stringify(out), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("parse-cv error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
