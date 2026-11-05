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

export type ContactItem = { detail?: string; line_num: number };
export type ExperienceItem = {
  title?: string;
  company?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  comments?: string;
  line_num: number;
};
export type SkillItem = { skill?: string; comments?: string; line_num: number };
export type StudyItem = {
  edu_center?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  comments?: string;
  line_num: number;
};
export type LanguageItem = {
  language?: string;
  level?: string;
  comments?: string;
  line_num: number;
};
export type AwardItem = {
  name?: string;
  date?: string;
  comments?: string;
  line_num: number;
};
export type PublicationItem = {
  name?: string;
  date?: string;
  comments?: string;
  line_num: number;
};
export type VolunteeringItem = {
  center?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  comments?: string;
  line_num: number;
};
export type ProjectItem = {
  name?: string;
  url?: string;
  comments?: string;
  line_num: number;
};

export type StructuredCVData = {
  name: string;
  title: string;
  summary: string;
  contact: ContactItem[];
  experience: ExperienceItem[];
  education: StudyItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  awards: AwardItem[];
  publications: PublicationItem[];
  volunteer: VolunteeringItem[];
  projects: ProjectItem[];
  certifications: string;
  references: string;
  other: string;
};

export type CVTemplateId = "classic";

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
    | "soft-hero"
    | "single"
    | "editorial";
};

export const CV_TEMPLATES: CVTemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    blurb: "Centered header, clean rules, timeless.",
    accent: "#111111",
    bg: "#FFFFFF",
    font: "sans",
    layout: "single",
  },
];

export type SectionOrderItem = {
  type: "section";
  key: keyof StructuredCVData;
};

export const DEFAULT_SECTION_ORDER: SectionOrderItem[] = [
  { type: "section", key: "experience" },
  { type: "section", key: "education" },
  { type: "section", key: "skills" },
  { type: "section", key: "languages" },
  { type: "section", key: "contact" },
  { type: "section", key: "awards" },
  { type: "section", key: "publications" },
  { type: "section", key: "volunteer" },
  { type: "section", key: "projects" },
];

export const DEFAULT_TEMPLATE: CVTemplateId = "classic";

export function getTemplate(id?: string | null): CVTemplateMeta {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];
}

export function orderedSections(
  order: SectionOrderItem[] | undefined,
  keys: (keyof StructuredCVData)[],
): (keyof StructuredCVData)[] {
  if (!order) return keys;
  const ordered = order
    .filter(
      (item): item is { type: "section"; key: keyof StructuredCVData } =>
        item.type === "section" &&
        keys.includes(item.key as keyof StructuredCVData),
    )
    .map((item) => item.key);
  const missing = keys.filter((k) => !ordered.includes(k));
  return [...ordered, ...missing];
}
