function SignatureFeature({ eyebrow, title, body, accent }) {
  return (
    <article className={`signature-card signature-card--${accent} animate-in`}>
      <span className="signature-card__eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{body}</p>
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
            These are the pillars that make AbWork feel more like a complete system than a basic
            tracker.
          </p>
        </div>

        <div className="signature-grid">
          <SignatureFeature
            eyebrow="WORKOUT FLOW"
            title="Programs, live sessions, and routine structure in one training space"
            body="Plan your split, open a workout, follow the routine, and keep progression visible without leaving the app rhythm."
            accent="workout"
          />
          <SignatureFeature
            eyebrow="AI NUTRITION"
            title="Guidance that responds to your day instead of generic meal-plan content"
            body="AbWork’s AI helps close macro gaps, answer questions, and turn nutrition into practical next actions."
            accent="ai"
          />
          <SignatureFeature
            eyebrow="DAILY TRACKING"
            title="Steps, diary, hydration, and recovery cues that make consistency tangible"
            body="The dashboard is designed to keep your routine visible, not buried in menus or historical charts."
            accent="tracking"
          />
          <SignatureFeature
            eyebrow="CONNECTED DATA"
            title="Wearable sync and health integrations that make the app feel complete"
            body="When the data already exists on your device, AbWork brings it into the same premium flow instead of asking you to rebuild it manually."
            accent="sync"
          />
        </div>
      </div>
    </section>
  );
}
