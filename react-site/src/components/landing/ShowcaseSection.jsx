import advicePreview from '../../../../assets/Screenshot_20260417_034729.png';
import dashboardPreview from '../../../../assets/DashBoard.png';
import workoutPreview from '../../../../assets/LiveWorkout.png';

function ShowcaseStory({
  eyebrow,
  title,
  summary,
  bullets,
  image,
  alt,
  label,
  reverse = false,
}) {
  return (
    <article className={`showcase-story animate-in${reverse ? ' showcase-story--reverse' : ''}`}>
      <div className="showcase-story__device">
        <div className="showcase-phone showcase-phone--feature">
          <div className="showcase-phone__frame">
            <img src={image} alt={alt} />
          </div>
          <span>{label}</span>
        </div>
      </div>

      <div className="showcase-story__copy">
        <span className="showcase-story__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p className="showcase-story__summary">{summary}</p>
        <ul className="showcase-story__list">
          {bullets.map((bullet) => (
            <li key={bullet}>
              <span className="showcase-story__check" aria-hidden="true">
                ✓
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function ShowcaseSection() {
  return (
    <section className="showcase-section" id="showcase">
      <div className="launch-shell">
        <div className="showcase-section__header animate-in">
          <span className="section-tag">THE EXPERIENCE</span>
          <h2 className="section-title">
            Every tab is designed to keep you moving, not just storing data.
          </h2>
          <p className="section-subtitle">
            The interface already tells the story: daily visibility, smoother training flow, and
            AI help in the moment.
          </p>
        </div>

        <div className="showcase-stories">
          <ShowcaseStory
            eyebrow="DASHBOARD"
            title="Dashboard that drives action"
            summary="The home experience tells you what matters today without making you scan through noise."
            bullets={[
              'Live habit signals at a glance',
              'Streaks, hydration, and steps in one place',
              'Leaderboard energy that keeps momentum visible',
            ]}
            image={dashboardPreview}
            alt="AbWork dashboard"
            label="Dashboard clarity"
          />

          <ShowcaseStory
            eyebrow="WORKOUT"
            title="Workout planning that feels premium"
            summary="The workout flow feels built for real training sessions, not casual browsing."
            bullets={[
              'Structured routines ready to run',
              'Live session logging that stays readable',
              'Progress-focused flow without clutter',
            ]}
            image={workoutPreview}
            alt="AbWork workout"
            label="Workout flow"
            reverse
          />

          <ShowcaseStory
            eyebrow="AI NUTRITION"
            title="AI nutrition that feels useful in the moment"
            summary="Advice stays practical so the AI feels like a useful coaching layer, not a gimmick."
            bullets={[
              'Quick macro-aware suggestions',
              'Fast answers when you need the next move',
              'Meal guidance that feels practical',
            ]}
            image={advicePreview}
            alt="AbWork advice"
            label="AI nutrition help"
          />
        </div>
      </div>
    </section>
  );
}
