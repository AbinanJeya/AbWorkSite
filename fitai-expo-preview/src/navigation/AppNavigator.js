import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme, ELEVATION } from '../theme';
import { useTranslation } from '../services/i18n';
import { usePreviewEnvironment } from '../preview/PreviewEnvironment';
import { usePreviewAutoDemo } from '../preview/PreviewAutoDemo';
import DashboardScreen from '../screens/DashboardScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AdviceScreen from '../screens/AdviceScreen';
import WorkoutPlannerScreen from '../screens/WorkoutPlannerScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Dashboard: { lib: MaterialIcons, icon: 'home', iconActive: 'home' },
  Diary: { lib: MaterialIcons, icon: 'menu-book', iconActive: 'menu-book' },
  Advice: { lib: MaterialIcons, icon: 'auto-awesome', iconActive: 'auto-awesome' },
  Workout: { lib: MaterialCommunityIcons, icon: 'dumbbell', iconActive: 'dumbbell' },
  Profile: { lib: MaterialIcons, icon: 'person-outline', iconActive: 'person' },
};

function CustomTabBar({ state, navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { pauseAutomation, registerNavigator, reportActiveTab } = usePreviewAutoDemo();
  const styles = getStyles(colors, isDark);

  useEffect(() => {
    const unregister = registerNavigator((routeName) => {
      navigation.navigate(routeName);
    });

    return unregister;
  }, [navigation, registerNavigator]);

  useEffect(() => {
    const activeRouteName = state.routes[state.index]?.name;

    if (activeRouteName) {
      reportActiveTab(activeRouteName);
    }
  }, [reportActiveTab, state.index, state.routes]);

  return (
    <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconConfig = tabIcons[route.name] || tabIcons.Dashboard;
        const IconComponent = iconConfig.lib;
        const iconName = isFocused ? iconConfig.iconActive : iconConfig.icon;
        const iconColor = isFocused ? colors.primary : colors.textSecondary;

        const onPress = () => {
          pauseAutomation();

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.name}
            onPress={onPress}
            style={[styles.tab, isFocused && styles.tabActive]}
            activeOpacity={0.88}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            dataSet={{ previewTab: 'true' }}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <IconComponent name={iconName} size={22} color={iconColor} />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {t('tab_' + (route.name === 'Workout' ? 'workouts' : route.name.toLowerCase()))}
            </Text>
            {isFocused ? <View style={styles.activeIndicator} /> : null}
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  const { initialRoute } = usePreviewEnvironment();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgDark }}>
      <Tab.Navigator
        initialRouteName={initialRoute}
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, lazy: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Diary" component={DiaryScreen} />
        <Tab.Screen name="Advice" component={AdviceScreen} />
        <Tab.Screen name="Workout" component={WorkoutPlannerScreen} />
        <Tab.Screen name="Profile" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    tabBar: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 10,
      height: 74,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 10,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(12, 13, 14, 0.72)' : 'rgba(255, 255, 255, 0.78)',
      borderWidth: 1,
      borderColor: colors.border,
      ...ELEVATION.tabBar,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      height: 56,
      borderRadius: 20,
      position: 'relative',
    },
    tabActive: {
      backgroundColor: colors.primaryDim,
    },
    iconWrap: {
      width: 28,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      transform: [{ translateY: -1 }],
    },
    tabLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontFamily: 'SpaceGrotesk_500Medium',
    },
    tabLabelActive: {
      color: colors.primary,
      fontFamily: 'SpaceGrotesk_700Bold',
    },
    activeIndicator: {
      position: 'absolute',
      top: 0,
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
  });
