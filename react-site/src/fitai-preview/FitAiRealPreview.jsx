import React, { useEffect, useMemo, useRef, useState } from 'react';
import FitAiStatusBar from '../components/fitai/FitAiStatusBar.jsx';
import DashboardScreen from './app/screens/DashboardScreen.jsx';
import DiaryScreen from './app/screens/DiaryScreen.jsx';
import AdviceScreen from './app/screens/AdviceScreen.jsx';
import WorkoutPlannerScreen from './app/screens/WorkoutPlannerScreen.jsx';
import SettingsScreen from './app/screens/SettingsScreen.jsx';
import { PreviewProviders } from './PreviewProviders.jsx';
import { createPreviewNavigation } from './shims/react-navigation-native.jsx';

const SCREEN_ORDER = ['dashboard', 'diary', 'advice', 'workout', 'profile'];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', iconId: 'fitai-icon-home' },
  { id: 'diary', label: 'Diary', iconId: 'fitai-icon-book' },
  { id: 'advice', label: 'Advice', iconId: 'fitai-icon-sparkles' },
  { id: 'workout', label: 'Workouts', iconId: 'fitai-icon-dumbbell' },
  { id: 'profile', label: 'Profile', iconId: 'fitai-icon-user' },
];

const STATUS_BAR_BY_SCREEN = {
  dashboard: { time: '2:58', leftGlyphs: ['◈', '∞'], rightGlyphs: ['•'], battery: '65' },
  diary: { time: '3:47', leftGlyphs: ['G', 'M', 'M'], rightGlyphs: [], battery: '75' },
  advice: { time: '3:16', leftGlyphs: ['◈', '∞'], rightGlyphs: ['•'], battery: '72' },
  workout: { time: '3:47', leftGlyphs: ['G', 'M', 'M'], rightGlyphs: [], battery: '74' },
  profile: { time: '3:48', leftGlyphs: ['G', 'M', 'M'], rightGlyphs: [], battery: '73' },
};

const SCREEN_COMPONENTS = {
  dashboard: DashboardScreen,
  diary: DiaryScreen,
  advice: AdviceScreen,
  workout: WorkoutPlannerScreen,
  profile: SettingsScreen,
};

class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (typeof window !== 'undefined') {
      window.__fitaiPreviewError = error;
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fitai-real-preview__error">
          <strong>Preview Error</strong>
          <span>{this.state.error.message || 'The FitAI preview crashed while rendering.'}</span>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function FitAiRealPreview() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const autoRotateStoppedRef = useRef(false);
  const autoRotateTimerRef = useRef(null);
  const previewNavigation = useMemo(() => createPreviewNavigation(), []);

  useEffect(() => {
    if (autoRotateStoppedRef.current) {
      return undefined;
    }

    autoRotateTimerRef.current = window.setInterval(() => {
      setActiveScreen((currentScreen) => {
        const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % SCREEN_ORDER.length : 0;
        return SCREEN_ORDER[nextIndex];
      });
    }, 3200);

    return () => {
      if (autoRotateTimerRef.current) {
        window.clearInterval(autoRotateTimerRef.current);
      }
    };
  }, []);

  const stopAutoRotate = () => {
    if (autoRotateStoppedRef.current) {
      return;
    }

    autoRotateStoppedRef.current = true;
    if (autoRotateTimerRef.current) {
      window.clearInterval(autoRotateTimerRef.current);
      autoRotateTimerRef.current = null;
    }
  };

  const handleScreenSelect = (screenId) => {
    stopAutoRotate();
    setActiveScreen(screenId);
  };

  const statusBar = STATUS_BAR_BY_SCREEN[activeScreen] || STATUS_BAR_BY_SCREEN.dashboard;
  const ActiveScreenComponent = SCREEN_COMPONENTS[activeScreen] || DashboardScreen;
  const activeScreenProps = {
    navigation: previewNavigation,
    route: { params: {} },
  };

  return (
    <div className="hero__phone-frame fitai-device">
      <div className="fitai-device__camera"></div>
      <div className="hero__phone-screen" id="heroInteractivePhone">
        <div
          className="fitai-preview fitai-real-preview"
          data-fitai-preview
          aria-label="Interactive FitAI preview"
          onPointerDown={stopAutoRotate}
          onTouchStart={stopAutoRotate}
          onWheel={stopAutoRotate}
        >
          <FitAiStatusBar
            time={statusBar.time}
            leftGlyphs={statusBar.leftGlyphs}
            rightGlyphs={statusBar.rightGlyphs}
            battery={statusBar.battery}
          />
          <PreviewProviders navigation={previewNavigation}>
            <div className="fitai-real-preview__screens">
              <div
                className="fitai-real-preview__screen fitai-real-preview__screen--active"
                data-screen={activeScreen}
                aria-hidden="false"
              >
                <PreviewErrorBoundary key={activeScreen}>
                  <ActiveScreenComponent {...activeScreenProps} />
                </PreviewErrorBoundary>
              </div>
            </div>
          </PreviewProviders>
          <nav className="fitai-nav" aria-label="Switch app preview tabs">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeScreen;

              return (
                <button
                  key={item.id}
                  className={`fitai-nav__button${isActive ? ' fitai-nav__button--active' : ''}`}
                  data-screen-target={item.id}
                  type="button"
                  aria-pressed={isActive ? 'true' : 'false'}
                  onClick={() => handleScreenSelect(item.id)}
                >
                  <span className="fitai-nav__indicator"></span>
                  <svg className="fitai-nav__icon">
                    <use href={`#${item.iconId}`}></use>
                  </svg>
                  <span className="fitai-nav__label">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="fitai-home-indicator"></div>
        </div>
      </div>
    </div>
  );
}
