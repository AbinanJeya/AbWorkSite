import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Animated } from 'react-native';
import { StyledRefreshControl, RefreshOverlay } from '../components/CustomRefreshControl';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ELEVATION } from '../theme';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import StepRing from '../components/StepRing';
import { AddFoodModal } from '../components/AddFoodModal';
import {
    getMeals, getWorkouts, getSettings, getUserProfile,
    getTodaysMeals, getTodaysWorkouts, getDiaryForDate, getDiaryStreak, getWorkoutStreak,
    calcMacroTotals, calcWorkoutTotals, getRecentWorkouts, getStepHistory,
    isHealthConnectEntry,
    getWater, saveWater, addFoodToDiary
} from '../services/storage';
import { getTodayStepCount, startStepWatcher, stopStepWatcher, getActiveStepSourceInfo } from '../services/pedometer';
import { fetchWeeklySteps } from '../services/health';
import { getFitbitCalories } from '../services/fitbit';
import { awardMissionXPIfEligible, awardWeeklyWorkoutTargetBonusIfEligible, XP_AMOUNTS } from '../services/leveling';
import { getInteractiveNutritionCoach } from '../services/openai';
import { getLeaderboardData, formatSteps } from '../services/friends';
import { useTranslation } from '../services/i18n';
import { getDailyMissionPlan } from '../services/dailyMissions';
import { buildDashboardHabitSnapshot } from '../services/dashboardCoach';
import { usePreviewAutoScroll } from '../preview/PreviewAutoDemo';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

// Weekly Step Rings Card
const RING_SIZE = 38;
const RING_RADIUS = 14;
const RING_STROKE = 3.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~87.96

function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWaterTotalFromLogs(logs) {
    return Array.isArray(logs)
        ? logs.reduce((acc, log) => acc + (parseInt(log.amount, 10) || 0), 0)
        : (parseInt(logs, 10) || 0);
}

const LeaderboardRow = React.memo(({ entry, index, totalCount, colors, t }) => {
    const styles = getStyles(colors, false);
    const rankColors = [colors.primary, '#94a3b8', '#b87333'];
    const maxS = totalCount > 0 ? totalCount : 1;
    const i = index;
    const isLast = i === 2 || i === totalCount - 1;

    return (
        <View style={[styles.lbRow, !isLast && styles.lbRowBorder]}>
            <View style={[styles.lbRankBadge, { backgroundColor: rankColors[i] + '22', borderColor: rankColors[i] + '55' }]}>
                <Text style={[styles.lbRankText, { color: rankColors[i] }]}>{i + 1}</Text>
            </View>
            <View style={styles.lbAvatar}>
                <MaterialIcons name={entry.isAI ? "smart-toy" : "person"} size={14} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.lbName, entry.isYou && { color: colors.primary }]}>
                    {entry.isYou ? t('you') : entry.name}
                </Text>
                <View style={styles.lbBarBg}>
                    <View style={[styles.lbBarFill, { width: `${(entry.steps / maxS) * 100}%` }]} />
                </View>
            </View>
            <Text style={styles.lbSteps}>{formatSteps(entry.steps)}</Text>
        </View>
    );
});

const LoadingPulseBlock = React.memo(({ colors, style }) => {
    const opacity = React.useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return <Animated.View style={[{ opacity, backgroundColor: colors.surface, borderRadius: 12 }, style]} />;
});

const WeeklyStepsCard = React.memo(({ history, goal, colors, nav }) => {
    if (!history || history.length === 0) return null;

    // Build date range label
    const startDate = new Date(history[0].date);
    const endDate = new Date(history[history.length - 1].date);
    const fmt = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const rangeLabel = `${fmt(startDate)} - ${fmt(endDate)}`;

    return (
        <View style={{
            marginTop: 12, marginHorizontal: 24,
            backgroundColor: colors.bgCard || 'rgba(255,255,255,0.04)',
            borderRadius: 22, padding: 16,
            borderWidth: 1, borderColor: colors.border || 'rgba(255,255,255,0.06)',
        }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold', color: colors.text }}>Last 7 Days</Text>
                    <TouchableOpacity 
                        onPress={() => nav.navigate('ActivityCalendar')}
                        style={{ backgroundColor: colors.primaryDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
                    >
                        <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', color: colors.primary }}>See More</Text>
                    </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' }}>{rangeLabel}</Text>
            </View>

            {/* Ring Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {history.map((day, idx) => {
                    const pct = goal > 0 ? Math.min(day.steps / goal, 1) : 0;
                    const offset = RING_CIRCUMFERENCE * (1 - pct);
                    const isComplete = pct >= 1;

                    return (
                        <View key={idx} style={{ alignItems: 'center', gap: 5, flex: 1 }}>
                            <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                                <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                                    {/* Background track */}
                                    <SvgCircle
                                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
                                        stroke={colors.border || 'rgba(255,255,255,0.06)'}
                                        strokeWidth={RING_STROKE} fill="transparent"
                                    />
                                    {/* Progress arc */}
                                    <SvgCircle
                                        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
                                        stroke={isComplete ? colors.primary : (pct > 0 ? colors.primary + '80' : 'transparent')}
                                        strokeWidth={RING_STROKE} fill="transparent"
                                        strokeDasharray={`${RING_CIRCUMFERENCE}`}
                                        strokeDashoffset={`${offset}`}
                                        strokeLinecap="round"
                                    />
                                </Svg>
                                {/* Checkmark overlay for completed days */}
                                {isComplete && (
                                    <View style={{ position: 'absolute' }}>
                                        <MaterialIcons name="check" size={13} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                            <Text style={{
                                fontSize: 9,
                                fontFamily: day.isToday ? 'SpaceGrotesk_700Bold' : 'SpaceGrotesk_600SemiBold',
                                color: day.isToday ? colors.primary : colors.textSecondary,
                                textTransform: 'uppercase',
                            }}>
                                {day.isToday ? 'Today' : day.dayLabel}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
});

const getMissionTone = (tone, colors) => {
    const toneMap = {
        primary: {
            badgeBg: colors.primaryDim,
            badgeText: colors.primary,
            iconBg: colors.primaryDim,
            iconColor: colors.primary,
            track: colors.surface,
            fill: colors.primary,
            actionText: colors.primary,
        },
        blue: {
            badgeBg: colors.blueBg,
            badgeText: colors.blue500,
            iconBg: colors.blueBg,
            iconColor: colors.blue500,
            track: colors.surface,
            fill: colors.blue500,
            actionText: colors.blue500,
        },
        amber: {
            badgeBg: colors.amberBg,
            badgeText: colors.amber500,
            iconBg: colors.amberBg,
            iconColor: colors.amber500,
            track: colors.surface,
            fill: colors.amber500,
            actionText: colors.amber500,
        },
        green: {
            badgeBg: colors.greenBg,
            badgeText: colors.green500,
            iconBg: colors.greenBg,
            iconColor: colors.green500,
            track: colors.surface,
            fill: colors.green500,
            actionText: colors.green500,
        },
        violet: {
            badgeBg: colors.violetBg,
            badgeText: colors.violet500,
            iconBg: colors.violetBg,
            iconColor: colors.violet500,
            track: colors.surface,
            fill: colors.violet500,
            actionText: colors.violet500,
        },
    };

    return toneMap[tone] || toneMap.primary;
};

export default function DashboardScreen() {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const previewAutoScroll = usePreviewAutoScroll('Dashboard', { demoOffset: 280, demoRatio: 0.58 });
    const [steps, setSteps] = useState(0);
    const [settings, setSettingsState] = useState({ stepGoal: 10000, calorieGoal: 2000, userName: 'Alex Rivera' });
    const [userName, setUserName] = useState('');
    const [intake, setIntake] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [workoutStats, setWorkoutStats] = useState({ caloriesBurned: 0, totalMinutes: 0 });
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [celebrating, setCelebrating] = useState(false);
    const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
    const [aiCoach, setAiCoach] = useState(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stepSource, setStepSource] = useState(null);
    const [profileImg, setProfileImg] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weeklySteps, setWeeklySteps] = useState([]);
    const [water, setWater] = useState(0);
    const [waterHistory, setWaterHistory] = useState({});
    const [assistantFoodModalVisible, setAssistantFoodModalVisible] = useState(false);
    const [assistantStatusNote, setAssistantStatusNote] = useState('');
    const nav = useNavigation();

    // Context from our zero-loading architecture
    const { stepHistory, diaryHistory, workoutDates, stepGoal } = require('../contexts/ActivityDataContext').useActivityData();

    // Cache footprint to prevent re-running AI on every tab focus
    const [aiFingerprint, setAiFingerprint] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const loadData = useCallback(async () => {
        try {
            await awardWeeklyWorkoutTargetBonusIfEligible();
            const [allMeals, allWorkouts, s, stepCount, recentHistory, stepHist] = await Promise.all([
                getMeals(), getWorkouts(), getSettings(), getTodayStepCount(), getRecentWorkouts(5), getStepHistory(7),
            ]);

            setSettingsState(s);
            setSteps(stepCount);
            
            const todayKey = localDateKey(new Date());
            const wLogs = await getWater(todayKey);
            const currentTotal = getWaterTotalFromLogs(wLogs);
            setWater(currentTotal);

            const recentWaterEntries = await Promise.all(
                Array.from({ length: 7 }, (_, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() - index);
                    const dateKey = localDateKey(date);

                    if (dateKey === todayKey) {
                        return Promise.resolve([dateKey, currentTotal]);
                    }

                    return getWater(dateKey).then((logs) => [dateKey, getWaterTotalFromLogs(logs)]);
                })
            );
            setWaterHistory(
                recentWaterEntries.reduce((acc, [dateKey, total]) => {
                    acc[dateKey] = total;
                    return acc;
                }, {})
            );

            // Merge Health Connect step history into the weekly rings if HC steps are enabled
            const conn = s.wearableConnections?.health_connect;
            if (typeof conn === 'object' && conn.syncSteps) {
                try {
                    const hcSteps = await fetchWeeklySteps(7); // { '2026-03-05': 8542, ... }
                    const merged = stepHist.map(day => ({
                        ...day,
                        steps: Math.max(day.steps, hcSteps[day.date] || 0), // Take the higher value to avoid double-counting
                    }));
                    setWeeklySteps(merged);
                } catch (e) {
                    console.warn('HC weekly steps merge failed:', e);
                    setWeeklySteps(stepHist);
                }
            } else {
                setWeeklySteps(stepHist);
            }

            // Check if steps come from a wearable
            const sourceInfo = await getActiveStepSourceInfo();
            setStepSource(sourceInfo);

            const todayMeals = getTodaysMeals(allMeals);
            const todayWorkouts = getTodaysWorkouts(allWorkouts);
            const macros = calcMacroTotals(todayMeals);
            const wStats = calcWorkoutTotals(todayWorkouts);

            if (sourceInfo?.deviceId === 'fitbit') {
                const fitbitCal = await getFitbitCalories('today');
                if (fitbitCal > 0) wStats.caloriesBurned = fitbitCal;
            }

            setIntake(macros);
            setWorkoutStats(wStats);

            // QoL: Celebration Trigger
            if (macros.calories >= s.calorieGoal && s.calorieGoal > 0 && !hasCelebratedToday) {
                setCelebrating(true);
                setHasCelebratedToday(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => setCelebrating(false), 5000);
            }

            // Format history objects to perfectly match the WorkoutCard props
            // First, deduplicate: remove HC entries that overlap (ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±2h) with local/CSV entries
            const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
            const localEntries = recentHistory.filter(h => !isHealthConnectEntry(h));
            const localTimestamps = localEntries
                .map(h => new Date(h.startedAt || h.finishedAt || 0).getTime())
                .filter(t => t > 0);

            const dedupedHistory = recentHistory.filter(h => {
                if (!isHealthConnectEntry(h)) return true; // Always keep local/CSV
                const hcMs = new Date(h.startedAt || h.startTime || 0).getTime();
                if (hcMs <= 0) return true;
                return !localTimestamps.some(localMs => Math.abs(localMs - hcMs) < TWO_HOURS_MS);
            });

            const historyWorkouts = dedupedHistory.map(h => {
                let d = new Date(h.startedAt || new Date());
                let mins = Math.round((h.elapsedSeconds || 0) / 60);
                return {
                    id: h.id,
                    name: h.routineName || 'Completed Workout',
                    type: h.type === 'activity' ? (h.activityType || 'run') : 'default',
                    duration: mins, // Must be pure int, WorkoutCard natively appends " mins"
                    time: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), // e.g. "Mar 5"
                    caloriesBurned: h.caloriesBurned || Math.round(mins * 6), // Estimate if missing
                    completed: true,
                    timestamp: h.startedAt || new Date().toISOString()
                };
            });

            // Make sure current workouts explicitly have a sortable timestamp
            const currentWorkouts = allWorkouts.map(w => ({
                ...w, timestamp: w.timestamp || new Date().toISOString()
            }));

            // Merge both lists, sort backwards by time, take top 3
            const combinedWorkouts = [...currentWorkouts, ...historyWorkouts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setRecentWorkouts(combinedWorkouts.slice(0, 3));

            const [profile, todayDiaryEntry, diaryStreak, workoutStreak] = await Promise.all([
                getUserProfile(),
                getDiaryForDate(todayKey),
                getDiaryStreak(),
                getWorkoutStreak(),
            ]);

            // Load leaderboard
            setUserName(profile?.firstName || '');
            const lb = await getLeaderboardData('weekly', stepCount, profile?.firstName || 'You');
            setLeaderboard(lb);
            setProfileImg(profile?.profileImage || null);

            // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ AI Caching Logic ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬
            // Only re-run AI if macros, workouts, step goals, or the 'time block' changes.
            const nextWaterHistory = recentWaterEntries.reduce((acc, [dateKey, total]) => {
                acc[dateKey] = total;
                return acc;
            }, {});
            const habitSnapshot = buildDashboardHabitSnapshot({
                now: new Date(),
                steps: stepCount,
                stepGoal: s.stepGoal || stepGoal,
                water: currentTotal,
                hydrationGoal,
                intake: macros,
                settings: s,
                profile,
                workoutStats: wStats,
                workoutDates,
                stepHistory,
                diaryHistory,
                waterHistory: nextWaterHistory,
                diaryStreak,
                workoutStreak,
                todayDiary: todayDiaryEntry,
            });
            const newFingerprint = [
                habitSnapshot.timeBlock,
                habitSnapshot.today.calories,
                habitSnapshot.today.protein,
                habitSnapshot.today.mealsLogged,
                habitSnapshot.today.water,
                habitSnapshot.today.steps >= habitSnapshot.goals.stepGoal ? 1 : 0,
                habitSnapshot.today.didWorkout ? 1 : 0,
                habitSnapshot.recent.loggingDays,
                habitSnapshot.recent.workoutDays,
                habitSnapshot.recent.hydrationDays,
                Math.sign(habitSnapshot.recent.stepTrendDiff),
                habitSnapshot.flags.likelyUnderLoggedToday ? 1 : 0,
                habitSnapshot.flags.hydrationLagging ? 1 : 0,
                diaryStreak,
                workoutStreak,
            ].join('|');

            if (aiFingerprint !== newFingerprint || !aiCoach) {
                setIsAiThinking(true);
                const aiContext = {
                    profile,
                    steps: stepCount,
                    workoutHistory: recentHistory,
                    localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    habitSnapshot,
                };

                try {
                    const coach = await getInteractiveNutritionCoach(macros, s, aiContext);
                    setAiCoach(coach);
                    setAiFingerprint(newFingerprint);
                } catch (e) {
                    console.warn('AI fetch failed', e);
                }
                setIsAiThinking(false);
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
            setIsAiThinking(false);
        }
    }, [aiCoach, aiFingerprint, hasCelebratedToday, stepGoal, stepHistory, diaryHistory, workoutDates]);

    const handleWaterAdd = useCallback(async (amount) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const todayKey = localDateKey(new Date());
        const currentLogs = await getWater(todayKey);
        
        // Ensure we are working with an array (handle legacy data)
        const logs = Array.isArray(currentLogs) ? currentLogs : [];
        
        if (amount > 0) {
            const newLog = { id: Date.now().toString(), amount: amount, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            const nextLogs = [...logs, newLog];
            await saveWater(todayKey, nextLogs);
            const nextTotal = nextLogs.reduce((acc, l) => acc + l.amount, 0);
            setWater(nextTotal);
            setWaterHistory(prev => ({ ...prev, [todayKey]: nextTotal }));
        } else {
            // Treat negative as "remove last" or just decrement total for Dashboard since it's simplified
            const total = Math.max(0, water + amount);
            setWater(total);
            // For Dashboard simplicity, if negative, we just wipe and set the total as a single entry or manage logs
            // Better to just pop the last one if it matches or similar
            if (logs.length > 0) {
                const nextLogs = logs.slice(0, -1);
                await saveWater(todayKey, nextLogs);
                setWaterHistory(prev => ({ ...prev, [todayKey]: getWaterTotalFromLogs(nextLogs) }));
            }
        }
    }, [water]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Start pedometer watcher for real-time step updates on Android
    useEffect(() => {
        startStepWatcher((newSteps) => {
            setSteps(newSteps);
        });
        return () => stopStepWatcher();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return t('goodMorning');
        if (h < 17) return t('goodAfternoon');
        return t('goodEvening');
    };

    const distance = ((steps * 0.0008).toFixed(1)); // rough km estimate
    const hydrationGoal = 2500;
    const hydrationProgress = hydrationGoal > 0 ? Math.min(water / hydrationGoal, 1) : 0;
    const hydrationTone = hydrationProgress >= 1 ? 'Goal hit' : hydrationProgress >= 0.6 ? 'On pace' : 'Need a refill';
    const stepSyncMessage = stepSource
        ? `Synced from ${stepSource.deviceName}`
        : settings?.wearableConnections?.health_connect?.syncSteps
            ? 'Using phone motion while wearable sync catches up'
            : 'Tracking with your phone sensors';
    const missionPlan = useMemo(() => getDailyMissionPlan({
        now: currentTime,
        steps,
        stepGoal,
        water,
        hydrationGoal,
        intake,
        settings,
        workoutStats,
        stepHistory,
        diaryHistory,
        workoutDates,
    }), [currentTime, steps, stepGoal, water, hydrationGoal, intake, settings, workoutStats, stepHistory, diaryHistory, workoutDates]);
    const primaryMission = missionPlan?.missions?.[0] || null;
    const assistantMessage = useMemo(() => {
        if (isAiThinking && !aiCoach?.message) {
            return 'Your coach is reading today\'s nutrition, training, and recovery signals.';
        }

        return aiCoach?.message
            || primaryMission?.title
            || 'Log one honest meal and the coach can tighten the rest of today.';
    }, [aiCoach, primaryMission, isAiThinking]);
    const assistantSupportingNote = useMemo(() => {
        if (isAiThinking && !aiCoach?.supportingNote) {
            return 'Pulling in your latest intake, steps, hydration, and workout data.';
        }

        return aiCoach?.supportingNote
            || missionPlan?.summary
            || 'The coach updates when your logged food, movement, or recovery pattern changes.';
    }, [aiCoach, missionPlan, isAiThinking]);
    const assistantToneKey = aiCoach?.tone || 'primary';
    const assistantTone = useMemo(() => getMissionTone(assistantToneKey, colors), [assistantToneKey, colors]);
    const assistantAction = useMemo(() => {
        const action = aiCoach?.action;
        return action?.ctaType && action.ctaType !== 'none' ? action : null;
    }, [aiCoach]);
    const assistantFoodSuggestion = useMemo(() => {
        const suggestion = aiCoach?.foodSuggestion;
        return suggestion?.name ? suggestion : null;
    }, [aiCoach]);
    const assistantCoachLabel = isAiThinking ? 'Coach is updating' : 'Nutrition coach';

    const navigateDashboardTarget = useCallback((target) => {
        if (!target?.routeName) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        if (target.routeScope === 'stack') {
            const parentNav = nav.getParent ? nav.getParent() : null;
            if (parentNav) {
                parentNav.navigate(target.routeName);
                return;
            }
        }

        nav.navigate(target.routeName);
    }, [nav]);

    const handleAssistantFoodAdd = useCallback(async (food, slot = 'snacks') => {
        if (!food) return;

        await addFoodToDiary(localDateKey(new Date()), slot, food);
        setAssistantFoodModalVisible(false);
        setAssistantStatusNote(`Logged ${food.name}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await loadData();
    }, [loadData]);

    const handleAssistantSectionAction = useCallback(async (section) => {
        if (!section?.ctaType || section.ctaType === 'none') return;

        switch (section.ctaType) {
            case 'open-add-food':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAssistantFoodModalVisible(true);
                return;
            case 'open-diary':
                navigateDashboardTarget({ routeName: 'Diary', routeScope: 'tab' });
                return;
            case 'log-water-500':
                await handleWaterAdd(500);
                setAssistantStatusNote('Hydration logged');
                return;
            case 'open-workout':
                navigateDashboardTarget({ routeName: 'Workout', routeScope: 'tab' });
                return;
            case 'open-activity':
                navigateDashboardTarget({ routeName: 'ActivityCalendar', routeScope: 'stack' });
                return;
            case 'open-sleep':
                navigateDashboardTarget({ routeName: 'Sleep', routeScope: 'stack' });
                return;
            case 'open-mission':
                navigateDashboardTarget({ routeName: 'MissionCenter', routeScope: 'stack' });
                return;
            default:
                return;
        }
    }, [handleWaterAdd, navigateDashboardTarget]);

    useEffect(() => {
        const awardDailyMissionRewards = async () => {
            const todayKey = localDateKey(new Date());
            for (const mission of missionPlan?.missions || []) {
                if (mission.completed) {
                    await awardMissionXPIfEligible('daily', `${mission.id}_${todayKey}`, XP_AMOUNTS.DAILY_MISSION_COMPLETED);
                }
            }
        };

        awardDailyMissionRewards();
    }, [missionPlan]);

    const actionTiles = useMemo(() => {
        const completedMissions = (missionPlan?.missions || []).filter((mission) => mission.completed).length;
        return [
            {
                id: 'sleep',
                title: 'Sleep',
                subtitle: 'Recovery insights',
                icon: 'bedtime',
                onPress: () => navigateDashboardTarget({ routeName: 'Sleep', routeScope: 'stack' }),
            },
            {
                id: 'recent',
                title: 'Recent Workouts',
                subtitle: recentWorkouts.length ? `${recentWorkouts.length} logged` : 'Open history',
                icon: 'history',
                onPress: () => navigateDashboardTarget({ routeName: 'WorkoutHistory', routeScope: 'stack' }),
            },
            {
                id: 'friends',
                title: 'Friends',
                subtitle: leaderboard.length > 2 ? `${leaderboard.length - 2} in circle` : 'Manage circle',
                icon: 'groups',
                onPress: () => navigateDashboardTarget({ routeName: 'Friends', routeScope: 'stack' }),
            },
            {
                id: 'missions',
                title: 'Missions',
                subtitle: `${completedMissions}/${missionPlan?.missions?.length || 0} done today`,
                icon: 'flag',
                onPress: () => navigateDashboardTarget({ routeName: 'MissionCenter', routeScope: 'stack' }),
            },
        ];
    }, [leaderboard.length, missionPlan, navigateDashboardTarget, recentWorkouts.length]);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                {...previewAutoScroll}
                style={[styles.container, { paddingTop: insets.top }]}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<StyledRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {celebrating && <ConfettiCannon count={60} origin={{ x: 180, y: 0 }} fadeOut />}
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{getGreeting().toUpperCase()}</Text>
                    <Text style={styles.userName}>{userName || settings.userName}</Text>
                </View>
                <View style={styles.avatar}>
                    {profileImg ? (
                        <Image source={{ uri: profileImg }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                    ) : (
                        <MaterialIcons name="person" size={20} color={colors.textSecondary} />
                    )}
                    <View style={styles.statusDot} />
                </View>
            </View>

            {/* Step Ring Hero */}
            <View style={styles.stepSection}>
                <Text style={{ position: 'absolute', top: 15, right: 15, fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold', color: colors.textSecondary, opacity: 0.7, zIndex: 10 }}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <StepRing steps={steps} goal={settings.stepGoal || stepGoal} colors={colors} />
                <View style={[styles.heroStatusPill, { backgroundColor: stepSource ? colors.primaryDim : colors.surface }]}>
                    <MaterialIcons name={stepSource ? 'watch' : 'directions-walk'} size={12} color={stepSource ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.heroStatusText, { color: stepSource ? colors.primary : colors.textSecondary }]}>{stepSyncMessage}</Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{workoutStats.caloriesBurned}</Text>
                        <Text style={styles.statLabel}>KCAL</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{distance}</Text>
                        <Text style={styles.statLabel}>KM</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{workoutStats.totalMinutes}</Text>
                        <Text style={styles.statLabel}>MIN</Text>
                    </View>
                </View>
            </View>

            <WeeklyStepsCard history={weeklySteps} goal={settings.stepGoal || stepGoal} colors={colors} nav={nav} />

            {/* Mini Leaderboard Widget */}
            {leaderboard.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('friendsLeaderboard')}</Text>
                        <TouchableOpacity onPress={() => nav.getParent()?.navigate('Leaderboard')}>
                            <Text style={styles.seeMore}>{t('seeMore')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.lbCard}>
                        <View style={styles.inlineStatusRow}>
                            <View style={styles.inlineStatusPill}>
                                <MaterialIcons name="emoji-events" size={12} color={colors.primary} />
                                <Text style={styles.inlineStatusText}>Top movers this week</Text>
                            </View>
                        </View>
                        {leaderboard.slice(0, 3).map((entry, i) => (
                            <LeaderboardRow
                                key={i}
                                entry={entry}
                                index={i}
                                totalCount={leaderboard[0]?.steps || 0}
                                colors={colors}
                                t={t}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Nutrition Coach */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('aiNutritionAssistant')}</Text>
                </View>
                <View style={styles.aiCard}>
                    {isAiThinking && !aiCoach?.message ? (
                        <View style={styles.assistantLoadingState}>
                            <LoadingPulseBlock colors={colors} style={{ width: 110, height: 12, borderRadius: 999 }} />
                            <LoadingPulseBlock colors={colors} style={{ width: '100%', height: 68, borderRadius: 18 }} />
                            <LoadingPulseBlock colors={colors} style={{ width: '82%', height: 28, borderRadius: 14 }} />
                        </View>
                    ) : (
                        <>
                            <Text style={[styles.assistantEyebrow, { color: assistantTone.badgeText }]}>{assistantCoachLabel}</Text>
                            <View style={styles.assistantSummaryBlock}>
                                <View style={styles.aiRow}>
                                    <View style={[styles.aiIconBox, { backgroundColor: assistantTone.iconBg }]}>
                                        <MaterialIcons name="tips-and-updates" size={18} color={assistantTone.iconColor} />
                                    </View>
                                    <View style={styles.assistantSummaryCopy}>
                                        <Text style={styles.assistantHeadline}>{assistantMessage}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.assistantSupportBlock}>
                                <Text style={styles.assistantSupportLabel}>Coach read</Text>
                                <Text style={styles.assistantReason}>{assistantSupportingNote}</Text>
                            </View>
                            {assistantFoodSuggestion ? (
                                <View style={styles.assistantSuggestionCard}>
                                    <Text style={styles.assistantSuggestionEyebrow}>Suggested move</Text>
                                    <Text style={styles.assistantSuggestionName}>{assistantFoodSuggestion.name}</Text>
                                    <Text style={styles.assistantSuggestionMeta}>
                                        {Math.round(assistantFoodSuggestion.protein || 0)}g protein - {Math.round(assistantFoodSuggestion.calories || 0)} kcal
                                    </Text>
                                    {assistantFoodSuggestion.reason ? (
                                        <Text style={styles.assistantSuggestionReason}>{assistantFoodSuggestion.reason}</Text>
                                    ) : null}
                                </View>
                            ) : null}
                            {assistantAction ? (
                                <View style={styles.assistantActionRow}>
                                    <TouchableOpacity
                                        style={styles.assistantActionLink}
                                        onPress={() => handleAssistantSectionAction(assistantAction)}
                                    >
                                        <Text style={[styles.assistantActionText, { color: assistantTone.actionText }]}>
                                            {assistantAction.ctaLabel}
                                        </Text>
                                        <MaterialIcons name="east" size={14} color={assistantTone.actionText} />
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                            {assistantStatusNote ? (
                                <View style={styles.assistantNoticePill}>
                                    <MaterialIcons name="check-circle" size={12} color={colors.green500} />
                                    <Text style={styles.assistantNoticeText}>{assistantStatusNote}</Text>
                                </View>
                            ) : null}
                        </>
                    )}
                </View>
            </View>

            <AddFoodModal
                visible={assistantFoodModalVisible}
                onClose={() => setAssistantFoodModalVisible(false)}
                onAdd={handleAssistantFoodAdd}
                mealType="snacks"
            />

            {/* Hydration Tracker (QoL) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Hydration</Text>
                    <Text style={[styles.viewAll, { color: colors.slate400 }]}>{water}ml / {hydrationGoal}ml</Text>
                </View>
                <View style={styles.waterCard}>
                    <View style={styles.waterTopRow}>
                        <View style={styles.waterInfo}>
                            <View style={styles.waterIconBox}>
                                <MaterialCommunityIcons name="water" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.waterCopy}>
                                <Text style={styles.waterTitle}>Keep Flowing</Text>
                                <Text style={styles.waterSubtitle}>{hydrationTone} - quick tap to log hydration</Text>
                            </View>
                        </View>
                        <View style={styles.waterActions}>
                            <TouchableOpacity style={styles.waterBtn} onPress={() => handleWaterAdd(-250)}>
                                <Text style={styles.waterBtnText}>-250</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.waterBtn} onPress={() => handleWaterAdd(500)}>
                                <Text style={styles.waterBtnText}>+500</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.hydrationProgressTrack}>
                        <View style={[styles.hydrationProgressFill, { width: `${hydrationProgress * 100}%` }]} />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Access</Text>
                </View>
                <View style={styles.actionGrid}>
                    {actionTiles.map((tile) => (
                        <TouchableOpacity
                            key={tile.id}
                            style={styles.actionTile}
                            activeOpacity={0.88}
                            onPress={tile.onPress}
                        >
                            <View style={styles.actionTileIcon}>
                                <MaterialIcons name={tile.icon} size={22} color={colors.primary} />
                            </View>
                            <Text style={styles.actionTileTitle}>{tile.title}</Text>
                            <Text style={styles.actionTileSubtitle}>{tile.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

        </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark = false) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
    },
    content: {
        paddingBottom: 200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    greeting: {
        color: colors.primary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        letterSpacing: 2,
    },
    userName: {
        color: colors.text,
        fontSize: 24,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: -0.5,
        marginTop: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.bgDark,
    },

    // Step section
    stepSection: {
        alignItems: 'center',
        paddingVertical: 32,
        marginHorizontal: 24,
        marginTop: 8,
        borderRadius: 24,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        gap: 16,
    },
    heroStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
    },
    heroStatusText: {
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    statValue: {
        color: colors.primary,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },
    statLabel: {
        color: colors.slate400,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        letterSpacing: 1,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: colors.slate800,
    },

    // Sections
    section: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    viewAll: {
        color: colors.primary,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    aiBadge: {
        backgroundColor: colors.primaryDim,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    aiBadgeText: {
        color: colors.primary,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
    },

    // Daily Missions
    missionHeaderBadge: {
        backgroundColor: colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
    },
    missionHeaderBadgeText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    missionCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    missionHeadline: {
        color: colors.text,
        fontSize: 17,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 6,
    },
    missionSummary: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
        marginBottom: 14,
    },
    missionList: {
        gap: 12,
    },
    missionItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        backgroundColor: colors.surfaceAlt,
    },
    missionIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    missionBody: {
        flex: 1,
    },
    missionTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        gap: 10,
    },
    missionEyebrow: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    missionStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    missionStatusBadgeText: {
        fontSize: 9,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 0.8,
    },
    missionTitle: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 4,
    },
    missionSubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
    },
    missionMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        marginBottom: 8,
    },
    missionProgressLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        flex: 1,
    },
    missionActionText: {
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    missionTrack: {
        height: 7,
        borderRadius: 999,
        overflow: 'hidden',
    },
    missionFill: {
        height: '100%',
        borderRadius: 999,
    },
    aiMissionSection: {
        marginTop: 12,
    },
    missionBadgeRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    missionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    missionBadgeText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        textTransform: 'uppercase',
    },
    aiMissionLauncher: {
        marginTop: 2,
    },
    missionButton: {
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'stretch',
        gap: 8,
    },
    missionButtonTitle: {
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },
    missionButtonLabel: {
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        color: '#fff',
    },
    missionCTAtext: {
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    assistantChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    assistantChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    assistantChipText: {
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bgCard,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '70%',
    },
    missionModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    missionModalTitle: {
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: colors.text,
    },
    missionModalList: {
        paddingBottom: 24,
    },

    // Rescue Mode
    rescueHeaderBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    rescueHeaderBadgeText: {
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    rescueCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    rescueTitle: {
        color: colors.text,
        fontSize: 17,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 6,
    },
    rescueSubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
        marginBottom: 14,
    },
    rescueActionList: {
        gap: 10,
    },
    rescueActionCard: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        backgroundColor: colors.surfaceAlt,
    },
    rescueActionIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rescueActionBody: {
        flex: 1,
    },
    rescueActionTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    rescueActionTitle: {
        color: colors.text,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
        flex: 1,
    },
    rescueActionDetail: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
    },
    rescuePrimaryPill: {
        backgroundColor: colors.bgCard,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    rescuePrimaryPillText: {
        color: colors.text,
        fontSize: 9,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 0.8,
    },

    // Pattern Intelligence
    patternHeaderBadge: {
        backgroundColor: colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
    },
    patternHeaderBadgeText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    patternCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    patternHeadline: {
        color: colors.text,
        fontSize: 17,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 6,
    },
    patternSummary: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
        marginBottom: 14,
    },
    patternList: {
        gap: 12,
    },
    patternItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
    },
    patternIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    patternBody: {
        flex: 1,
    },
    patternTitle: {
        color: colors.text,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 4,
    },
    patternDetail: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
        marginBottom: 8,
    },
    patternActionText: {
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },

    // AI Card
    aiCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 2.5,
        borderLeftColor: colors.primary,
        ...ELEVATION.card,
    },
    assistantHeaderLink: {
        color: colors.primary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    assistantLoadingState: {
        gap: 12,
    },
    assistantEyebrow: {
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 0.9,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    assistantSummaryBlock: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
    },
    aiRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    aiIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.primaryMid,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    assistantSummaryCopy: {
        flex: 1,
    },
    assistantHeadline: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
        lineHeight: 22,
    },
    assistantSupportBlock: {
        paddingHorizontal: 2,
        marginBottom: 2,
    },
    assistantSupportLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    assistantReason: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 18,
    },
    assistantSuggestionCard: {
        marginTop: 12,
        backgroundColor: colors.surfaceAlt,
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    assistantSuggestionEyebrow: {
        color: colors.primary,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    assistantSuggestionName: {
        color: colors.text,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 4,
    },
    assistantSuggestionMeta: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    assistantSuggestionReason: {
        color: colors.textMuted,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 16,
        marginTop: 6,
    },
    assistantActionRow: {
        marginTop: 12,
        alignItems: 'flex-start',
    },
    assistantActionLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    assistantActionText: {
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    assistantNoticePill: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: colors.greenBg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    assistantNoticeText: {
        color: colors.green500,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionTile: {
        width: '48%',
        minHeight: 118,
        backgroundColor: colors.bgCard,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    actionTileIcon: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: colors.primaryDim,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    actionTileTitle: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 6,
    },
    actionTileSubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        lineHeight: 17,
    },
    aiSnackRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    aiSnackCard: {
        flex: 1,
        backgroundColor: colors.bgDark,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    aiSnackLabel: {
        color: colors.primary,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 4,
    },
    aiSnackName: {
        color: colors.text,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        marginBottom: 4,
    },
    aiSnackMeta: {
        color: colors.slate500,
        fontSize: 9,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    sleepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        },
    sleepIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sleepTextCol: {
        flex: 1,
    },
    sleepTitle: {
        color: colors.text,
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 2,
    },
    sleepSubtitle: {
        color: colors.slate500,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
    },

    // Water Card
    waterCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        gap: 10,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    waterTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    waterInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
    waterIconBox: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '15',
        alignItems: 'center', justifyContent: 'center'
    },
    waterCopy: { flex: 1, minWidth: 0 },
    waterTitle: { color: colors.text, fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
    waterSubtitle: { color: colors.slate500, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium' },
    waterActions: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
    waterBtn: {
        backgroundColor: colors.primaryDim,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 12, borderWidth: 1, borderColor: colors.border
    },
    waterBtnText: { color: colors.primary, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
    hydrationProgressTrack: {
        marginTop: 10,
        height: 8,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surfaceAlt,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    hydrationProgressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: isDark ? '#4dd7ff' : colors.primary,
    },

    // Workouts
    workoutList: {
        gap: 12,
    },
    emptyCard: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.borderLight,
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Mini Leaderboard
    seeMore: { color: colors.primary, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    lbCard: {
        backgroundColor: colors.bgCard, borderRadius: 16, padding: 12,
        borderWidth: 1, borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    inlineStatusRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignSelf: 'stretch',
    },
    inlineStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flex: 1,
    },
    inlineStatusText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
        textAlign: 'center',
        flexShrink: 1,
    },
    lbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    lbRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    lbMedal: { fontSize: 18, width: 28, textAlign: 'center' },
    lbRankBadge: {
        width: 28, height: 28, borderRadius: 14,
        borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    lbRankText: { fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
    lbAvatar: {
        width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },
    lbName: { color: colors.text, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 3 },
    lbBarBg: { height: 5, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
    lbBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    lbSteps: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold', fontVariant: ['tabular-nums'], width: 40, textAlign: 'right' },
});




