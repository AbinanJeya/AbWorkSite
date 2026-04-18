import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import StepRing from '../components/StepRing';
import WorkoutCard from '../components/WorkoutCard';
import { getSettings, getWorkoutHistoryRange, getWorkouts, isHealthConnectEntry, KEYS } from '../services/storage';
import { getTodayStepCount } from '../services/pedometer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../services/i18n';

function localDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSessionDateKey(timestamp) {
    if (!timestamp) return null;
    const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(timestamp);
    if (isoMatch) return isoMatch[1];

    const dateObj = new Date(timestamp);
    if (Number.isNaN(dateObj.getTime())) return null;
    return localDateKey(dateObj);
}

function mapWorkoutSession(session) {
    const timestamp = session.startedAt || session.finishedAt || session.timestamp || new Date().toISOString();
    const dateObj = new Date(timestamp);
    const minutes = Math.round((session.elapsedSeconds || session.duration || 0) / 60);

    return {
        id: session.id || `${timestamp}-${session.routineName || session.name || Math.random()}`,
        name: session.routineName || session.workoutName || session.name || 'Workout Session',
        type: session.type === 'activity' ? (session.activityType || 'run') : 'default',
        duration: minutes,
        time: dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        caloriesBurned: session.caloriesBurned || 0,
        completed: true,
        timestamp,
    };
}

export default function DaySummaryScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useTranslation();
    const styles = getStyles(colors, isDark);

    const { selectedDate } = route.params || {};
    const [steps, setSteps] = useState(0);
    const [stepGoal, setStepGoal] = useState(10000);
    const [workoutStats, setWorkoutStats] = useState({ caloriesBurned: 0, totalMinutes: 0, totalCount: 0 });
    const [dayWorkouts, setDayWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!selectedDate) return;
        try {
            const [historyData, legacyWorkouts, settings] = await Promise.all([
                getWorkoutHistoryRange(selectedDate + 'T00:00:00', selectedDate + 'T23:59:59'),
                getWorkouts(),
                getSettings()
            ]);
            
            setStepGoal(settings.stepGoal || 10000);

            // For today: use live wearable data (matches Dashboard exactly)
            // For historical dates: use local storage
            const todayStr = localDateKey(new Date());
            if (selectedDate === todayStr) {
                const liveSteps = await getTodayStepCount();
                setSteps(liveSteps || 0);
            } else {
                const stepsJson = await AsyncStorage.getItem(KEYS.STEPS);
                const stepsData = stepsJson ? JSON.parse(stepsJson) : {};
                setSteps(stepsData[selectedDate] || 0);
            }

            const twoHoursMs = 2 * 60 * 60 * 1000;
            const localEntries = historyData.filter(item => !isHealthConnectEntry(item));
            const localTimestamps = localEntries
                .map(item => new Date(item.startedAt || item.finishedAt || 0).getTime())
                .filter(timestamp => timestamp > 0);

            const dedupedHistory = historyData.filter(item => {
                if (!isHealthConnectEntry(item)) return true;
                const healthConnectMs = new Date(item.startedAt || item.finishedAt || 0).getTime();
                if (healthConnectMs <= 0) return true;
                return !localTimestamps.some(localMs => Math.abs(localMs - healthConnectMs) < twoHoursMs);
            });

            const historySessions = dedupedHistory
                .filter(item => getSessionDateKey(item.startedAt || item.finishedAt) === selectedDate)
                .map(mapWorkoutSession);
            const legacySessions = (legacyWorkouts || [])
                .filter(item => getSessionDateKey(item.timestamp) === selectedDate)
                .map(mapWorkoutSession);

            const sessions = [...historySessions, ...legacySessions].sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );

            const stats = sessions.reduce((acc, workout) => ({
                caloriesBurned: acc.caloriesBurned + (workout.caloriesBurned || 0),
                totalMinutes: acc.totalMinutes + (workout.duration || 0),
                totalCount: acc.totalCount + 1,
            }), { caloriesBurned: 0, totalMinutes: 0, totalCount: 0 });

            setWorkoutStats(stats);
            setDayWorkouts(sessions);
        } catch (err) {
            console.error('Failed to load day summary:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    const distance = (steps * 0.00076).toFixed(2);
    // Estimate baseline calories: ~0.04 - 0.05 kcal per step
    const baseCalories = Math.round(steps * 0.04);
    // Total kcal = workout kcal + estimated walking kcal
    const calories = workoutStats.caloriesBurned + baseCalories;
    // Total min = workout min + estimated walking min (100 steps/min)
    const activeMinutes = workoutStats.totalMinutes + Math.round(steps / 100);

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dateTitle = dateObj.toLocaleDateString([], { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Summary</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{dateTitle}</Text>
                </View>

                <View style={styles.heroSection}>
                    <View style={styles.ringGlow} />
                    <StepRing steps={steps} goal={stepGoal} size={240} />
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{calories}</Text>
                        <Text style={styles.statLabel}>KCAL</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{distance}</Text>
                        <Text style={styles.statLabel}>KM</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{activeMinutes}</Text>
                        <Text style={styles.statLabel}>MIN</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <MaterialIcons name="info-outline" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                        This is a summary of your activity recorded on {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}.
                    </Text>
                </View>

                <View style={styles.workoutSection}>
                    <View style={styles.workoutSectionHeader}>
                        <Text style={styles.workoutSectionTitle}>Workout Summary</Text>
                        <Text style={styles.workoutSectionMeta}>
                            {workoutStats.totalCount} {workoutStats.totalCount === 1 ? 'session' : 'sessions'}
                        </Text>
                    </View>

                    {dayWorkouts.length > 0 ? (
                        <>
                            <View style={styles.workoutHighlights}>
                                <View style={styles.highlightChip}>
                                    <Text style={styles.highlightValue}>{workoutStats.totalMinutes}</Text>
                                    <Text style={styles.highlightLabel}>min logged</Text>
                                </View>
                                <View style={styles.highlightChip}>
                                    <Text style={styles.highlightValue}>{workoutStats.caloriesBurned}</Text>
                                    <Text style={styles.highlightLabel}>kcal burned</Text>
                                </View>
                            </View>

                            <View style={styles.workoutList}>
                                {dayWorkouts.map((workout) => (
                                    <View key={workout.id} style={styles.workoutCardWrap}>
                                        <WorkoutCard
                                            name={workout.name}
                                            type={workout.type}
                                            duration={workout.duration}
                                            time={workout.time}
                                            caloriesBurned={workout.caloriesBurned}
                                            completed={workout.completed}
                                            opacity={1}
                                        />
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyWorkoutCard}>
                            <Text style={styles.emptyWorkoutTitle}>No workouts logged</Text>
                            <Text style={styles.emptyWorkoutText}>
                                Activity metrics are still shown for this day, but there are no workout sessions saved yet.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDark },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    dateContainer: { marginTop: 24, alignItems: 'center' },
    dateText: { color: colors.textSecondary, fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' },
    heroSection: { 
        marginTop: 40, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 20,
    },
    ringGlow: {
        position: 'absolute', width: 180, height: 180,
        borderRadius: 90, backgroundColor: colors.primary,
        opacity: 0.08, blurRadius: 40,
    },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        marginTop: 50, paddingVertical: 20, backgroundColor: colors.bgCard,
        borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { color: colors.text, fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
    statLabel: { color: colors.textSecondary, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 4 },
    divider: { width: 1, height: 30, backgroundColor: colors.border, opacity: 0.5 },
    infoCard: {
        marginTop: 32, flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, backgroundColor: colors.primary + '10', borderRadius: 16,
        borderWidth: 1, borderColor: colors.primary + '20',
    },
    infoText: { flex: 1, color: colors.text, fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium', lineHeight: 20 },
    workoutSection: {
        marginTop: 28,
    },
    workoutSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    workoutSectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    workoutSectionMeta: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    workoutHighlights: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    highlightChip: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
    },
    highlightValue: {
        color: colors.primary,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    highlightLabel: {
        marginTop: 4,
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_500Medium',
        textTransform: 'uppercase',
    },
    workoutList: {
        gap: 12,
    },
    workoutCardWrap: {
        marginBottom: 12,
    },
    emptyWorkoutCard: {
        padding: 18,
        borderRadius: 18,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyWorkoutTitle: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    emptyWorkoutText: {
        marginTop: 6,
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 20,
    },
});
