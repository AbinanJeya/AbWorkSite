import FitAiPreview from '../FitAiPreview.jsx';

const loopItems = [
  { label: 'Train', detail: 'Plans and live logging stay ready' },
  { label: 'Eat', detail: 'Meals and macros stay connected' },
  { label: 'Move', detail: 'Steps and daily momentum stay visible' },
  { label: 'Recover', detail: 'Sleep, hydration, and trends stay in view' },
];

const proofItems = [
  { value: '800+', label: 'exercises ready to run' },
  { value: 'AI', label: 'coaching inside the daily loop' },
  { value: '1 app', label: 'for training, food, and recovery' },
];

const signalItems = [
  {
    position: 'top-left',
    label: 'Workout split',
    value: 'Chest + Triceps',
    detail: 'Ready the second you open the app',
  },
  {
    position: 'top-right',
    label: 'Meals tracked',
    value: '1,840 kcal',
    detail: 'Macros stay live with training',
  },
  {
    position: 'bottom-left',
    label: 'Steps synced',
    value: '8,412 today',
    detail: 'Health data keeps the loop honest',
  },
  {
    position: 'bottom-right',
    label: 'Recovery trend',
    value: 'Sleep improving',
    detail: 'Small signals stay easy to notice',
  },
];

export default function HeroSection({ onPrimaryClick, onSecondaryClick }) {
  return (
    <section className="launch-hero" id="hero">
      <div className="launch-hero__mesh"></div>
      <div className="launch-hero__grid"></div>
      <div className="launch-hero__orb"></div>
      <div className="launch-shell launch-hero__layout">
        <div className="launch-hero__content">
          <div className="launch-eyebrow animate-in visible">
            <span className="launch-eyebrow__dot"></span>
            Android APK access available now
          </div>
          <h1 className="launch-hero__title animate-in visible">One daily fitness loop.</h1>
          <p className="launch-hero__subtitle animate-in visible">
            Workouts, meals, steps, and recovery stay in sync so every check-in points to the next
            useful move.
          </p>

          <div className="launch-loop-list animate-in visible">
            {loopItems.map((item) => (
              <div key={item.label} className="launch-loop-list__item">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>

          <div className="launch-hero__actions animate-in visible">
            <a href="#download" className="launch-btn launch-btn--primary" onClick={onPrimaryClick}>
              Download APK
            </a>
            <a
              href="#showcase"
              className="launch-btn launch-btn--ghost"
              onClick={onSecondaryClick}
            >
              Explore the experience
            </a>
          </div>

          <div className="launch-hero__proof animate-in visible">
            {proofItems.map((item) => (
              <div key={item.label} className="launch-proof-chip">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="launch-hero__device-wrap animate-in visible">
          <div className="launch-hero__device-stage">
            <div className="launch-hero__sync-ring" aria-hidden="true"></div>
            <div className="launch-hero__signal-grid" aria-hidden="true">
              {signalItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`launch-hero__signal animate-in launch-hero__signal--${item.position}`}
                  style={{ '--signal-index': index }}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="launch-hero__preview-shell">
              <FitAiPreview />
            </div>
          </div>
          <p className="launch-hero__device-note">
            Real app preview in the middle, with the surrounding signals showing why the system
            feels connected.
          </p>
        </div>
      </div>
    </section>
  );
}
