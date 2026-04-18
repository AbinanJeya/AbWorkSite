function TrustCard({ title, meta, points }) {
  return (
    <article className="trust-card animate-in">
      <span className="trust-card__meta">{meta}</span>
      <h3>{title}</h3>
      <ul className="trust-card__list">
        {points.map((point) => (
          <li key={point}>
            <span className="trust-card__dot" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function TrustSection() {
  return (
    <section className="trust-section" id="trust">
      <div className="launch-shell">
        <div className="trust-section__header animate-in">
          <span className="section-tag">PRODUCT PROOF</span>
          <h2 className="section-title">
            The pitch works because the product already has depth, not because the website is
            pretending.
          </h2>
          <p className="section-subtitle">
            Trust should come from seeing the product move: live preview, connected data, and a
            mobile flow that already feels finished.
          </p>
        </div>

        <div className="trust-grid">
          <TrustCard
            meta="REAL APP PREVIEW"
            title="The hero proves the product is real"
            points={[
              'Real UI, not a concept render',
              'Live navigation instead of a fake mockup',
              'A product people can immediately inspect',
            ]}
          />
          <TrustCard
            meta="CONNECTED SYSTEM"
            title="The value comes from everything reinforcing each other"
            points={[
              'Training and nutrition stay connected',
              'Steps, recovery, and sync stay in the same loop',
              'The whole system feels unified instead of scattered',
            ]}
          />
          <TrustCard
            meta="CONSUMER READY"
            title="The product already feels ready to use"
            points={[
              'Consistent mobile polish from the first screen',
              'An install path that is visible right away',
              'An experience that feels deliberate, not improvised',
            ]}
          />
        </div>

        <div className="trust-pills animate-in">
          <span>Workout planning</span>
          <span>AI nutrition coach</span>
          <span>Step history</span>
          <span>Hydration tracking</span>
          <span>Health integrations</span>
          <span>Routine structure</span>
        </div>
      </div>
    </section>
  );
}
