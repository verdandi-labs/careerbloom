import "./PageBreak.css";

interface PageBreakLabelProps {
  top: number;
}

export function PageBreakLabel({ top }: PageBreakLabelProps) {
  return (
    <div className="cv-page-break-label" style={{ top: top - 16 }}>
      <div className="cv-page-break-label__inner">
        <div className="cv-page-break-label__rule" />
        <div className="cv-page-break-label__center">
          <img src="/logo_bw.png" alt="" className="cv-page-break-label__logo" />
          <span className="cv-page-break-label__text">Page Break</span>
        </div>
        <div className="cv-page-break-label__rule" />
      </div>
    </div>
  );
}
