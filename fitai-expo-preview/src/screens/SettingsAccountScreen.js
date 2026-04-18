import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useActivityData } from '../contexts/ActivityDataContext';
import { clearAllData } from '../services/storage';
import { forceCloudBackup, wipeCloudData } from '../services/cloudSync';
import { deleteAccount, signOut } from '../services/auth';
import { useTranslation } from '../services/i18n';
import { createSettingsStyles, AlertModal, ConfirmModal, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

export default function SettingsAccountScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const { refreshWorkouts } = useActivityData();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', actionText: '', onConfirm: null, isDestructive: false });

    const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

    const showConfirm = (title, message, actionText, onConfirm, isDestructive = false) => {
        setConfirmModal({ visible: true, title, message, actionText, onConfirm, isDestructive });
    };

    const handleRecalcTDEE = () => {
        navigation.navigate('TDEECalculator', { fromSettings: true });
    };

    const handleClearData = () => {
        showConfirm('Clear All Data', 'This will delete all your meals, workouts, and settings. Are you sure?', 'Yes', async () => {
            await wipeCloudData();
            await clearAllData();
            await refreshWorkouts();
            const parent = navigation.getParent();
            if (parent) {
                parent.reset({ index: 0, routes: [{ name: 'HealthConnectOnboarding' }] });
            } else {
                navigation.replace('HealthConnectOnboarding');
            }
        }, true);
    };

    const handleLogout = () => {
        showConfirm('Log Out', 'Are you sure you want to log out?', 'Log Out', async () => {
            try {
                await forceCloudBackup(true);
            } catch (error) {
                console.log('Pre-logout sync failed (expected if offline):', error);
            }

            try {
                await signOut();
                await clearAllData();
            } catch (error) {
                console.log('Firebase sign out error:', error);
            }

            try {
                const parent = navigation.getParent();
                if (parent) {
                    parent.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                } else {
                    navigation.replace('Welcome');
                }
            } catch {
                navigation.navigate('Welcome');
            }
        }, true);
    };

    const handleDeleteAccount = () => {
        showConfirm(
            'Delete Account',
            'Are you absolutely sure you want to permanently delete your account? This action cannot be undone and will erase all your data.',
            'Delete Forever',
            async () => {
                try {
                    await deleteAccount();
                    await wipeCloudData();
                    await clearAllData();
                    showAlert('Account Deleted', 'Your account and all associated data have been permanently removed.');

                    const parent = navigation.getParent();
                    if (parent) {
                        parent.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                    } else {
                        navigation.replace('Welcome');
                    }
                } catch (error) {
                    console.error('Delete account error:', error);
                    if (error.message?.includes('requires-recent-login') || error.code === 'auth/requires-recent-login') {
                        showAlert('Authentication Required', 'Please log out and log back in to verify your identity before deleting your account.');
                    } else {
                        showAlert('Error', error.message || 'Could not delete your account. Please try again.');
                    }
                }
            },
            true
        );
    };

    return (
        <SettingsScreenShell title="Account & Data">
            <View style={styles.section}>
                <TouchableOpacity style={styles.actionCard} onPress={handleRecalcTDEE} activeOpacity={0.7}>
                    <View style={styles.actionCardRow}>
                        <View style={styles.actionIconCircle}>
                            <MaterialIcons name="calculate" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{t('recalcTdee')}</Text>
                            <Text style={styles.actionCardSub}>{t('recalcTdeeSub')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { marginTop: 12 }]} onPress={handleClearData} activeOpacity={0.7}>
                    <View style={styles.actionCardRow}>
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{t('clearData')}</Text>
                            <Text style={styles.actionCardSub}>{t('clearDataSub')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { marginTop: 12 }]} onPress={handleLogout} activeOpacity={0.7}>
                    <View style={styles.actionCardRow}>
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <MaterialIcons name="logout" size={20} color="#ef4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{t('logOut')}</Text>
                            <Text style={styles.actionCardSub}>{t('logOutSub')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { marginTop: 12, borderColor: 'rgba(239, 68, 68, 0.3)' }]} onPress={handleDeleteAccount} activeOpacity={0.7}>
                    <View style={styles.actionCardRow}>
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <MaterialIcons name="person-remove" size={20} color="#ef4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionCardTitle, { color: '#ef4444' }]}>Delete Account</Text>
                            <Text style={styles.actionCardSub}>Permanently delete your profile and all data.</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#ef4444" />
                    </View>
                </TouchableOpacity>
            </View>

            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
            />
            <ConfirmModal
                visible={confirmModal.visible}
                title={confirmModal.title}
                message={confirmModal.message}
                actionText={confirmModal.actionText}
                isDestructive={confirmModal.isDestructive}
                onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
                onConfirm={() => {
                    setConfirmModal((prev) => ({ ...prev, visible: false }));
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
            />
        </SettingsScreenShell>
    );
}

