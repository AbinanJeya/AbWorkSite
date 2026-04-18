import FitAiStatusBar from './FitAiStatusBar.jsx';

export default function FitAiDiaryScreen() {
  return (
    <section className="fitai-screen" data-screen="diary">
      <FitAiStatusBar time="3:47" leftGlyphs={['G', 'M', 'M', '•']} battery="75" />
      <div className="fitai-screen__scroll">
        <header className="fitai-app-header fitai-app-header--diary">
          <div className="fitai-app-header__main">
            <span className="fitai-app-header__icon fitai-app-header__icon--green">
              <svg><use href="#fitai-icon-book"></use></svg>
            </span>
            <h2 className="fitai-app-header__title">Food Diary</h2>
          </div>
          <div className="fitai-app-header__actions">
            <span className="fitai-counter-chip fitai-counter-chip--danger">
              <span className="fitai-drumstick"></span>
              0
            </span>
            <span className="fitai-counter-chip">
              <svg><use href="#fitai-icon-calendar"></use></svg>
            </span>
          </div>
        </header>

        <div className="fitai-week-strip">
          {[
            ['MON', '13'],
            ['TUE', '14'],
            ['WED', '15'],
            ['THU', '16'],
            ['FRI', '17'],
            ['SAT', '18'],
            ['SUN', '19'],
          ].map(([day, date]) => (
            <div key={day} className={`fitai-week-strip__day${day === 'FRI' ? ' fitai-week-strip__day--active' : ''}`}>
              <span>{day}</span>
              <strong>{date}</strong>
            </div>
          ))}
        </div>
        <div className="fitai-week-strip__footer">
          <span>&lt;</span>
          <strong>WEEKLY VIEW</strong>
          <span>&gt;</span>
        </div>
        <div className="fitai-section-divider"></div>

        <article className="fitai-card fitai-card--calories">
          <div className="fitai-card__row fitai-card__row--space fitai-card__row--start">
            <div>
              <p className="fitai-card__muted-heading">Daily Calories</p>
              <div className="fitai-calorie-line">
                <strong>0</strong>
                <span>/ 1,717 kcal</span>
              </div>
              <p className="fitai-card__accent-copy">1,717 kcal remaining</p>
            </div>
            <div className="fitai-percent-ring">0%</div>
          </div>
          <div className="fitai-divider-line"></div>
          <div className="fitai-macro-summary">
            {[
              ['PROTEIN', '/163g'],
              ['CARBS', '/167g'],
              ['FATS', '/44g'],
            ].map(([label, target]) => (
              <div key={label} className="fitai-macro-summary__item">
                <span>{label}</span>
                <strong>0g<span>{target}</span></strong>
                <div className="fitai-progress"><span style={{ width: '0%' }}></span></div>
              </div>
            ))}
          </div>
        </article>

        {[
          ['Breakfast', 'fitai-meal-icon--breakfast', 'Nothing logged yet'],
          ['Lunch', 'fitai-meal-icon--lunch', 'Nothing logged yet'],
          ['Dinner', 'fitai-meal-icon--dinner', 'Plan your post-workout meal here'],
          ['Snacks', 'fitai-meal-icon--snacks', 'Nothing logged yet'],
        ].map(([mealName, iconClassName, emptyCopy]) => (
          <article key={mealName} className="fitai-card fitai-card--meal">
            <div className="fitai-card__row fitai-card__row--space">
              <div className="fitai-card__row fitai-card__row--tight">
                <span className={`fitai-meal-icon ${iconClassName}`}></span>
                <h3>{mealName}</h3>
              </div>
              <span className="fitai-kcal-label">-- kcal</span>
            </div>
            <div className="fitai-meal-empty">{emptyCopy}</div>
            <div className="fitai-meal-action"><span className="fitai-plus-dot">+</span> Add Food</div>
          </article>
        ))}
      </div>
    </section>
  );
}
