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
            The fitness app that keeps your whole routine in one locked-in system.
          </h1>
          <p className="launch-hero__subtitle animate-in visible">
            AbWork brings training, nutrition coaching, step tracking, recovery cues, and wearable
            sync into one premium mobile experience so progress feels clear, immediate, and easy to
            keep.
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
              <span>Nutrition guidance built into your daily flow</span>
            </div>
            <div className="launch-proof-chip">
              <strong>1 app</strong>
              <span>Workouts, habits, recovery, and tracking together</span>
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
              <strong>Synced in one flow</strong>
            </div>
            <FitAiPreview />
          </div>
          <p className="launch-hero__device-note">
            Live app preview using the real FitAI-inspired front end inside the landing page.
          </p>
        </div>
      </div>
    </section>
  );
}
