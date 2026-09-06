import { useEffect, useRef, createElement, type CSSProperties } from "react";
import type {
  CVTemplateId,
  StructuredCVData,
  SectionOrderItem,
} from "@/lib/cv-templates";
import { orderedSections, splitAtPageBreaks } from "@/lib/cv-templates";
import { CVTextSection } from "./cv-render-helpers";

export type EditableField =
  "name" | "title" | "summary" | "certifications" | "references" | "other";

type Props = {
  data: StructuredCVData;
  template: CVTemplateId;
  editable?: boolean;
  onChange?: (field: EditableField, value: string) => void;
  onEditItem?: (
    field: keyof StructuredCVData,
    index: number,
    updatedItem: unknown,
  ) => void;
  sectionOrder?: SectionOrderItem[];
};

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

function SidebarLabel({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color }}>
      {children}
    </p>
  );
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

function Terracotta({
  data,
  editable,
  onChange,
  onEditItem,
  sectionOrder,
  template: _template,
}: Props) {
  const TERRACOTTA = "#CB6843";
  const TERRACOTTA_LIGHT = "#FDE8E8";
  const MUTED = "#9b8b86";
  const INK = "#1c1410";
  const e = !!editable;

  const sidebarKeys = orderedSections(sectionOrder, [
    "contact",
    "skills",
    "languages",
    "education",
  ]);
  const mainKeys = orderedSections(sectionOrder, ["experience"]);

  function renderSidebarSection(key: keyof StructuredCVData) {
    if (key === "contact" && data.contact.length > 0) {
      return (
        <div key="contact">
          <SidebarLabel color={TERRACOTTA}>Contact</SidebarLabel>
          {data.contact.map((item, i) => (
            <p
              key={item.line_num}
              onClick={() => onEditItem?.("contact", i, item)}
              className="text-xs leading-relaxed cursor-pointer hover:bg-black/5 rounded transition"
              style={{ color: MUTED }}
            >
              {item.detail}
            </p>
          ))}
        </div>
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <div key="skills">
          <SidebarLabel color={TERRACOTTA}>Skills</SidebarLabel>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((item, i) => (
              <span
                key={item.line_num}
                onClick={() => onEditItem?.("skills", i, item)}
                className="text-[10px] px-2 py-1 rounded-md cursor-pointer hover:bg-black/5 transition"
                style={{ backgroundColor: TERRACOTTA_LIGHT, color: TERRACOTTA }}
              >
                {item.skill}
              </span>
            ))}
          </div>
        </div>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <div key="languages">
          <SidebarLabel color={TERRACOTTA}>Languages</SidebarLabel>
          {data.languages.map((item, i) => (
            <div
              key={item.line_num}
              onClick={() => onEditItem?.("languages", i, item)}
              className="flex justify-between cursor-pointer hover:bg-black/5 rounded transition"
            >
              <span className="text-xs" style={{ color: INK }}>
                {item.language}
              </span>
              {item.level && (
                <span className="text-xs" style={{ color: MUTED }}>
                  {item.level}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <div key="education">
          <SidebarLabel color={TERRACOTTA}>Education</SidebarLabel>
          {data.education.map((item, i) => (
            <div
              key={item.line_num}
              onClick={() => onEditItem?.("education", i, item)}
              className="mb-2 cursor-pointer hover:bg-black/5 rounded transition"
            >
              <p className="text-xs font-medium" style={{ color: INK }}>
                {item.edu_center}
              </p>
              <p className="text-[10px]" style={{ color: MUTED }}>
                {[item.city, item.end_date ?? item.start_date]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {item.comments && (
                <p className="text-[10px]" style={{ color: MUTED }}>
                  {item.comments}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  }

  function renderMainSection(key: keyof StructuredCVData) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <div key="experience">
          <SidebarLabel color={TERRACOTTA}>Experience</SidebarLabel>
          <div className="flex flex-col gap-5">
            {data.experience.map((item, i) => (
              <div
                key={item.line_num}
                onClick={() => onEditItem?.("experience", i, item)}
                className="cursor-pointer hover:bg-black/5 rounded transition"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p
                      style={{
                        fontFamily: "Playfair Display, serif",
                        color: INK,
                      }}
                      className="text-sm font-semibold"
                    >
                      {item.company}
                    </p>
                    {item.city && (
                      <p className="text-[10px]" style={{ color: TERRACOTTA }}>
                        {item.city}
                      </p>
                    )}
                  </div>
                  {(item.start_date || item.end_date) && (
                    <span
                      className="text-[10px] shrink-0 px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: TERRACOTTA_LIGHT,
                        color: MUTED,
                      }}
                    >
                      {item.start_date && item.end_date
                        ? `${item.start_date} – ${item.end_date}`
                        : (item.start_date ?? item.end_date)}
                    </span>
                  )}
                </div>
                {item.comments && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: MUTED }}
                  >
                    {item.comments}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  const sidebarGroups = splitAtPageBreaks(sectionOrder, sidebarKeys);
  const mainGroups = splitAtPageBreaks(sectionOrder, mainKeys);

  return (
    <>
      {sidebarGroups.map((group, gi) => (
        <div
          key={`s-${gi}`}
          className="cv-page"
          style={{
            fontFamily: "DM Sans, sans-serif",
            backgroundColor: "#ffffff",
          }}
        >
          {gi > 0 && (
            <div
              style={{
                marginTop: 32,
                borderTop: "2px dashed #e5e7eb",
                paddingTop: 32,
              }}
            />
          )}
          <div className="grid grid-cols-[180px_1fr]">
            <div
              className="p-5 flex flex-col gap-5"
              style={{ borderRight: `1px solid ${TERRACOTTA}` }}
            >
              {gi === 0 && (
                <div
                  className="w-full overflow-hidden rounded-sm"
                  style={{ height: 120, backgroundColor: "#F5E6DF" }}
                >
                  {data.photo ? (
                    <img
                      src={data.photo}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: "#CB6843",
                          opacity: 0.3,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              {group.map((key) => renderSidebarSection(key))}
            </div>
            <div className="p-7 flex flex-col gap-5">
              {gi === 0 && (/\S/.test(data.name ?? "") || e) && (
                <div className="relative group">
                  <h1
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: INK,
                    }}
                    className="text-4xl font-bold leading-tight"
                  >
                    <Editable
                      value={data.name}
                      field="name"
                      editable={e}
                      onChange={onChange}
                      as="span"
                      multiline={false}
                    />
                  </h1>
                  {(/\S/.test(data.title ?? "") || e) && (
                    <p className="text-sm mt-1" style={{ color: TERRACOTTA }}>
                      <Editable
                        value={data.title}
                        field="title"
                        editable={e}
                        onChange={onChange}
                        as="span"
                        multiline={false}
                      />
                    </p>
                  )}
                  {(/\S/.test(data.summary ?? "") || e) && (
                    <p
                      className="text-xs leading-relaxed mt-3 max-w-md"
                      style={{ color: MUTED }}
                    >
                      <Editable
                        value={data.summary}
                        field="summary"
                        editable={e}
                        onChange={onChange}
                        className="text-xs leading-relaxed"
                      />
                    </p>
                  )}
                </div>
              )}
              {gi === 0 && (
                <div className="h-px" style={{ backgroundColor: TERRACOTTA }} />
              )}
              {group.map((key) => renderMainSection(key))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function Sage({
  data,
  editable,
  onChange,
  onEditItem,
  sectionOrder,
  template: _template,
}: Props) {
  const SAGE = "#7B9E87";
  const SAGE_LIGHT = "#EAF0EC";
  const SAGE_MID = "#C5D8CB";
  const INK = "#1a1a1a";
  const MUTED = "#888";
  const e = !!editable;

  const Dot = () => (
    <span
      className="inline-block w-1 h-1 rounded-full mx-2 align-middle"
      style={{ backgroundColor: SAGE }}
    />
  );

  function SageSection({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mb-5">
        <p
          className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-1"
          style={{ color: SAGE }}
        >
          {label}
        </p>
        <div
          className="flex-1 h-px mb-3"
          style={{ backgroundColor: SAGE_MID }}
        />
        {children}
      </section>
    );
  }

  const sidebarKeys = orderedSections(sectionOrder, ["skills", "languages"]);
  const mainKeys = orderedSections(sectionOrder, ["experience", "education"]);

  function renderSidebarSection(key: keyof StructuredCVData) {
    if (key === "skills" && data.skills.length > 0) {
      return (
        <SageSection key="skills" label="Skills">
          <div className="flex flex-col gap-1.5">
            {data.skills.map((item, i) => (
              <p
                key={item.line_num}
                onClick={() => onEditItem?.("skills", i, item)}
                className="text-xs cursor-pointer hover:bg-black/5 rounded transition"
                style={{ color: INK }}
              >
                {item.skill}
              </p>
            ))}
          </div>
        </SageSection>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <SageSection key="languages" label="Languages">
          <div className="flex flex-col gap-1.5">
            {data.languages.map((item, i) => (
              <div
                key={item.line_num}
                onClick={() => onEditItem?.("languages", i, item)}
                className="flex justify-between cursor-pointer hover:bg-black/5 rounded transition"
              >
                <span className="text-xs" style={{ color: INK }}>
                  {item.language}
                </span>
                {item.level && (
                  <span className="text-xs" style={{ color: MUTED }}>
                    {item.level}
                  </span>
                )}
              </div>
            ))}
          </div>
        </SageSection>
      );
    }
    return null;
  }

  function renderMainSection(key: keyof StructuredCVData) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <SageSection key="experience" label="Experience">
          <div className="flex flex-col gap-4">
            {data.experience.map((item, i) => (
              <div
                key={item.line_num}
                onClick={() => onEditItem?.("experience", i, item)}
                className="cursor-pointer hover:bg-black/5 rounded transition"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p
                      style={{
                        fontFamily: "Playfair Display, serif",
                        color: INK,
                      }}
                      className="text-sm font-semibold"
                    >
                      {item.company}
                    </p>
                    {item.city && (
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: SAGE }}
                      >
                        {item.city}
                      </p>
                    )}
                  </div>
                  {(item.start_date || item.end_date) && (
                    <span
                      className="text-[9px] shrink-0 px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: SAGE_LIGHT, color: SAGE }}
                    >
                      {item.start_date && item.end_date
                        ? `${item.start_date} – ${item.end_date}`
                        : (item.start_date ?? item.end_date)}
                    </span>
                  )}
                </div>
                {item.comments && (
                  <ul className="list-none mt-1">
                    {item.comments
                      .split("\n")
                      .filter(Boolean)
                      .map((line, li) => (
                        <li
                          key={li}
                          className="text-[11px] leading-relaxed flex items-start gap-2"
                          style={{ color: MUTED }}
                        >
                          <span
                            className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                            style={{ backgroundColor: SAGE_MID }}
                          />
                          {line}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SageSection>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <SageSection key="education" label="Education">
          <div className="flex flex-col gap-4">
            {data.education.map((item, i) => (
              <div
                key={item.line_num}
                onClick={() => onEditItem?.("education", i, item)}
                className="cursor-pointer hover:bg-black/5 rounded transition"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p
                      style={{
                        fontFamily: "Playfair Display, serif",
                        color: INK,
                      }}
                      className="text-sm font-semibold"
                    >
                      {item.edu_center}
                    </p>
                    {item.city && (
                      <p className="text-[10px]" style={{ color: MUTED }}>
                        {item.city}
                      </p>
                    )}
                  </div>
                  {(item.start_date || item.end_date) && (
                    <span
                      className="text-[9px] shrink-0 px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: SAGE_LIGHT, color: SAGE }}
                    >
                      {item.start_date && item.end_date
                        ? `${item.start_date} – ${item.end_date}`
                        : (item.start_date ?? item.end_date)}
                    </span>
                  )}
                </div>
                {item.comments && (
                  <p
                    className="text-[11px] leading-relaxed mt-1"
                    style={{ color: MUTED }}
                  >
                    {item.comments}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SageSection>
      );
    }
    return null;
  }

  const sidebarGroups = splitAtPageBreaks(sectionOrder, sidebarKeys);
  const mainGroups = splitAtPageBreaks(sectionOrder, mainKeys);

  return (
    <>
      {sidebarGroups.map((group, gi) => (
        <div
          key={`s-${gi}`}
          className="cv-page"
          style={{
            fontFamily: "DM Sans, sans-serif",
            backgroundColor: "#ffffff",
          }}
        >
          {gi > 0 && (
            <div
              style={{
                marginTop: 32,
                borderTop: "2px dashed #e5e7eb",
                paddingTop: 32,
              }}
            />
          )}
          <div
            className="relative group px-8 pt-8 pb-5"
            style={{ borderBottom: `1px solid ${SAGE_LIGHT}` }}
          >
            <p
              className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-2"
              style={{ color: SAGE }}
            >
              Curriculum Vitae
            </p>
            {(/\S/.test(data.name ?? "") || e) && (
              <h1
                style={{ fontFamily: "Playfair Display, serif", color: INK }}
                className="text-5xl font-bold leading-tight mb-2"
              >
                <Editable
                  value={data.name}
                  field="name"
                  editable={e}
                  onChange={onChange}
                  as="span"
                  multiline={false}
                />
              </h1>
            )}
            <div
              className="flex items-center flex-wrap text-[10px] mb-3"
              style={{ color: MUTED }}
            >
              {(/\S/.test(data.title ?? "") || e) && (
                <Editable
                  value={data.title}
                  field="title"
                  editable={e}
                  onChange={onChange}
                  as="span"
                  multiline={false}
                  className="font-medium"
                />
              )}
              {data.title && data.contact.length > 0 && <Dot />}
              {data.contact.map((item, i) => (
                <span key={item.line_num}>
                  {item.detail}
                  {i < data.contact.length - 1 && <Dot />}
                </span>
              ))}
            </div>
            {(/\S/.test(data.summary ?? "") || e) && (
              <div
                className="rounded-md px-4 py-3"
                style={{ backgroundColor: SAGE_LIGHT }}
              >
                <Editable
                  value={data.summary}
                  field="summary"
                  editable={e}
                  onChange={onChange}
                  className="text-xs leading-relaxed"
                  style={{ color: "#4a4a4a" }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-[1fr_200px]">
            <div className="p-8 pr-6">
              {group.map((key) => renderMainSection(key))}
            </div>
            <div
              className="p-8 pl-6"
              style={{ borderLeft: `1px solid ${SAGE_LIGHT}` }}
            >
              {gi === 0 && (
                <div
                  className="w-full overflow-hidden rounded-sm mb-5"
                  style={{ height: 120, backgroundColor: "#EAF0EC" }}
                >
                  {data.photo ? (
                    <img
                      src={data.photo}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: "#7B9E87",
                          opacity: 0.3,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              {group.map((key) => renderSidebarSection(key))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function Classic({
  data,
  editable,
  onChange,
  onEditItem,
  template: _template,
}: Props) {
  const INK = "#111";
  const MUTED = "#666";
  const RULE = "#d0c8c4";
  const e = !!editable;

  function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
      <h2
        style={{ fontFamily: "Playfair Display, serif", color: INK }}
        className="text-xs uppercase tracking-[0.18em] font-semibold mb-4"
      >
        {children}
      </h2>
    );
  }

  return (
    <div
      className="cv-page px-12 py-10"
      style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: "#ffffff" }}
    >
      <div className="text-center mb-5">
        {(/\S/.test(data.name ?? "") || e) && (
          <h1
            style={{ fontFamily: "Playfair Display, serif", color: INK }}
            className="text-5xl font-bold leading-tight mb-3"
          >
            <Editable
              value={data.name}
              field="name"
              editable={e}
              onChange={onChange}
              as="span"
              multiline={false}
            />
          </h1>
        )}
        <div
          className="flex items-center justify-center flex-wrap text-xs tracking-widest uppercase"
          style={{ color: MUTED }}
        >
          {(/\S/.test(data.title ?? "") || e) && (
            <Editable
              value={data.title}
              field="title"
              editable={e}
              onChange={onChange}
              as="span"
              multiline={false}
              className="font-medium"
            />
          )}
          {data.title && data.contact.length > 0 && (
            <span className="mx-2">·</span>
          )}
          {data.contact.map((item, i) => (
            <span key={item.line_num}>
              {item.detail}
              {i < data.contact.length - 1 && <span className="mx-2">·</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="h-px w-full my-5" style={{ backgroundColor: RULE }} />

      {(/\S/.test(data.summary ?? "") || e) && (
        <div className="mb-5">
          <SectionHeading>Profile</SectionHeading>
          <Editable
            value={data.summary}
            field="summary"
            editable={e}
            onChange={onChange}
            className="text-xs leading-relaxed"
            style={{ color: MUTED }}
          />
        </div>
      )}

      <div className="h-px w-full my-5" style={{ backgroundColor: RULE }} />

      {data.experience.length > 0 && (
        <div className="mb-5">
          <SectionHeading>Experience</SectionHeading>
          <div className="flex flex-col gap-4">
            {data.experience.map((item, i) => (
              <div
                key={item.line_num}
                onClick={() => onEditItem?.("experience", i, item)}
                className="cursor-pointer hover:bg-black/5 rounded transition"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: INK,
                    }}
                    className="text-sm font-semibold"
                  >
                    {item.company}
                  </p>
                  {(item.start_date || item.end_date) && (
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: MUTED }}
                    >
                      {item.start_date && item.end_date
                        ? `${item.start_date} – ${item.end_date}`
                        : (item.start_date ?? item.end_date)}
                    </span>
                  )}
                </div>
                {item.city && (
                  <p
                    className="text-[10px] italic mb-1"
                    style={{ color: MUTED }}
                  >
                    {item.city}
                  </p>
                )}
                {item.comments && (
                  <ul className="list-none mt-1">
                    {item.comments
                      .split("\n")
                      .filter(Boolean)
                      .map((line, li) => (
                        <li
                          key={li}
                          className="text-[11px] leading-relaxed flex items-start gap-2"
                          style={{ color: MUTED }}
                        >
                          <span className="shrink-0">–</span>
                          {line}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-px w-full my-5" style={{ backgroundColor: RULE }} />

      {data.education.length > 0 && (
        <div className="mb-5">
          <SectionHeading>Education</SectionHeading>
          <div className="flex flex-col gap-4">
            {data.education.map((item, i) => (
              <div
                key={item.line_num}
                onClick={() => onEditItem?.("education", i, item)}
                className="cursor-pointer hover:bg-black/5 rounded transition"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: INK,
                    }}
                    className="text-sm font-semibold"
                  >
                    {item.edu_center}
                  </p>
                  {(item.start_date || item.end_date) && (
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: MUTED }}
                    >
                      {item.start_date && item.end_date
                        ? `${item.start_date} – ${item.end_date}`
                        : (item.start_date ?? item.end_date)}
                    </span>
                  )}
                </div>
                {item.city && (
                  <p className="text-[10px] italic" style={{ color: MUTED }}>
                    {item.city}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-px w-full my-5" style={{ backgroundColor: RULE }} />

      <div className="grid grid-cols-2 gap-8">
        <div>
          {data.skills.length > 0 && (
            <div>
              <SectionHeading>Skills</SectionHeading>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: MUTED }}
              >
                {data.skills
                  .map((item) => item.skill)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
        <div>
          {data.languages.length > 0 && (
            <div>
              <SectionHeading>Languages</SectionHeading>
              <div className="flex flex-col gap-1.5">
                {data.languages.map((item, i) => (
                  <div
                    key={item.line_num}
                    onClick={() => onEditItem?.("languages", i, item)}
                    className="flex justify-between cursor-pointer hover:bg-black/5 rounded transition"
                  >
                    <span className="text-xs" style={{ color: INK }}>
                      {item.language}
                    </span>
                    {item.level && (
                      <span className="text-xs" style={{ color: MUTED }}>
                        {item.level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bold({
  data,
  editable,
  onChange,
  onEditItem,
  template: _template,
}: Props) {
  const INK = "#111";
  const MUTED = "#555";
  const BG = "#E8E5DC";
  const e = !!editable;

  function SkillPill({ label, filled }: { label: string; filled?: boolean }) {
    return (
      <span
        className="inline-block text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full mr-1.5 mb-1.5"
        style={
          filled
            ? { backgroundColor: INK, color: BG }
            : {
                backgroundColor: "transparent",
                color: INK,
                border: `1.5px solid ${INK}`,
              }
        }
      >
        {label}
      </span>
    );
  }

  function DotRating({ level }: { level?: string }) {
    const map: Record<string, number> = {
      native: 5,
      fluent: 4,
      advanced: 3,
      intermediate: 2,
      basic: 1,
    };
    const filled = map[(level ?? "").toLowerCase()] ?? 3;
    return (
      <span className="flex gap-1 items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: i < filled ? INK : "transparent",
              border: `1.5px solid ${INK}`,
            }}
          />
        ))}
      </span>
    );
  }

  return (
    <div
      className="cv-page"
      style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: BG }}
    >
      <div
        className="grid grid-cols-3 text-[9px] uppercase tracking-widest px-6 py-3"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div>{data.name || " "}</div>
        <div className="text-center">{data.contact[0]?.detail || " "}</div>
        <div className="text-right">{data.contact[1]?.detail || " "}</div>
      </div>

      <div className="grid grid-cols-[1fr_180px] px-6 py-6">
        <div>
          <div
            className="font-black uppercase text-center"
            style={{
              fontSize: 72,
              letterSpacing: -2,
              color: INK,
              lineHeight: 1,
            }}
          >
            RESUME
          </div>
          <div
            className="text-[11px] uppercase tracking-widest mt-3"
            style={{ color: INK }}
          >
            {data.title}
          </div>
          {(/\S/.test(data.name ?? "") || e) && (
            <div
              className="text-[11px] uppercase tracking-widest mt-1"
              style={{ color: INK }}
            >
              <Editable
                value={data.name}
                field="name"
                editable={e}
                onChange={onChange}
                as="span"
                multiline={false}
              />
            </div>
          )}
          {(/\S/.test(data.summary ?? "") || e) && (
            <div
              className="text-[11px] leading-relaxed mt-4 max-w-xs"
              style={{ color: MUTED }}
            >
              <Editable
                value={data.summary}
                field="summary"
                editable={e}
                onChange={onChange}
                className="text-[11px] leading-relaxed"
              />
            </div>
          )}
        </div>
        <div
          className="aspect-[3/4] rounded-sm overflow-hidden"
          style={{ backgroundColor: "#C8C5BC" }}
        >
          {data.photo ? (
            <img
              src={data.photo}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: INK,
                  opacity: 0.15,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="h-px mx-6" style={{ backgroundColor: INK }} />

      <div className="grid grid-cols-2 gap-6 px-6 pb-4 mt-4">
        <div>
          {data.experience.length > 0 && (
            <div className="mb-5">
              {data.experience.map((item, i) => (
                <div
                  key={item.line_num}
                  onClick={() => onEditItem?.("experience", i, item)}
                  className="mb-4 cursor-pointer hover:bg-black/5 rounded transition"
                >
                  <div className="flex justify-between items-start">
                    <p
                      className="text-[11px] font-bold uppercase"
                      style={{ color: INK }}
                    >
                      {item.company}
                    </p>
                    {(item.start_date || item.end_date) && (
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: MUTED }}
                      >
                        {item.start_date && item.end_date
                          ? `${item.start_date} – ${item.end_date}`
                          : (item.start_date ?? item.end_date)}
                      </span>
                    )}
                  </div>
                  {item.city && (
                    <p className="text-[10px] italic" style={{ color: MUTED }}>
                      {item.city}
                    </p>
                  )}
                  {item.comments && (
                    <p className="text-[10px] mt-1" style={{ color: MUTED }}>
                      {item.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.languages.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-3"
                style={{ color: INK }}
              >
                Languages
              </p>
              {data.languages.map((item, i) => (
                <div
                  key={item.line_num}
                  onClick={() => onEditItem?.("languages", i, item)}
                  className="flex items-center justify-between mb-2 cursor-pointer hover:bg-black/5 rounded transition"
                >
                  <span className="text-[10px]" style={{ color: INK }}>
                    {item.language}
                    {item.level ? ` — ${item.level}` : ""}
                  </span>
                  <DotRating level={item.level} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {data.education.length > 0 && (
            <div className="mb-5">
              {data.education.map((item, i) => (
                <div
                  key={item.line_num}
                  onClick={() => onEditItem?.("education", i, item)}
                  className="mb-4 cursor-pointer hover:bg-black/5 rounded transition"
                >
                  <div className="flex justify-between items-start">
                    <p
                      className="text-[11px] font-bold uppercase"
                      style={{ color: INK }}
                    >
                      {item.edu_center}
                    </p>
                    {(item.start_date || item.end_date) && (
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: MUTED }}
                      >
                        {item.start_date && item.end_date
                          ? `${item.start_date} – ${item.end_date}`
                          : (item.start_date ?? item.end_date)}
                      </span>
                    )}
                  </div>
                  {item.city && (
                    <p className="text-[10px] italic" style={{ color: MUTED }}>
                      {item.city}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.skills.length > 0 && (
            <div className="mb-5">
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-3"
                style={{ color: INK }}
              >
                Skills
              </p>
              <div className="flex flex-wrap">
                {data.skills.map((item, i) => (
                  <span
                    key={item.line_num}
                    onClick={() => onEditItem?.("skills", i, item)}
                    className="inline-block text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full mr-1.5 mb-1.5 cursor-pointer hover:bg-black/5 transition"
                    style={
                      i < Math.ceil(data.skills.length / 2)
                        ? { backgroundColor: INK, color: BG }
                        : {
                            backgroundColor: "transparent",
                            color: INK,
                            border: `1.5px solid ${INK}`,
                          }
                    }
                  >
                    {item.skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.references.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-3"
                style={{ color: INK }}
              >
                References
              </p>
              <p
                className="text-[10px] leading-relaxed"
                style={{ color: MUTED }}
              >
                {data.references}
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className="px-6 py-4 text-center"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        <div
          className="font-black uppercase"
          style={{ fontSize: 64, letterSpacing: -1, color: INK, lineHeight: 1 }}
        >
          {data.name}
        </div>
      </div>
    </div>
  );
}

function Minimal({
  data,
  editable,
  onChange,
  onEditItem,
  template: _template,
}: Props) {
  const INK = "#111";
  const MUTED = "#666";
  const LIGHT = "#f5f5f5";
  const e = !!editable;

  return (
    <div
      className="cv-page"
      style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: "#ffffff" }}
    >
      <div className="grid grid-cols-[220px_1fr]">
        <div className="min-h-[240px]" style={{ backgroundColor: "#C8C8C6" }}>
          {data.photo ? (
            <img
              src={data.photo}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ minHeight: 240 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: INK,
                  opacity: 0.15,
                }}
              />
            </div>
          )}
        </div>
        <div className="px-8 py-7">
          {(/\S/.test(data.name ?? "") || e) && (
            <h1
              style={{ fontFamily: "Playfair Display, serif", color: INK }}
              className="text-4xl font-bold leading-tight"
            >
              <Editable
                value={data.name}
                field="name"
                editable={e}
                onChange={onChange}
                as="span"
                multiline={false}
              />
            </h1>
          )}
          {(/\S/.test(data.title ?? "") || e) && (
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              <Editable
                value={data.title}
                field="title"
                editable={e}
                onChange={onChange}
                as="span"
                multiline={false}
              />
            </p>
          )}
          <div className="w-6 h-0.5 my-3" style={{ backgroundColor: INK }} />
          <p
            className="text-[9px] uppercase tracking-widest font-semibold mb-1"
            style={{ color: INK }}
          >
            Summary
          </p>
          {(/\S/.test(data.summary ?? "") || e) && (
            <Editable
              value={data.summary}
              field="summary"
              editable={e}
              onChange={onChange}
              className="text-[11px] leading-relaxed"
              style={{ color: MUTED }}
            />
          )}
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: "#ddd" }} />

      <div className="grid grid-cols-[220px_1fr]">
        <div
          className="px-6 py-7 flex flex-col gap-6"
          style={{ backgroundColor: LIGHT, borderRight: "1px solid #e0e0e0" }}
        >
          {data.contact.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: INK }}
              >
                Contact
              </p>
              {data.contact.map((item, i) => (
                <p
                  key={item.line_num}
                  onClick={() => onEditItem?.("contact", i, item)}
                  className="text-[10px] leading-relaxed flex items-start gap-2 cursor-pointer hover:bg-black/5 rounded transition"
                  style={{ color: MUTED }}
                >
                  <span className="shrink-0">•</span>
                  {item.detail}
                </p>
              ))}
            </div>
          )}

          {data.skills.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: INK }}
              >
                Skills
              </p>
              {data.skills.map((item, i) => (
                <p
                  key={item.line_num}
                  onClick={() => onEditItem?.("skills", i, item)}
                  className="text-[10px] leading-relaxed flex items-start gap-2 cursor-pointer hover:bg-black/5 rounded transition"
                  style={{ color: MUTED }}
                >
                  <span className="shrink-0">•</span>
                  {item.skill}
                </p>
              ))}
            </div>
          )}

          {data.education.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: INK }}
              >
                Education
              </p>
              {data.education.map((item, i) => (
                <div
                  key={item.line_num}
                  onClick={() => onEditItem?.("education", i, item)}
                  className="mb-2 cursor-pointer hover:bg-black/5 rounded transition"
                >
                  <p
                    className="text-[10px] font-bold uppercase"
                    style={{ color: INK }}
                  >
                    {item.edu_center}
                  </p>
                  <p className="text-[9px]" style={{ color: MUTED }}>
                    {[item.start_date ?? item.end_date]
                      .filter(Boolean)
                      .join(" – ")}
                  </p>
                  {item.comments && (
                    <p className="text-[9px]" style={{ color: MUTED }}>
                      {item.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.languages.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: INK }}
              >
                Languages
              </p>
              {data.languages.map((item, i) => (
                <p
                  key={item.line_num}
                  onClick={() => onEditItem?.("languages", i, item)}
                  className="text-[10px] leading-relaxed flex items-start gap-2 cursor-pointer hover:bg-black/5 rounded transition"
                  style={{ color: MUTED }}
                >
                  <span className="shrink-0">•</span>
                  {item.language}
                  {item.level ? ` — ${item.level}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-7 flex flex-col gap-6">
          {data.experience.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-3"
                style={{ color: INK }}
              >
                Experience
              </p>
              {data.experience.map((item, i) => (
                <div
                  key={item.line_num}
                  onClick={() => onEditItem?.("experience", i, item)}
                  className="mb-4 cursor-pointer hover:bg-black/5 rounded transition"
                >
                  <div className="flex justify-between items-start">
                    <p
                      className="text-[11px] font-bold uppercase"
                      style={{ color: INK }}
                    >
                      {item.company}
                    </p>
                    {(item.start_date || item.end_date) && (
                      <span
                        className="text-[9px] shrink-0"
                        style={{ color: MUTED }}
                      >
                        {item.start_date && item.end_date
                          ? `${item.start_date} – ${item.end_date}`
                          : (item.start_date ?? item.end_date)}
                      </span>
                    )}
                  </div>
                  {item.city && (
                    <p className="text-[9px]" style={{ color: MUTED }}>
                      {item.city}
                    </p>
                  )}
                  {item.comments && (
                    <ul className="list-none mt-1">
                      {item.comments
                        .split("\n")
                        .filter(Boolean)
                        .map((line, li) => (
                          <li
                            key={li}
                            className="text-[10px] leading-relaxed flex items-start gap-2"
                            style={{ color: MUTED }}
                          >
                            <span className="shrink-0">•</span>
                            {line}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.references.length > 0 && (
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-semibold mb-3"
                style={{ color: INK }}
              >
                References
              </p>
              <p
                className="text-[10px] leading-relaxed"
                style={{ color: MUTED }}
              >
                {data.references}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CvDocument(props: Props) {
  const inner =
    props.template === "sage" ? (
      <Sage {...props} />
    ) : props.template === "classic" ? (
      <Classic {...props} />
    ) : props.template === "bold" ? (
      <Bold {...props} />
    ) : props.template === "minimal" ? (
      <Minimal {...props} />
    ) : (
      <Terracotta {...props} />
    );

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
