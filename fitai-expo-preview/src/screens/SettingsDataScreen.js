import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Updates from 'expo-updates';
import { useActivityData } from '../contexts/ActivityDataContext';
import { parseAndImportCSV } from '../services/csvImport';
import { exportWorkoutHistoryToCSV } from '../services/csvExport';
import { clearWorkoutHistory, importRoutines, importWorkoutSessions } from '../services/storage';
import { AlertModal, ConfirmModal, createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

export default function SettingsDataScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const { refreshWorkouts } = useActivityData();
    const [importLoading, setImportLoading] = useState(false);
    const [importProgress, setImportProgress] = useState('');
    const [showImportResult, setShowImportResult] = useState(false);
    const [importStats, setImportStats] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
    const [updateCheckLoading, setUpdateCheckLoading] = useState(false);
    const importCancelRef = useRef(false);
    const [showRoutineSelector, setShowRoutineSelector] = useState(false);
    const [pendingRoutines, setPendingRoutines] = useState([]);
    const [selectedRoutines, setSelectedRoutines] = useState(new Set());
    const [tempImportStats, setTempImportStats] = useState(null);
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });
    const [confirmClearHistory, setConfirmClearHistory] = useState(false);

    const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

    const handleImportCSV = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'application/vnd.ms-excel', '*/*'], copyToCacheDirectory: true });
            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];
            setImportLoading(true);
            setImportProgress('Reading file...');
            importCancelRef.current = false;

            const csvText = await FileSystem.readAsStringAsync(file.uri);
            setImportProgress('Parsing & matching exercises...');

            const parsed = await parseAndImportCSV(
                csvText,
                (current, total) => setImportProgress(`Processing workout ${current} of ${total}...`),
                () => importCancelRef.current
            );

            if (parsed.sessions.length === 0) {
                setImportLoading(false);
                showAlert('Import Failed', parsed.errors.length > 0 ? parsed.errors[0] : 'No valid workout sessions found in the CSV file.');
                return;
            }

            setImportProgress('Saving and syncing workouts...');
            const mergeResult = await importWorkoutSessions(parsed.sessions);
            if (mergeResult.added > 0 || mergeResult.removed > 0) {
                await refreshWorkouts();
            }

            const initialStats = {
                ...parsed.stats,
                added: mergeResult.added,
                skipped: mergeResult.skipped,
                errors: parsed.errors,
            };

            setImportLoading(false);

            if (parsed.routines && parsed.routines.length > 0) {
                setPendingRoutines(parsed.routines);
                setSelectedRoutines(new Set(parsed.routines.map((routine) => routine.name)));
                setTempImportStats(initialStats);
                setShowRoutineSelector(true);
            } else {
                setImportStats(initialStats);
                setShowImportResult(true);
            }
        } catch (error) {
            setImportLoading(false);
            if (error.message === 'IMPORT_CANCELLED') return;
            console.error('Import error:', error);
            showAlert('Import Error', 'Something went wrong while importing. Please try again.');
        }
    };

    const handleSaveSelectedRoutines = async () => {
        try {
            setImportLoading(true);
            const routinesToSave = pendingRoutines.filter((routine) => selectedRoutines.has(routine.name));
            const routineMergeResult = await importRoutines(routinesToSave);
            setImportLoading(false);
            setShowRoutineSelector(false);
            setImportStats({
                ...tempImportStats,
                routinesAdded: routineMergeResult.added,
                routinesSkipped: routineMergeResult.skipped,
            });
            setShowImportResult(true);
        } catch (error) {
            setImportLoading(false);
            console.error('Save routines error:', error);
            showAlert('Error', 'Failed to save selected routines.');
        }
    };

    const handleExportHistory = async () => {
        try {
            setExportLoading(true);
            const result = await exportWorkoutHistoryToCSV();
            setExportLoading(false);
            if (!result.success) {
                showAlert('Export Failed', result.error || 'Something went wrong.');
            }
        } catch (error) {
            setExportLoading(false);
            console.error('Export exception:', error);
            showAlert('Export Error', 'An unexpected error occurred during export.');
        }
    };

    const handleClearWorkoutHistory = async () => {
        try {
            setClearHistoryLoading(true);
            await clearWorkoutHistory();
            await refreshWorkouts();
            showAlert('Workout History Cleared', 'All workout history entries have been removed.');
        } catch (error) {
            console.error('Clear workout history error:', error);
            showAlert('Clear Failed', 'Could not clear workout history right now.');
        } finally {
            setClearHistoryLoading(false);
            setConfirmClearHistory(false);
        }
    };

    const handleCheckForAppUpdates = async () => {
        try {
            setUpdateCheckLoading(true);
            const update = await Updates.checkForUpdateAsync();
            if (!update?.isAvailable) {
                showAlert('Up to Date', 'You already have the latest app update.');
                return;
            }

            await Updates.fetchUpdateAsync();
            showAlert('Update Ready', 'A new update was downloaded. The app will restart now.');
            setTimeout(() => {
                Updates.reloadAsync().catch(() => {});
            }, 500);
        } catch (error) {
            console.error('OTA check failed:', error);
            showAlert('Update Check Failed', 'Could not check for updates right now. Please try again on a stable internet connection.');
        } finally {
            setUpdateCheckLoading(false);
        }
    };

    return (
        <SettingsScreenShell title="Data & Import">
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={handleCheckForAppUpdates}
                    activeOpacity={0.7}
                    disabled={updateCheckLoading}
                >
                    <View style={styles.actionCardRow}>
                        <View style={styles.actionIconCircle}>
                            <MaterialIcons name="system-update-alt" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{updateCheckLoading ? 'Checking...' : 'Check for App Updates'}</Text>
                            <Text style={styles.actionCardSub}>Fetch latest OTA update now</Text>
                        </View>
                        {updateCheckLoading ? (
                            <Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' }}>...</Text>
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { marginTop: 12 }]} onPress={handleImportCSV} activeOpacity={0.7} disabled={importLoading}>
                    <View style={styles.actionCardRow}>
                        <View style={styles.actionIconCircle}>
                            <MaterialIcons name="cloud-upload" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{importLoading ? 'Importing...' : 'Import Workout History'}</Text>
                            <Text style={styles.actionCardSub}>{importLoading ? importProgress : 'Hevy & Strong CSV files'}</Text>
                        </View>
                        {importLoading ? (
                            <TouchableOpacity
                                onPress={() => { importCancelRef.current = true; }}
                                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 20 }}
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: '#ef4444', fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' }}>Cancel</Text>
                            </TouchableOpacity>
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionCard, { marginTop: 12 }]} onPress={handleExportHistory} activeOpacity={0.7} disabled={exportLoading}>
                    <View style={styles.actionCardRow}>
                        <View style={styles.actionIconCircle}>
                            <MaterialIcons name="file-download" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{exportLoading ? 'Exporting...' : 'Export Workout History'}</Text>
                            <Text style={styles.actionCardSub}>{exportLoading ? 'Generating CSV...' : 'Save as CSV file'}</Text>
                        </View>
                        {exportLoading ? (
                            <Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' }}>...</Text>
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { marginTop: 12 }]}
                    onPress={() => setConfirmClearHistory(true)}
                    activeOpacity={0.7}
                    disabled={clearHistoryLoading}
                >
                    <View style={styles.actionCardRow}>
                        <View style={styles.actionIconCircle}>
                            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionCardTitle}>{clearHistoryLoading ? 'Clearing...' : 'Clear Workout History'}</Text>
                            <Text style={styles.actionCardSub}>Remove all workout sessions only</Text>
                        </View>
                        {clearHistoryLoading ? (
                            <Text style={{ color: '#ef4444', fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' }}>...</Text>
                        ) : (
                            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <Modal visible={showRoutineSelector} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setShowRoutineSelector(false)}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>
                    <View style={[styles.wheelModal, { maxHeight: '80%' }]} pointerEvents="box-none">
                        <Text style={styles.wheelTitle}>Import Routines</Text>
                        <Text style={styles.wheelSubtitle}>We found these routines in your history. Select the ones you want to save as templates.</Text>
                        <ScrollView style={{ width: '100%', marginVertical: 16 }} indicatorStyle={isDark ? 'white' : 'black'}>
                            {pendingRoutines.map((routine, index) => {
                                const isSelected = selectedRoutines.has(routine.name);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            const newSet = new Set(selectedRoutines);
                                            if (isSelected) newSet.delete(routine.name);
                                            else newSet.add(routine.name);
                                            setSelectedRoutines(newSet);
                                        }}
                                    >
                                        <MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={24} color={isSelected ? colors.primary : colors.textMuted} />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' }}>{routine.name}</Text>
                                            <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' }}>{routine.exercises.length} exercises</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={{ width: '100%', flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                                onPress={() => {
                                    setShowRoutineSelector(false);
                                    setImportStats(tempImportStats);
                                    setShowImportResult(true);
                                }}
                            >
                                <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' }}>Skip</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' }}
                                onPress={handleSaveSelectedRoutines}
                            >
                                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>Save ({selectedRoutines.size})</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showImportResult} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setShowImportResult(false)}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>
                    <View style={styles.wheelModal} pointerEvents="box-none">
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <MaterialIcons name="check-circle" size={32} color={colors.primary} />
                            </View>
                            <Text style={styles.wheelTitle}>Import Complete</Text>
                        </View>
                        {importStats && (
                            <View style={{ width: '100%', gap: 8, marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }}>
                                    <Text style={{ color: isDark ? '#a1a1aa' : '#6b7280', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' }}>Workouts Added</Text>
                                    <Text style={{ color: colors.primary, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>{importStats.added}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }}>
                                    <Text style={{ color: isDark ? '#a1a1aa' : '#6b7280', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' }}>Unique Exercises</Text>
                                    <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>{importStats.exercises}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }}>
                                    <Text style={{ color: isDark ? '#a1a1aa' : '#6b7280', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' }}>Total Sets</Text>
                                    <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>{importStats.sets}</Text>
                                </View>
                                {importStats.routinesAdded > 0 && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }}>
                                        <Text style={{ color: isDark ? '#a1a1aa' : '#6b7280', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' }}>Routines Created</Text>
                                        <Text style={{ color: '#10b981', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>{importStats.routinesAdded}</Text>
                                    </View>
                                )}
                                {importStats.skipped > 0 && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272a' : '#f3f4f6' }}>
                                        <Text style={{ color: '#f59e0b', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' }}>Duplicates Skipped</Text>
                                        <Text style={{ color: '#f59e0b', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>{importStats.skipped}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <TouchableOpacity style={{ width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center' }} onPress={() => setShowImportResult(false)}>
                            <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
            />
            <ConfirmModal
                visible={confirmClearHistory}
                title="Clear Workout History"
                message="This will permanently remove all workout sessions from history. Your routines and settings will stay intact."
                actionText={clearHistoryLoading ? 'Clearing...' : 'Clear History'}
                isDestructive
                onCancel={() => {
                    if (!clearHistoryLoading) setConfirmClearHistory(false);
                }}
                onConfirm={handleClearWorkoutHistory}
            />
        </SettingsScreenShell>
    );
}
