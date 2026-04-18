import FitAiStatusBar from './FitAiStatusBar.jsx';

export default function FitAiDashboardScreen() {
  return (
    <section className="fitai-screen fitai-screen--active" data-screen="dashboard">
      <FitAiStatusBar time="2:58" leftGlyphs={['◆', '∞']} rightGlyphs={['⌁', '●']} battery="65" />
      <div className="fitai-screen__scroll">
        <header className="fitai-dashboard-header">
          <div>
            <p className="fitai-dashboard-header__eyebrow">GOOD MORNING</p>
            <h2 className="fitai-dashboard-header__title">Abinan</h2>
          </div>
          <div className="fitai-profile-avatar">
            <span className="fitai-profile-avatar__photo"></span>
            <span className="fitai-profile-avatar__online"></span>
          </div>
        </header>
        <div className="fitai-section-divider"></div>

        <article className="fitai-card fitai-card--steps">
          <div className="fitai-card__timestamp">2:58 AM</div>
          <div className="fitai-steps-ring">
            <div className="fitai-steps-ring__track"></div>
            <div className="fitai-steps-ring__progress"></div>
            <div className="fitai-steps-ring__content">
              <span className="fitai-steps-ring__icon">&bull;&bull;</span>
              <strong>1,561</strong>
              <span>/ 10,000 steps</span>
              <em>8,439 left</em>
            </div>
          </div>
          <div className="fitai-sync-pill">
            <span className="fitai-sync-pill__watch"></span>
            Synced from Health Connect
          </div>
          <div className="fitai-steps-metrics">
            <div>
              <strong>0</strong>
              <span>KCAL</span>
            </div>
            <div>
              <strong>1.2</strong>
              <span>KM</span>
            </div>
            <div>
              <strong>0</strong>
              <span>MIN</span>
            </div>
          </div>
        </article>

        <article className="fitai-card fitai-card--week">
          <div className="fitai-card__row fitai-card__row--space">
            <h3>Last 7 Days</h3>
            <div className="fitai-card__row fitai-card__row--tight">
              <span className="fitai-chip fitai-chip--ghost fitai-chip--small">See More</span>
              <span className="fitai-card__range">APR 10 - APR 16</span>
            </div>
          </div>
          <div className="fitai-week-rings">
            {[
              ['SAT', 'fitai-mini-ring--65'],
              ['SUN', 'fitai-mini-ring--72'],
              ['MON', 'fitai-mini-ring--58'],
              ['TUE', 'fitai-mini-ring--76'],
              ['WED', 'fitai-mini-ring--42'],
              ['THU', 'fitai-mini-ring--49'],
            ].map(([day, ringClass]) => (
              <div key={day} className="fitai-week-rings__day">
                <span className={`fitai-mini-ring ${ringClass}`}></span>
                <small>{day}</small>
              </div>
            ))}
            <div className="fitai-week-rings__day fitai-week-rings__day--today">
              <span className="fitai-mini-ring fitai-mini-ring--23"></span>
              <small>TODAY</small>
            </div>
          </div>
        </article>

        <div className="fitai-section-head fitai-section-head--spacious">
          <h3>Friends Leaderboard</h3>
          <span>See More -&gt;</span>
        </div>
        <article className="fitai-card fitai-card--leaderboard">
          <div className="fitai-card__eyebrow fitai-card__eyebrow--icon">
            <span className="fitai-card__trophy">&#127942;</span>
            Top movers this week
          </div>
          <div className="fitai-leaderboard-row fitai-leaderboard-row--you">
            <span className="fitai-rank">4</span>
            <div className="fitai-leaderboard-row__identity">
              <span className="fitai-avatar-dot fitai-avatar-dot--green"></span>
              <strong>YOU</strong>
            </div>
            <span className="fitai-leaderboard-row__steps">1.6k</span>
          </div>
          <div className="fitai-progress fitai-progress--thin"><span style={{ width: '82%' }}></span></div>
          <div className="fitai-leaderboard-row">
            <span className="fitai-rank fitai-rank--muted">5</span>
            <div className="fitai-leaderboard-row__identity">
              <span className="fitai-avatar-dot"></span>
              <span>Coach Alex</span>
            </div>
            <span className="fitai-leaderboard-row__steps">1.4k</span>
          </div>
          <div className="fitai-progress fitai-progress--thin fitai-progress--muted"><span style={{ width: '71%' }}></span></div>
        </article>

        <div className="fitai-section-head">
          <h3>AI Nutrition Assistant</h3>
          <span>Last checked 12m ago</span>
        </div>
        <article className="fitai-card fitai-card--assistant">
          <div className="fitai-card__row fitai-card__row--tight">
            <span className="fitai-assistant-badge">AI</span>
            <strong>You&apos;re 1,717 kcal under target.</strong>
          </div>
          <p>Consider a lean protein meal and one complex carb snack to stay on track before tonight&apos;s training.</p>
          <div className="fitai-assistant-pills">
            <span>High protein</span>
            <span>Pre-workout</span>
            <span>Easy prep</span>
          </div>
        </article>

        <div className="fitai-dashboard-grid">
          <article className="fitai-card fitai-card--compact">
            <div className="fitai-card__row fitai-card__row--tight">
              <svg className="fitai-inline-icon"><use href="#fitai-icon-droplet"></use></svg>
              <h4>Hydration</h4>
            </div>
            <strong className="fitai-card__big-number">2.1L</strong>
            <p>0.9L left to goal</p>
            <div className="fitai-progress"><span style={{ width: '70%' }}></span></div>
          </article>
          <article className="fitai-card fitai-card--compact">
            <div className="fitai-card__row fitai-card__row--tight">
              <svg className="fitai-inline-icon"><use href="#fitai-icon-bed"></use></svg>
              <h4>Sleep</h4>
            </div>
            <strong className="fitai-card__big-number">7h 48m</strong>
            <p>Recovery score 84%</p>
            <div className="fitai-progress fitai-progress--cool"><span style={{ width: '84%' }}></span></div>
          </article>
        </div>

        <article className="fitai-card fitai-card--quick-links">
          <div className="fitai-section-head fitai-section-head--inline">
            <h3>Quick Access</h3>
            <span>Built around your routine</span>
          </div>
          <div className="fitai-quick-links">
            <span className="fitai-quick-links__item">Log breakfast</span>
            <span className="fitai-quick-links__item">Start Push day</span>
            <span className="fitai-quick-links__item">Review macro split</span>
          </div>
        </article>
      </div>
    </section>
  );
}
