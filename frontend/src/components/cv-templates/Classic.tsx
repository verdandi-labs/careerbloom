import React, { type CSSProperties } from "react";
import type { StructuredCVData } from "@/lib/cv-templates";
import { orderedSections, splitAtPageBreaks } from "@/lib/cv-templates";
import { Editable, DragSection, type Props } from "../CvDocument";

import "./Classic.css";

export function Classic({
  data,
  editable,
  onChange,
  onEditItem,
  sectionOrder,
  template: _template,
  onDragSection,
  activeDragIndex,
  setActiveDragIndex,
  photoUploading,
  pdfScale,
}: Props) {
  const INK = "#111";
  const MUTED = "#666";
  const RULE = "#d0c8c4";
  const e = !!editable;

  const allKeys = orderedSections(sectionOrder, [
    "experience",
    "education",
    "skills",
    "languages",
  ]);
  const groups = splitAtPageBreaks(sectionOrder, allKeys);

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

  function renderSection(key: keyof StructuredCVData) {
    if (key === "experience" && data.experience.length > 0) {
      return (
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
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
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
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <div>
          <SectionHeading>Skills</SectionHeading>
          <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
            {data.skills
              .map((item) => item.skill)
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
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
      );
    }
    return null;
  }

  return (
    <>
      {groups.map((group, gi) => (
        <div
          key={gi}
          className="cv-page classic px-12 pt-[30px] pb-10"
          style={
            {
              fontFamily: "DM Sans, sans-serif",
              backgroundColor: "#ffffff",
              "--cv-scale": pdfScale,
            } as CSSProperties
          }
        >
          {gi === 0 && (
            <>
              <div className="text-center mb-5">
                {(/\S/.test(data.name ?? "") || e) && (
                  <h1
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: INK,
                    }}
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
                    <span
                      key={item.line_num}
                      onClick={() => onEditItem?.("contact", i, item)}
                      className="cursor-pointer"
                    >
                      {item.detail || " "}
                      {i < data.contact.length - 1 && (
                        <span className="mx-2">·</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="h-px w-full my-5"
                style={{ backgroundColor: RULE }}
              />
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
              <div
                className="h-px w-full my-5"
                style={{ backgroundColor: RULE }}
              />
            </>
          )}

          {group.map((key) => {
            const idx = sectionOrder.findIndex(
              (s) => s.type === "section" && s.key === key,
            );
            return (
              <DragSection
                key={key as string}
                index={idx}
                onDrop={onDragSection ?? (() => {})}
                isActive={activeDragIndex === idx}
              >
                {renderSection(key)}
                <div
                  className="h-px w-full my-5"
                  style={{ backgroundColor: RULE }}
                />
              </DragSection>
            );
          })}
        </div>
      ))}
    </>
  );
}
