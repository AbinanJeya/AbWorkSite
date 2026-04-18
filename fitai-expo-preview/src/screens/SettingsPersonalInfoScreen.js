import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthChange, sendPasswordResetEmail } from '../services/auth';
import { createSettingsStyles, AlertModal, ConfirmModal, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

export default function SettingsPersonalInfoScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const [userEmail, setUserEmail] = useState('');
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', actionText: '', onConfirm: null, isDestructive: false });

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUserEmail(user?.email || '');
        });
        return unsubscribe;
    }, []);

    const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

    const showConfirm = (title, message, actionText, onConfirm, isDestructive = false) => {
        setConfirmModal({ visible: true, title, message, actionText, onConfirm, isDestructive });
    };

    const handleChangePassword = async () => {
        if (!userEmail) return;
        showConfirm('Set / Change Password', `A secure password reset link will be sent to:\n${userEmail}`, 'Send Email', async () => {
            try {
                await sendPasswordResetEmail(userEmail);
                showAlert('Email Sent', 'Check your inbox for a secure link to manage your password.');
            } catch (error) {
                showAlert('Error', error.message || 'Could not send reset email.');
            }
        });
    };

    return (
        <SettingsScreenShell title="Personal Info">
            <View style={styles.section}>
                <View style={styles.actionCard}>
                    <View style={styles.personalRow}>
                        <Text style={styles.personalLabel}>Email</Text>
                        <Text style={styles.personalValue} numberOfLines={1}>{userEmail || 'Not signed in'}</Text>
                    </View>
                    <View style={styles.personalDivider} />
                    <TouchableOpacity style={styles.personalRow} onPress={handleChangePassword} disabled={!userEmail}>
                        <Text style={styles.personalLabel}>Password</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.personalActionText, !userEmail && { color: colors.textMuted }]}>Change / Set Password</Text>
                            <MaterialIcons name="chevron-right" size={20} color={userEmail ? colors.textSecondary : colors.textMuted} />
                        </View>
                    </TouchableOpacity>
                </View>
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
