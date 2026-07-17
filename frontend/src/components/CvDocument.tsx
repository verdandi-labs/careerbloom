// Renders a CVData object into one of five cohesive single-document templates.
// All fields are inline-editable via contentEditable when `editable` is true.
// On blur, the parent receives the field key + new text.

import { useEffect, useRef, createElement, type CSSProperties, type ReactNode } from "react";
import type { CVData, CVTemplateId } from "@/lib/cv-templates";
import { Camera, Mail, MapPin, Phone, Globe } from "lucide-react";

export type EditableField = keyof CVData;

type Props = {
  data: CVData;
  template: CVTemplateId;
  editable?: boolean;
  onChange?: (field: EditableField, value: string) => void;
  onPhotoClick?: () => void;
};

// --- helpers ---------------------------------------------------------------

function Editable({
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

function lines(s: string): string[] {
  return s.split(/\n+/).map((l) => l.trim()).filter(Boolean);
}

function PhotoSlot({
  url,
  onClick,
  shape = "circle",
  size = 140,
}: {
  url?: string | null;
  onClick?: () => void;
  shape?: "circle" | "square";
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: shape === "circle" ? "50%" : 8,
      }}
      className="relative shrink-0 overflow-hidden bg-neutral-200 group"
      aria-label="Upload photo"
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-neutral-100 text-neutral-400">
          <Camera className="h-6 w-6" />
        </div>
      )}
      {onClick && (
        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      )}
    </button>
  );
}

// Map of optional/extra section keys to the human label shown in CV.
const EXTRA_FIELDS: Array<{ key: EditableField; title: string }> = [
  { key: "projects", title: "Projects" },
  { key: "volunteer", title: "Volunteer" },
  { key: "awards", title: "Awards" },
  { key: "publications", title: "Publications" },
  { key: "references", title: "References" },
  { key: "other", title: "Other" },
];

function extras(data: CVData, editable: boolean, onChange?: Props["onChange"]) {
  return EXTRA_FIELDS.filter(({ key }) => (data[key] as string)?.trim() || editable).map(({ key, title }) => ({
    key,
    title,
    node: (
      <Editable
        value={(data[key] as string) || ""}
        field={key}
        editable={editable}
        onChange={onChange}
        className="text-[12px] leading-relaxed text-neutral-700"
        placeholder={editable ? `Add ${title.toLowerCase()}…` : undefined}
      />
    ),
  }));
}

// Balanced two-column flow using CSS multi-column. Sections won't split mid-block.
function BalancedColumns({ children, gap = "2.5rem" }: { children: ReactNode; gap?: string }) {
  return (
    <div
      style={{
        columnCount: 2,
        columnGap: gap,
        columnFill: "balance",
      }}
    >
      {children}
    </div>
  );
}

function Block({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-6"
      style={{ breakInside: "avoid", pageBreakInside: "avoid", ...({ WebkitColumnBreakInside: "avoid" } as CSSProperties) }}
    >
      {children}
    </div>
  );
}

// --- templates -------------------------------------------------------------

function Editorial({ data, editable, onChange, onPhotoClick }: Required<Pick<Props, "data">> & Props) {
  const e = !!editable;
  const accent = "#B96A4B";
  const xs = extras(data, e, onChange);
  return (
    <div
      className="cv-page font-serif"
      style={{ background: "#fff", color: "#1a1a1a", fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <div className="grid grid-cols-[180px_1fr] gap-8 p-12">
        <div className="space-y-6">
          <PhotoSlot url={data.photoUrl} onClick={onPhotoClick} shape="circle" size={180} />
          <Section title="Contact" accent={accent} serif>
            <Editable value={data.contact} field="contact" editable={e} onChange={onChange}
              className="text-[12px] leading-relaxed text-neutral-700 font-sans" />
          </Section>
          <Section title="About Me" accent={accent} serif>
            <Editable value={data.summary} field="summary" editable={e} onChange={onChange}
              className="text-[12px] leading-relaxed text-neutral-700 font-sans" />
          </Section>
          <Section title="Skills" accent={accent} serif>
            <ul className="text-[12px] text-neutral-700 font-sans space-y-1 list-disc list-inside">
              {lines(data.skills).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            {e && <Editable value={data.skills} field="skills" editable={e} onChange={onChange}
              className="mt-2 text-[11px] italic text-neutral-400 font-sans" placeholder="One skill per line" />}
          </Section>
        </div>

        <div className="space-y-6 border-l border-neutral-200 pl-8">
          <header>
            <Editable as="h1" value={data.name} field="name" editable={e} onChange={onChange} multiline={false}
              className="text-4xl font-semibold tracking-tight" style={{ color: accent } as React.CSSProperties} />
            <Editable as="p" value={data.title} field="title" editable={e} onChange={onChange} multiline={false}
              className="mt-1 text-xl text-neutral-700" />
          </header>

          <Section title="Education" accent={accent} serif>
            <Editable value={data.education} field="education" editable={e} onChange={onChange}
              className="text-[13px] leading-relaxed text-neutral-700 font-sans" />
          </Section>

          <Section title="Experience" accent={accent} serif>
            <Editable value={data.experience} field="experience" editable={e} onChange={onChange}
              className="text-[13px] leading-relaxed text-neutral-700 font-sans" />
          </Section>

          {(data.languages || data.certifications) && (
            <div className="grid grid-cols-2 gap-6">
              <Section title="Languages" accent={accent} serif>
                <Editable value={data.languages} field="languages" editable={e} onChange={onChange}
                  className="text-[12px] text-neutral-700 font-sans" />
              </Section>
              <Section title="Certifications" accent={accent} serif>
                <Editable value={data.certifications} field="certifications" editable={e} onChange={onChange}
                  className="text-[12px] text-neutral-700 font-sans" />
              </Section>
            </div>
          )}

          {xs.map((x) => (
            <Section key={x.key} title={x.title} accent={accent} serif>
              <div className="font-sans">{x.node}</div>
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Classic({ data, editable, onChange }: Required<Pick<Props, "data">> & Props) {
  const e = !!editable;
  const accent = "#5C5C5C";
  const xs = extras(data, e, onChange);
  return (
    <div className="cv-page" style={{ background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="p-12">
        <div className="border-b border-neutral-300 pb-6 text-center">
          <Editable as="h1" value={data.name} field="name" editable={e} onChange={onChange} multiline={false}
            className="text-4xl font-light" style={{ letterSpacing: "0.3em" } as React.CSSProperties} />
          <Editable as="p" value={data.title} field="title" editable={e} onChange={onChange} multiline={false}
            className="mt-3 text-sm text-neutral-600" style={{ letterSpacing: "0.4em" } as React.CSSProperties} />
        </div>

        <div className="mt-8 grid grid-cols-[200px_1fr] gap-8">
          <aside className="space-y-6 border-r border-neutral-200 pr-6">
            <Section title="Contact" accent={accent} small>
              <Editable value={data.contact} field="contact" editable={e} onChange={onChange}
                className="text-[12px] leading-relaxed text-neutral-700" />
            </Section>
            <Section title="Education" accent={accent} small>
              <Editable value={data.education} field="education" editable={e} onChange={onChange}
                className="text-[12px] leading-relaxed text-neutral-700" />
            </Section>
            <Section title="Skills" accent={accent} small>
              <ul className="text-[12px] text-neutral-700 space-y-1">
                {lines(data.skills).map((s, i) => <li key={i}>◆ {s}</li>)}
              </ul>
              {e && <Editable value={data.skills} field="skills" editable={e} onChange={onChange}
                className="mt-2 text-[11px] italic text-neutral-400" placeholder="One per line" />}
            </Section>
            <Section title="Languages" accent={accent} small>
              <Editable value={data.languages} field="languages" editable={e} onChange={onChange}
                className="text-[12px] text-neutral-700" />
            </Section>
          </aside>

          <main className="space-y-6">
            <Section title="Profile Summary" accent={accent} small>
              <Editable value={data.summary} field="summary" editable={e} onChange={onChange}
                className="text-[13px] leading-relaxed text-neutral-700 text-justify" />
            </Section>
            <Section title="Work Experience" accent={accent} small>
              <Editable value={data.experience} field="experience" editable={e} onChange={onChange}
                className="text-[13px] leading-relaxed text-neutral-700" />
            </Section>
            {data.certifications && (
              <Section title="Certifications" accent={accent} small>
                <Editable value={data.certifications} field="certifications" editable={e} onChange={onChange}
                  className="text-[13px] leading-relaxed text-neutral-700" />
              </Section>
            )}
            {xs.map((x) => (
              <Section key={x.key} title={x.title} accent={accent} small>
                {x.node}
              </Section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}

function EditorialBig({ data, editable, onChange, onPhotoClick }: Required<Pick<Props, "data">> & Props) {
  const e = !!editable;
  const accent = "#3D3D3D";
  const xs = extras(data, e, onChange);
  return (
    <div className="cv-page" style={{ background: "#EFEAE3", color: accent, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="p-10">
        <div className="text-center">
          <Editable as="p" value={data.title} field="title" editable={e} onChange={onChange} multiline={false}
            className="text-sm font-bold uppercase tracking-wider" />
        </div>
        <div className="relative -mt-2 flex flex-col items-center">
          <Editable as="h1" value={data.name} field="name" editable={e} onChange={onChange} multiline={false}
            className="text-[120px] font-black leading-none text-center"
            style={{ letterSpacing: "-0.04em", color: accent } as React.CSSProperties} />
          <div className="-mt-12 z-10">
            <PhotoSlot url={data.photoUrl} onClick={onPhotoClick} shape="square" size={240} />
          </div>
        </div>

        <div className="mt-10">
          <BalancedColumns>
            <Block>
              <Section title="About Me" accent={accent} bold>
                <Editable value={data.summary} field="summary" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed text-justify" />
              </Section>
            </Block>
            <Block>
              <Section title="Experience" accent={accent} bold>
                <Editable value={data.experience} field="experience" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed text-justify" />
              </Section>
            </Block>
            <Block>
              <Section title="Education" accent={accent} bold>
                <Editable value={data.education} field="education" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed" />
              </Section>
            </Block>
            <Block>
              <Section title="Contact" accent={accent} bold>
                <Editable value={data.contact} field="contact" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed" />
              </Section>
            </Block>
            <Block>
              <Section title="Skills" accent={accent} bold>
                <Editable value={data.skills} field="skills" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed" />
              </Section>
            </Block>
            {data.languages && (
              <Block>
                <Section title="Languages" accent={accent} bold>
                  <Editable value={data.languages} field="languages" editable={e} onChange={onChange}
                    className="text-[12px] leading-relaxed" />
                </Section>
              </Block>
            )}
            {data.certifications && (
              <Block>
                <Section title="Certifications" accent={accent} bold>
                  <Editable value={data.certifications} field="certifications" editable={e} onChange={onChange}
                    className="text-[12px] leading-relaxed" />
                </Section>
              </Block>
            )}
            {xs.map((x) => (
              <Block key={x.key}>
                <Section title={x.title} accent={accent} bold>{x.node}</Section>
              </Block>
            ))}
          </BalancedColumns>
        </div>
      </div>
    </div>
  );
}

function Geometric({ data, editable, onChange, onPhotoClick }: Required<Pick<Props, "data">> & Props) {
  const e = !!editable;
  const accent = "#B47A5C";
  const xs = extras(data, e, onChange);
  return (
    <div className="cv-page" style={{ background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="relative" style={{ background: "#E7EEE5" }}>
        <div className="grid grid-cols-[1fr_auto] items-center gap-6 px-10 py-8">
          <div>
            <Editable as="h1" value={data.name} field="name" editable={e} onChange={onChange} multiline={false}
              className="text-4xl font-light tracking-widest" />
            <Editable as="p" value={data.title} field="title" editable={e} onChange={onChange} multiline={false}
              className="mt-2 text-xs uppercase tracking-[0.3em] text-neutral-600" />
          </div>
          <PhotoSlot url={data.photoUrl} onClick={onPhotoClick} shape="circle" size={140} />
        </div>
      </div>

      <div className="p-10">
        <BalancedColumns>
          <Block>
            <Section title="About Me" accent={accent} thin>
              <Editable value={data.summary} field="summary" editable={e} onChange={onChange}
                className="text-[13px] leading-relaxed text-neutral-700" />
            </Section>
          </Block>
          <Block>
            <Section title="Experience" accent={accent} thin>
              <Editable value={data.experience} field="experience" editable={e} onChange={onChange}
                className="text-[12px] leading-relaxed text-neutral-700" />
            </Section>
          </Block>
          <Block>
            <Section title="Education" accent={accent} thin>
              <Editable value={data.education} field="education" editable={e} onChange={onChange}
                className="text-[12px] leading-relaxed text-neutral-700" />
            </Section>
          </Block>
          <Block>
            <Section title="Contact" accent={accent} thin>
              <Editable value={data.contact} field="contact" editable={e} onChange={onChange}
                className="text-[12px] leading-relaxed text-neutral-700" />
            </Section>
          </Block>
          <Block>
            <Section title="Skills" accent={accent} thin>
              {lines(data.skills).map((s, i) => (
                <div key={i} className="mb-2">
                  <div className="text-[11px] text-neutral-700">{s}</div>
                  <div className="h-[3px] w-full rounded-full" style={{ background: "#eee" }}>
                    <div className="h-full rounded-full" style={{ width: `${70 + ((i * 7) % 25)}%`, background: accent }} />
                  </div>
                </div>
              ))}
              {e && <Editable value={data.skills} field="skills" editable={e} onChange={onChange}
                className="mt-2 text-[11px] italic text-neutral-400" placeholder="One skill per line" />}
            </Section>
          </Block>
          {data.languages && (
            <Block>
              <Section title="Languages" accent={accent} thin>
                <Editable value={data.languages} field="languages" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed text-neutral-700" />
              </Section>
            </Block>
          )}
          {data.certifications && (
            <Block>
              <Section title="Certifications" accent={accent} thin>
                <Editable value={data.certifications} field="certifications" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed text-neutral-700" />
              </Section>
            </Block>
          )}
          {xs.map((x) => (
            <Block key={x.key}>
              <Section title={x.title} accent={accent} thin>{x.node}</Section>
            </Block>
          ))}
        </BalancedColumns>
      </div>
    </div>
  );
}

function Soft({ data, editable, onChange, onPhotoClick }: Required<Pick<Props, "data">> & Props) {
  const e = !!editable;
  const xs = extras(data, e, onChange);
  return (
    <div className="cv-page" style={{ background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="relative p-10">
        <div className="absolute left-0 top-0 h-56 w-56 rounded-br-full -z-0" style={{ background: "#F5DDE6" }} />
        <div className="relative grid grid-cols-[160px_1fr] items-center gap-8">
          <div className="pt-4 pl-2">
            <PhotoSlot url={data.photoUrl} onClick={onPhotoClick} shape="circle" size={150} />
          </div>
          <div>
            <Editable as="h1" value={data.name} field="name" editable={e} onChange={onChange} multiline={false}
              className="text-4xl font-light tracking-wide" />
            <div className="mt-3 inline-block rounded-full border border-neutral-800 px-4 py-1">
              <Editable as="span" value={data.title} field="title" editable={e} onChange={onChange} multiline={false}
                className="text-xs font-bold uppercase tracking-wider" />
            </div>
            <Editable value={data.summary} field="summary" editable={e} onChange={onChange}
              className="mt-4 text-[13px] leading-relaxed text-neutral-700" />
          </div>
        </div>

        <div className="mt-10">
          <BalancedColumns gap="2rem">
            <Block>
              <PillSection title="Experience">
                <Editable value={data.experience} field="experience" editable={e} onChange={onChange}
                  className="text-[13px] leading-relaxed text-neutral-700" />
              </PillSection>
            </Block>
            <Block>
              <PillSection title="Education">
                <Editable value={data.education} field="education" editable={e} onChange={onChange}
                  className="text-[13px] leading-relaxed text-neutral-700" />
              </PillSection>
            </Block>
            <Block>
              <PillSection title="Contact">
                <Editable value={data.contact} field="contact" editable={e} onChange={onChange}
                  className="text-[12px] leading-relaxed text-neutral-700" />
              </PillSection>
            </Block>
            <Block>
              <PillSection title="Skills">
                <ul className="text-[12px] text-neutral-700 space-y-1">
                  {lines(data.skills).map((s, i) => <li key={i}>⬢ {s}</li>)}
                </ul>
                {e && <Editable value={data.skills} field="skills" editable={e} onChange={onChange}
                  className="mt-2 text-[11px] italic text-neutral-400" placeholder="One per line" />}
              </PillSection>
            </Block>
            {data.languages && (
              <Block>
                <PillSection title="Languages">
                  <Editable value={data.languages} field="languages" editable={e} onChange={onChange}
                    className="text-[12px] leading-relaxed text-neutral-700" />
                </PillSection>
              </Block>
            )}
            {data.certifications && (
              <Block>
                <PillSection title="Certifications">
                  <Editable value={data.certifications} field="certifications" editable={e} onChange={onChange}
                    className="text-[12px] leading-relaxed text-neutral-700" />
                </PillSection>
              </Block>
            )}
            {xs.map((x) => (
              <Block key={x.key}>
                <PillSection title={x.title}>{x.node}</PillSection>
              </Block>
            ))}
          </BalancedColumns>
        </div>
      </div>
    </div>
  );
}

// --- shared section primitives --------------------------------------------

function Section({
  title, accent, children, serif, small, bold, mono, thin,
}: {
  title: string; accent: string; children: React.ReactNode;
  serif?: boolean; small?: boolean; bold?: boolean; mono?: boolean; thin?: boolean;
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
      <h2 className={headingClass} style={{ color: accent }}>{title}</h2>
      <div className="mt-1 mb-2 h-px w-full" style={{ background: `${accent}33` }} />
      {children}
    </section>
  );
}

function PillSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="inline-block rounded-full border border-neutral-800 px-4 py-1 mb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// --- entry -----------------------------------------------------------------

export function CvDocument(props: Props) {
  const { template } = props;
  const inner =
    template === "classic" ? <Classic {...props} /> :
    template === "editorialBig" ? <EditorialBig {...props} /> :
    template === "geometric" ? <Geometric {...props} /> :
    template === "soft" ? <Soft {...props} /> :
    <Editorial {...props} />;

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

export { Mail, MapPin, Phone, Globe };
