import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useTranslation } from '../services/i18n';
import { getWorkouts, getWorkoutHistory, isHealthConnectEntry } from '../services/storage';

function formatLocalDateKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

function getWorkoutDateKey(timestamp) {
    if (!timestamp) return null;
    const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(timestamp);
    if (isoMatch) return isoMatch[1];

    const dateObj = new Date(timestamp);
    if (Number.isNaN(dateObj.getTime())) return null;
    return formatLocalDateKey(dateObj);
}

function mapHistoryWorkout(workout) {
    const timestamp = workout.startedAt || workout.finishedAt || new Date().toISOString();
    const dateObj = new Date(timestamp);
    const mins = Math.round((workout.elapsedSeconds || workout.duration || 0) / 60);

    return {
        id: workout.id || `${Date.now()}_${Math.random()}`,
        name: workout.routineName || workout.workoutName || 'Completed Workout',
        type: workout.type === 'activity' ? (workout.activityType || 'run') : 'default',
        duration: mins,
        time: dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        caloriesBurned: workout.caloriesBurned || Math.round(mins * 6),
        completed: true,
        timestamp,
    };
}

function mapPlannedWorkout(workout) {
    const dateObj = new Date(workout.timestamp || new Date());

    return {
        ...workout,
        duration: Math.round((workout.duration || 0) / 60),
        time: dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        timestamp: workout.timestamp || dateObj.toISOString(),
    };
}

function buildDayGroups(items) {
    const groups = new Map();

    items.forEach((workout) => {
        const dateKey = getWorkoutDateKey(workout.timestamp);
        if (!dateKey) return;

        if (!groups.has(dateKey)) {
            const [year, month, day] = dateKey.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            groups.set(dateKey, {
                dateKey,
                label: dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
                count: 0,
                totalMinutes: 0,
                totalCalories: 0,
            });
        }

        const entry = groups.get(dateKey);
        entry.count += 1;
        entry.totalMinutes += workout.duration || 0;
        entry.totalCalories += workout.caloriesBurned || 0;
    });

    return Array.from(groups.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export default function WorkoutHistoryScreen() {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [allWorkouts, setAllWorkouts] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedYears, setExpandedYears] = useState({});
    const [expandedMonths, setExpandedMonths] = useState({});

    const toggleYear = (year) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const toggleMonth = (year, monthName) => {
        const key = `${year}-${monthName}`;
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const loadInitialMarkers = useCallback(async () => {
        try {
            setLoading(true);
            const [plannedWorkouts, history] = await Promise.all([
                getWorkouts(),
                getWorkoutHistory(),
            ]);

            const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
            const localEntries = history.filter(item => !isHealthConnectEntry(item));
            const localTimestamps = localEntries
                .map(item => new Date(item.startedAt || item.finishedAt || 0).getTime())
                .filter(timestamp => timestamp > 0);

            const dedupedHistory = history.filter(item => {
                if (!isHealthConnectEntry(item)) return true;
                const hcMs = new Date(item.startedAt || item.finishedAt || 0).getTime();
                if (hcMs <= 0) return true;
                return !localTimestamps.some(localMs => Math.abs(localMs - hcMs) < TWO_HOURS_MS);
            });

            const grouped = {};
            const ensureMonthBucket = (year, monthLabel, monthIndex) => {
                if (!grouped[year]) grouped[year] = {};
                if (!grouped[year][monthLabel]) {
                    grouped[year][monthLabel] = { count: 0, monthIndex, items: [], dayGroups: [] };
                }
                return grouped[year][monthLabel];
            };

            dedupedHistory.forEach((workout) => {
                const dateObj = new Date(workout.startedAt || workout.finishedAt || new Date());
                const year = dateObj.getFullYear().toString();
                const month = dateObj.toLocaleDateString([], { month: 'long' });
                const bucket = ensureMonthBucket(year, month, dateObj.getMonth());
                bucket.count += 1;
                bucket.items.push(mapHistoryWorkout(workout));
            });

            plannedWorkouts.forEach((workout) => {
                const mappedWorkout = mapPlannedWorkout(workout);
                const dateObj = new Date(mappedWorkout.timestamp || new Date());
                const year = dateObj.getFullYear().toString();
                const month = dateObj.toLocaleDateString([], { month: 'long' });
                const bucket = ensureMonthBucket(year, month, dateObj.getMonth());
                bucket.count += 1;
                bucket.items.push(mappedWorkout);
            });

            Object.values(grouped).forEach((months) => {
                Object.values(months).forEach((bucket) => {
                    bucket.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    bucket.dayGroups = buildDayGroups(bucket.items);
                });
            });

            setAllWorkouts(grouped);

            const sortedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
            if (sortedYears.length > 0) {
                const recentYear = sortedYears[0];
                setExpandedYears({ [recentYear]: true });
                const recentMonth = Object.entries(grouped[recentYear])
                    .sort(([, a], [, b]) => (b.monthIndex ?? -1) - (a.monthIndex ?? -1))[0]?.[0];
                if (recentMonth) {
                    setExpandedMonths({ [`${recentYear}-${recentMonth}`]: true });
                }
            }
        } catch (err) {
            console.error('Workout History marker load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadInitialMarkers();
        }, [loadInitialMarkers])
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Past Workouts</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : Object.keys(allWorkouts).length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>{t('noWorkoutsYet') || 'No workouts found.'}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {Object.keys(allWorkouts).sort((a, b) => Number(b) - Number(a)).map((year) => {
                        const isYearExpanded = expandedYears[year];
                        const yearWorkoutCount = Object.values(allWorkouts[year]).reduce(
                            (acc, monthWorkouts) => acc + (monthWorkouts?.count || 0),
                            0
                        );

                        return (
                            <View key={year} style={styles.yearSection}>
                                <TouchableOpacity
                                    style={styles.yearHeader}
                                    onPress={() => toggleYear(year)}
                                >
                                    <View style={styles.headerTitleRow}>
                                        <Text style={styles.yearText}>{year}</Text>
                                        <Text style={styles.countBadge}>{yearWorkoutCount} workouts</Text>
                                    </View>
                                    <MaterialIcons
                                        name={isYearExpanded ? 'expand-less' : 'expand-more'}
                                        size={28}
                                        color={colors.text}
                                    />
                                </TouchableOpacity>

                                {isYearExpanded && (
                                    <View style={styles.monthsContainer}>
                                        {Object.entries(allWorkouts[year])
                                            .sort(([, a], [, b]) => (b.monthIndex ?? -1) - (a.monthIndex ?? -1))
                                            .map(([month, monthDataObj]) => {
                                                const monthKey = `${year}-${month}`;
                                                const isMonthExpanded = expandedMonths[monthKey];

                                                return (
                                                    <View key={monthKey} style={styles.monthSection}>
                                                        <TouchableOpacity
                                                            style={styles.monthHeader}
                                                            onPress={() => toggleMonth(year, month)}
                                                        >
                                                            <View style={styles.headerTitleRow}>
                                                                <Text style={styles.monthText}>{month}</Text>
                                                                <Text style={styles.monthCountBadge}>{monthDataObj.count} workouts</Text>
                                                            </View>
                                                            <MaterialIcons
                                                                name={isMonthExpanded ? 'expand-less' : 'expand-more'}
                                                                size={24}
                                                                color={colors.textSecondary}
                                                            />
                                                        </TouchableOpacity>

                                                        {isMonthExpanded && (
                                                            <View style={styles.daysContainer}>
                                                                {monthDataObj.dayGroups.map((dayGroup) => (
                                                                    <TouchableOpacity
                                                                        key={dayGroup.dateKey}
                                                                        style={styles.dayRow}
                                                                        activeOpacity={0.8}
                                                                        onPress={() => navigation.navigate('DaySummary', { selectedDate: dayGroup.dateKey })}
                                                                    >
                                                                        <View style={styles.dayCopy}>
                                                                            <Text style={styles.dayTitle}>{dayGroup.label}</Text>
                                                                            <Text style={styles.dayMeta}>
                                                                                {dayGroup.count} {dayGroup.count === 1 ? 'workout' : 'workouts'}
                                                                            </Text>
                                                                        </View>

                                                                        <View style={styles.dayStats}>
                                                                            <View style={[styles.dayStatBadge, styles.dayMinutesBadge]}>
                                                                                <MaterialIcons name="schedule" size={12} color={colors.primary} />
                                                                                <Text style={[styles.dayStatText, styles.dayMinutesText]}>{dayGroup.totalMinutes} min</Text>
                                                                            </View>
                                                                            {dayGroup.totalCalories > 0 ? (
                                                                                <View style={styles.dayStatBadge}>
                                                                                    <MaterialIcons name="local-fire-department" size={12} color={colors.orange500} />
                                                                                    <Text style={styles.dayStatText}>{dayGroup.totalCalories} kcal</Text>
                                                                                </View>
                                                                            ) : null}
                                                                        </View>

                                                                        <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: colors.text,
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    yearSection: {
        marginBottom: 16,
    },
    yearHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: colors.cardBg || colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderLight || colors.border,
        borderRadius: 12,
        marginBottom: 12,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    yearText: {
        fontSize: 22,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: colors.text,
    },
    countBadge: {
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_500Medium',
        color: colors.primary,
        backgroundColor: colors.surfaceAlt || colors.bgCard,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    monthsContainer: {
        paddingLeft: 12,
    },
    monthSection: {
        marginBottom: 8,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: colors.cardBg || colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderLight || colors.border,
        borderRadius: 10,
        marginBottom: 8,
    },
    monthText: {
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        color: colors.textSecondary,
    },
    monthCountBadge: {
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
        color: colors.textSecondary,
        backgroundColor: colors.surfaceAlt || colors.bgCard,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
    },
    daysContainer: {
        paddingTop: 8,
        paddingLeft: 4,
        gap: 10,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayCopy: {
        flex: 1,
    },
    dayTitle: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    dayMeta: {
        marginTop: 4,
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    dayStats: {
        alignItems: 'flex-end',
        gap: 4,
    },
    dayStatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.orangeBg,
    },
    dayMinutesBadge: {
        backgroundColor: colors.primaryDim,
    },
    dayStatText: {
        color: colors.orange500,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    dayMinutesText: {
        color: colors.primary,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary || '#94A3B8',
        fontFamily: 'SpaceGrotesk_400Regular',
        textAlign: 'center',
    },
});
