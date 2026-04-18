const stackItems = [
  { title: 'Workouts', detail: 'Plans + live logging' },
  { title: 'Nutrition', detail: 'Macros + meals' },
  { title: 'Steps', detail: 'Daily movement' },
  { title: 'Recovery', detail: 'Hydration + trends' },
];

const checklistItems = [
  {
    title: 'One place to train',
    detail: 'Routines, sessions, and exercise history stay in one flow.',
  },
  {
    title: 'One place to eat',
    detail: 'Diary, macros, and AI guidance stop living in separate tools.',
  },
  {
    title: 'One place to stay consistent',
    detail: 'Steps, recovery cues, and progress stay visible every day.',
  },
];

function ChecklistItem({ title, detail }) {
  return (
    <div className="proof-strip__check-item animate-in">
      <span className="proof-strip__check-icon" aria-hidden="true">
        ✓
      </span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
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
            Most people bounce between separate tools for workouts, food, steps, and progress.
            AbWork collapses that into one rhythm you can actually stay with.
          </p>
        </div>

        <div className="proof-strip__experience">
          <div className="proof-strip__stage animate-in">
            <div className="proof-strip__stage-glow" aria-hidden="true" />
            <div className="proof-strip__stack" aria-label="Scattered fitness tools">
              {stackItems.map((item, index) => (
                <div
                  key={item.title}
                  className="proof-strip__stack-item"
                  style={{ '--proof-index': index }}
                >
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>

            <div className="proof-strip__beam" aria-hidden="true" />

            <div className="proof-strip__core">
              <span className="proof-strip__core-tag">ABWORK</span>
              <strong>Everything moves together</strong>
              <p>Planning, meals, movement, and recovery reinforce each other without tool switching.</p>
            </div>
          </div>

          <div className="proof-strip__checklist">
            {checklistItems.map((item) => (
              <ChecklistItem key={item.title} title={item.title} detail={item.detail} />
            ))}
          </div>
        </div>

        <div className="proof-strip__metrics">
          <Metric value={800} label="Exercises ready to log" />
          <Metric value={6} label="Wearable and health integrations" />
          <Metric value={15} label="Core capabilities working together" />
          <Metric value={100} label="Free consumer access" />
        </div>
      </div>
    </section>
  );
}
