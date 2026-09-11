import React, { type CSSProperties } from "react";
import type { StructuredCVData } from "@/lib/cv-templates";
import { orderedSections, splitAtPageBreaks } from "@/lib/cv-templates";
import { Editable, DragSection, type Props } from "../CvDocument";
import "./Bold.css";

export function Bold({
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
  const MUTED = "#555";
  const BG = "#E8E5DC";
  const e = !!editable;

  const allKeys = orderedSections(sectionOrder, [
    "experience",
    "languages",
    "education",
    "skills",
    "references",
  ]);
  const groups = splitAtPageBreaks(sectionOrder, allKeys);

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

  function renderSection(key: keyof StructuredCVData) {
    if (key === "experience" && data.experience.length > 0) {
      return (
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
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
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
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
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
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
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
      );
    }
    if (key === "references" && data.references.length > 0) {
      return (
        <div>
          <p
            className="text-[9px] uppercase tracking-widest font-semibold mb-3"
            style={{ color: INK }}
          >
            References
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: MUTED }}>
            {data.references}
          </p>
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
          className="cv-page bold"
          style={
            {
              fontFamily: "DM Sans, sans-serif",
              backgroundColor: BG,
              "--cv-scale": pdfScale,
            } as CSSProperties
          }
        >
          {gi === 0 && (
            <>
              <div
                className="grid grid-cols-3 text-[9px] uppercase tracking-widest px-6 py-3"
                style={{ borderBottom: `1px solid ${INK}` }}
              >
                <div>{data.name || " "}</div>
                <div className="text-center">
                  {data.contact[0]?.detail || " "}
                </div>
                <div className="text-right">
                  {data.contact[1]?.detail || " "}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_144px] px-6 py-6">
                <div>
                  <div
                    className="text-[11px] uppercase tracking-widest mt-3"
                    style={{ color: INK }}
                  >
                    {data.title}
                  </div>
                  {(/\S/.test(data.name ?? "") || e) && (
                    <div
                      className="text-[13px] font-bold uppercase tracking-widest mt-1"
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
                      className="text-[13px] leading-relaxed mt-4 max-w-xs"
                      style={{ color: MUTED }}
                    >
                      <Editable
                        value={data.summary}
                        field="summary"
                        editable={e}
                        onChange={onChange}
                        className="text-[13px] leading-relaxed"
                      />
                    </div>
                  )}
                </div>
                <div
                  className="aspect-[3/4] rounded-sm overflow-hidden"
                  style={{ backgroundColor: "#C8C5BC" }}
                >
                  {photoUploading ? (
                    <div className="w-full h-full flex items-center justify-center animate-pulse">
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
            </>
          )}
          {gi > 0 && (
            <div
              style={{
                marginTop: 32,
                borderTop: "2px dashed #e5e7eb",
                paddingTop: 32,
              }}
            />
          )}
          <div className="px-6 pb-4 mt-4">
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
                </DragSection>
              );
            })}
          </div>
          <div
            className="px-6 py-4 text-center"
            style={{ borderTop: `1px solid ${INK}` }}
          >
            <div
              className="font-black uppercase"
              style={{
                fontSize: 64 * (pdfScale ?? 1),
                letterSpacing: -1,
                color: INK,
                lineHeight: 1,
              }}
            >
              {data.name}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
