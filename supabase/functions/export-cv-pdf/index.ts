// Generates a clean, single-column ATS-friendly PDF using pdf-lib.
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Section = { heading: string; body: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { name, sections, language } = await req.json() as {
      name?: string;
      sections: Section[];
      language?: string;
    };

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([612, 792]); // US Letter
    const margin = 54;
    const maxWidth = 612 - margin * 2;
    let y = 792 - margin;

    const drawWrapped = (text: string, size: number, f = font, lineGap = 4) => {
      const words = text.split(/\s+/);
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        const width = f.widthOfTextAtSize(test, size);
        if (width > maxWidth && line) {
          if (y < margin + size) { page = pdf.addPage([612, 792]); y = 792 - margin; }
          page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
          y -= size + lineGap;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) {
        if (y < margin + size) { page = pdf.addPage([612, 792]); y = 792 - margin; }
        page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
        y -= size + lineGap;
      }
    };

    if (name) {
      drawWrapped(name, 20, bold, 6);
      y -= 8;
    }
    if (language) {
      drawWrapped(`Language: ${language.toUpperCase()}`, 9, font, 2);
      y -= 6;
    }

    for (const s of sections) {
      if (!s.body?.trim()) continue;
      y -= 8;
      if (y < margin + 40) { page = pdf.addPage([612, 792]); y = 792 - margin; }
      drawWrapped(s.heading.toUpperCase(), 12, bold, 4);
      y -= 2;
      for (const para of s.body.split(/\n+/)) {
        if (para.trim()) drawWrapped(para.trim(), 10, font, 3);
        y -= 2;
      }
    }

    const bytes = await pdf.save();
    return new Response(bytes, {
      headers: {
        ...CORS,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="careerBloom-cv.pdf"',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
