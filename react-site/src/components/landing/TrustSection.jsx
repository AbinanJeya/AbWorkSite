const trustCards = [
  {
    meta: 'REAL APP',
    metric: '5 live tabs',
    title: 'Tap through the actual product',
    points: [
      'Real screens sit in the hero, not placeholder art',
      'Navigation works instead of faking a concept',
      'People can inspect the product immediately',
    ],
    footer: 'Live preview',
  },
  {
    meta: 'CONNECTED LOOP',
    metric: '1 shared system',
    title: 'The value comes from signals reinforcing each other',
    points: [
      'Training and nutrition stay in one rhythm',
      'Steps and recovery stay visible in the same loop',
      'Progress reads like one story instead of scattered fragments',
    ],
    footer: 'Shared momentum',
  },
  {
    meta: 'READY NOW',
    metric: 'APK live',
    title: 'The install path already feels concrete',
    points: [
      'Polish shows up from the first screen',
      'The download action is visible right away',
      'The experience feels deliberate, not stitched together',
    ],
    footer: 'Consumer ready',
  },
];

function TrustCard({ title, meta, metric, points, footer }) {
  return (
    <article className="trust-board__card trust-card animate-in">
      <div className="trust-board__topline">
        <span className="trust-card__meta">{meta}</span>
        <span className="trust-board__metric">{metric}</span>
      </div>
      <h3>{title}</h3>
      <ul className="trust-card__list">
        {points.map((point) => (
          <li key={point}>
            <span className="trust-card__dot" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="trust-board__footer">
        <span></span>
        <strong>{footer}</strong>
      </div>
    </article>
  );
}

export default function TrustSection() {
  return (
    <section className="trust-section" id="trust">
      <div className="launch-shell">
        <div className="trust-section__header animate-in">
          <span className="section-tag">PRODUCT PROOF</span>
          <h2 className="section-title">The product proves the pitch in seconds.</h2>
          <p className="section-subtitle">
            Real screens, connected signals, and an install-ready flow do more than extra
            paragraphs ever could.
          </p>
        </div>

        <div className="trust-board">
          {trustCards.map((card) => (
            <TrustCard
              key={card.meta}
              meta={card.meta}
              metric={card.metric}
              title={card.title}
              points={card.points}
              footer={card.footer}
            />
          ))}
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
