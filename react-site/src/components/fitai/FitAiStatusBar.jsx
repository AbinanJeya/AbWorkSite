export default function FitAiStatusBar({ time, leftGlyphs, rightGlyphs = [], battery }) {
  return (
    <div className="fitai-statusbar" aria-hidden="true">
      <div className="fitai-statusbar__left">
        <span className="fitai-statusbar__time">{time}</span>
        {leftGlyphs.map((glyph) => (
          <span key={`${time}-${glyph}`} className="fitai-statusbar__glyph">
            {glyph}
          </span>
        ))}
      </div>
      <div className="fitai-statusbar__right">
        {rightGlyphs.map((glyph) => (
          <span key={`${battery}-${glyph}`} className="fitai-statusbar__glyph">
            {glyph}
          </span>
        ))}
        <span className="fitai-statusbar__signal">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span className="fitai-statusbar__wifi">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span className="fitai-statusbar__battery">
          <span className="fitai-statusbar__battery-fill"></span>
          <strong>{battery}</strong>
        </span>
      </div>
    </div>
  );
}
