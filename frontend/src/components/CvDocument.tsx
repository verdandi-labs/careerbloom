import { useEffect, useRef, createElement, type CSSProperties } from "react";
import type {
  CVTemplateId,
  StructuredCVData,
  SectionOrderItem,
} from "@/lib/cv-templates";
import { GripVertical } from "lucide-react";
import { Terracotta } from "./cv-templates/Terracotta";
import { Sage } from "./cv-templates/Sage";
import { Classic } from "./cv-templates/Classic";
import { Bold } from "./cv-templates/Bold";
import { Minimal } from "./cv-templates/Minimal";
import { PageBreakLabel } from "./cv-templates/PageBreak";
import "./cv-templates/common.css";

export type EditableField =
  "name" | "title" | "summary" | "certifications" | "references" | "other";

export type Props = {
  data: StructuredCVData;
  template: CVTemplateId;
  editable?: boolean;
  onChange?: (field: EditableField, value: string) => void;
  onEditItem?: (
    field: keyof StructuredCVData,
    index: number,
    updatedItem: unknown,
  ) => void;
  onUpdateItem?: (
    field: keyof StructuredCVData,
    index: number,
    updates: Record<string, unknown>,
  ) => void;
  sectionOrder: SectionOrderItem[];
  onDragSection?: (fromIndex: number, toIndex: number) => void;
  activeDragIndex?: number | null;
  setActiveDragIndex?: (index: number | null) => void;
  pdfScale?: number;
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

const _dragState: { fromIndex: number | null; overIndex: number | null } = {
  fromIndex: null,
  overIndex: null,
};

export function DragSection({
  index,
  onDrop,
  isActive,
  children,
}: {
  index: number;
  onDrop: (from: number, to: number) => void;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDropTarget =
    _dragState.overIndex === index && _dragState.fromIndex !== index;

  return (
    <div
      ref={wrapperRef}
      className="relative group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={() => {
        _dragState.fromIndex = index;
        _dragState.overIndex = index;
      }}
      onDragOver={(e) => {
        e.preventDefault();
        _dragState.overIndex = index;
        if (wrapperRef.current) {
          wrapperRef.current.style.borderTopColor = "rgba(0,0,0,0.15)";
        }
      }}
      onDragLeave={() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.borderTopColor = "transparent";
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (wrapperRef.current) {
          wrapperRef.current.style.borderTopColor = "transparent";
        }
        if (_dragState.fromIndex != null && _dragState.overIndex != null) {
          onDrop(_dragState.fromIndex, _dragState.overIndex);
        }
        _dragState.fromIndex = null;
        _dragState.overIndex = null;
      }}
      onDragEnd={() => {
        _dragState.fromIndex = null;
        _dragState.overIndex = null;
      }}
      style={{
        borderTop: isDropTarget
          ? "2px solid rgba(0,0,0,0.15)"
          : "2px solid transparent",
        transition: "border-color 0.15s",
        opacity: isActive ? 0.5 : undefined,
      }}
    >
      <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 cursor-grab p-0.5 rounded bg-white/80 shadow-sm transition-opacity">
        <GripVertical className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-700" />
      </div>
      {children}
    </div>
  );
}

export function CvDocument(props: Props) {
  const { pdfScale } = props;
  const inner =
    props.template === "sage" ? (
      <Sage {...props} pdfScale={pdfScale} />
    ) : props.template === "classic" ? (
      <Classic {...props} pdfScale={pdfScale} />
    ) : props.template === "bold" ? (
      <Bold {...props} pdfScale={pdfScale} />
    ) : props.template === "minimal" ? (
      <Minimal {...props} pdfScale={pdfScale} />
    ) : (
      <Terracotta {...props} pdfScale={pdfScale} />
    );

  return (
    <div className="mx-auto w-full max-w-[820px] rounded-md shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
      <div style={{ position: "relative" }}>
        {inner}
        <PageBreakLabel top={1123} />
        <PageBreakLabel top={2246} />
      </div>
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
        .cv-section-wrapper:hover .section-drag-handle {
          opacity: 1;
        }
        .section-drag-handle {
          position: absolute;
          top: 4px;
          left: 4px;
          opacity: 0;
          cursor: grab;
          padding: 2px 3px;
          border-radius: 4px;
          background: rgba(255,255,255,0.8);
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          transition: opacity 0.15s;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }
        .section-drag-handle:hover {
          color: #333;
          background: rgba(255,255,255,0.95);
        }
      `}</style>
    </div>
  );
}
