import { ThemeProvider } from './app/theme.jsx';
import { I18nProvider } from './app/services/i18n.jsx';
import { WorkoutProvider } from './app/contexts/WorkoutContext.jsx';
import { RecipeDataProvider } from './app/contexts/RecipeDataContext.jsx';
import { ActivityDataProvider } from './app/contexts/ActivityDataContext.jsx';
import { PreviewNavigationProvider } from './shims/react-navigation-native.jsx';
import { SafeAreaProvider } from './shims/react-native-safe-area-context.jsx';

export function PreviewProviders({ children, navigation }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PreviewNavigationProvider navigation={navigation}>
          <SafeAreaProvider>
            <WorkoutProvider>
              <ActivityDataProvider>
                <RecipeDataProvider>{children}</RecipeDataProvider>
              </ActivityDataProvider>
            </WorkoutProvider>
          </SafeAreaProvider>
        </PreviewNavigationProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
