import FitAiStatusBar from './FitAiStatusBar.jsx';

export default function FitAiWorkoutScreen() {
  return (
    <section className="fitai-screen" data-screen="workout">
      <FitAiStatusBar time="3:47" leftGlyphs={['G', 'M', 'M', '•']} battery="75" />
      <div className="fitai-screen__scroll">
        <header className="fitai-app-header">
          <div className="fitai-app-header__main">
            <span className="fitai-app-header__icon fitai-app-header__icon--green">
              <svg><use href="#fitai-icon-dumbbell"></use></svg>
            </span>
            <h2 className="fitai-app-header__title">Workouts</h2>
          </div>
          <div className="fitai-app-header__actions">
            <span className="fitai-counter-chip fitai-counter-chip--blue">
              <svg><use href="#fitai-icon-dumbbell"></use></svg>
              0
            </span>
            <span className="fitai-counter-chip fitai-counter-chip--slate">
              <svg><use href="#fitai-icon-clock"></use></svg>
              2
            </span>
          </div>
        </header>
        <div className="fitai-section-divider"></div>

        <div className="fitai-card__row fitai-card__row--space fitai-card__row--start fitai-card__row--workout-title">
          <div>
            <h2 className="fitai-screen-title">My Routines</h2>
            <p className="fitai-screen-subtitle">0-week streak</p>
            <span className="fitai-screen-detail">3/5 this week</span>
          </div>
          <div className="fitai-card__row fitai-card__row--tight">
            <span className="fitai-chip fitai-chip--dark">REORDER</span>
            <span className="fitai-chip fitai-chip--dark">SELECT</span>
          </div>
        </div>

        {[
          ['Push', 'Incline Bench Pres...', 'fitai-routine-card__art--arm'],
          ['Pull', 'Lat Pulldown, Seat...', 'fitai-routine-card__art--db'],
          ['Legs/Lower', 'Squat, Romanian D...', 'fitai-routine-card__art--arm'],
          ['Upper', 'Lat Pulldown, Seat...', 'fitai-routine-card__art--db'],
        ].map(([title, copy, artClass]) => (
          <article key={title} className="fitai-card fitai-card--routine">
            <div className={`fitai-routine-card__art ${artClass}`}></div>
            <div className="fitai-routine-card__copy">
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
            <span className="fitai-cta-pill">START WORKOUT</span>
            <span className="fitai-kebab">&bull;&bull;&bull;</span>
          </article>
        ))}

        <article className="fitai-card fitai-card--create-routine">
          <span className="fitai-card--create-routine__plus">+</span>
          <strong>CREATE ROUTINE</strong>
        </article>

        <article className="fitai-card fitai-card--calendar">
          <div className="fitai-card__row fitai-card__row--space">
            <div className="fitai-card__row fitai-card__row--tight">
              <svg className="fitai-inline-icon"><use href="#fitai-icon-calendar"></use></svg>
              <h3>Workout Activity</h3>
            </div>
            <span>See More -&gt;</span>
          </div>
          <h4>April 2026</h4>
          <div className="fitai-calendar">
            <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
            <b className="fitai-calendar__active">1</b><i>2</i><b className="fitai-calendar__active">3</b><b className="fitai-calendar__active">4</b><b className="fitai-calendar__active">5</b><i>6</i><i>7</i>
            <b className="fitai-calendar__active">8</b><b className="fitai-calendar__active">9</b><i>10</i><b className="fitai-calendar__active">11</b><b className="fitai-calendar__active">12</b><b className="fitai-calendar__active">13</b><i>14</i>
            <b className="fitai-calendar__active">15</b><i>16</i><b className="fitai-calendar__selected">17</b><i>18</i><i>19</i><i>20</i><i>21</i>
            <i>22</i><i>23</i><i>24</i><i>25</i><i>26</i><i>27</i><i>28</i>
          </div>
        </article>
      </div>
    </section>
  );
}
