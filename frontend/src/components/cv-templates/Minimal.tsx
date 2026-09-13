import React, { type CSSProperties } from "react";
import type { StructuredCVData } from "@/lib/cv-templates";
import { splitAtPageBreaks } from "@/lib/cv-templates";
import { Editable, DragSection, type Props } from "../CvDocument";

import "./Minimal.css";

export function Minimal({
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
  const LIGHT = "#f5f5f5";
  const e = !!editable;

  const SIDEBAR_KEYS: (keyof StructuredCVData)[] = [
    "contact",
    "skills",
    "education",
    "languages",
  ];
  const MAIN_KEYS: (keyof StructuredCVData)[] = ["experience", "references"];

  const pageGroups = splitAtPageBreaks(sectionOrder, [
    ...SIDEBAR_KEYS,
    ...MAIN_KEYS,
  ]);

  function renderSidebarSection(key: keyof StructuredCVData) {
    if (key === "contact" && data.contact.length > 0) {
      return (
        <div key="contact">
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-2"
            style={{ color: "#ffffff" }}
          >
            Contact
          </p>
          {data.contact.map((item, i) => (
            <p
              key={item.line_num}
              onClick={() => onEditItem?.("contact", i, item)}
              className="text-xs leading-relaxed flex items-start gap-2 cursor-pointer hover:bg-white/10 rounded transition"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              <span className="shrink-0">•</span>
              {item.detail}
            </p>
          ))}
        </div>
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <div key="skills">
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-2"
            style={{ color: "#ffffff" }}
          >
            Skills
          </p>
          {data.skills.map((item, i) => (
            <p
              key={item.line_num}
              onClick={() => onEditItem?.("skills", i, item)}
              className="text-[13px] leading-relaxed flex items-start gap-2 cursor-pointer hover:bg-white/10 rounded transition"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              <span className="shrink-0">•</span>
              {item.skill}
            </p>
          ))}
        </div>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <div key="education">
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-2"
            style={{ color: "#ffffff" }}
          >
            Education
          </p>
          {data.education.map((item, i) => (
            <div
              key={item.line_num}
              onClick={() => onEditItem?.("education", i, item)}
              className="mb-2 cursor-pointer hover:bg-white/10 rounded transition"
            >
              <p
                className="text-xs font-semibold uppercase"
                style={{ color: "#ffffff" }}
              >
                {item.edu_center}
              </p>
              <p
                className="text-[10px]"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {[item.start_date ?? item.end_date].filter(Boolean).join(" – ")}
              </p>
              {item.comments && (
                <p
                  className="text-[11px]"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {item.comments}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <div key="languages">
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-2"
            style={{ color: "#ffffff" }}
          >
            Languages
          </p>
          {data.languages.map((item, i) => (
            <p
              key={item.line_num}
              onClick={() => onEditItem?.("languages", i, item)}
              className="text-sm leading-relaxed flex items-start gap-2 cursor-pointer hover:bg-white/10 rounded transition"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              <span className="shrink-0">•</span>
              {item.language}
              {item.level ? ` — ${item.level}` : ""}
            </p>
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
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-3"
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
                  className="text-sm font-bold uppercase"
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
                <p className="text-[10px]" style={{ color: MUTED }}>
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
                        <span className="shrink-0">•</span>
                        {line}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (key === "references" && data.references.length > 0) {
      return (
        <div key="references">
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-3"
            style={{ color: INK }}
          >
            References
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
            {data.references}
          </p>
        </div>
      );
    }
    return null;
  }

  const handleDrop = onDragSection ?? (() => {});

  return (
    <>
      {pageGroups.map((pageKeys, gi) => {
        const pageSidebarKeys = pageKeys.filter((k) =>
          SIDEBAR_KEYS.includes(k),
        );
        const pageMainKeys = pageKeys.filter((k) => MAIN_KEYS.includes(k));
        return (
          <div
            key={`page-${gi}`}
            className="cv-page minimal"
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
                <div className="grid grid-cols-[220px_1fr] items-stretch">
                  <div
                    className="min-h-[240px]"
                    style={{ backgroundColor: "#333333" }}
                  >
                    {photoUploading ? (
                      <div
                        className="w-full h-full flex items-center justify-center animate-pulse"
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
                    ) : data.photo ? (
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
                        style={{
                          fontFamily: "Playfair Display, serif",
                          color: INK,
                        }}
                        className="text-[33px] leading-tight"
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
                    <div
                      className="w-full my-3"
                      style={{ backgroundColor: "#2B2B2B", height: "0.5px" }}
                    />
                    {(/\S/.test(data.summary ?? "") || e) && (
                      <Editable
                        value={data.summary}
                        field="summary"
                        editable={e}
                        onChange={onChange}
                        className="text-sm leading-relaxed"
                        style={{ color: MUTED }}
                      />
                    )}
                  </div>
                </div>
                <div className="h-px" style={{ backgroundColor: "#ddd" }} />
              </>
            )}

            <div
              className="grid grid-cols-[220px_1fr] items-stretch"
              style={{ minHeight: "100%" }}
            >
              <div
                className="px-6 py-7 flex flex-col gap-6 self-stretch min-h-[885px]"
                style={{
                  backgroundColor: INK,
                  borderRight: "1px solid #e0e0e0",
                }}
              >
                {pageSidebarKeys.map((key) => {
                  const idx = sectionOrder.findIndex(
                    (s) => s.type === "section" && s.key === key,
                  );
                  return (
                    <DragSection
                      key={key}
                      index={idx}
                      onDrop={handleDrop}
                      isActive={activeDragIndex === idx}
                    >
                      {renderSidebarSection(key)}
                    </DragSection>
                  );
                })}
              </div>
              <div className="px-8 py-7 flex flex-col gap-6">
                {pageMainKeys.map((key) => {
                  const idx = sectionOrder.findIndex(
                    (s) => s.type === "section" && s.key === key,
                  );
                  return (
                    <DragSection
                      key={key}
                      index={idx}
                      onDrop={handleDrop}
                      isActive={activeDragIndex === idx}
                    >
                      {renderMainSection(key)}
                    </DragSection>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
