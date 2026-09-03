import {
  useEffect,
  useRef,
  createElement,
  type CSSProperties,
} from "react";
import type { CVTemplateId, StructuredCVData } from "@/lib/cv-templates";
import { CVTextSection } from "./cv-render-helpers";

export type EditableField = "name" | "title" | "summary" | "certifications" | "references" | "other"

type Props = {
  data: StructuredCVData
  template: CVTemplateId
  editable?: boolean
  onChange?: (field: EditableField, value: string) => void
  onEditItem?: (field: keyof StructuredCVData, index: number, updatedItem: unknown) => void
}

export function Editable({
  value,
  field,
  editable,
  onChange,
  className,
  placeholder,
  multiline = true,
  as = "div",
  style,
}: {
  value: string;
  field: EditableField;
  editable: boolean;
  onChange?: (field: EditableField, value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: "div" | "h1" | "h2" | "p" | "span";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value]);

  return createElement(as, {
    ref,
    contentEditable: editable,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder,
    onBlur: (e: React.FocusEvent<HTMLElement>) =>
      onChange?.(field, (e.target as HTMLElement).innerText),
    className: `cv-editable ${multiline ? "whitespace-pre-wrap" : ""} ${className ?? ""}`,
    style: { outline: "none", ...style },
  });
}

function SidebarLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color }}>
      {children}
    </p>
  )
}

export function Section({
  title,
  accent,
  children,
  serif,
  small,
  bold,
  mono,
  thin,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  serif?: boolean;
  small?: boolean;
  bold?: boolean;
  mono?: boolean;
  thin?: boolean;
}) {
  const headingClass = mono
    ? "text-[13px] font-bold uppercase tracking-wider"
    : bold
      ? "text-base font-bold uppercase tracking-wide"
      : serif
        ? "text-xl font-semibold"
        : small
          ? "text-[11px] font-semibold uppercase tracking-[0.22em]"
          : thin
            ? "text-base font-semibold"
            : "text-sm font-semibold uppercase tracking-wide";
  return (
    <section>
      <h2 className={headingClass} style={{ color: accent }}>
        {title}
      </h2>
      <div
        className="mt-1 mb-2 h-px w-full"
        style={{ background: `${accent}33` }}
      />
      {children}
    </section>
  );
}

function Terracotta({ data, editable, onChange, template: _template }: Props) {
  const TERRACOTTA = "#CB6843"
  const TERRACOTTA_LIGHT = "#FDE8E8"
  const MUTED = "#9b8b86"
  const INK = "#1c1410"
  const e = !!editable

  return (
    <div className="cv-page" style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: "#ffffff" }}>
      <div className="grid grid-cols-[180px_1fr]">
        {/* Left sidebar */}
        <div className="p-5 flex flex-col gap-5" style={{ borderRight: `1px solid ${TERRACOTTA}` }}>
          {/* Contact */}
          {data.contact.length > 0 && (
            <div>
              <SidebarLabel color={TERRACOTTA}>Contact</SidebarLabel>
              {data.contact.map((item) => (
                <p key={item.line_num} className="text-xs leading-relaxed" style={{ color: MUTED }}>{item.detail}</p>
              ))}
            </div>
          )}

          {/* Skills as pills */}
          {data.skills.length > 0 && (
            <div>
              <SidebarLabel color={TERRACOTTA}>Skills</SidebarLabel>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((item) => (
                  <span key={item.line_num} className="text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: TERRACOTTA_LIGHT, color: TERRACOTTA }}>
                    {item.skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages.length > 0 && (
            <div>
              <SidebarLabel color={TERRACOTTA}>Languages</SidebarLabel>
              {data.languages.map((item) => (
                <div key={item.line_num} className="flex justify-between">
                  <span className="text-xs" style={{ color: INK }}>{item.language}</span>
                  {item.level && <span className="text-xs" style={{ color: MUTED }}>{item.level}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div>
              <SidebarLabel color={TERRACOTTA}>Education</SidebarLabel>
              {data.education.map((item) => (
                <div key={item.line_num} className="mb-2">
                  <p className="text-xs font-medium" style={{ color: INK }}>{item.edu_center}</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>
                    {[item.city, item.end_date ?? item.start_date].filter(Boolean).join(" · ")}
                  </p>
                  {item.comments && <p className="text-[10px]" style={{ color: MUTED }}>{item.comments}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right main */}
        <div className="p-7 flex flex-col gap-5">
          {/* Name */}
          {(/\S/.test(data.name ?? "") || e) && (
            <div>
              <h1 style={{ fontFamily: "Playfair Display, serif", color: INK }} className="text-4xl font-bold leading-tight">
                <Editable value={data.name} field="name" editable={e} onChange={onChange} as="span" multiline={false} />
              </h1>
              {(/\S/.test(data.title ?? "") || e) && (
                <p className="text-sm mt-1" style={{ color: TERRACOTTA }}>
                  <Editable value={data.title} field="title" editable={e} onChange={onChange} as="span" multiline={false} />
                </p>
              )}
              {(/\S/.test(data.summary ?? "") || e) && (
                <p className="text-xs leading-relaxed mt-3 max-w-md" style={{ color: MUTED }}>
                  <Editable value={data.summary} field="summary" editable={e} onChange={onChange} className="text-xs leading-relaxed" />
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: TERRACOTTA }} />

          {/* Experience */}
          {data.experience.length > 0 && (
            <div>
              <SidebarLabel color={TERRACOTTA}>Experience</SidebarLabel>
              <div className="flex flex-col gap-5">
                {data.experience.map((item) => (
                  <div key={item.line_num}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p style={{ fontFamily: "Playfair Display, serif", color: INK }} className="text-sm font-semibold">
                          {item.company}
                        </p>
                        {item.city && <p className="text-[10px]" style={{ color: TERRACOTTA }}>{item.city}</p>}
                      </div>
                      {(item.start_date || item.end_date) && (
                        <span className="text-[10px] shrink-0 px-2 py-0.5 rounded-md" style={{ backgroundColor: TERRACOTTA_LIGHT, color: MUTED }}>
                          {item.start_date && item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date ?? item.end_date}
                        </span>
                      )}
                    </div>
                    {item.comments && (
                      <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{item.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Sage({ data, editable, onChange, template: _template }: Props) {
  const SAGE = "#7B9E87"
  const SAGE_LIGHT = "#EAF0EC"
  const SAGE_MID = "#C5D8CB"
  const INK = "#1a1a1a"
  const MUTED = "#888"
  const e = !!editable

  const Dot = () => (
    <span className="inline-block w-1 h-1 rounded-full mx-2 align-middle" style={{ backgroundColor: SAGE }} />
  )

  function SageSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <section className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: SAGE }}>{label}</p>
        <div className="flex-1 h-px mb-3" style={{ backgroundColor: SAGE_MID }} />
        {children}
      </section>
    )
  }

  return (
    <div className="cv-page" style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: "#ffffff" }}>
      {/* Header block */}
      <div className="px-8 pt-8 pb-5" style={{ borderBottom: `1px solid ${SAGE_LIGHT}` }}>
        <p className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: SAGE }}>Curriculum Vitae</p>
        {(/\S/.test(data.name ?? "") || e) && (
          <h1 style={{ fontFamily: "Playfair Display, serif", color: INK }} className="text-5xl font-bold leading-tight mb-2">
            <Editable value={data.name} field="name" editable={e} onChange={onChange} as="span" multiline={false} />
          </h1>
        )}
        <div className="flex items-center flex-wrap text-[10px] mb-3" style={{ color: MUTED }}>
          {(/\S/.test(data.title ?? "") || e) && (
            <Editable value={data.title} field="title" editable={e} onChange={onChange} as="span" multiline={false} className="font-medium" />
          )}
          {data.title && data.contact.length > 0 && <Dot />}
          {data.contact.map((item, i) => (
            <span key={item.line_num}>
              {item.detail}{i < data.contact.length - 1 && <Dot />}
            </span>
          ))}
        </div>
        {(/\S/.test(data.summary ?? "") || e) && (
          <div className="rounded-md px-4 py-3" style={{ backgroundColor: SAGE_LIGHT }}>
            <Editable value={data.summary} field="summary" editable={e} onChange={onChange} className="text-xs leading-relaxed" style={{ color: "#4a4a4a" }} />
          </div>
        )}
      </div>

      {/* Body: two columns */}
      <div className="grid grid-cols-[1fr_200px]">
        {/* Left main */}
        <div className="p-8 pr-6">
          {/* Experience */}
          {data.experience.length > 0 && (
            <SageSection label="Experience">
              <div className="flex flex-col gap-4">
                {data.experience.map((item) => (
                  <div key={item.line_num}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p style={{ fontFamily: "Playfair Display, serif", color: INK }} className="text-sm font-semibold">
                          {item.company}
                        </p>
                        {item.city && <p className="text-[10px] font-medium" style={{ color: SAGE }}>{item.city}</p>}
                      </div>
                      {(item.start_date || item.end_date) && (
                        <span className="text-[9px] shrink-0 px-2.5 py-1 rounded-full" style={{ backgroundColor: SAGE_LIGHT, color: SAGE }}>
                          {item.start_date && item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date ?? item.end_date}
                        </span>
                      )}
                    </div>
                    {item.comments && (
                      <ul className="list-none mt-1">
                        {item.comments.split("\n").filter(Boolean).map((line, li) => (
                          <li key={li} className="text-[11px] leading-relaxed flex items-start gap-2" style={{ color: MUTED }}>
                            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: SAGE_MID }} />
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </SageSection>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <SageSection label="Education">
              <div className="flex flex-col gap-4">
                {data.education.map((item) => (
                  <div key={item.line_num}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p style={{ fontFamily: "Playfair Display, serif", color: INK }} className="text-sm font-semibold">
                          {item.edu_center}
                        </p>
                        {item.city && <p className="text-[10px]" style={{ color: MUTED }}>{item.city}</p>}
                      </div>
                      {(item.start_date || item.end_date) && (
                        <span className="text-[9px] shrink-0 px-2.5 py-1 rounded-full" style={{ backgroundColor: SAGE_LIGHT, color: SAGE }}>
                          {item.start_date && item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date ?? item.end_date}
                        </span>
                      )}
                    </div>
                    {item.comments && <p className="text-[11px] leading-relaxed mt-1" style={{ color: MUTED }}>{item.comments}</p>}
                  </div>
                ))}
              </div>
            </SageSection>
          )}
        </div>

        {/* Right sidebar */}
        <div className="p-8 pl-6" style={{ borderLeft: `1px solid ${SAGE_LIGHT}` }}>
          {/* Skills */}
          {data.skills.length > 0 && (
            <SageSection label="Skills">
              <div className="flex flex-col gap-1.5">
                {data.skills.map((item) => (
                  <p key={item.line_num} className="text-xs" style={{ color: INK }}>{item.skill}</p>
                ))}
              </div>
            </SageSection>
          )}

          {/* Languages */}
          {data.languages.length > 0 && (
            <SageSection label="Languages">
              <div className="flex flex-col gap-1.5">
                {data.languages.map((item) => (
                  <div key={item.line_num} className="flex justify-between">
                    <span className="text-xs" style={{ color: INK }}>{item.language}</span>
                    {item.level && <span className="text-xs" style={{ color: MUTED }}>{item.level}</span>}
                  </div>
                ))}
              </div>
            </SageSection>
          )}
        </div>
      </div>
    </div>
  )
}

export function CvDocument(props: Props) {
  const inner = props.template === "sage"
    ? <Sage {...props} />
    : <Terracotta {...props} />

  return (
    <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-md shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
      {inner}
      <style>{`
        .cv-editable[contenteditable="true"]:empty::before {
          content: attr(data-placeholder);
          color: #c7c7c7;
        }
        .cv-editable[contenteditable="true"]:hover {
          background: rgba(254, 232, 231, 0.4);
          border-radius: 4px;
        }
        .cv-editable[contenteditable="true"]:focus {
          background: rgba(254, 232, 231, 0.65);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
