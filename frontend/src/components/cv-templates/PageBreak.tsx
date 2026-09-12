import "./PageBreak.css";

interface PageBreakLabelProps {
  top: number;
}

export function PageBreakLabel({ top }: PageBreakLabelProps) {
  return (
    <div className="cv-page-break-label" style={{ top: top - 8 }}>
      <img src="/logo.png" alt="" className="cv-page-break-label__logo" />
    </div>
  );
}
