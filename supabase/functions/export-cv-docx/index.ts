// Generates a styled .docx that mirrors the chosen CV template.
// Uses the `docx` npm package via esm.sh.
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, LevelFormat, Packer,
  PageOrientation, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun,
  VerticalAlign, WidthType,
} from "https://esm.sh/docx@8.5.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CVData = {
  name: string; title: string; photoUrl?: string | null;
  contact: string; summary: string; experience: string;
  education: string; skills: string; languages: string; certifications: string;
};

type TemplateId = "editorial" | "classic" | "editorialBig" | "geometric" | "soft";

const ACCENTS: Record<TemplateId, string> = {
  editorial: "B96A4B", classic: "5C5C5C",
  editorialBig: "3D3D3D", geometric: "B47A5C", soft: "B85988",
};
const FONTS: Record<TemplateId, string> = {
  editorial: "Cambria", classic: "Calibri",
  editorialBig: "Calibri", geometric: "Calibri", soft: "Calibri",
};
const BG: Partial<Record<TemplateId, string>> = { editorialBig: "EFEAE3" };

function lines(s: string) {
  return (s ?? "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
}

function para(text: string, opts: { bold?: boolean; size?: number; color?: string; spacing?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; allCaps?: boolean; font?: string } = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacing ?? 80 },
    children: [new TextRun({
      text, bold: opts.bold, size: opts.size ?? 22, color: opts.color, allCaps: opts.allCaps, font: opts.font,
    })],
  });
}

function sectionHeading(text: string, accent: string, font: string) {
  return [
    new Paragraph({
      spacing: { before: 200, after: 60 },
      border: { bottom: { color: accent, space: 4, style: BorderStyle.SINGLE, size: 6 } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: accent, font, characterSpacing: 40 })],
    }),
  ];
}

function bodyLines(text: string, font: string, size = 20) {
  return lines(text).map((l) => new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: l, size, font })],
  }));
}

function bulletList(text: string, font: string) {
  return lines(text).map((l) => new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text: l, size: 20, font })],
  }));
}

async function fetchPhoto(url: string | null | undefined): Promise<{ data: Uint8Array; type: "png" | "jpg" } | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    const ct = (r.headers.get("content-type") ?? "").toLowerCase();
    const type: "png" | "jpg" = ct.includes("png") || url.toLowerCase().includes(".png") ? "png" : "jpg";
    return { data: bytes, type };
  } catch { return null; }
}

function photoParagraph(photo: { data: Uint8Array; type: "png" | "jpg" } | null, size = 120, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.CENTER) {
  if (!photo) return null;
  return new Paragraph({
    alignment: align,
    spacing: { after: 120 },
    children: [new ImageRun({ data: photo.data, transformation: { width: size, height: size }, type: photo.type } as never)],
  });
}

function cell(children: (Paragraph | Table)[], width: number, opts: { shading?: string; padding?: number; border?: boolean } = {}) {
  const border = opts.border ? { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } : { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: opts.padding ?? 120, bottom: opts.padding ?? 120, left: opts.padding ?? 160, right: opts.padding ?? 160 },
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading, color: "auto" } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    children,
  });
}

async function buildDoc(data: CVData, template: TemplateId) {
  const accent = ACCENTS[template];
  const font = FONTS[template];
  const bg = BG[template];
  const photoBytes = await fetchPhoto(data.photoUrl ?? null);

  let children: (Paragraph | Table)[] = [];

  if (template === "classic") {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
        children: [new TextRun({ text: data.name, bold: false, size: 56, font, characterSpacing: 120 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
        border: { bottom: { color: "999999", space: 8, style: BorderStyle.SINGLE, size: 6 } },
        children: [new TextRun({ text: data.title.toUpperCase(), size: 20, color: "5C5C5C", font, characterSpacing: 160 })] }),
    );
    const left = [
      ...sectionHeading("Contact", accent, font), ...bodyLines(data.contact, font),
      ...sectionHeading("Education", accent, font), ...bodyLines(data.education, font),
      ...sectionHeading("Skills", accent, font), ...bulletList(data.skills, font),
      ...sectionHeading("Languages", accent, font), ...bodyLines(data.languages, font),
    ];
    const right = [
      ...sectionHeading("Profile Summary", accent, font), ...bodyLines(data.summary, font),
      ...sectionHeading("Work Experience", accent, font), ...bodyLines(data.experience, font),
      ...(data.certifications ? [...sectionHeading("Certifications", accent, font), ...bodyLines(data.certifications, font)] : []),
    ];
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [new TableRow({ children: [cell(left, 3000), cell(right, 6360)] })],
    }));
  } else if (template === "editorialBig") {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
        children: [new TextRun({ text: data.title.toUpperCase(), bold: true, size: 22, font })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
        children: [new TextRun({ text: data.name.toUpperCase(), bold: true, size: 180, font, color: accent })] }),
      photoParagraph(photoBytes, 180, AlignmentType.CENTER) ?? new Paragraph({ text: "" }),
    );
    const left = [...sectionHeading("About Me", accent, font), ...bodyLines(data.summary, font),
      ...sectionHeading("Experience", accent, font), ...bodyLines(data.experience, font)];
    const right = [...sectionHeading("Education", accent, font), ...bodyLines(data.education, font),
      ...sectionHeading("Contact", accent, font), ...bodyLines(data.contact, font),
      ...sectionHeading("Skills", accent, font), ...bulletList(data.skills, font)];
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      rows: [new TableRow({ children: [cell(left, 4680), cell(right, 4680)] })],
    }));
  } else {

    // editorial / geometric / soft → photo + name top, then 2-col body
    const headerCells: TableCell[] = [];
    if (photoBytes) {
      const photoP = photoParagraph(photoBytes, 130, AlignmentType.LEFT);
      headerCells.push(cell([photoP!], 2200));
    }
    headerCells.push(cell([
      new Paragraph({ children: [new TextRun({ text: data.name, bold: true, size: 52, color: accent, font })] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: data.title, size: 26, font })] }),
      ...bodyLines(data.summary, font),
    ], photoBytes ? 7160 : 9360));
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: photoBytes ? [2200, 7160] : [9360],
      rows: [new TableRow({ children: headerCells })],
    }));
    const left = [...sectionHeading("Contact", accent, font), ...bodyLines(data.contact, font),
      ...sectionHeading("Skills", accent, font), ...bulletList(data.skills, font),
      ...sectionHeading("Languages", accent, font), ...bodyLines(data.languages, font)];
    const right = [...sectionHeading("Education", accent, font), ...bodyLines(data.education, font),
      ...sectionHeading("Experience", accent, font), ...bodyLines(data.experience, font),
      ...(data.certifications ? [...sectionHeading("Certifications", accent, font), ...bodyLines(data.certifications, font)] : [])];
    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3400, 5960],
      rows: [new TableRow({ children: [cell(left, 3400), cell(right, 5960)] })],
    }));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font, size: 22 } } } },
    background: bg ? { color: bg } : undefined,
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
          margin: { top: 720, right: 1080, bottom: 720, left: 1080 },
        },
      },
      children,
    }],
  });
  return doc;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const { data, template } = await req.json() as { data: CVData; template: TemplateId };

    // If photoUrl is a Supabase storage path (not http), sign it via service role.
    if (data.photoUrl && !data.photoUrl.startsWith("http")) {
      const url = Deno.env.get("SUPABASE_URL");
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && key) {
        const r = await fetch(`${url}/storage/v1/object/sign/photos/${encodeURIComponent(data.photoUrl)}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: 300 }),
        });
        if (r.ok) {
          const j = await r.json() as { signedURL?: string };
          if (j.signedURL) data.photoUrl = `${url}/storage/v1${j.signedURL}`;
        }
      }
    }

    const doc = await buildDoc(data, template);
    const buf = await Packer.toBuffer(doc);
    return new Response(buf, {
      headers: {
        ...CORS,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="careerBloom-cv.docx"',
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
