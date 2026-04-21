const stickCards = [
  {
    metric: '2 tap feel',
    title: 'Fast daily check-ins',
    body: 'When logging feels light, staying on plan feels easier to repeat.',
  },
  {
    metric: 'Momentum visible',
    title: 'Progress you can notice fast',
    body: 'Clear rings, summaries, and streak signals make effort feel real.',
  },
  {
    metric: 'Low friction',
    title: 'A calmer loop to come back to',
    body: 'Predictable screens lower resistance and make the next open more likely.',
  },
];

function StickCard({ metric, title, body }) {
  return (
    <article className="stick-card animate-in">
      <span className="stick-card__metric">{metric}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="stick-card__bars" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </article>
  );
}

export default function WhyItSticksSection() {
  return (
    <section className="stick-section">
      <div className="launch-shell">
        <div className="section-header animate-in">
          <span className="section-tag">WHY IT STICKS</span>
          <h2 className="section-title">Consistency gets easier when the loop feels rewarding.</h2>
          <p className="section-subtitle">
            This should land as a product you want to reopen, not a tool you have to remember to
            manage.
          </p>
        </div>

        <div className="stick-grid">
          {stickCards.map((card) => (
            <StickCard
              key={card.title}
              metric={card.metric}
              title={card.title}
              body={card.body}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
