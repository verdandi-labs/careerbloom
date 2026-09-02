// CV template registry + shared types.
// Each template renders the same CVData into a different visual document.

export type CVData = {
  name: string;
  title: string;
  contact: string; // free text, one line per entry
  summary: string;
  experience: string;
  education: string;
  skills: string; // one per line
  languages: string; // one per line
  certifications: string;
  projects: string;
  volunteer: string;
  awards: string;
  publications: string;
  references: string;
  other: string;
};

export type ContactItem = { detail?: string; line_num: number }
export type ExperienceItem = { company?: string; city?: string; start_date?: string; end_date?: string; comments?: string; line_num: number }
export type SkillItem = { skill?: string; comments?: string; line_num: number }
export type StudyItem = { edu_center?: string; city?: string; start_date?: string; end_date?: string; comments?: string; line_num: number }
export type LanguageItem = { language?: string; level?: string; comments?: string; line_num: number }
export type AwardItem = { name?: string; date?: string; comments?: string; line_num: number }
export type PublicationItem = { name?: string; date?: string; comments?: string; line_num: number }
export type VolunteeringItem = { center?: string; city?: string; start_date?: string; end_date?: string; comments?: string; line_num: number }
export type ProjectItem = { name?: string; url?: string; comments?: string; line_num: number }

export type StructuredCVData = {
  name: string
  title: string
  summary: string
  contact: ContactItem[]
  experience: ExperienceItem[]
  education: StudyItem[]
  skills: SkillItem[]
  languages: LanguageItem[]
  awards: AwardItem[]
  publications: PublicationItem[]
  volunteer: VolunteeringItem[]
  projects: ProjectItem[]
  certifications: string
  references: string
  other: string
}

export type CVTemplateId =
  "editorial" | "classic" | "editorialBig" | "soft" | "terracotta";

export type CVTemplateMeta = {
  id: CVTemplateId;
  name: string;
  blurb: string;
  accent: string; // hex for swatch + DOCX accent
  bg: string;
  font: "serif" | "sans" | "mono" | "display-serif";
  layout:
    | "sidebar"
    | "split"
    | "banner"
    | "editorial-banner"
    | "soft-hero";
};

export const CV_TEMPLATES: CVTemplateMeta[] = [
  {
    id: "editorial",
    name: "Editorial",
    blurb: "Elegant serif with a quiet terracotta accent.",
    accent: "#B96A4B",
    bg: "#FFFFFF",
    font: "serif",
    layout: "split",
  },
  {
    id: "classic",
    name: "Classic",
    blurb: "Centered letter-spaced name. Two-column sidebar.",
    accent: "#5C5C5C",
    bg: "#FFFFFF",
    font: "sans",
    layout: "sidebar",
  },
  {
    id: "editorialBig",

    name: "Statement",
    blurb: "Huge display name on a beige backdrop.",
    accent: "#3D3D3D",
    bg: "#EFEAE3",
    font: "display-serif",
    layout: "editorial-banner",
  },
  {
    id: "soft",
    name: "Soft",
    blurb: "Pink blossom blob, pill headers.",
    accent: "#E8C5D0",
    bg: "#FFFFFF",
    font: "sans",
    layout: "soft-hero",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    blurb: "Warm sidebar, Playfair accents.",
    accent: "#CB6843",
    bg: "#FFFFFF",
    font: "sans",
    layout: "sidebar",
  },
];

export const DEFAULT_TEMPLATE: CVTemplateId = "editorial";

export function getTemplate(id?: string | null): CVTemplateMeta {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];
}
