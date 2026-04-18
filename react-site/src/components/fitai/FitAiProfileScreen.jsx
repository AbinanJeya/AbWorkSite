import FitAiStatusBar from './FitAiStatusBar.jsx';

export default function FitAiProfileScreen() {
  return (
    <section className="fitai-screen" data-screen="profile">
      <FitAiStatusBar time="3:48" leftGlyphs={['G', 'M', 'M', '•']} battery="75" />
      <div className="fitai-screen__scroll">
        <header className="fitai-app-header">
          <div className="fitai-app-header__main">
            <span className="fitai-app-header__icon fitai-app-header__icon--green">
              <svg><use href="#fitai-icon-user"></use></svg>
            </span>
            <h2 className="fitai-app-header__title">Profile</h2>
          </div>
          <div className="fitai-app-header__actions fitai-app-header__actions--plain">
            <span className="fitai-app-header__ghost">&#10003;</span>
            <span className="fitai-app-header__ghost">
              <svg><use href="#fitai-icon-gear"></use></svg>
            </span>
          </div>
        </header>
        <div className="fitai-section-divider"></div>

        <div className="fitai-profile-hero">
          <div className="fitai-profile-hero__photo">
            <span className="fitai-profile-avatar__photo"></span>
            <span className="fitai-profile-hero__camera">&#9673;</span>
          </div>
          <div className="fitai-profile-hero__name">
            <h2>Abinan</h2>
            <span className="fitai-profile-hero__edit">
              <svg><use href="#fitai-icon-pencil"></use></svg>
            </span>
          </div>
          <p>Newcomer &bull; Level 1</p>
        </div>

        <article className="fitai-card fitai-card--xp">
          <div className="fitai-card__row fitai-card__row--space">
            <span>LEVEL 1</span>
            <span>LEVEL 2</span>
          </div>
          <div className="fitai-progress fitai-progress--xp"><span style={{ width: '79%' }}></span></div>
          <p>1,550 / 1,970 XP TO MILESTONE</p>
        </article>

        <div className="fitai-section-head fitai-section-head--caps fitai-section-head--inline">
          <h3>Current Plan</h3>
          <span className="fitai-pill-badge">Edit Plan</span>
        </div>
        <article className="fitai-card fitai-card--plan">
          <div>
            <h3>Cut</h3>
            <p>Target: 1717 kcal / day</p>
          </div>
          <div className="fitai-card__plan-side">
            <span>Maintenance (TDEE)</span>
            <strong>2,717 kcal</strong>
          </div>
        </article>

        <div className="fitai-section-head fitai-section-head--caps">
          <h3>Daily Goals</h3>
        </div>
        <div className="fitai-dashboard-grid">
          <article className="fitai-card fitai-card--goal">
            <p>Calorie Goal</p>
            <strong>1,717</strong>
            <span className="fitai-goal-edit">
              <svg><use href="#fitai-icon-pencil"></use></svg>
            </span>
          </article>
          <article className="fitai-card fitai-card--goal">
            <p>Step Goal</p>
            <strong>10,000</strong>
            <span className="fitai-goal-edit">
              <svg><use href="#fitai-icon-pencil"></use></svg>
            </span>
          </article>
        </div>

        <article className="fitai-card fitai-card--weekly-target">
          <div className="fitai-card__row fitai-card__row--space fitai-card__row--start">
            <div>
              <p className="fitai-card__goal-title">Weekly Gym Target</p>
              <strong>5 days per week</strong>
            </div>
            <span>Applies to your full streak history</span>
          </div>
          <div className="fitai-target-circles">
            <span>1</span><span>2</span><span>3</span><span>4</span><span className="fitai-target-circles__active">5</span><span>6</span><span>7</span>
          </div>
        </article>

        <div className="fitai-section-head fitai-section-head--caps fitai-section-head--inline">
          <h3>Macro Split</h3>
          <span>Recalculate</span>
        </div>
        <article className="fitai-card fitai-card--macro-split">
          <div className="fitai-macro-stack">
            <span style={{ width: '39%' }}></span>
            <span style={{ width: '38%' }}></span>
            <span style={{ width: '23%' }}></span>
          </div>
          <div className="fitai-slider-row">
            <div>
              <p>Carbohydrates</p>
              <div className="fitai-slider"><span style={{ width: '52%' }}></span></div>
            </div>
            <strong>39% <span>167g</span></strong>
          </div>
          <div className="fitai-slider-row">
            <div>
              <p>Protein</p>
              <div className="fitai-slider"><span style={{ width: '50%' }}></span></div>
            </div>
            <strong>38% <span>163g</span></strong>
          </div>
          <div className="fitai-slider-row">
            <div>
              <p>Fats</p>
              <div className="fitai-slider"><span style={{ width: '28%' }}></span></div>
            </div>
            <strong>23% <span>44g</span></strong>
          </div>
          <p className="fitai-card__success">&#10003; Total distribution equals 100%</p>
        </article>

        <div className="fitai-section-head fitai-section-head--caps">
          <h3>Nutrition AI Personality</h3>
        </div>
        <article className="fitai-card fitai-card--personality">
          <span className="fitai-card--personality__icon">&#9881;</span>
          <div>
            <h3>Refine AI Personalization</h3>
            <p>Update your struggles, restrictions, and meal frequency.</p>
          </div>
          <span className="fitai-personality-arrow">&gt;</span>
        </article>
      </div>
    </section>
  );
}
