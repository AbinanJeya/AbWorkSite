function StickCard({ title, body }) {
  return (
    <article className="stick-card animate-in">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

export default function WhyItSticksSection() {
  return (
    <section className="stick-section">
      <div className="launch-shell">
        <div className="section-header animate-in">
          <span className="section-tag">WHY IT STICKS</span>
          <h2 className="section-title">Premium design matters because consistency is emotional.</h2>
          <p className="section-subtitle">
            People keep using tools that feel rewarding, clear, and trustworthy. AbWork should sell
            that feeling just as much as its feature set.
          </p>
        </div>

        <div className="stick-grid">
          <StickCard
            title="Quicker check-ins lower the odds of falling off"
            body="Fast logging and clear next steps make staying on plan feel lighter week after week."
          />
          <StickCard
            title="Visible momentum makes effort easier to repeat"
            body="Rings, summaries, and session history turn progress into something you can notice fast."
          />
          <StickCard
            title="A calm interface reduces resistance"
            body="When the app feels clean and predictable, opening it again takes less mental effort."
          />
        </div>
      </div>
    </section>
  );
}
