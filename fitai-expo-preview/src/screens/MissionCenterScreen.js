import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme, ELEVATION } from '../theme';
import { useActivityData } from '../contexts/ActivityDataContext';
import {
    calcMacroTotals,
    calcWorkoutTotals,
    getMeals,
    getSettings,
    getWorkouts,
    getTodaysMeals,
    getTodaysWorkouts,
    getUserProfile,
    getWaterHistoryForDates,
} from '../services/storage';
import { getMissionCenterPlan } from '../services/dailyMissions';
import { awardMissionXPIfEligible } from '../services/leveling';

function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCurrentMonthKeys(fromDate = new Date()) {
    const date = fromDate instanceof Date ? fromDate : new Date(fromDate);
    const keys = [];
    for (let day = 1; day <= date.getDate(); day += 1) {
        keys.push(localDateKey(new Date(date.getFullYear(), date.getMonth(), day)));
    }
    return keys;
}

const TABS = ['daily', 'monthly'];

export default function MissionCenterScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();
    const { stepHistory, diaryHistory, workoutDates, stepGoal, fetchMonthData } = useActivityData();
    const [selectedTab, setSelectedTab] = useState('daily');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [settings, setSettingsState] = useState(null);
    const [intake, setIntake] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [workoutStats, setWorkoutStats] = useState({ caloriesBurned: 0, totalMinutes: 0 });
    const [waterHistory, setWaterHistory] = useState({});
    const [monthHydrated, setMonthHydrated] = useState(false);

    const loadMissionData = useCallback(async () => {
        setLoading(true);
        const now = new Date();
        try {
            await fetchMonthData(now.getFullYear(), now.getMonth());

            const [nextProfile, nextSettings, meals, workouts, nextWaterHistory] = await Promise.all([
                getUserProfile(),
                getSettings(),
                getMeals(),
                getWorkouts(),
                getWaterHistoryForDates(buildCurrentMonthKeys(now)),
            ]);

            setProfile(nextProfile || {});
            setSettingsState(nextSettings || {});
            setIntake(calcMacroTotals(getTodaysMeals(meals || [])));
            setWorkoutStats(calcWorkoutTotals(getTodaysWorkouts(workouts || [])));
            setWaterHistory(nextWaterHistory || {});
            setMonthHydrated(true);
        } catch (error) {
            console.error('Mission center load error:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchMonthData]);

    useFocusEffect(useCallback(() => {
        loadMissionData();
    }, [loadMissionData]));

    const missionPlan = useMemo(() => {
        if (!monthHydrated || !settings) return null;

        const todayKey = localDateKey(new Date());
        const currentWater = waterHistory?.[todayKey] || 0;

        return getMissionCenterPlan({
            now: new Date(),
            steps: stepHistory?.[todayKey] || 0,
            stepGoal,
            water: currentWater,
            hydrationGoal: 2500,
            intake,
            settings,
            profile: profile || {},
            workoutStats,
            stepHistory,
            diaryHistory,
            workoutDates,
            waterHistory,
        });
    }, [monthHydrated, settings, waterHistory, intake, workoutStats, stepHistory, diaryHistory, workoutDates, stepGoal, profile]);

    useEffect(() => {
        if (!missionPlan) return;

        const maybeAwardMissions = async () => {
            const allMissions = [...missionPlan.dailyMissions, ...missionPlan.monthlyMissions];
            for (const mission of allMissions) {
                if (mission.completed) {
                    await awardMissionXPIfEligible(mission.period, mission.rewardKey, mission.rewardXp);
                }
            }
        };

        maybeAwardMissions();
    }, [missionPlan]);

    const visibleMissions = selectedTab === 'daily'
        ? missionPlan?.dailyMissions || []
        : missionPlan?.monthlyMissions || [];

    const selectedSummary = selectedTab === 'daily'
        ? missionPlan?.summaries?.daily
        : missionPlan?.summaries?.monthly;

    const navigateMission = useCallback((mission) => {
        if (!mission?.routeName) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        if (mission.routeScope === 'tab') {
            navigation.navigate('Tabs', { screen: mission.routeName });
            return;
        }

        navigation.navigate(mission.routeName);
    }, [navigation]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mission Center</Text>
                <View style={styles.iconBtnPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>GUIDED MOMENTUM</Text>
                    <Text style={styles.heroTitle}>Daily wins, monthly follow-through</Text>
                    <Text style={styles.heroSubtitle}>
                        Missions adapt to your goal, logging habits, weekly gym target, and recovery rhythm.
                    </Text>
                    <View style={styles.tabRow}>
                        {TABS.map((tab) => {
                            const selected = tab === selectedTab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tabButton, selected && styles.tabButtonActive]}
                                    onPress={() => setSelectedTab(tab)}
                                >
                                    <Text style={[styles.tabButtonText, selected && styles.tabButtonTextActive]}>
                                        {tab === 'daily' ? 'Daily' : 'Monthly'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {selectedSummary ? (
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryPill}>
                                <Text style={styles.summaryPillText}>
                                    {selectedSummary.completedCount}/{selectedSummary.totalCount} complete
                                </Text>
                            </View>
                            <View style={styles.summaryPill}>
                                <Text style={styles.summaryPillText}>
                                    {selectedSummary.totalRewardXp} XP in play
                                </Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {loading && !missionPlan ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator color={colors.primary} size="large" />
                        <Text style={styles.loadingText}>Loading your missions</Text>
                    </View>
                ) : (
                    <View style={styles.missionList}>
                        {visibleMissions.map((mission) => (
                            <TouchableOpacity
                                key={`${mission.period}-${mission.rewardKey}`}
                                activeOpacity={0.9}
                                style={styles.missionCard}
                                onPress={() => navigateMission(mission)}
                            >
                                <View style={styles.missionTopRow}>
                                    <View style={styles.missionIconBox}>
                                        <MaterialIcons name={mission.icon} size={18} color={colors.primary} />
                                    </View>
                                    <View style={styles.missionBody}>
                                        <View style={styles.missionHeaderRow}>
                                            <Text style={styles.missionEyebrow}>{mission.eyebrow}</Text>
                                            <View style={[styles.statusBadge, mission.completed && styles.statusBadgeComplete]}>
                                                <Text style={[styles.statusBadgeText, mission.completed && styles.statusBadgeTextComplete]}>
                                                    {mission.completed ? 'Done' : 'Live'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.missionTitle}>{mission.title}</Text>
                                        <Text style={styles.missionSubtitle}>{mission.subtitle}</Text>
                                    </View>
                                </View>
                                <View style={styles.missionMetaRow}>
                                    <Text style={styles.missionProgress}>{mission.progressLabel}</Text>
                                    <Text style={styles.missionReward}>{mission.rewardXp} XP</Text>
                                </View>
                                <View style={styles.progressTrack}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${Math.max(mission.completed ? 100 : 6, Math.round((mission.progress || 0) * 100))}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.missionCta}>{mission.ctaLabel}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    iconBtnPlaceholder: {
        width: 38,
        height: 38,
    },
    headerTitle: {
        color: colors.text,
        fontSize: 20,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 24,
        backgroundColor: colors.bgCard,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        ...ELEVATION.card,
    },
    heroEyebrow: {
        color: colors.primary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    heroTitle: {
        color: colors.text,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'SpaceGrotesk_500Medium',
        marginTop: 10,
    },
    tabRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
    },
    tabButton: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tabButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabButtonText: {
        color: colors.text,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    tabButtonTextActive: {
        color: colors.bgDark,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    summaryPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryPillText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    loadingState: {
        marginTop: 36,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    missionList: {
        marginTop: 22,
        gap: 14,
    },
    missionCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...ELEVATION.card,
    },
    missionTopRow: {
        flexDirection: 'row',
        gap: 12,
    },
    missionIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDim,
    },
    missionBody: {
        flex: 1,
    },
    missionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    missionEyebrow: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    statusBadgeComplete: {
        backgroundColor: colors.primaryDim,
        borderColor: colors.primaryDim,
    },
    statusBadgeText: {
        color: colors.primary,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    statusBadgeTextComplete: {
        color: colors.primary,
    },
    missionTitle: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 20,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 4,
    },
    missionSubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    missionMetaRow: {
        marginTop: 14,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    missionProgress: {
        flex: 1,
        color: colors.textMuted,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    missionReward: {
        color: colors.primary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    progressTrack: {
        height: 7,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: colors.primary,
    },
    missionCta: {
        marginTop: 10,
        color: colors.primary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
});
