import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, updateNotificationPreferences } from '../services/storage';
import {
    getNotificationCategoryDefinitions,
} from '../services/notifications';
import { resolveNotificationSettings } from '../services/notificationPreferences';
import { createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { openRestTimerAlarmSoundSettings } from '../services/restTimerNotification';
import { useTheme } from '../theme';

export default function SettingsNotificationCategoryScreen({ route }) {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const category = route?.params?.category || 'workout';
    const meta = getNotificationCategoryDefinitions()[category];
    const [notifications, setNotifications] = useState(resolveNotificationSettings());
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            (async () => {
                const settings = await getSettings();
                if (!active) return;
                setNotifications(resolveNotificationSettings(settings?.notifications, settings));
            })();
            return () => {
                active = false;
            };
        }, [])
    );

    if (!meta) {
        return <SettingsScreenShell title="Notifications" />;
    }

    const categorySettings = notifications?.[category] || { enabled: false };

    const applyPatch = async (patch) => {
        if (saving) return;
        setSaving(true);
        try {
            const result = await updateNotificationPreferences({
                [category]: patch,
                promptCompleted: true,
            });
            setNotifications(result.notifications);
        } catch (error) {
            console.error(`Failed to update ${category} notifications:`, error);
            Alert.alert('Update Failed', 'Could not update notification preferences right now.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsScreenShell title={meta.title}>
            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <View style={styles.darkModeRow}>
                        <View style={styles.darkModeLeft}>
                            <View style={styles.darkModeIcon}>
                                <MaterialIcons name={meta.icon} size={22} color={colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.darkModeTitle}>{meta.title}</Text>
                                <Text style={styles.darkModeSub}>{meta.subtitle}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.themeModeOptions, { marginBottom: 0 }]}>
                        <TouchableOpacity
                            style={[styles.modeBtn, categorySettings.enabled && styles.modeBtnActive, saving && { opacity: 0.7 }]}
                            onPress={() => applyPatch({ enabled: true })}
                            disabled={saving}
                        >
                            <Text style={[styles.modeBtnText, categorySettings.enabled && styles.modeBtnTextActive]}>ON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, !categorySettings.enabled && styles.modeBtnActive, saving && { opacity: 0.7 }]}
                            onPress={() => applyPatch({ enabled: false })}
                            disabled={saving}
                        >
                            <Text style={[styles.modeBtnText, !categorySettings.enabled && styles.modeBtnTextActive]}>OFF</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {meta.toggles.map((toggle) => {
                const enabled = categorySettings[toggle.key] !== false;
                return (
                    <View style={styles.section} key={toggle.key}>
                        <View style={styles.themeCard}>
                            <View style={styles.darkModeRow}>
                                <View style={styles.darkModeLeft}>
                                    <View>
                                        <Text style={styles.darkModeTitle}>{toggle.title}</Text>
                                        <Text style={styles.darkModeSub}>{toggle.description}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.themeModeOptions, { marginBottom: 0 }]}>
                                <TouchableOpacity
                                    style={[styles.modeBtn, enabled && styles.modeBtnActive, saving && { opacity: 0.7 }]}
                                    onPress={() => applyPatch({ [toggle.key]: true })}
                                    disabled={saving || !categorySettings.enabled}
                                >
                                    <Text style={[styles.modeBtnText, enabled && styles.modeBtnTextActive]}>ON</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modeBtn, !enabled && styles.modeBtnActive, saving && { opacity: 0.7 }]}
                                    onPress={() => applyPatch({ [toggle.key]: false })}
                                    disabled={saving || !categorySettings.enabled}
                                >
                                    <Text style={[styles.modeBtnText, !enabled && styles.modeBtnTextActive]}>OFF</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            })}

            {category === 'workout' && (
                <View style={styles.section}>
                    <View style={styles.themeCard}>
                        <TouchableOpacity
                            style={[styles.darkModeRow, { paddingBottom: 0 }]}
                            onPress={async () => {
                                try {
                                    await openRestTimerAlarmSoundSettings();
                                } catch (error) {
                                    Alert.alert('Could not open sound settings', 'Please open Android notification settings and configure the workout complete sound.');
                                }
                            }}
                        >
                            <View style={styles.darkModeLeft}>
                                <View style={styles.darkModeIcon}>
                                    <MaterialIcons name="music-note" size={22} color={colors.textSecondary} />
                                </View>
                                <View>
                                    <Text style={styles.darkModeTitle}>Rest timer complete sound</Text>
                                    <Text style={styles.darkModeSub}>Choose the Android sound used when your rest timer finishes.</Text>
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SettingsScreenShell>
    );
}
