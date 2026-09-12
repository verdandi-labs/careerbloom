import "./PageBreak.css";

interface PageBreakProps {
  background?: string;
}

export function PageBreak({ background }: PageBreakProps) {
  const style = background
    ? ({ "--page-background": background } as React.CSSProperties)
    : undefined;

  return (
    <div className="cv-page-break" style={style}>
      <img src="/logo.png" alt="" className="cv-page-break__logo" />
      <span className="cv-page-break__text">page break</span>
      <img
        src="/logo.png"
        alt=""
        className="cv-page-break__logo cv-page-break__logo--right"
      />
    </div>
  );
}
