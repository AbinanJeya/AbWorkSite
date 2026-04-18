import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { PREVIEW_ROOT_TABS } from './PreviewEnvironment';

const AUTO_PAN_START_DELAY_MS = 850;
const AUTO_PAN_DURATION_MS = 2200;
const AUTO_TAB_ADVANCE_DELAY_MS = 4100;
const USER_PAUSE_MS = 12000;
const DEFAULT_DEMO_RATIO = 0.62;
const DEFAULT_DEMO_OFFSET = 240;
const MIN_DEMO_OFFSET = 120;
const MAX_DEMO_OFFSET = 320;

const PreviewAutoDemoContext = createContext(null);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getNextTabName(currentTab) {
  const currentIndex = PREVIEW_ROOT_TABS.indexOf(currentTab);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PREVIEW_ROOT_TABS.length;
  return PREVIEW_ROOT_TABS[nextIndex];
}

function animateScroll(controller, targetOffset, durationMs) {
  const startOffset = controller.getCurrentOffset?.() ?? 0;
  const maxOffset = controller.getMaxOffset?.() ?? 0;
  const boundedTargetOffset = clamp(targetOffset, 0, maxOffset);

  if (Math.abs(boundedTargetOffset - startOffset) < 1 || durationMs <= 0) {
    controller.scrollTo?.(boundedTargetOffset, false);
    return () => {};
  }

  const startedAt = Date.now();
  const intervalId = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const progress = clamp(elapsed / durationMs, 0, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    const nextOffset = startOffset + (boundedTargetOffset - startOffset) * easedProgress;

    controller.scrollTo?.(nextOffset, false);

    if (progress >= 1) {
      clearInterval(intervalId);
    }
  }, 32);

  return () => {
    clearInterval(intervalId);
  };
}

export function PreviewAutoDemoProvider({ children }) {
  const [activeTab, setActiveTab] = useState(PREVIEW_ROOT_TABS[0]);
  const [pauseUntil, setPauseUntil] = useState(0);
  const [registryVersion, setRegistryVersion] = useState(0);
  const [navigatorVersion, setNavigatorVersion] = useState(0);
  const controllersRef = useRef(new Map());
  const navigateRef = useRef(null);

  const registerScrollController = useCallback((tabName, controller) => {
    controllersRef.current.set(tabName, controller);
    setRegistryVersion((version) => version + 1);

    return () => {
      const currentController = controllersRef.current.get(tabName);

      if (currentController === controller) {
        controllersRef.current.delete(tabName);
        setRegistryVersion((version) => version + 1);
      }
    };
  }, []);

  const registerNavigator = useCallback((navigate) => {
    navigateRef.current = navigate;
    setNavigatorVersion((version) => version + 1);

    return () => {
      if (navigateRef.current === navigate) {
        navigateRef.current = null;
        setNavigatorVersion((version) => version + 1);
      }
    };
  }, []);

  const reportActiveTab = useCallback((tabName) => {
    if (!tabName) {
      return;
    }

    setActiveTab((currentTab) => (currentTab === tabName ? currentTab : tabName));
  }, []);

  const pauseAutomation = useCallback((durationMs = USER_PAUSE_MS) => {
    if (Platform.OS !== 'web') {
      return;
    }

    const nextPauseUntil = Date.now() + durationMs;
    setPauseUntil((currentPauseUntil) => Math.max(currentPauseUntil, nextPauseUntil));
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || pauseUntil <= Date.now()) {
      return undefined;
    }

    const remainingMs = pauseUntil - Date.now();
    const timeoutId = setTimeout(() => {
      setPauseUntil((currentPauseUntil) =>
        currentPauseUntil <= Date.now() ? 0 : currentPauseUntil
      );
    }, remainingMs + 16);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pauseUntil]);

  useEffect(() => {
    if (Platform.OS !== 'web' || pauseUntil > Date.now()) {
      return undefined;
    }

    const activeController = controllersRef.current.get(activeTab);
    const navigate = navigateRef.current;

    if (!activeController || typeof navigate !== 'function') {
      return undefined;
    }

    activeController.reset?.();

    let stopAnimation = null;
    const panTimeoutId = setTimeout(() => {
      const maxOffset = activeController.getMaxOffset?.() ?? 0;
      const preferredOffset = activeController.getDemoOffset?.() ?? 0;
      const fallbackOffset = clamp(
        Math.max(maxOffset * DEFAULT_DEMO_RATIO, DEFAULT_DEMO_OFFSET),
        MIN_DEMO_OFFSET,
        MAX_DEMO_OFFSET
      );
      const targetOffset = Math.min(maxOffset, Math.max(preferredOffset, fallbackOffset));

      stopAnimation = animateScroll(activeController, targetOffset, AUTO_PAN_DURATION_MS);
    }, AUTO_PAN_START_DELAY_MS);

    const nextTabTimeoutId = setTimeout(() => {
      navigate(getNextTabName(activeTab));
    }, AUTO_TAB_ADVANCE_DELAY_MS);

    return () => {
      clearTimeout(panTimeoutId);
      clearTimeout(nextTabTimeoutId);
      stopAnimation?.();
    };
  }, [activeTab, navigatorVersion, pauseUntil, registryVersion]);

  const value = useMemo(
    () => ({
      pauseAutomation,
      registerNavigator,
      registerScrollController,
      reportActiveTab,
    }),
    [pauseAutomation, registerNavigator, registerScrollController, reportActiveTab]
  );

  return (
    <PreviewAutoDemoContext.Provider value={value}>
      {children}
    </PreviewAutoDemoContext.Provider>
  );
}

export function usePreviewAutoDemo() {
  const context = useContext(PreviewAutoDemoContext);

  if (!context) {
    throw new Error('usePreviewAutoDemo must be used within PreviewAutoDemoProvider');
  }

  return context;
}

export function usePreviewAutoScroll(tabName, options = {}) {
  const { registerScrollController } = usePreviewAutoDemo();
  const scrollRef = options.ref ?? React.useRef(null);
  const metricsRef = useRef({ contentHeight: 0, offset: 0, viewportHeight: 0 });
  const listType = options.type ?? 'scrollview';
  const demoRatio = options.demoRatio ?? DEFAULT_DEMO_RATIO;
  const demoOffset = options.demoOffset ?? DEFAULT_DEMO_OFFSET;

  const getMaxOffset = useCallback(() => {
    const { contentHeight, viewportHeight } = metricsRef.current;
    return Math.max(0, contentHeight - viewportHeight);
  }, []);

  const scrollTo = useCallback(
    (offset, animated = false) => {
      const scrollable = scrollRef.current;

      if (!scrollable) {
        return;
      }

      const boundedOffset = clamp(offset, 0, getMaxOffset());
      metricsRef.current.offset = boundedOffset;

      if (listType === 'flatlist' && typeof scrollable.scrollToOffset === 'function') {
        scrollable.scrollToOffset({ animated, offset: boundedOffset });
        return;
      }

      if (typeof scrollable.scrollTo === 'function') {
        scrollable.scrollTo({ animated, y: boundedOffset });
        return;
      }

      if (typeof scrollable.scrollResponderScrollTo === 'function') {
        scrollable.scrollResponderScrollTo({ animated, y: boundedOffset });
      }
    },
    [getMaxOffset, listType, scrollRef]
  );

  const getDemoOffset = useCallback(() => {
    const maxOffset = getMaxOffset();

    if (maxOffset <= 0) {
      return 0;
    }

    return Math.min(
      maxOffset,
      clamp(Math.max(maxOffset * demoRatio, demoOffset), MIN_DEMO_OFFSET, MAX_DEMO_OFFSET)
    );
  }, [demoOffset, demoRatio, getMaxOffset]);

  const handleLayout = useCallback(
    (event) => {
      metricsRef.current.viewportHeight = event.nativeEvent.layout.height;
      options.onLayout?.(event);
    },
    [options]
  );

  const handleContentSizeChange = useCallback(
    (width, height) => {
      metricsRef.current.contentHeight = height;
      options.onContentSizeChange?.(width, height);
    },
    [options]
  );

  const handleScroll = useCallback(
    (event) => {
      metricsRef.current.offset = event.nativeEvent.contentOffset?.y ?? 0;
      options.onScroll?.(event);
    },
    [options]
  );

  useEffect(() => {
    const unregister = registerScrollController(tabName, {
      getCurrentOffset: () => metricsRef.current.offset,
      getDemoOffset,
      getMaxOffset,
      reset: () => scrollTo(0, false),
      scrollTo,
    });

    return unregister;
  }, [getDemoOffset, getMaxOffset, registerScrollController, scrollTo, tabName]);

  return {
    onContentSizeChange: handleContentSizeChange,
    onLayout: handleLayout,
    onScroll: handleScroll,
    ref: scrollRef,
    scrollEventThrottle: 16,
  };
}
