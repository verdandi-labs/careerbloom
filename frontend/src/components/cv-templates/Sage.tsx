import React, { type CSSProperties } from "react";
import type { StructuredCVData } from "@/lib/cv-templates";
import { splitAtPageBreaks } from "@/lib/cv-templates";
import { Editable, DragSection, type Props } from "../CvDocument";

import "./Sage.css";

export function Sage({
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

  const SIDEBAR_KEYS: (keyof StructuredCVData)[] = ["skills", "languages"];
  const MAIN_KEYS: (keyof StructuredCVData)[] = ["experience", "education"];

  const pageGroups = splitAtPageBreaks(sectionOrder, [
    ...SIDEBAR_KEYS,
    ...MAIN_KEYS,
  ]);

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
                className="flex items-start justify-between gap-3 cursor-pointer hover:bg-black/5 rounded transition"
              >
                <span className="text-xs" style={{ color: INK, flexShrink: 0 }}>
                  {item.language}
                </span>
                {item.level && (
                  <span
                    className="text-xs"
                    style={{
                      color: MUTED,
                      textAlign: "right",
                      flexShrink: 1,
                      wordBreak: "break-word",
                      minWidth: 0,
                    }}
                  >
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
            className="cv-page sage"
            style={
              {
                fontFamily: "DM Sans, sans-serif",
                backgroundColor: "#ffffff",
                "--cv-scale": pdfScale,
              } as CSSProperties
            }
          >
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
            <div className="grid grid-cols-[1fr_200px] items-stretch">
              <div className="p-5 pr-6">
                {pageMainKeys.map((key) => (
                  <DragSection
                    key={key}
                    index={sectionOrder.findIndex(
                      (s) => s.type === "section" && s.key === key,
                    )}
                    onDrop={handleDrop}
                    isActive={
                      activeDragIndex ===
                      sectionOrder.findIndex(
                        (s) => s.type === "section" && s.key === key,
                      )
                    }
                  >
                    {renderMainSection(key)}
                  </DragSection>
                ))}
              </div>
              <div
                className="p-8 pl-6 self-stretch"
                style={{
                  borderLeft: `1px solid ${SAGE_LIGHT}`,
                  minHeight: "100%",
                }}
              >
                {gi === 0 && (
                  <div
                    className="w-full overflow-hidden rounded-sm mb-5"
                    style={{ height: 120, backgroundColor: "#EAF0EC" }}
                  >
                    {photoUploading ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse">
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
                {pageSidebarKeys.map((key) => (
                  <DragSection
                    key={key}
                    index={sectionOrder.findIndex(
                      (s) => s.type === "section" && s.key === key,
                    )}
                    onDrop={handleDrop}
                    isActive={
                      activeDragIndex ===
                      sectionOrder.findIndex(
                        (s) => s.type === "section" && s.key === key,
                      )
                    }
                  >
                    {renderSidebarSection(key)}
                  </DragSection>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
