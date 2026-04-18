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
            title="Less friction means more follow-through"
            body="When training, food, steps, and recovery live in one place, staying on plan stops feeling like admin work."
          />
          <StickCard
            title="Visual momentum keeps motivation alive"
            body="Rings, summaries, routines, and progress blocks make your effort visible in a way that encourages another day of showing up."
          />
          <StickCard
            title="The app feels worth opening"
            body="The aesthetic polish and app-native rhythm are part of the product value, not decoration added on top."
          />
        </div>
      </div>
    </section>
  );
}
