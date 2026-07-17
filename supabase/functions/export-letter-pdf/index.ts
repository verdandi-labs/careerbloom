// Generates a clean PDF for a cover letter.
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const { job_title, company, content } = await req.json() as {
      job_title: string; company: string; content: string;
    };

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([612, 792]);
    const margin = 54;
    const maxWidth = 612 - margin * 2;
    let y = 792 - margin;

    const wrap = (text: string, size: number, f = font, gap = 4) => {
      for (const para of text.split(/\n+/)) {
        const words = para.split(/\s+/);
        let line = "";
        for (const w of words) {
          const t = line ? line + " " + w : w;
          if (f.widthOfTextAtSize(t, size) > maxWidth && line) {
            if (y < margin + size) { page = pdf.addPage([612, 792]); y = 792 - margin; }
            page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
            y -= size + gap;
            line = w;
          } else line = t;
        }
        if (line) {
          if (y < margin + size) { page = pdf.addPage([612, 792]); y = 792 - margin; }
          page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
          y -= size + gap;
        }
        y -= 4;
      }
    };

    wrap(`${job_title} — ${company}`, 14, bold, 4);
    y -= 6;
    wrap(content, 11, font, 4);

    const bytes = await pdf.save();
    return new Response(bytes, {
      headers: {
        ...CORS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cover-letter-${company.replace(/\W+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
