function ProofCard({ title, body }) {
  return (
    <div className="proof-strip__card animate-in">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="proof-strip__metric animate-in">
      <strong data-count={value}>{typeof value === 'number' ? 0 : value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function ProofStripSection() {
  return (
    <section className="proof-strip" id="proof">
      <div className="launch-shell">
        <div className="proof-strip__intro animate-in">
          <span className="section-tag">WHY ABWORK</span>
          <h2 className="section-title">
            It replaces the scattered stack that usually makes fitness harder to sustain.
          </h2>
          <p className="section-subtitle">
            Most people juggle separate tools for workouts, food, steps, recovery, and progress.
            AbWork turns that into one rhythm so the whole system finally works together.
          </p>
        </div>

        <div className="proof-strip__grid">
          <ProofCard
            title="Training and nutrition stop living in different apps"
            body="The workout side and the food side inform each other, so your daily choices feel connected instead of fragmented."
          />
          <ProofCard
            title="Your progress stays visible every day"
            body="Step rings, diary history, routines, and AI prompts keep momentum in front of you without asking for more effort."
          />
          <ProofCard
            title="The app feels like a premium product, not a tracker spreadsheet"
            body="Dark polished surfaces, focused flows, and app-first design make the whole experience feel desirable to return to."
          />
        </div>

        <div className="proof-strip__metrics">
          <Metric value={800} label="Exercises ready to log" />
          <Metric value={6} label="Wearable and health integrations" />
          <Metric value={15} label="Core capabilities in one system" />
          <Metric value={100} label="Free consumer access" />
        </div>
      </div>
    </section>
  );
}
