// CV template registry + shared types.
// Each template renders the same CVData into a different visual document.

export type CVData = {
  name: string;
  title: string;
  photoUrl?: string | null;
  contact: string;      // free text, one line per entry
  summary: string;
  experience: string;
  education: string;
  skills: string;       // one per line
  languages: string;    // one per line
  certifications: string;
  projects: string;
  volunteer: string;
  awards: string;
  publications: string;
  references: string;
  other: string;
};

export type CVTemplateId =
  | "editorial"
  | "classic"
  | "editorialBig"
  | "geometric"
  | "soft";

export type CVTemplateMeta = {
  id: CVTemplateId;
  name: string;
  blurb: string;
  hasPhoto: boolean;
  accent: string;       // hex for swatch + DOCX accent
  bg: string;
  font: "serif" | "sans" | "mono" | "display-serif";
  layout: "sidebar" | "split" | "banner" | "editorial-banner" | "geometric-band" | "soft-hero";
};

export const CV_TEMPLATES: CVTemplateMeta[] = [
  {
    id: "editorial",
    name: "Editorial",
    blurb: "Elegant serif with photo and a quiet terracotta accent.",
    hasPhoto: true,
    accent: "#B96A4B",
    bg: "#FFFFFF",
    font: "serif",
    layout: "split",
  },
  {
    id: "classic",
    name: "Classic",
    blurb: "Centered letter-spaced name. Two-column sidebar, no photo.",
    hasPhoto: false,
    accent: "#5C5C5C",
    bg: "#FFFFFF",
    font: "sans",
    layout: "sidebar",
  },
  {
    id: "editorialBig",

    name: "Statement",
    blurb: "Huge display name behind a centred portrait. Beige.",
    hasPhoto: true,
    accent: "#3D3D3D",
    bg: "#EFEAE3",
    font: "display-serif",
    layout: "editorial-banner",
  },
  {
    id: "geometric",
    name: "Geometric",
    blurb: "Soft sage band, round portrait top-right, copper rules.",
    hasPhoto: true,
    accent: "#B47A5C",
    bg: "#FFFFFF",
    font: "sans",
    layout: "geometric-band",
  },
  {
    id: "soft",
    name: "Soft",
    blurb: "Round portrait with a pink blossom blob, pill headers.",
    hasPhoto: true,
    accent: "#E8C5D0",
    bg: "#FFFFFF",
    font: "sans",
    layout: "soft-hero",
  },
];

export const DEFAULT_TEMPLATE: CVTemplateId = "editorial";

export function getTemplate(id?: string | null): CVTemplateMeta {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];
}
