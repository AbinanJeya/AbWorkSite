import { useDeferredValue, useMemo, useState } from 'react';
import FitAiPreview from '../FitAiPreview.jsx';
import exerciseDatabase from '../../../../fitai-expo-preview/src/data/exercises.json';

const ACTION_PROOF_SEARCH_TERMS = ['bench', 'row', 'shoulder', 'cable'];
const ACTION_PROOF_FEATURED_NAMES = [
  'Bench Press (Barbell)',
  'Dumbbell Bench Press',
  'Cable Row (Seated)',
  'Lat Pulldown',
  'Overhead Press',
  'Face Pulls',
];

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeExercise(exercise, index) {
  return {
    id: `exercise-${index}`,
    name: exercise.name || 'Exercise',
    equipment: titleCase(exercise.equipment || 'Bodyweight'),
    primaryMuscle: titleCase(exercise.primary_muscle || 'General'),
    secondaryMuscle:
      exercise.secondary_muscle && exercise.secondary_muscle.toLowerCase() !== 'none'
        ? titleCase(exercise.secondary_muscle)
        : '',
  };
}

const ACTION_PROOF_LIBRARY = exerciseDatabase
  .map(normalizeExercise)
  .filter((exercise) => exercise.name.trim().length > 0);

const ACTION_PROOF_FEATURED = ACTION_PROOF_FEATURED_NAMES.map((exerciseName) =>
  ACTION_PROOF_LIBRARY.find((exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase())
).filter(Boolean);

const ACTION_PROOF_DEFAULT_RESULTS =
  ACTION_PROOF_FEATURED.length >= 4 ? ACTION_PROOF_FEATURED : ACTION_PROOF_LIBRARY.slice(0, 6);

const ACTION_PROOF_WORKOUT_PREVIEW_PARAMS = {
  previewRoute: 'Workout',
  previewScene: 'active-workout',
  previewWorkout: 'routine-upper-strength',
};

function SearchResultCard({ exercise }) {
  return (
    <article className="action-proof__result-card">
      <div className="action-proof__result-main">
        <strong>{exercise.name}</strong>
        <span>
          {exercise.primaryMuscle}
          {exercise.secondaryMuscle ? ` / ${exercise.secondaryMuscle}` : ''}
        </span>
      </div>
      <div className="action-proof__result-meta">
        <span>{exercise.equipment}</span>
      </div>
    </article>
  );
}

export default function ActionProofSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const searchResults = useMemo(() => {
    const trimmedQuery = deferredQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      return ACTION_PROOF_DEFAULT_RESULTS;
    }

    return ACTION_PROOF_LIBRARY.filter((exercise) => {
      const haystack = [
        exercise.name,
        exercise.equipment,
        exercise.primaryMuscle,
        exercise.secondaryMuscle,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(trimmedQuery);
    }).slice(0, 7);
  }, [deferredQuery]);

  return (
    <section className="action-proof" id="proof">
      <div className="launch-shell">
        <div className="action-proof__intro animate-in">
          <span className="section-tag">PRODUCT IN ACTION</span>
          <h2 className="section-title">Watch a set land. Search the full exercise library.</h2>
          <p className="section-subtitle">
            Real workout logging on one side, real exercise search on the other.
          </p>
        </div>

        <div className="action-proof__panels">
          <article className="action-proof__panel action-proof__panel--workout animate-in">
            <div className="action-proof__panel-topline">
              <span className="action-proof__eyebrow">Live workout</span>
              <span className="action-proof__live-pill">Real active workout</span>
            </div>

            <div className="action-proof__preview-shell">
              <FitAiPreview
                title="FitAI active workout preview"
                previewParams={ACTION_PROOF_WORKOUT_PREVIEW_PARAMS}
              />
            </div>
            <p className="action-proof__preview-note">
              This is the real workout screen running a sample session. Tap a set and the live rest
              timer counts down inside the same screen.
            </p>
          </article>

          <article className="action-proof__panel action-proof__panel--search animate-in">
            <div className="action-proof__panel-topline">
              <span className="action-proof__eyebrow">Exercise database</span>
              <span className="action-proof__count-pill">
                {ACTION_PROOF_LIBRARY.length.toLocaleString()} indexed
              </span>
            </div>

            <div className="action-proof__search-shell">
              <label className="action-proof__search-label" htmlFor="action-proof-search">
                Search exercises
              </label>
              <div className="action-proof__search-input-wrap">
                <span className="action-proof__search-icon" aria-hidden="true"></span>
                <input
                  id="action-proof-search"
                  className="action-proof__search-input"
                  type="search"
                  value={searchQuery}
                  placeholder="Search bench, row, cable..."
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="action-proof__clear-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="action-proof__quick-row">
                {ACTION_PROOF_SEARCH_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="action-proof__quick-btn"
                    onClick={() => setSearchQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="action-proof__search-summary">
                <strong>
                  {deferredQuery.trim()
                    ? `${searchResults.length} matches`
                    : `${ACTION_PROOF_LIBRARY.length.toLocaleString()} exercises ready`}
                </strong>
                <span>
                  {deferredQuery.trim()
                    ? `Filtering the same local database the preview app uses.`
                    : 'Popular results are loaded before you even type.'}
                </span>
              </div>

              <div className="action-proof__results" aria-live="polite">
                {searchResults.length ? (
                  searchResults.map((exercise) => (
                    <SearchResultCard key={exercise.id} exercise={exercise} />
                  ))
                ) : (
                  <div className="action-proof__empty-state">
                    <strong>No matches yet</strong>
                    <span>Try bench, squat, row, or cable.</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
