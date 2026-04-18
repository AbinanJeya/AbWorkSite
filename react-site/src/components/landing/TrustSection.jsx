function TrustCard({ title, body, meta }) {
  return (
    <article className="trust-card animate-in">
      <span className="trust-card__meta">{meta}</span>
      <h3>{title}</h3>
      <p>{body}</p>
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
            This site should earn trust by showing real capability: live app preview, integrated
            systems, and a mobile experience that already feels premium.
          </p>
        </div>

        <div className="trust-grid">
          <TrustCard
            meta="REAL APP PREVIEW"
            title="The hero uses a live app preview instead of a fake phone mockup"
            body="That turns the site itself into proof that AbWork is a real product with a real interface, not just a concept with polished marketing."
          />
          <TrustCard
            meta="CONNECTED SYSTEM"
            title="Training, nutrition, steps, recovery, and sync all reinforce each other"
            body="This is the strongest product argument on the page: AbWork is valuable because the system feels unified where most users are juggling separate tools."
          />
          <TrustCard
            meta="CONSUMER READY"
            title="The site should feel premium enough to match the ambition of the app"
            body="Stronger hierarchy, sharper messaging, and cleaner conversion flow position AbWork like a product people aspire to use."
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
