import React, { type CSSProperties } from "react";
import type { StructuredCVData } from "@/lib/cv-templates";
import { splitAtPageBreaks } from "@/lib/cv-templates";
import { Editable, DragSection, type Props } from "../CvDocument";
import { PageBreak } from "./PageBreak";
import "./Terracotta.css";

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

export function Terracotta({
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
  const TERRACOTTA = "#CB6843";
  const TERRACOTTA_LIGHT = "#FDE8E8";
  const MUTED = "#9b8b86";
  const INK = "#1c1410";
  const e = !!editable;

  const SIDEBAR_KEYS: (keyof StructuredCVData)[] = [
    "contact",
    "skills",
    "languages",
    "education",
  ];
  const MAIN_KEYS: (keyof StructuredCVData)[] = [
    "experience",
    "awards",
    "publications",
    "volunteer",
    "projects",
  ];

  const pageGroups = splitAtPageBreaks(sectionOrder, [
    ...SIDEBAR_KEYS,
    ...MAIN_KEYS,
  ]);

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
          <div className="flex flex-col gap-3.5">
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
            className="cv-page terracotta"
            style={
              {
                fontFamily: "DM Sans, sans-serif",
                backgroundColor: "#ffffff",
                "--cv-scale": pdfScale,
              } as CSSProperties
            }
          >
            {gi > 0 && <PageBreak />}
            <div
              className="grid grid-cols-[180px_1fr]"
              style={{ alignItems: "stretch" }}
            >
              <div
                className="p-5 flex flex-col gap-5 h-full"
                style={{ borderRight: `1px solid ${TERRACOTTA}` }}
              >
                {gi === 0 && (
                  <div
                    className="w-full overflow-hidden rounded-sm"
                    style={{ height: 120, backgroundColor: "#F5E6DF" }}
                  >
                    {photoUploading ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse">
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
                            backgroundColor: "#CB6843",
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
              <div className="p-6 flex flex-col gap-5 h-full">
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
                  <div
                    className="h-px"
                    style={{ backgroundColor: TERRACOTTA }}
                  />
                )}
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
            </div>
          </div>
        );
      })}
    </>
  );
}
