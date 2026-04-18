import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RestTimerPicker from '../components/RestTimerPicker';
import { createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { getSettings, saveSettings } from '../services/storage';
import {
    openRestTimerAlarmSoundSettings,
} from '../services/restTimerNotification';
import { useTheme } from '../theme';

export default function SettingsRestTimerScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const [baseRestTimer, setBaseRestTimer] = useState(60);
    const [keepAwakeDuringWorkout, setKeepAwakeDuringWorkout] = useState(false);
    const [showRestPicker, setShowRestPicker] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            (async () => {
                const settings = await getSettings();
                if (!active) return;
                setBaseRestTimer(settings.baseRestTimer !== undefined ? settings.baseRestTimer : 60);
                setKeepAwakeDuringWorkout(!!settings.keepAwakeDuringWorkout);
            })();
            return () => {
                active = false;
            };
        }, [])
    );

    return (
        <SettingsScreenShell title="Workout">
            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <TouchableOpacity style={[styles.darkModeRow, { paddingBottom: 0 }]} onPress={() => setShowRestPicker(true)}>
                        <View style={styles.darkModeLeft}>
                            <View style={styles.darkModeIcon}>
                                <MaterialIcons name="timer" size={22} color={colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.darkModeTitle}>Base Rest Timer</Text>
                                <Text style={styles.darkModeSub}>Default timer for new exercises</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: colors.primary, fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' }}>
                                {Math.floor(baseRestTimer / 60)}:{String(baseRestTimer % 60).padStart(2, '0')}
                            </Text>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <TouchableOpacity
                        style={[styles.darkModeRow, { paddingBottom: 0 }]}
                        onPress={async () => {
                            try {
                                await openRestTimerAlarmSoundSettings();
                            } catch (error) {
                                Alert.alert('Could not open sound settings', 'Please open Android notification settings and configure the Rest Complete channel sound.');
                            }
                        }}
                    >
                        <View style={styles.darkModeLeft}>
                            <View style={styles.darkModeIcon}>
                                <MaterialIcons name="music-note" size={22} color={colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.darkModeTitle}>Rest timer alarm sound</Text>
                                <Text style={styles.darkModeSub}>Choose from Android built-in sounds</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <View style={[styles.darkModeRow, { paddingBottom: 0, alignItems: 'flex-start' }]}>
                        <View style={[styles.darkModeLeft, { flex: 1, alignItems: 'flex-start', paddingRight: 14 }]}>
                            <View style={[styles.darkModeIcon, { marginTop: 2 }]}>
                                <MaterialIcons name="visibility" size={22} color={colors.textSecondary} />
                            </View>
                            <View style={{ flex: 1, width: '100%' }}>
                                <Text style={styles.darkModeTitle}>Keep awake during workout</Text>
                                <Text style={[styles.darkModeSub, { paddingRight: 0 }]}>
                                    Keeps your screen on during active workouts so it does not dim or lock between sets.
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: 74, alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
                            <TouchableOpacity
                                onPress={async () => {
                                    const nextValue = !keepAwakeDuringWorkout;
                                    setKeepAwakeDuringWorkout(nextValue);
                                    await saveSettings({ keepAwakeDuringWorkout: nextValue });
                                }}
                                activeOpacity={0.85}
                                style={{
                                    width: 60,
                                    height: 34,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: keepAwakeDuringWorkout ? colors.primary : colors.border,
                                    backgroundColor: keepAwakeDuringWorkout ? colors.primary + '33' : colors.bgCard,
                                    justifyContent: 'center',
                                    paddingHorizontal: 3,
                                }}
                            >
                                <View
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 6,
                                        borderWidth: 1.5,
                                        borderColor: keepAwakeDuringWorkout ? colors.primary : colors.border,
                                        backgroundColor: keepAwakeDuringWorkout ? colors.primary : colors.surface,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: keepAwakeDuringWorkout ? 30 : 0,
                                    }}
                                >
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {showRestPicker && (
                <RestTimerPicker
                    visible={showRestPicker}
                    initialValue={baseRestTimer}
                    onClose={() => setShowRestPicker(false)}
                    onDone={async (formatted, totalSecs) => {
                        setBaseRestTimer(totalSecs);
                        await saveSettings({ baseRestTimer: totalSecs });
                    }}
                />
            )}
        </SettingsScreenShell>
    );
}
