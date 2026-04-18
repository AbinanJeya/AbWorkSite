import React, { createContext, useContext } from 'react';

const DEFAULT_INSETS = {
  top: 30,
  right: 0,
  bottom: 22,
  left: 0,
};

const SafeAreaContext = createContext(DEFAULT_INSETS);

export function SafeAreaProvider({ children, initialInsets = DEFAULT_INSETS }) {
  return <SafeAreaContext.Provider value={initialInsets}>{children}</SafeAreaContext.Provider>;
}

export function useSafeAreaInsets() {
  return useContext(SafeAreaContext);
}
