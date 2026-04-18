import FitAiPreview from '../FitAiPreview.jsx';

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
          <h1 className="launch-hero__title animate-in visible">
            The fitness app that keeps training, food, and progress in sync.
          </h1>
          <p className="launch-hero__subtitle animate-in visible">
            AbWork keeps workouts, nutrition, steps, recovery, and wearable data aligned so the
            next useful action stays obvious.
          </p>

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
            <div className="launch-proof-chip">
              <strong>800+</strong>
              <span>Exercises with progress-ready logging</span>
            </div>
            <div className="launch-proof-chip">
              <strong>AI</strong>
              <span>Nutrition help built into the daily loop</span>
            </div>
            <div className="launch-proof-chip">
              <strong>1 app</strong>
              <span>Training, food, recovery, and momentum together</span>
            </div>
          </div>
        </div>

        <div className="launch-hero__device-wrap animate-in visible">
          <div className="launch-hero__device-stage">
            <div className="launch-floating launch-floating--left">
              <span>Macros</span>
              <strong>Tracked live</strong>
            </div>
            <div className="launch-floating launch-floating--right">
              <span>Wearables</span>
              <strong>Synced automatically</strong>
            </div>
            <FitAiPreview />
          </div>
          <p className="launch-hero__device-note">
            Live app preview embedded directly into the landing page.
          </p>
        </div>
      </div>
    </section>
  );
}
