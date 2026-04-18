import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { useTranslation } from '../services/i18n';
import { useTheme } from '../theme';

const PREFERENCE_CARDS = [
    {
        key: 'pref_rest_timer',
        title: 'Workout',
        subtitle: 'Base rest timer and workout defaults',
        icon: 'timer',
        route: 'SettingsRestTimer',
    },
    {
        key: 'pref_units',
        title: 'Units',
        subtitle: 'Weight, distance, and measurements',
        icon: 'straighten',
        route: 'SettingsUnits',
    },
    {
        key: 'pref_notifications',
        title: 'Notifications',
        subtitle: 'Workout alerts and reminders',
        icon: 'notifications-active',
        route: 'SettingsNotifications',
    },
    {
        key: 'pref_themes',
        title: 'Themes',
        subtitle: 'Appearance, accent, and app icon colours',
        icon: 'palette',
        route: 'SettingsThemes',
    },
    {
        key: 'pref_ai',
        title: 'AI Integration',
        subtitle: 'OpenAI and Gemini keys',
        icon: 'psychology',
        route: 'SettingsAI',
    },
    {
        key: 'pref_wearables',
        title: 'Wearable Devices',
        subtitle: 'Pixel Watch, Health Connect, Fitbit',
        icon: 'watch',
        route: 'WearableIntegration',
    },
    {
        key: 'pref_language',
        title: 'Language',
        subtitle: 'Choose app language',
        icon: 'translate',
        route: 'SettingsLanguage',
    },
];

const ACCOUNT_AND_DATA_CARDS = [
    {
        key: 'account_personal',
        title: 'Personal Info',
        subtitle: 'Email and password management',
        icon: 'person',
        route: 'SettingsPersonalInfo',
    },
    {
        key: 'account_data_import',
        title: 'Data & Import',
        subtitle: 'Import and export workout history',
        icon: 'folder-open',
        route: 'SettingsData',
    },
    {
        key: 'account_actions',
        title: 'Account & Data',
        subtitle: 'TDEE, logout, clear data, and delete account',
        icon: 'manage-accounts',
        route: 'SettingsAccount',
    },
];

function SettingsCardList({ cards, styles, colors, navigation }) {
    return (
        <View style={[styles.themeCard, { paddingVertical: 12, paddingHorizontal: 14 }]}>
            {cards.map((item, index) => (
                <View key={item.key}>
                    <TouchableOpacity
                        style={[styles.darkModeRow, { paddingBottom: 8, paddingTop: 8, minHeight: 56 }]}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <View style={styles.darkModeLeft}>
                            <View style={styles.darkModeIcon}>
                                <MaterialIcons name={item.icon} size={22} color={colors.textSecondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.darkModeTitle}>{item.title}</Text>
                                <Text style={styles.darkModeSub}>{item.subtitle}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {index !== cards.length - 1 && (
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                    )}
                </View>
            ))}
        </View>
    );
}

export default function SettingsMenuScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const { t } = useTranslation();

    return (
        <SettingsScreenShell title={t('settings')}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>PREFERENCES</Text>
                <SettingsCardList
                    cards={PREFERENCE_CARDS}
                    styles={styles}
                    colors={colors}
                    navigation={navigation}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACCOUNT & DATA</Text>
                <SettingsCardList
                    cards={ACCOUNT_AND_DATA_CARDS}
                    styles={styles}
                    colors={colors}
                    navigation={navigation}
                />
            </View>
        </SettingsScreenShell>
    );
}
