import React, { useCallback, useMemo, memo, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Dimensions
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActivityData } from '../contexts/ActivityDataContext';
import { useTranslation, getMonthNames } from '../services/i18n';
import { getWorkoutHistory, getWorkoutStreakStatus } from '../services/storage';

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_W - 32) / 7;

const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const todayStr = getLocalDateStr();

// ─── Memoized Day Cell ────────────────────────────

const DayCell = memo(({ day, dateStr, hasWorkout, count, colors, isDark }) => {
    if (!day) return <View style={cellStyles.cell} />;

    const isToday = todayStr === dateStr;
    const isActive = hasWorkout;

    const mainColor = colors.primary;

    return (
        <View style={cellStyles.cell}>
            <View style={[
                cellStyles.circle,
                isActive && { backgroundColor: mainColor },
                isToday && !isActive && { borderWidth: 1.5, borderColor: colors.primary },
            ]}>
                <Text style={[
                    cellStyles.dayText,
                    { color: isActive ? (isDark ? '#0a0a0a' : '#fff') : colors.text },
                    isActive && cellStyles.boldText,
                    isToday && !isActive && { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' },
                ]}>{day}</Text>
            </View>
            {isActive && (
                <View style={cellStyles.indicator}>
                    <MaterialCommunityIcons name="dumbbell" size={8} color={isDark ? '#0a0a0a' : '#fff'} />
                </View>
            )}
        </View>
    );
});

const cellStyles = StyleSheet.create({
    cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
    circle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    dayText: { fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
    boldText: { fontFamily: 'SpaceGrotesk_700Bold' },
    indicator: { position: 'absolute', bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 1 },
    badge: { fontSize: 8, fontFamily: 'SpaceGrotesk_700Bold' },
});

// ─── Memoized Month Block ─────────────────────────

const MonthBlock = memo(({ item, workoutDates, workoutCounts, colors, isDark, monthNames, daysHeader }) => {
    let monthTotal = 0;
    for (let d = 1; d <= item.daysInMonth; d++) {
        const dateStr = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = workoutCounts[dateStr] || 0;
        if (count > 0) {
            monthTotal += count;
        }
    }

    return (
        <View style={monthStyles.container}>
            <View style={monthStyles.headerRow}>
                <Text style={[monthStyles.title, { color: colors.text }]}>
                    {monthNames[item.month]} {item.year}
                </Text>
                {monthTotal > 0 && (
                    <View style={[monthStyles.badge, { backgroundColor: colors.primary + '15' }]}>
                        <MaterialCommunityIcons name="dumbbell" size={10} color={colors.primary} />
                        <Text style={[monthStyles.badgeText, { color: colors.primary }]}>{monthTotal}</Text>
                    </View>
                )}
            </View>
            <View style={monthStyles.weekRow}>
                {daysHeader.map((d, i) => (
                    <Text key={i} style={[monthStyles.weekText, { color: colors.textSecondary }]}>{d}</Text>
                ))}
            </View>
            <View style={monthStyles.grid}>
                {item.grid.map((cell, idx) => {
                    if (!cell) return <View key={idx} style={cellStyles.cell} />;
                    return (
                        <DayCell
                            key={idx}
                            day={cell.day}
                            dateStr={cell.dateStr}
                            hasWorkout={workoutDates.has(cell.dateStr)}
                            count={workoutCounts[cell.dateStr] || 0}
                            colors={colors}
                            isDark={isDark}
                        />
                    );
                })}
            </View>
        </View>
    );
});

const monthStyles = StyleSheet.create({
    container: { marginTop: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: 8 },
    title: { fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },
    weekRow: { flexDirection: 'row', marginBottom: 8 },
    weekText: { flex: 1, textAlign: 'center', fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
});

// ─── Screen ───────────────────────────────────────

export default function WorkoutCalendarScreen() {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { t } = useTranslation();
    const monthNames = getMonthNames(t);
    const [workoutStreak, setWorkoutStreak] = useState(0);
    const [workoutStreakStatus, setWorkoutStreakStatus] = useState({
        currentWeekCount: 0,
        currentWeekTarget: 3,
        currentWeekMet: false,
    });
    const [restStreak, setRestStreak] = useState(0);

    // Pre-computed grids + pre-cached data — zero work on mount
    const { workoutDates, workoutCounts, workoutMonths, fetchMonthData } = useActivityData();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadWorkoutStats = async () => {
                try {
                    const [history, streakStatus] = await Promise.all([
                        getWorkoutHistory(),
                        getWorkoutStreakStatus(),
                    ]);

                    if (!isActive) return;

                    setWorkoutStreak(streakStatus.streak);
                    setWorkoutStreakStatus(streakStatus);

                    const workoutDateKeys = new Set(
                        (history || [])
                            .map((session) => {
                                const startedAt = session?.startedAt || session?.finishedAt || session?.timestamp;
                                if (!startedAt) return null;
                                const date = new Date(startedAt);
                                if (Number.isNaN(date.getTime())) return null;
                                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            })
                            .filter(Boolean)
                    );

                    if (workoutDateKeys.size === 0) {
                        setRestStreak(0);
                        return;
                    }

                    let streak = 0;
                    const cursor = new Date();
                    cursor.setHours(0, 0, 0, 0);

                    while (streak < 365) {
                        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
                        if (!workoutDateKeys.has(key)) {
                            streak += 1;
                            cursor.setDate(cursor.getDate() - 1);
                        } else {
                            break;
                        }
                    }

                    setRestStreak(streak);
                } catch (error) {
                    console.error('Failed to load workout calendar stats:', error);
                }
            };

            loadWorkoutStats();

            return () => {
                isActive = false;
            };
        }, [])
    );

    const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
        viewableItems.forEach(item => {
            if (item.isViewable) {
                fetchMonthData(item.item.year, item.item.month);
            }
        });
    }).current;

    const daysHeader = useMemo(() => [
        t('sun').slice(0, 1).toUpperCase(),
        t('mon').slice(0, 1).toUpperCase(),
        t('tue').slice(0, 1).toUpperCase(),
        t('wed').slice(0, 1).toUpperCase(),
        t('thu').slice(0, 1).toUpperCase(),
        t('fri').slice(0, 1).toUpperCase(),
        t('sat').slice(0, 1).toUpperCase()
    ], [t]);

    const renderMonth = ({ item }) => (
        <MonthBlock
            item={item}
            workoutDates={workoutDates}
            workoutCounts={workoutCounts}
            colors={colors}
            isDark={isDark}
            monthNames={monthNames}
            daysHeader={daysHeader}
        />
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Workout History</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.statCardBlue]}>
                    <MaterialCommunityIcons
                        name="fire"
                        size={24}
                        color={isDark ? '#fb923c' : '#f97316'}
                        style={styles.statLeadIcon}
                    />
                    <View style={styles.statContent}>
                        <Text
                            style={styles.statHeadline}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                        >
                            <Text style={[styles.statValue, { color: colors.text }]}>{workoutStreak}</Text>
                            <Text style={styles.statUnit}> weeks</Text>
                        </Text>
                        <Text style={styles.statLabel}>Streak</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <MaterialCommunityIcons
                        name="weather-night"
                        size={24}
                        color={isDark ? '#3b82f6' : '#2563eb'}
                        style={styles.statLeadIcon}
                    />
                    <View style={styles.statContent}>
                        <Text
                            style={styles.statHeadline}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                        >
                            <Text style={styles.statValue}>{restStreak}</Text>
                            <Text style={styles.statUnit}> days</Text>
                        </Text>
                        <Text style={styles.statLabel}>Rest</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <MaterialIcons
                        name={workoutStreakStatus.currentWeekMet ? 'event-available' : 'event-note'}
                        size={22}
                        color={workoutStreakStatus.currentWeekMet ? colors.primary : colors.textSecondary}
                        style={styles.statLeadIcon}
                    />
                    <View style={styles.statContent}>
                        <Text
                            style={styles.statHeadline}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                        >
                            <Text style={[styles.statValue, workoutStreakStatus.currentWeekMet && styles.statValueComplete]}>
                                {workoutStreakStatus.currentWeekCount}/{workoutStreakStatus.currentWeekTarget}
                            </Text>
                            <Text style={styles.statUnit}> days</Text>
                        </Text>
                        <Text style={styles.statLabel}>This Week</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsDivider} />

            <FlatList
                data={workoutMonths}
                renderItem={renderMonth}
                keyExtractor={item => item.key}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
                initialNumToRender={4}
                maxToRenderPerBatch={2}
                windowSize={9}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                    length: 420, 
                    offset: 420 * index,
                    index,
                })}
            />
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDark },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
    },
    statsDivider: {
        height: 1,
        backgroundColor: colors.border,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 64,
        shadowColor: colors.shadowSoft,
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 3,
    },
    statCardBlue: {
        borderColor: isDark ? 'rgba(56,189,248,0.32)' : 'rgba(2,132,199,0.22)',
        backgroundColor: isDark ? '#0f172a' : '#f0f9ff',
    },
    streakIconBlue: {
        textShadowRadius: 8,
        textShadowOffset: { width: 0, height: 0 },
    },
    statLeadIcon: {
        marginRight: 12,
        alignSelf: 'center',
    },
    statContent: {
        flex: 1,
        minWidth: 0,
    },
    statHeadline: {
        color: colors.text,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
    },
    statValue: {
        color: colors.text,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: -0.1,
    },
    statUnit: {
        color: colors.text,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    statValueComplete: {
        color: colors.primary,
    },
    statLabel: {
        marginTop: 2,
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_500Medium',
        letterSpacing: 0,
    },
    list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
});
