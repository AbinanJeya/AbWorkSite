import { useEffect, useState } from 'react';
import advicePreview from '../../assets/Screenshot_20260417_034729.png';
import dashboardPreview from '../../assets/DashBoard.png';
import workoutPreview from '../../assets/LiveWorkout.png';
import FitAiPreview from './components/FitAiPreview.jsx';
import { useLandingEffects } from './hooks/useLandingEffects.js';

function FeatureCard({ id, iconClassName = '', icon, title, description }) {
  const className = iconClassName
    ? `feature-card__icon ${iconClassName}`.trim()
    : 'feature-card__icon';

  return (
    <div className="feature-card animate-in" id={id}>
      <div className={className}>{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__desc">{description}</p>
      <div className="feature-card__glow"></div>
    </div>
  );
}

function AiListItem({ title, description }) {
  return (
    <li className="ai-section__list-item animate-in">
      <div className="ai-section__list-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      </div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </li>
  );
}

function ScreenshotPhone({ id, image, alt, label, centered = false }) {
  return (
    <div className={`screenshot-phone${centered ? ' screenshot-phone--center' : ''}`} id={id}>
      <div className="screenshot-phone__frame phone-frame--raw">
        <div className="screenshot-phone__notch"></div>
        <div className="screenshot-phone__screen">
          <img src={image} alt={alt} />
        </div>
      </div>
      <span className="screenshot-phone__label">{label}</span>
    </div>
  );
}

function StatsItem({ count, suffix, label }) {
  return (
    <div className="stats-banner__item animate-in">
      <div className="stats-banner__value-row">
        <span className="stats-banner__value" data-count={count}>
          0
        </span>
        {suffix ? <span className="stats-banner__plus">{suffix}</span> : null}
      </div>
      <span className="stats-banner__label">{label}</span>
    </div>
  );
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useLandingEffects(setNavScrolled);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 961px)');
    const handleBreakpointChange = (event) => {
      if (event.matches) {
        setNavOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  const closeNav = () => {
    setNavOpen(false);
  };

  return (
    <>
      <nav className={`nav${navScrolled ? ' nav--scrolled' : ''}`} id="nav">
        <div className="nav__inner">
          <a href="#hero" className="nav__logo" onClick={closeNav}>
            <div className="nav__logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="20"
                height="20"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="nav__logo-text">AbWork</span>
          </a>
          <div className={`nav__links${navOpen ? ' open' : ''}`} id="navLinks">
            <a href="#features" className="nav__link" onClick={closeNav}>
              Features
            </a>
            <a href="#ai" className="nav__link" onClick={closeNav}>
              AI Coach
            </a>
            <a href="#screenshots" className="nav__link" onClick={closeNav}>
              Preview
            </a>
            <a href="#download" className="nav__link nav__link--cta" onClick={closeNav}>
              Download Free
            </a>
          </div>
          <button
            className={`nav__hamburger${navOpen ? ' active' : ''}`}
            id="navToggle"
            aria-label="Toggle navigation"
            aria-expanded={navOpen ? 'true' : 'false'}
            aria-controls="navLinks"
            type="button"
            onClick={() => setNavOpen((currentValue) => !currentValue)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <section className="hero" id="hero">
        <div className="hero__bg-glow"></div>
        <div className="hero__bg-grid"></div>
        <div className="hero__content">
          <div className="hero__text">
            <div className="hero__badge animate-in visible">
              <span className="hero__badge-dot"></span>
              AI-Powered Fitness
            </div>
            <h1 className="hero__title animate-in visible">
              Train Smarter.
              <br />
              <span className="hero__title-accent">Track Everything.</span>
            </h1>
            <p className="hero__subtitle animate-in visible">
              AbWork is your all-in-one fitness companion - AI nutrition coaching, workout
              planning, step tracking, sleep analysis, and wearable sync. All in one beautifully
              designed app.
            </p>
            <div className="hero__cta-row animate-in visible">
              <a href="#download" className="btn btn--primary btn--lg" onClick={closeNav}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="20"
                  height="20"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download Free
              </a>
              <a href="#features" className="btn btn--ghost btn--lg" onClick={closeNav}>
                Explore Features
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="18"
                  height="18"
                >
                  <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
                </svg>
              </a>
            </div>
            <div className="hero__stats animate-in visible">
              <div className="hero__stat">
                <span className="hero__stat-value">800+</span>
                <span className="hero__stat-label">Exercises</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-value">AI</span>
                <span className="hero__stat-label">Powered</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-value">100%</span>
                <span className="hero__stat-label">Free</span>
              </div>
            </div>
            <div className="hero__preview-note animate-in visible">
              Scroll the live front-end preview and use the bottom tab bar to move through
              Dashboard, Diary, Advice, Workout, and Profile. Auto-rotation stops as soon as you
              interact.
            </div>
          </div>

          <div className="hero__phone animate-in visible">
            <FitAiPreview />
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features__container">
          <div className="section-header animate-in">
            <span className="section-tag">FEATURES</span>
            <h2 className="section-title">
              Everything You Need to
              <br />
              <span className="text-accent">Crush Your Goals</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools that work together seamlessly to help you build the body and habits
              you&apos;ve always wanted.
            </p>
          </div>
          <div className="features__grid">
            <FeatureCard
              id="feature-workouts"
              title="Workout Tracker"
              description="Log every set, rep, and weight. Over 800+ exercises with detailed instructions and automatic progress tracking."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
                  <path d="M6.5 6.5l11 11M21 3l-8.5 8.5M3 21l8.5-8.5M14.5 6l-5 5M18 9.5l-5 5" />
                  <path d="M3.5 20.5l3-3M20.5 3.5l-3 3" />
                </svg>
              }
            />
            <FeatureCard
              id="feature-ai"
              iconClassName="feature-card__icon--ai"
              title="AI Nutrition Coach"
              description="Get personalized meal suggestions, macro tracking, and real-time nutritional advice powered by advanced AI."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1" />
                  <path d="M7 14a7 7 0 017-7h0" />
                  <circle cx="12" cy="17" r="4" />
                  <path d="M12 13v4M10 17h4" />
                </svg>
              }
            />
            <FeatureCard
              id="feature-steps"
              title="Step Counter"
              description="Track daily steps with beautiful ring visualizations, weekly history, distance calculations, and calorie estimates."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
            />
            <FeatureCard
              id="feature-planner"
              title="Workout Planner"
              description="Build custom routines, schedule your training splits, and follow structured programs that adapt to your progress."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
                </svg>
              }
            />
            <FeatureCard
              id="feature-sleep"
              title="Sleep Analysis"
              description="Monitor your rest patterns with Health Connect integration. Track sleep stages, duration, and quality trends over time."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              }
            />
            <FeatureCard
              id="feature-wearable"
              title="Wearable Sync"
              description="Seamlessly connect your Fitbit, health devices, and Health Connect. Sync steps, heart rate, calories, and more."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
                  <rect x="6" y="2" width="12" height="20" rx="3" />
                  <path d="M12 17h.01" />
                  <path d="M9 2v1M15 2v1M9 22v-1M15 22v-1" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      <section className="ai-section" id="ai">
        <div className="ai-section__container">
          <div className="ai-section__content animate-in">
            <span className="section-tag">AI ASSISTANT</span>
            <h2 className="section-title">
              Your Personal
              <br />
              <span className="text-accent">AI Fitness Coach</span>
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left' }}>
              AbWork&apos;s built-in AI analyzes your daily intake, workout history, and goals to
              provide real-time coaching - from meal suggestions to recovery advice.
            </p>
            <ul className="ai-section__list">
              <AiListItem
                title="Smart Meal Suggestions"
                description="Get snack and post-workout recommendations based on your remaining macros"
              />
              <AiListItem
                title="Real-Time Chat"
                description="Ask anything about nutrition, form, or programming - get instant expert answers"
              />
              <AiListItem
                title="TDEE Calculator"
                description="Accurately calculate your daily energy expenditure with science-backed formulas"
              />
            </ul>
          </div>
          <div className="ai-section__visual animate-in">
            <div className="ai-card">
              <div className="ai-card__header">
                <div className="ai-card__avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1M7 14a7 7 0 017-7" />
                    <circle cx="12" cy="17" r="4" />
                  </svg>
                </div>
                <div>
                  <span className="ai-card__name">AbWork AI</span>
                  <span className="ai-card__status">&bull; Active</span>
                </div>
              </div>
              <div className="ai-card__body">
                <div className="ai-card__message">
                  Based on your intake today, you&apos;re <strong>34g short on protein</strong>.
                  Try adding a Greek yogurt bowl with almonds for a quick 22g boost!
                </div>
                <div className="ai-card__suggestions">
                  <div className="ai-card__suggestion">
                    <span className="ai-card__suggestion-label">SNACK</span>
                    <span className="ai-card__suggestion-name">Greek Yogurt &amp; Nuts</span>
                    <span className="ai-card__suggestion-meta">180 kcal &bull; 15g Protein</span>
                  </div>
                  <div className="ai-card__suggestion">
                    <span className="ai-card__suggestion-label">POST-GYM</span>
                    <span className="ai-card__suggestion-name">Protein Shake</span>
                    <span className="ai-card__suggestion-meta">220 kcal &bull; 24g Protein</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ai-section__glow"></div>
          </div>
        </div>
      </section>

      <section className="screenshots" id="screenshots">
        <div className="screenshots__container">
          <div className="section-header animate-in">
            <span className="section-tag">PREVIEW</span>
            <h2 className="section-title">
              See It In
              <br />
              <span className="text-accent">Action</span>
            </h2>
            <p className="section-subtitle">
              Beautiful, intuitive, and packed with features. Take a look at what awaits inside.
            </p>
          </div>
          <div className="screenshots__gallery animate-in">
            <ScreenshotPhone
              id="screenshot1"
              image={dashboardPreview}
              alt="Dashboard Preview"
              label="Dashboard"
            />
            <ScreenshotPhone
              id="screenshot2"
              image={workoutPreview}
              alt="Active Workout Preview"
              label="Active Workout"
              centered
            />
            <ScreenshotPhone
              id="screenshot3"
              image={advicePreview}
              alt="Advice Preview"
              label="Advice"
            />
          </div>
        </div>
      </section>

      <section className="stats-banner">
        <div className="stats-banner__inner">
          <StatsItem count={800} suffix="+" label="Exercises" />
          <StatsItem count={15} suffix="+" label="Unique Features" />
          <StatsItem count={6} label="Wearable Integrations" />
          <StatsItem count={100} suffix="%" label="Free to Use" />
        </div>
      </section>

      <section className="download" id="download">
        <div className="download__container">
          <div className="download__glow"></div>
          <div className="download__content animate-in">
            <h2 className="download__title">
              Ready to Transform
              <br />
              Your Fitness Journey?
            </h2>
            <p className="download__subtitle">
              Join thousands who are already training smarter with AbWork. Available on Android -
              completely free.
            </p>
            <div className="download__buttons">
              <a href="#" className="download__badge" aria-label="Get it on Google Play">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.698-2.698 2.698-2.698v.792zM5.864 2.658L16.8 9.39l-2.302 2.302L5.864 2.658z" />
                </svg>
                <div>
                  <span className="download__badge-small">GET IT ON</span>
                  <span className="download__badge-large">Google Play</span>
                </div>
              </a>
              <a href="#" className="download__badge" aria-label="Download on the App Store">
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <span className="download__badge-small">DOWNLOAD ON THE</span>
                  <span className="download__badge-large">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="nav__logo-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="20"
                  height="20"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="nav__logo-text">AbWork</span>
            </div>
            <p className="footer__tagline">Train Smarter. Track Everything.</p>
          </div>
          <div className="footer__links">
            <div className="footer__col">
              <h4 className="footer__col-title">Product</h4>
              <a href="#features" className="footer__link">
                Features
              </a>
              <a href="#ai" className="footer__link">
                AI Coach
              </a>
              <a href="#screenshots" className="footer__link">
                Preview
              </a>
              <a href="#download" className="footer__link">
                Download
              </a>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Support</h4>
              <a href="#" className="footer__link">
                Help Center
              </a>
              <a href="/privacy.html" className="footer__link">
                Privacy Policy
              </a>
              <a href="#" className="footer__link">
                Terms of Service
              </a>
              <a href="#" className="footer__link">
                Contact
              </a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; 2026 AbWork. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
