import "./PageBreak.css";

interface PageBreakLabelProps {
  top: number;
}

export function PageBreakLabel({ top }: PageBreakLabelProps) {
  return (
    <div className="cv-page-break-label" style={{ top: top - 10 }}>
      <img src="/logo.png" alt="" className="cv-page-break-label__logo" />
      <span className="cv-page-break-label__text">page break</span>
      <img
        src="/logo.png"
        alt=""
        className="cv-page-break-label__logo cv-page-break-label__logo--right"
      />
    </div>
  );
}
