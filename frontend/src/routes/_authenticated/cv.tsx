import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, apiUpload } from "@/lib/api";
import { CvDocument, type EditableField } from "@/components/CvDocument";
import {
  CV_TEMPLATES,
  DEFAULT_TEMPLATE,
  getTemplate,
  type CVData,
  type CVTemplateId,
} from "@/lib/cv-templates";
import { Download, Globe2, Languages, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({ meta: [{ title: "CV Builder · careerBloom" }] }),
  component: CVPage,
});

type Lang = "en" | "es";
const SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "volunteer",
  "awards",
  "publications",
  "references",
  "other",
] as const;
type SectionKey = (typeof SECTIONS)[number];

const EMPTY_SECTIONS = (): Record<
  SectionKey,
  { en: string; es: string; id?: string }
> => Object.fromEntries(SECTIONS.map((s) => [s, { en: "", es: "" }])) as never;

function CVPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [template, setTemplate] = useState<CVTemplateId>(DEFAULT_TEMPLATE);
  const [name, setName] = useState("Your Name");
  const [title, setTitle] = useState<{ en: string; es: string }>({
    en: "Your title",
    es: "Tu cargo",
  });
  const [contact, setContact] = useState<{ en: string; es: string }>({
    en: "",
    es: "",
  });
  const [sections, setSections] =
    useState<Record<SectionKey, { en: string; es: string; id?: string }>>(
      EMPTY_SECTIONS(),
    );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showTranslateConfirm, setShowTranslateConfirm] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const allSections = await api<
        Array<{
          id: string;
          section: string;
          content_en: string;
          content_es: string;
        }>
      >("/cv/sections");
      const map = EMPTY_SECTIONS();
      let nextTitle = { en: "Your title", es: "Tu cargo" };
      let nextContact = { en: "", es: "" };
      for (const r of allSections) {
        if ((SECTIONS as readonly string[]).includes(r.section)) {
          map[r.section as SectionKey] = {
            id: r.id,
            en: r.content_en ?? "",
            es: r.content_es ?? "",
          };
        } else if (r.section === "title") {
          nextTitle = { en: r.content_en ?? "", es: r.content_es ?? "" };
        } else if (r.section === "contact") {
          nextContact = { en: r.content_en ?? "", es: r.content_es ?? "" };
        }
      }
      setSections(map);
      setTitle(nextTitle);
      setContact(nextContact);
    } catch {
      /* ignore */
    }
  }

  const data: CVData = useMemo(
    () => ({
      name,
      title: title[lang],
      contact: contact[lang],
      summary: sections.summary[lang],
      experience: sections.experience[lang],
      education: sections.education[lang],
      skills: sections.skills[lang],
      languages: sections.languages[lang],
      certifications: sections.certifications[lang],
      projects: sections.projects[lang],
      volunteer: sections.volunteer[lang],
      awards: sections.awards[lang],
      publications: sections.publications[lang],
      references: sections.references[lang],
      other: sections.other[lang],
    }),
    [name, title, contact, sections, lang],
  );

  async function saveField(field: EditableField, value: string) {
    setSaving(true);
    try {
      if (field === "name") {
        setName(value);
        await api("/profile", {
          method: "PATCH",
          json: { display_name: value },
        });
      } else if (field === "title") {
        const next = { ...title, [lang]: value };
        setTitle(next);
        await api(`/cv/sections/title`, {
          method: "PUT",
          json: { content_en: next.en, content_es: next.es },
        });
      } else if (field === "contact") {
        const next = { ...contact, [lang]: value };
        setContact(next);
        await api(`/cv/sections/contact`, {
          method: "PUT",
          json: { content_en: next.en, content_es: next.es },
        });
      } else {
        const key = field as SectionKey;
        const next = {
          ...sections,
          [key]: { ...sections[key], [lang]: value },
        };
        setSections(next);
        await api(`/cv/sections/${key}`, {
          method: "PUT",
          json: { content_en: next[key].en, content_es: next[key].es },
        });
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  }

  async function changeTemplate(id: CVTemplateId) {
    setTemplate(id);
    await api("/profile", { method: "PATCH", json: { cv_template: id } });
  }

  async function exportDocx() {
    setExporting(true);
    try {
      const blob = await fetch("/api/v1/cv/export/docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ data, template, language: lang }),
      }).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careerbloom-cv-${lang}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  }

  async function translateToSpanish() {
    setShowTranslateConfirm(false);
    setTranslating(true);
    try {
      const fields: Record<string, string> = {
        title: title.en,
        contact: contact.en,
      };
      for (const key of SECTIONS) fields[key] = sections[key].en;
      const result = await api<{ fields: Record<string, string> }>(
        "/cv/translate",
        {
          method: "POST",
          json: { fields, target_lang: "Spanish" },
        },
      );
      const out = result.fields;
      const nextTitle = { ...title, es: out.title ?? title.es };
      const nextContact = { ...contact, es: out.contact ?? contact.es };
      setTitle(nextTitle);
      setContact(nextContact);
      const nextSections = { ...sections };
      for (const key of SECTIONS) {
        nextSections[key] = {
          ...sections[key],
          es: out[key] ?? sections[key].es,
        };
      }
      setSections(nextSections);
      setLang("es");
    } catch (e) {
      console.error(e);
    }
    setTranslating(false);
  }

  const meta = getTemplate(template);

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
              Living document \u00b7 {meta.name}
            </p>
            <h1 className="mt-2 font-display text-4xl">
              Your story, in your voice
            </h1>
            <p className="mt-2 max-w-xl text-sm text-foreground/75">
              Click anywhere on the page below to edit. Saves as you go.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
              {(["en", "es"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${lang === l ? "bg-accent text-accent-foreground" : "text-foreground/70"}`}
                >
                  <Globe2 className="h-3 w-3" /> {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTranslateConfirm(true)}
              disabled={translating}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white disabled:opacity-50"
            >
              {translating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Languages className="h-3 w-3" />
              )}{" "}
              Translate to Spanish
            </button>
            <button
              onClick={exportDocx}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}{" "}
              Export .docx
            </button>
          </div>
        </div>
      </header>

      <section className="glass p-4">
        <p className="mb-3 px-2 text-[11px] uppercase tracking-[0.22em] text-foreground/60">
          Template
        </p>
        <div className="flex flex-wrap gap-2">
          {CV_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTemplate(t.id)}
              className={`group flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${template === t.id ? "border-foreground bg-accent" : "border-white/60 bg-white/60 hover:bg-white"}`}
            >
              <span
                className="h-7 w-7 rounded-md border border-black/10"
                style={{ background: t.bg }}
              >
                <span
                  className="block h-full w-full rounded-md"
                  style={{ boxShadow: `inset 0 -10px 0 0 ${t.accent}55` }}
                />
              </span>
              <span>
                <span className="block text-xs font-semibold">{t.name}</span>
                <span className="block text-[10px] text-foreground/60">
                  {t.blurb}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-neutral-100/60 p-4 md:p-8">
        <CvDocument
          data={data}
          template={template}
          editable
          onChange={saveField}
        />
        <p className="mt-3 text-center text-[11px] text-foreground/50">
          {saving ? "Saving\u2026" : "Click any text to edit."}
        </p>
      </section>

      {showTranslateConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-md">
          <div className="glass-strong w-full max-w-md p-7">
            <h2 className="font-display text-2xl">Translate to Spanish?</h2>
            <p className="mt-3 text-sm text-foreground/75">
              This will translate your current English content into Spanish and
              replace any previous Spanish version.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowTranslateConfirm(false)}
                className="rounded-2xl bg-white/70 px-5 py-2.5 text-sm hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={translateToSpanish}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-2.5 text-sm text-background"
              >
                <Languages className="h-4 w-4" /> Translate
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
