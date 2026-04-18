import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import AppNavigator from '../navigation/AppNavigator';
import { ThemeProvider, useTheme } from '../theme';
import { I18nProvider } from '../services/i18n';
import { WorkoutProvider } from '../contexts/WorkoutContext';
import { ActivityDataProvider } from '../contexts/ActivityDataContext';
import { RecipeDataProvider } from '../contexts/RecipeDataContext';
import {
  PreviewEnvironmentProvider,
  PREVIEW_SAFE_AREA_METRICS,
} from './PreviewEnvironment';
import { PreviewInteractionGate } from './PreviewInteractionGate';
import { PreviewAutoDemoProvider } from './PreviewAutoDemo';

const previewNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#25f46a',
    background: '#000000',
    card: '#000000',
    text: '#f8fafc',
    border: 'transparent',
    notification: '#25f46a',
  },
};

function PreviewStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function PreviewProviders({ children }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <WorkoutProvider>
          <ActivityDataProvider>
            <RecipeDataProvider>{children}</RecipeDataProvider>
          </ActivityDataProvider>
        </WorkoutProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default function PreviewApp() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const ready = fontsLoaded || fontError;

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
        }}
      >
        <ActivityIndicator color="#25f46a" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <PreviewEnvironmentProvider>
        <SafeAreaProvider initialMetrics={PREVIEW_SAFE_AREA_METRICS}>
          <PreviewAutoDemoProvider>
            <PreviewProviders>
              <NavigationContainer theme={previewNavigationTheme}>
                <PreviewStatusBar />
                <PreviewInteractionGate>
                  <AppNavigator />
                </PreviewInteractionGate>
              </NavigationContainer>
            </PreviewProviders>
          </PreviewAutoDemoProvider>
        </SafeAreaProvider>
      </PreviewEnvironmentProvider>
    </GestureHandlerRootView>
  );
}
