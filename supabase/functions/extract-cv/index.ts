// extract-cv edge function
// Accepts multipart/form-data with `file` (PDF or DOCX) and returns { text }
import mammoth from "https://esm.sh/mammoth@1.8.0";
import pdf from "https://esm.sh/pdf-parse@1.1.1/lib/pdf-parse.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();
    const type = file.type || "";

    let text = "";
    if (name.endsWith(".pdf") || type === "application/pdf") {
      const result = await pdf(buf);
      text = (result.text || "").trim();
    } else if (
      name.endsWith(".docx") ||
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: buf });
      text = (result.value || "").trim();
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type. Please upload PDF or DOCX." }), {
        status: 415,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-cv error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
