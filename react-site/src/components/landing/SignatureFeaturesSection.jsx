function SignatureFeature({ eyebrow, title, points, accent }) {
  return (
    <article className={`signature-card signature-card--${accent} animate-in`}>
      <div className="signature-card__topline">
        <span className="signature-card__eyebrow">{eyebrow}</span>
        <div className="signature-card__meter" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <h3>{title}</h3>
      <ul className="signature-card__list">
        {points.map((point) => (
          <li key={point}>
            <span className="signature-card__check" aria-hidden="true">
              ✓
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function SignatureFeaturesSection() {
  return (
    <section className="signature-section" id="features">
      <div className="launch-shell">
        <div className="section-header animate-in">
          <span className="section-tag">SIGNATURE FEATURES</span>
          <h2 className="section-title">
            Built to make everyday fitness feel sharper, clearer, and easier to keep.
          </h2>
          <p className="section-subtitle">
            These are the core behaviors that make the app useful every day.
          </p>
        </div>

        <div className="signature-grid">
          <SignatureFeature
            eyebrow="WORKOUT FLOW"
            title="Training built for real sessions"
            points={[
              'Build your split fast',
              'Run sessions without losing context',
              'Track progression in the same flow',
            ]}
            accent="workout"
          />
          <SignatureFeature
            eyebrow="AI NUTRITION"
            title="Guidance that feels useful today"
            points={[
              'Close macro gaps quickly',
              'Get practical meal suggestions',
              'Turn questions into next actions',
            ]}
            accent="ai"
          />
          <SignatureFeature
            eyebrow="DAILY TRACKING"
            title="Consistency that stays visible"
            points={[
              'See steps and hydration instantly',
              'Keep streaks and recovery cues visible',
              'Make daily momentum tangible',
            ]}
            accent="tracking"
          />
          <SignatureFeature
            eyebrow="CONNECTED DATA"
            title="Sync that makes the app feel complete"
            points={[
              'Pull health data into one place',
              'Reduce manual rebuild work',
              'Keep device data inside the same rhythm',
            ]}
            accent="sync"
          />
        </div>
      </div>
    </section>
  );
}
