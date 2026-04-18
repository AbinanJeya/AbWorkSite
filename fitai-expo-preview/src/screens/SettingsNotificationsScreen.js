import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getSettings, updateNotificationPreferences } from '../services/storage';
import {
    getNotificationCategoryDefinitions,
    getNotificationCategoryStatusLabel,
} from '../services/notifications';
import { resolveNotificationSettings } from '../services/notificationPreferences';
import { AlertModal, createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

const CATEGORIES = ['workout', 'nutrition', 'hydration', 'steps', 'sleep'];

export default function SettingsNotificationsScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const navigation = useNavigation();
    const categoryMeta = getNotificationCategoryDefinitions();
    const [notifications, setNotifications] = useState(resolveNotificationSettings());
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });

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

    const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

    const handleMasterToggle = async (nextEnabled) => {
        if (savingNotifications || notifications.masterEnabled === nextEnabled) return;
        setSavingNotifications(true);
        try {
            const result = await updateNotificationPreferences({
                masterEnabled: nextEnabled,
                promptCompleted: true,
            });
            setNotifications(result.notifications);
            if (nextEnabled && !result.granted) {
                showAlert(
                    'Notifications Off',
                    'We could not enable notifications because permission was denied. You can allow it later in Android app settings.'
                );
            }
        } catch (error) {
            console.error('Failed to update master notifications:', error);
            showAlert('Update Failed', 'Could not update notification preferences right now.');
        } finally {
            setSavingNotifications(false);
        }
    };

    return (
        <SettingsScreenShell title="Notifications">
            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <View style={styles.darkModeRow}>
                        <View style={styles.darkModeLeft}>
                            <View style={styles.darkModeIcon}>
                                <MaterialIcons name="notifications-active" size={22} color={colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.darkModeTitle}>App notifications</Text>
                                <Text style={styles.darkModeSub}>Master switch for all reminders and workout alerts</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.themeModeOptions, { marginBottom: 0 }]}>
                        <TouchableOpacity
                            style={[styles.modeBtn, notifications.masterEnabled && styles.modeBtnActive, savingNotifications && { opacity: 0.7 }]}
                            onPress={() => handleMasterToggle(true)}
                            disabled={savingNotifications}
                        >
                            <Text style={[styles.modeBtnText, notifications.masterEnabled && styles.modeBtnTextActive]}>ON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, !notifications.masterEnabled && styles.modeBtnActive, savingNotifications && { opacity: 0.7 }]}
                            onPress={() => handleMasterToggle(false)}
                            disabled={savingNotifications}
                        >
                            <Text style={[styles.modeBtnText, !notifications.masterEnabled && styles.modeBtnTextActive]}>OFF</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={[styles.themeCard, { paddingVertical: 12, paddingHorizontal: 14 }]}>
                    {CATEGORIES.map((category, index) => {
                        const meta = categoryMeta[category];
                        return (
                            <View key={category}>
                                <TouchableOpacity
                                    style={[styles.darkModeRow, { paddingBottom: 8, paddingTop: 8, minHeight: 56 }]}
                                    onPress={() => navigation.navigate('SettingsNotificationCategory', { category })}
                                >
                                    <View style={styles.darkModeLeft}>
                                        <View style={styles.darkModeIcon}>
                                            <MaterialIcons name={meta.icon} size={22} color={colors.textSecondary} />
                                        </View>
                                        <View>
                                            <Text style={styles.darkModeTitle}>{meta.title}</Text>
                                            <Text style={styles.darkModeSub}>{meta.subtitle}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold', marginRight: 6 }}>
                                            {getNotificationCategoryStatusLabel(notifications, category)}
                                        </Text>
                                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                                {index !== CATEGORIES.length - 1 && (
                                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
            />
        </SettingsScreenShell>
    );
}
