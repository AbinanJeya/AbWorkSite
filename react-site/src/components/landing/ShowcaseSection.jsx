import advicePreview from '../../../../assets/Screenshot_20260417_034729.png';
import dashboardPreview from '../../../../assets/DashBoard.png';
import workoutPreview from '../../../../assets/LiveWorkout.png';

function ShowcaseStory({ eyebrow, title, body, image, alt, label, reverse = false }) {
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
        <p>{body}</p>
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
            The product story should come from the actual interface. AbWork's screens already show
            what makes the system stick: daily visibility, confident training flow, and AI that
            feels useful in the moment.
          </p>
        </div>

        <div className="showcase-stories">
          <ShowcaseStory
            eyebrow="DASHBOARD"
            title="Dashboard that drives action"
            body="The home experience surfaces steps, streaks, hydration, leaderboard energy, and recovery cues so you always know what to do next."
            image={dashboardPreview}
            alt="AbWork dashboard"
            label="Dashboard clarity"
          />

          <ShowcaseStory
            eyebrow="WORKOUT"
            title="Workout planning that feels premium"
            body="Routine structure, active sessions, and progress-focused training design make the app feel built for actual gym use, not just casual browsing."
            image={workoutPreview}
            alt="AbWork workout"
            label="Workout flow"
            reverse
          />

          <ShowcaseStory
            eyebrow="AI NUTRITION"
            title="AI nutrition that feels useful in the moment"
            body="Meal suggestions, quick-add foods, and practical guidance make the Advice tab feel like a real coaching surface instead of a novelty chatbot."
            image={advicePreview}
            alt="AbWork advice"
            label="AI nutrition help"
          />
        </div>
      </div>
    </section>
  );
}
