import FitAiStatusBar from './FitAiStatusBar.jsx';

export default function FitAiAdviceScreen() {
  return (
    <section className="fitai-screen" data-screen="advice">
      <FitAiStatusBar time="3:47" leftGlyphs={['G', 'M', 'M', '•']} battery="75" />
      <div className="fitai-screen__scroll fitai-screen__scroll--chat">
        <header className="fitai-app-header">
          <div className="fitai-app-header__main">
            <span className="fitai-app-header__icon fitai-app-header__icon--green">
              <svg><use href="#fitai-icon-sparkles"></use></svg>
            </span>
            <h2 className="fitai-app-header__title">Advice</h2>
          </div>
          <div className="fitai-app-header__actions">
            <span className="fitai-pill-badge">1717 kcal left</span>
          </div>
        </header>
        <div className="fitai-section-divider"></div>

        <div className="fitai-section-head fitai-section-head--caps">
          <h3>Quick Add</h3>
          <span>Tap + to log</span>
        </div>
        <div className="fitai-quick-add-row">
          {[
            ['Greek Yog...', '130 kcal', 'P 15g · C 8g'],
            ['Protein Bar', '210 kcal', 'P 20g · C 24g'],
            ['Chicken Br...', '248 kcal', 'P 46g · C 0g'],
          ].map(([title, kcal, copy]) => (
            <article key={title} className="fitai-card fitai-card--quick-add">
              <span className="fitai-card__add">+</span>
              <h4>{title}</h4>
              <strong>{kcal}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <div className="fitai-section-head fitai-section-head--caps">
          <h3>Recipes For You</h3>
        </div>
        <div className="fitai-filter-row">
          <span className="fitai-filter-pill fitai-filter-pill--active">All</span>
          <span className="fitai-filter-pill">Under 10 Min</span>
          <span className="fitai-filter-pill">No-Cook</span>
          <span className="fitai-filter-pill">High Protein</span>
          <span className="fitai-filter-pill">Post-Workout</span>
        </div>

        {[
          ['Grilled Chicken Salad', '10 mins', '350', 'P: 35g', 'C: 15g', 'F: 18g'],
          ['Turkey & Egg White Wrap', '7 mins', '310', 'P: 38g', 'C: 22g', 'F: 8g'],
          ['Cottage Cheese Power Bowl', '3 mins', '280', 'P: 30g', 'C: 20g', 'F: 10g'],
        ].map(([title, mins, kcal, protein, carbs, fats]) => (
          <article key={title} className="fitai-card fitai-card--recipe">
            <div className="fitai-card__row fitai-card__row--space fitai-card__row--start">
              <div>
                <h3>{title}</h3>
                <div className="fitai-card__row fitai-card__row--tight">
                  <span className="fitai-time-pill">◔ {mins}</span>
                  <span className="fitai-tag-pill">HIGH PROTEIN</span>
                </div>
              </div>
              <div className="fitai-recipe-kcal"><strong>{kcal}</strong><span>kcal</span></div>
            </div>
            <div className="fitai-macro-pills">
              <span className="fitai-macro-pill fitai-macro-pill--protein">{protein}</span>
              <span className="fitai-macro-pill fitai-macro-pill--carbs">{carbs}</span>
              <span className="fitai-macro-pill fitai-macro-pill--fat">{fats}</span>
              <span className="fitai-bookmark-pill">
                <svg><use href="#fitai-icon-bookmark"></use></svg>
              </span>
            </div>
          </article>
        ))}

        <div className="fitai-section-head fitai-section-head--caps">
          <h3>AI Nutrition Chat</h3>
        </div>
        <article className="fitai-card fitai-card--chat">
          <div className="fitai-chat-input">
            <span>Ask about nutrition...</span>
            <span className="fitai-chat-send">
              <svg><use href="#fitai-icon-send"></use></svg>
            </span>
          </div>
          <div className="fitai-chat-bubble">
            Ask me anything about nutrition, meals, or macro splits and I&apos;ll tailor it to your plan.
          </div>
        </article>
      </div>
    </section>
  );
}
