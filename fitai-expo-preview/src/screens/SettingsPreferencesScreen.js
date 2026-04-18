import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import RestTimerPicker from '../components/RestTimerPicker';
import { useActivityData } from '../contexts/ActivityDataContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { getSettings, saveSettings, updateUnitPreferences } from '../services/storage';
import { useTranslation } from '../services/i18n';
import { getDistanceUnitLabel, getMeasurementUnitLabel, getWeightUnitLabel, resolveUnitsSettings } from '../services/units';
import { AlertModal, createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

export default function SettingsPreferencesScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const workout = useWorkout();
    const { refreshWorkouts } = useActivityData();
    const { t } = useTranslation();
    const [baseRestTimer, setBaseRestTimer] = useState(60);
    const [showRestPicker, setShowRestPicker] = useState(false);
    const [unitsDraft, setUnitsDraft] = useState(resolveUnitsSettings());
    const [savingUnits, setSavingUnits] = useState(false);
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            (async () => {
                const settings = await getSettings();
                if (!active) return;
                setBaseRestTimer(settings.baseRestTimer !== undefined ? settings.baseRestTimer : 60);
                setUnitsDraft(resolveUnitsSettings(settings.units));
            })();
            return () => {
                active = false;
            };
        }, [])
    );

    const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

    const handleSaveUnits = async () => {
        setSavingUnits(true);
        try {
            const result = await updateUnitPreferences(unitsDraft);
            setUnitsDraft(result.units);
            if (result.weightChanged) {
                workout.convertActiveWorkoutWeightUnit(result.units.weight);
            }
            refreshWorkouts?.();
            showAlert('Units Updated', 'Your workouts, distance, and measurement displays now follow the new unit settings.');
        } catch (error) {
            console.error('Failed to save units:', error);
            showAlert('Update Failed', error?.message || 'Could not update unit settings right now.');
        } finally {
            setSavingUnits(false);
        }
    };

    return (
        <SettingsScreenShell title="Preferences">
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
                    <Text style={styles.accentLabel}>{t('weightUnit')}</Text>
                    <View style={styles.themeModeOptions}>
                        {['lbs', 'kg'].map((option) => {
                            const selected = unitsDraft.weight === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.modeBtn, selected && styles.modeBtnActive]}
                                    onPress={() => setUnitsDraft((prev) => ({ ...prev, weight: option }))}
                                    disabled={savingUnits}
                                >
                                    <Text style={[styles.modeBtnText, selected && styles.modeBtnTextActive]}>
                                        {getWeightUnitLabel(option, { uppercase: true })}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.accentLabel}>{t('distanceUnit')}</Text>
                    <View style={styles.themeModeOptions}>
                        {['mi', 'km'].map((option) => {
                            const selected = unitsDraft.distance === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.modeBtn, selected && styles.modeBtnActive]}
                                    onPress={() => setUnitsDraft((prev) => ({ ...prev, distance: option }))}
                                    disabled={savingUnits}
                                >
                                    <Text style={[styles.modeBtnText, selected && styles.modeBtnTextActive]}>
                                        {getDistanceUnitLabel(option, { uppercase: true })}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.accentLabel}>{t('bodyMeasurements')}</Text>
                    <View style={[styles.themeModeOptions, { marginBottom: 0 }]}>
                        {['in', 'cm'].map((option) => {
                            const selected = unitsDraft.measurement === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.modeBtn, selected && styles.modeBtnActive]}
                                    onPress={() => setUnitsDraft((prev) => ({ ...prev, measurement: option }))}
                                    disabled={savingUnits}
                                >
                                    <Text style={[styles.modeBtnText, selected && styles.modeBtnTextActive]}>
                                        {getMeasurementUnitLabel(option, { uppercase: true })}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[styles.wheelApplyBtn, { marginTop: 20 }, savingUnits && { opacity: 0.65 }]}
                        onPress={handleSaveUnits}
                        disabled={savingUnits}
                    >
                        <Text style={[styles.wheelApplyText, { color: colors.textOnPrimary }]}>
                            {savingUnits ? 'Updating...' : t('save')}
                        </Text>
                    </TouchableOpacity>
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

            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
            />
        </SettingsScreenShell>
    );
}
