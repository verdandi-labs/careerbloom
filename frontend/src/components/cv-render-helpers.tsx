import type { CSSProperties } from "react";
import { Editable, Section, type EditableField } from "./CvDocument";

export type { EditableField };

export const hasContent = (value: unknown): boolean => {
  if (typeof value === "string") return /\S/.test(value);
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
};

type SectionStyleFlag = "serif" | "small" | "bold" | "mono" | "thin";

interface CVTextSectionProps {
  data?: string | null;
  field: EditableField;
  title: string;
  accent: string;
  editable: boolean;
  onChange?: (field: EditableField, value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: CSSProperties;
  as?: "div" | "h1" | "h2" | "p" | "span";
  sectionStyle?: SectionStyleFlag;
}

export function CVTextSection({
  data,
  field,
  title,
  accent,
  editable,
  onChange,
  className,
  placeholder,
  multiline = true,
  style,
  as = "div",
  sectionStyle,
}: CVTextSectionProps) {
  if (!hasContent(data) && !editable) return null;
  return (
    <Section
      title={title}
      accent={accent}
      {...(sectionStyle ? { [sectionStyle]: true } : {})}
    >
      <Editable
        value={data ?? ""}
        field={field}
        editable={editable}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
        multiline={multiline}
        as={as}
        style={style}
      />
    </Section>
  );
}
