import React, { createContext, useContext, useEffect, useMemo } from 'react';

const previewNavigation = {
  navigate: () => {},
  goBack: () => {},
  canGoBack: () => false,
  push: () => {},
  replace: () => {},
  setOptions: () => {},
  emit: () => ({ defaultPrevented: false }),
  getParent() {
    return this;
  },
};

const NavigationContext = createContext(previewNavigation);

export function createPreviewNavigation() {
  return previewNavigation;
}

export function PreviewNavigationProvider({ children, navigation }) {
  const value = useMemo(() => navigation || previewNavigation, [navigation]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  return useContext(NavigationContext);
}

export function useFocusEffect(effect) {
  useEffect(() => {
    const cleanup = effect?.();
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [effect]);
}
