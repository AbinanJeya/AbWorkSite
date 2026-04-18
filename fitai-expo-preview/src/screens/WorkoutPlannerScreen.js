import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Modal, Share, Animated, PanResponder
} from 'react-native';
import { StyledRefreshControl, RefreshOverlay } from '../components/CustomRefreshControl';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import RoutineReorderList from '../components/RoutineReorderList';
import {
    getRoutines,
    deleteRoutine,
    getWorkouts,
    getWorkoutHistory,
    getWorkoutStreakStatus,
    saveRoutineOrder,
    saveRoutines,
    getExerciseHistory,
    getSettings,
} from '../services/storage';
import { awardWeeklyWorkoutTargetBonusIfEligible } from '../services/leveling';
import { fetchWorkoutsData } from '../services/health';
import { useWorkout } from '../contexts/WorkoutContext';

import { useTranslation, getMonthNames } from '../services/i18n';
import { usePreviewAutoScroll } from '../preview/PreviewAutoDemo';
const DAYS_HEADER = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const ROUTINE_ICONS = [
    { lib: MaterialCommunityIcons, name: 'dumbbell' },
    { lib: MaterialIcons, name: 'fitness-center' },
    { lib: MaterialIcons, name: 'directions-run' },
    { lib: MaterialCommunityIcons, name: 'arm-flex' },
];

const ACTION_SHEET_DRAG_THRESHOLD = 6;
const ACTION_SHEET_CLOSE_DISTANCE = 90;
const ACTION_SHEET_CLOSE_VELOCITY = 1.1;

export default function WorkoutPlannerScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const previewAutoScroll = usePreviewAutoScroll('Workout', {
        demoOffset: 300,
        demoRatio: 0.66,
        type: 'flatlist',
    });

    const tMonthNames = getMonthNames(t);
    const tDaysHeader = [t('sun').slice(0, 2).toUpperCase(), t('mon').slice(0, 2).toUpperCase(), t('tue').slice(0, 2).toUpperCase(), t('wed').slice(0, 2).toUpperCase(), t('thu').slice(0, 2).toUpperCase(), t('fri').slice(0, 2).toUpperCase(), t('sat').slice(0, 2).toUpperCase()];
    const [routines, setRoutines] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [workoutDates, setWorkoutDates] = useState(new Set());

    const now = new Date();
    const [calMonth, setCalMonth] = useState(now.getMonth());
    const [calYear, setCalYear] = useState(now.getFullYear());
    const [workoutStreak, setWorkoutStreak] = useState(0);
    const [workoutStreakStatus, setWorkoutStreakStatus] = useState({
        currentWeekCount: 0,
        currentWeekTarget: 3,
        currentWeekMet: false,
    });
    const [restStreak, setRestStreak] = useState(0);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [startBlockedTarget, setStartBlockedTarget] = useState(null);

    // Today for calendar highlight
    const todayDay = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();

    const loadData = useCallback(async () => {
        try {
            await awardWeeklyWorkoutTargetBonusIfEligible();
            const [r, allWorkouts, history, s] = await Promise.all([
                getRoutines(), 
                getWorkouts(), 
                getWorkoutHistory(),
                getSettings()
            ]);

            setRoutines(r);
            setSelectedRoutineIds((previous) => {
                const next = new Set((r || []).map((routine) => routine.id));
                return new Set([...previous].filter((id) => next.has(id)));
            });
            
            const dates = new Set();
            // From workout log (timestamp field)
            (allWorkouts || []).forEach(w => {
                if (w.timestamp) dates.add(w.timestamp.slice(0, 10));
            });
            // From workout history (startedAt / finishedAt fields)
            (history || []).forEach(w => {
                if (w.startedAt) dates.add(w.startedAt.slice(0, 10));
                if (w.finishedAt) dates.add(w.finishedAt.slice(0, 10));
            });

            // Fetch Health Connect and merge into Dates to keep calendar & streaks alive
            const conn = s.wearableConnections?.health_connect;
            if (typeof conn === 'object' && conn.syncWorkouts) {
                const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
                const endWindow = new Date();
                const startWindow = new Date();
                startWindow.setMonth(startWindow.getMonth() - 2); // 2 months lookup for streak continuity
                const hcWorkouts = await fetchWorkoutsData(startWindow, endWindow) || [];

                // Build local timestamps for dedup
                const localTimestamps = (history || [])
                    .map(w => new Date(w.startedAt || w.finishedAt || 0).getTime())
                    .filter(t => t > 0);

                hcWorkouts.forEach(hc => {
                    const hcMs = new Date(hc.startTime).getTime();
                    const isDuplicate = localTimestamps.some(localMs => Math.abs(localMs - hcMs) < TWO_HOURS_MS);
                    if (!isDuplicate) {
                        dates.add(hc.startTime.slice(0, 10));
                    }
                });
            }

            setWorkoutDates(dates);
            const streakStatus = await getWorkoutStreakStatus();
            setWorkoutStreak(streakStatus.streak);
            setWorkoutStreakStatus(streakStatus);

            // Compute daily rest streak (days backwards with 0 workouts)
            let rStreak = 0;
            const formatDate = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            
            if (dates.size === 0) {
                // If there are literally no workouts ever, rest streak is meaningless
                setRestStreak(0);
            } else {
                const rCursor = new Date();
                rCursor.setHours(0, 0, 0, 0); // Ignore time differences
                
                while (rStreak < 365) { // Cap at 1 year so we don't infinitely loop
                    if (!dates.has(formatDate(rCursor))) {
                        rStreak++;
                        rCursor.setDate(rCursor.getDate() - 1);
                    } else {
                        break;
                    }
                }
                setRestStreak(rStreak);
            }

        } catch (err) {
            console.error('Routines load error:', err);
        }
    }, []);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionTarget, setActionTarget] = useState(null);
    const [selectedRoutineIds, setSelectedRoutineIds] = useState(new Set());
    const [expandedRoutineIds, setExpandedRoutineIds] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const queuedRoutineOrderVersionRef = useRef(0);
    const routineOrderSaveChainRef = useRef(Promise.resolve());
    const actionSheetTranslateY = useRef(new Animated.Value(0)).current;

    const queueRoutineOrderSave = useCallback((nextRoutines) => {
        queuedRoutineOrderVersionRef.current += 1;
        const saveVersion = queuedRoutineOrderVersionRef.current;
        const routineIds = nextRoutines.map((routine) => routine.id);

        routineOrderSaveChainRef.current = routineOrderSaveChainRef.current
            .catch(() => {})
            .then(async () => {
                if (saveVersion < queuedRoutineOrderVersionRef.current) return;
                await saveRoutineOrder(routineIds);
            })
            .catch((error) => {
                console.error('Routine reorder save error:', error);
            });
    }, []);

    const flushRoutineOrderSave = useCallback(async () => {
        try {
            await routineOrderSaveChainRef.current;
        } catch (error) {
            console.error('Routine reorder flush error:', error);
        }
    }, []);

    const closeActionSheet = useCallback((onClosed) => {
        Animated.timing(actionSheetTranslateY, {
            toValue: 320,
            duration: 180,
            useNativeDriver: true,
        }).start(() => {
            setActionTarget(null);
            if (onClosed) onClosed();
        });
    }, [actionSheetTranslateY]);

    const openActionSheet = useCallback((routine) => {
        actionSheetTranslateY.stopAnimation(() => {
            actionSheetTranslateY.setOffset(0);
            actionSheetTranslateY.setValue(320);
            setActionTarget(routine);
        });
    }, [actionSheetTranslateY]);

    useFocusEffect(useCallback(() => {
        void loadData();

        return () => {
            void flushRoutineOrderSave();
        };
    }, [loadData, flushRoutineOrderSave]));

    useEffect(() => () => {
        void flushRoutineOrderSave();
    }, [flushRoutineOrderSave]);

    useEffect(() => {
        if (!actionTarget) return;

        const frameId = requestAnimationFrame(() => {
            Animated.spring(actionSheetTranslateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 90,
                friction: 12,
            }).start();
        });

        return () => cancelAnimationFrame(frameId);
    }, [actionTarget, actionSheetTranslateY]);

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const handleRoutineOrderChange = useCallback((nextRoutines) => {
        setRoutines(nextRoutines);
        queueRoutineOrderSave(nextRoutines);
    }, [queueRoutineOrderSave]);

    const handleDelete = (id, name) => {
        setDeleteTarget({ id, name });
    };

    const toggleRoutineSelection = useCallback((routineId) => {
        setIsSelectionMode(true);
        setSelectedRoutineIds((previous) => {
            const next = new Set(previous);
            if (next.has(routineId)) next.delete(routineId);
            else next.add(routineId);
            return next;
        });
    }, []);

    const clearRoutineSelection = useCallback(() => {
        setSelectedRoutineIds(new Set());
        setIsSelectionMode(false);
    }, []);

    const toggleRoutineExpanded = useCallback((routineId) => {
        setExpandedRoutineIds((previous) => {
            const next = new Set(previous);
            if (next.has(routineId)) next.delete(routineId);
            else next.add(routineId);
            return next;
        });
    }, []);

    const toggleReorderMode = useCallback(async () => {
        if (isReorderMode) {
            await flushRoutineOrderSave();
            setIsReorderMode(false);
            return;
        }

        setActionTarget(null);
        clearRoutineSelection();
        setIsReorderMode(true);
    }, [clearRoutineSelection, flushRoutineOrderSave, isReorderMode]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedRoutineIds.size === 0) return;
        const selectedRoutines = routines.filter((routine) => selectedRoutineIds.has(routine.id));
        setDeleteTarget({
            ids: selectedRoutines.map((routine) => routine.id),
            count: selectedRoutines.length,
            multi: true,
        });
    }, [routines, selectedRoutineIds]);

    const confirmDelete = useCallback(async () => {
        if (deleteTarget) {
            await flushRoutineOrderSave();
            if (deleteTarget.multi) {
                await Promise.all((deleteTarget.ids || []).map((id) => deleteRoutine(id)));
                clearRoutineSelection();
            } else {
                await deleteRoutine(deleteTarget.id);
            }
            await loadData();
        }
        setDeleteTarget(null);
    }, [clearRoutineSelection, deleteTarget, flushRoutineOrderSave, loadData]);

    const workoutCtx = useWorkout();

    const handleStartWorkout = async (routine) => {
        if (workoutCtx.activeWorkout) {
            setStartBlockedTarget({
                activeName: workoutCtx.activeWorkout.routine?.name || 'Workout',
                nextName: routine.name,
            });
            return;
        }

        const exerciseLogs = await Promise.all((routine.exercises || []).map(async (ex) => {
            // Fetch last session's data for smart defaults
            const hist = await getExerciseHistory(ex.name);
            const numSets = ex.sets || 3;
            return {
                name: ex.name,
                muscleGroup: ex.muscleGroup || '',
                equipment: ex.equipment || '',
                weightUnit: 'kg',
                restMin: '1',
                restSec: '30',
                bestWeight: hist.bestWeight,
                bestE1RM: hist.bestE1RM,
                sets: Array.isArray(ex.sets) 
                    ? ex.sets.map((s, i) => {
                        const lastSet = hist.lastSets[i] || hist.lastSets[hist.lastSets.length - 1];
                        const defWeight = s.weight || lastSet?.weight || ex.weight || '';
                        const defReps = s.reps || lastSet?.reps || ex.reps || '12';
                        const prevStr = lastSet ? `${lastSet.weight}${lastSet.weightUnit || 'kg'} x ${lastSet.reps}` : '';
                        return {
                            id: `${Date.now()}-${i}-${Math.random()}`,
                            setNum: i + 1,
                            weight: defWeight,
                            reps: defReps,
                            prev: prevStr,
                            completed: false,
                        };
                    })
                    : Array.from({ length: numSets }, (_, i) => {
                        const lastSet = hist.lastSets[i] || hist.lastSets[hist.lastSets.length - 1];
                        const defWeight = lastSet?.weight || ex.weight || '';
                        const defReps = lastSet?.reps || ex.reps || '12';
                        const prevStr = lastSet ? `${lastSet.weight}${lastSet.weightUnit || 'kg'} x ${lastSet.reps}` : (ex.weight ? `${ex.weight}${ex.weightUnit || 'kg'} x ${ex.reps || '12'}` : '');
                        return {
                            id: `${Date.now()}-${i}`,
                            setNum: i + 1,
                            weight: defWeight,
                            reps: defReps,
                            prev: prevStr,
                            completed: false,
                        };
                    }),
            };
        }));
        workoutCtx.startWorkout(routine, exerciseLogs);
    };

    const handleCreateRoutine = useCallback(async () => {
        await flushRoutineOrderSave();
        setIsReorderMode(false);
        navigation.navigate('CreateRoutine');
    }, [flushRoutineOrderSave, navigation]);

    const handleEditRoutine = useCallback(async (routine) => {
        if (!routine) return;
        closeActionSheet();
        await flushRoutineOrderSave();
        setIsReorderMode(false);
        navigation.navigate('CreateRoutine', { editRoutine: routine });
    }, [closeActionSheet, flushRoutineOrderSave, navigation]);

    const handleDuplicateRoutine = useCallback(async (routine) => {
        if (!routine) return;
        closeActionSheet();
        await flushRoutineOrderSave();

        const existingRoutines = await getRoutines();
        const duplicateName = `${routine.name} Copy`;
        const duplicatedRoutine = {
            ...routine,
            id: Date.now().toString(),
            name: duplicateName,
        };

        await saveRoutines([...existingRoutines, duplicatedRoutine]);
        await loadData();
    }, [closeActionSheet, flushRoutineOrderSave, loadData]);

    const handleShareRoutine = useCallback(async (routine) => {
        if (!routine) return;
        closeActionSheet();

        const summary = (routine.exercises || [])
            .map((exercise, index) => {
                const setsLabel = exercise.sets ? ` - ${exercise.sets} sets` : '';
                const groupLabel = exercise.muscleGroup ? ` (${exercise.muscleGroup})` : '';
                return `${index + 1}. ${exercise.name}${groupLabel}${setsLabel}`;
            })
            .join('\n');

        await Share.share({
            title: routine.name,
            message: `${routine.name}\n\n${summary || 'No exercises added yet.'}`,
        });
    }, [closeActionSheet]);

    const shouldSetActionSheetPanResponder = useCallback((gestureState) => {
        const { dx, dy } = gestureState;
        return dy > ACTION_SHEET_DRAG_THRESHOLD && dy > Math.abs(dx);
    }, []);

    const actionSheetPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) =>
                shouldSetActionSheetPanResponder(gestureState),
            onMoveShouldSetPanResponderCapture: (_, gestureState) =>
                shouldSetActionSheetPanResponder(gestureState),
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: () => {
                actionSheetTranslateY.stopAnimation((currentValue) => {
                    actionSheetTranslateY.setOffset(currentValue);
                    actionSheetTranslateY.setValue(0);
                });
            },
            onPanResponderMove: (_, gestureState) => {
                actionSheetTranslateY.setValue(Math.max(0, gestureState.dy));
            },
            onPanResponderRelease: (_, gestureState) => {
                actionSheetTranslateY.flattenOffset();
                if (gestureState.dy > ACTION_SHEET_CLOSE_DISTANCE || gestureState.vy > ACTION_SHEET_CLOSE_VELOCITY) {
                    closeActionSheet();
                    return;
                }

                Animated.spring(actionSheetTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 90,
                    friction: 12,
                }).start();
            },
            onPanResponderTerminate: () => {
                actionSheetTranslateY.flattenOffset();
                Animated.spring(actionSheetTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 90,
                    friction: 12,
                }).start();
            },
        })
    ).current;

    const buildCalendarDays = () => {
        const firstDay = new Date(calYear, calMonth, 1);
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        let startDow = firstDay.getDay(); // Sun=0, already correct for SU-first
        const cells = [];
        // Empty spacers for alignment (no prev month days)
        for (let i = 0; i < startDow; i++) {
            cells.push({ day: '', type: 'empty' });
        }
        // Current month days only
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasWorkout = workoutDates.has(dateStr);
            const isToday = calYear === todayYear && calMonth === todayMonth && d === todayDay;
            cells.push({ day: d, type: 'current', highlighted: hasWorkout, isToday });
        }
        // No next month overflow
        return cells;
    };

    const calendarDays = buildCalendarDays();
    const renderRoutineItem = ({ item: r }) => {
        const exerciseCount = r.exercises?.length || 0;
        const hash = (r.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const iconConfig = ROUTINE_ICONS[hash % ROUTINE_ICONS.length];
        const IconLib = iconConfig.lib;
        const isSelected = selectedRoutineIds.has(r.id);
        const isExpanded = expandedRoutineIds.has(r.id);
        const selectionMode = isSelectionMode;
        const routineLabels = (r.exercises || [])
            .map((exercise) => exercise.muscleGroup || exercise.name)
            .filter(Boolean);
        const routineMeta = `${routineLabels.join(', ') || t('general')} - ${exerciseCount} ${t('exercises')}`;

        return (
            <View key={r.id} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                    style={[
                        styles.routineCard,
                        isSelected && styles.routineCardSelected,
                        isExpanded && !selectionMode && styles.routineCardExpanded,
                    ]}
                    activeOpacity={selectionMode ? 0.82 : 1}
                    onPress={() => {
                        if (selectionMode) {
                            toggleRoutineSelection(r.id);
                        } else {
                            toggleRoutineExpanded(r.id);
                        }
                    }}
                >
                    <View style={styles.routineRow}>
                        <View style={styles.routineIconSquare}>
                            <IconLib name={iconConfig.name} size={22} color={colors.textMuted} />
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.routineName} numberOfLines={1}>{r.name}</Text>
                            <Text style={styles.routineMeta} numberOfLines={1}>
                                {routineMeta}
                            </Text>
                        </View>

                        <View style={styles.routineActions}>
                            {selectionMode ? (
                                <TouchableOpacity
                                    style={[styles.selectionDot, isSelected && styles.selectionDotActive]}
                                    onPress={() => toggleRoutineSelection(r.id)}
                                    hitSlop={10}
                                >
                                    {isSelected && <MaterialIcons name="check" size={16} color={isDark ? '#0a0a0a' : '#fff'} />}
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.startBadge} onPress={() => handleStartWorkout(r)}>
                                        <Text style={styles.startBadgeText}>{t('startWorkout').toUpperCase()}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.moreBadge}
                                        onPress={() => openActionSheet(r)}
                                        hitSlop={10}
                                    >
                                        <MaterialIcons name="more-vert" size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                </TouchableOpacity>

                {!selectionMode && isExpanded ? (
                    <View style={styles.routineDetailsCard}>
                        <View style={styles.routineDetailsHandle} />
                        <Text style={styles.routineDetailsLabel}>ROUTINE BREAKDOWN</Text>
                        <Text style={styles.routineDetailsText}>
                            {routineMeta}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const plannerHeader = (
        <>
            <View style={styles.myRoutinesRow}>
                <View>
                    <Text style={styles.myRoutinesTitle}>{t('myRoutines')}</Text>
                    <Text style={styles.streakMetaTitle}>
                        {workoutStreak}-week streak
                    </Text>
                    <Text style={[styles.streakMetaText, workoutStreakStatus.currentWeekMet && styles.streakMetaTextComplete]}>
                        {workoutStreakStatus.currentWeekCount}/{workoutStreakStatus.currentWeekTarget} this week
                    </Text>
                </View>

                {isReorderMode ? (
                    <TouchableOpacity style={[styles.headerSelectBtn, styles.headerReorderBtnActive]} onPress={toggleReorderMode}>
                        <Text style={[styles.headerSelectText, styles.headerReorderBtnActiveText]}>DONE</Text>
                    </TouchableOpacity>
                ) : !isSelectionMode ? (
                    <View style={styles.headerActionGroup}>
                        <TouchableOpacity style={styles.headerSelectBtn} onPress={toggleReorderMode}>
                            <Text style={styles.headerSelectText}>{t('reorder')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerSelectBtn} onPress={() => setIsSelectionMode(true)}>
                            <Text style={styles.headerSelectText}>SELECT</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.bulkActions}>
                        <TouchableOpacity style={styles.bulkCancelBtn} onPress={clearRoutineSelection}>
                            <Text style={styles.bulkCancelText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bulkDeleteBtn, selectedRoutineIds.size === 0 && styles.bulkDeleteBtnDisabled]}
                            onPress={handleDeleteSelected}
                            disabled={selectedRoutineIds.size === 0}
                        >
                            <MaterialIcons name="delete-outline" size={18} color="#fff" />
                            <Text style={styles.bulkDeleteText}>
                                {t('delete')} ({selectedRoutineIds.size})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {isReorderMode ? (
                <Text style={styles.reorderHintText}>Drag the handle to move routines instantly.</Text>
            ) : null}

            {routines.length === 0 && (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="fitness-center" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>{t('noRoutines')}</Text>
                    <Text style={styles.emptyText}>
                        {t('createFirstRoutine')}
                    </Text>
                </View>
            )}
        </>
    );

    const plannerFooter = (
        <>
            <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreateRoutine}
                activeOpacity={0.7}
            >
                <MaterialIcons name="add-circle-outline" size={24} color={colors.textMuted} />
                <Text style={styles.createBtnText}>{t('createRoutine').toUpperCase()}</Text>
            </TouchableOpacity>

            <View style={styles.calendarCard}>
                <View style={styles.calendarHeader}>
                    <View style={styles.calendarTitleRow}>
                        <MaterialIcons name="calendar-month" size={22} color={colors.primary} />
                        <Text style={styles.calendarTitle}>{t('workoutActivity')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('WorkoutCalendar')}>
                        <Text style={styles.seeMoreText}>{t('seeMore') || 'See More'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarBody}>
                    <Text style={styles.monthText}>{tMonthNames[calMonth]} {calYear}</Text>
                    <View style={styles.calGrid}>
                        {tDaysHeader.map((d) => (
                            <View key={d} style={styles.calCell}>
                                <Text style={styles.calDayHeader}>{d}</Text>
                            </View>
                        ))}

                        {calendarDays.map((cell, i) => (
                            <View key={i} style={styles.calCell}>
                                {cell.highlighted ? (
                                    <View style={styles.calDayHighlighted}>
                                        <Text style={styles.calDayHighlightedText}>{cell.day}</Text>
                                    </View>
                                ) : cell.isToday ? (
                                    <View style={styles.calDayTodayRing}>
                                        <Text style={styles.calDayToday}>{cell.day}</Text>
                                    </View>
                                ) : (
                                    <Text style={[
                                        styles.calDayText,
                                        cell.type !== 'current' && styles.calDayDimmed,
                                    ]}>{cell.day}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <RefreshOverlay refreshing={refreshing} />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIcon}>
                        <MaterialIcons name="fitness-center" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.pageTitle}>{t('workouts')}</Text>
                </View>

                {/* Streak Indicators */}
                <View style={styles.streakGroup}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <View style={[styles.streakBadge, { borderColor: isDark ? '#38bdf8' : '#0284c7' }]}>
                            <MaterialCommunityIcons 
                                name="dumbbell" 
                                size={16} 
                                color={isDark ? '#38bdf8' : '#0284c7'} 
                                style={[
                                    styles.streakIconBlue, 
                                    { textShadowColor: isDark ? 'rgba(56,189,248,0.5)' : 'rgba(2,132,199,0.3)' }
                                ]} 
                            />
                            <Text style={[styles.streakText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>{workoutStreak}</Text>
                        </View>
                        <View style={[styles.streakBadge, { borderColor: colors.textSecondary }]}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.streakText, { color: colors.textSecondary }]}>{restStreak}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {isReorderMode ? (
                <View style={styles.reorderModeContent}>
                    {plannerHeader}
                    {routines.length > 0 ? (
                        <View style={styles.reorderListShell}>
                            <RoutineReorderList
                                routines={routines}
                                colors={colors}
                                isDark={isDark}
                                generalLabel={t('general')}
                                exercisesLabel={t('exercises')}
                                onOrderChange={handleRoutineOrderChange}
                            />
                        </View>
                    ) : null}
                </View>
            ) : (
                <FlatList
                    {...previewAutoScroll}
                    data={routines}
                    renderItem={renderRoutineItem}
                    keyExtractor={(routine) => routine.id}
                    extraData={{
                        isSelectionMode,
                        selectedRoutineIds: Array.from(selectedRoutineIds).join('|'),
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<StyledRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListHeaderComponent={plannerHeader}
                    ListFooterComponent={plannerFooter}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
                <TouchableOpacity style={styles.deleteOverlay} activeOpacity={1} onPress={() => setDeleteTarget(null)}>
                    <TouchableOpacity activeOpacity={1} style={styles.deleteModal}>
                        <View style={styles.deleteIconCircle}>
                            <MaterialIcons name="delete-outline" size={28} color="#ef4444" />
                        </View>
                        <Text style={styles.deleteTitle}>{t('deleteRoutine')}</Text>
                        <Text style={styles.deleteMsg}>
                            {deleteTarget?.multi ? (
                                <>
                                    {t('areYouSureDelete')}{'\n'}
                                    <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', color: colors.text }}>
                                        {deleteTarget?.count} {deleteTarget?.count === 1 ? 'routine' : 'routines'}
                                    </Text>
                                    ?
                                </>
                            ) : (
                                <>
                                    {t('areYouSureDelete')}{'\n'}
                                    <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', color: colors.text }}>
                                        "{deleteTarget?.name}"
                                    </Text>
                                    ?
                                </>
                            )}
                        </Text>
                        <View style={styles.deleteBtnRow}>
                            <TouchableOpacity
                                style={styles.deleteCancelBtn}
                                onPress={() => setDeleteTarget(null)}
                            >
                                <Text style={styles.deleteCancelText}>{t('no')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteConfirmBtn}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteConfirmText}>{t('yesDelete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal visible={!!actionTarget} transparent animationType="none" onRequestClose={() => closeActionSheet()}>
                <View style={styles.bottomSheetOverlay} {...actionSheetPanResponder.panHandlers}>
                    <TouchableOpacity
                        style={styles.bottomSheetBackdrop}
                        activeOpacity={1}
                        onPress={() => closeActionSheet()}
                    />
                    <Animated.View
                        style={[
                            styles.actionSheetDock,
                            {
                                paddingBottom: Math.max(insets.bottom, 10),
                                transform: [{ translateY: actionSheetTranslateY }],
                            },
                        ]}
                    >
                        <TouchableOpacity activeOpacity={1} style={styles.actionSheetContent}>
                            <View style={styles.actionSheetHandle} />
                            <Text style={styles.actionRoutineName}>{actionTarget?.name}</Text>

                            <View style={styles.sheetOptionGroup}>
                                <TouchableOpacity
                                    style={styles.sheetOptionRow}
                                    onPress={() => handleShareRoutine(actionTarget)}
                                >
                                    <MaterialIcons name="ios-share" size={20} color={colors.text} />
                                    <Text style={styles.sheetOptionText}>Share Routine</Text>
                                </TouchableOpacity>

                                <View style={styles.sheetDivider} />

                                <TouchableOpacity
                                    style={styles.sheetOptionRow}
                                    onPress={() => handleDuplicateRoutine(actionTarget)}
                                >
                                    <MaterialIcons name="content-copy" size={20} color={colors.text} />
                                    <Text style={styles.sheetOptionText}>Duplicate Routine</Text>
                                </TouchableOpacity>

                                <View style={styles.sheetDivider} />

                                <TouchableOpacity
                                    style={styles.sheetOptionRow}
                                    onPress={() => handleEditRoutine(actionTarget)}
                                >
                                    <MaterialIcons name="edit" size={20} color={colors.text} />
                                    <Text style={styles.sheetOptionText}>Edit Routine</Text>
                                </TouchableOpacity>

                                <View style={styles.sheetDivider} />

                                <TouchableOpacity
                                    style={styles.sheetOptionRow}
                                    onPress={() => {
                                        const r = actionTarget;
                                        closeActionSheet(() => {
                                            if (r) handleDelete(r.id, r.name);
                                        });
                                    }}
                                >
                                    <MaterialIcons name="close" size={20} color="#ef4444" />
                                    <Text style={[styles.sheetOptionText, styles.sheetOptionTextDanger]}>Delete Routine</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            <Modal visible={!!startBlockedTarget} transparent animationType="fade" onRequestClose={() => setStartBlockedTarget(null)}>
                <TouchableOpacity style={styles.deleteOverlay} activeOpacity={1} onPress={() => setStartBlockedTarget(null)}>
                    <TouchableOpacity activeOpacity={1} style={styles.startBlockedModal}>
                        <View style={styles.startBlockedIconCircle}>
                            <MaterialIcons name="fitness-center" size={28} color={colors.primary} />
                        </View>
                        <Text style={styles.startBlockedTitle}>Workout In Progress</Text>
                        <Text style={styles.startBlockedMsg}>
                            You already have{'\n'}
                            <Text style={styles.startBlockedStrong}>
                                "{startBlockedTarget?.activeName}"
                            </Text>
                            {'\n'}in progress. Finish or discard it before starting{'\n'}
                            <Text style={styles.startBlockedStrong}>
                                "{startBlockedTarget?.nextName}"
                            </Text>
                            .
                        </Text>
                        <TouchableOpacity
                            style={styles.startBlockedBtn}
                            onPress={() => setStartBlockedTarget(null)}
                        >
                            <Text style={styles.startBlockedBtnText}>OK</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDark },
    content: { paddingBottom: 120, paddingHorizontal: 16 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIcon: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary + '18',
        alignItems: 'center', justifyContent: 'center',
    },
    pageTitle: { color: colors.text, fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.5 },

    // Streak indicator
    streakBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6,
        backgroundColor: isDark ? '#0f172a' : '#f0f9ff',
        borderWidth: 1, borderRadius: 12,
        shadowColor: isDark ? '#38bdf8' : '#0284c7', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    streakGroup: {
        alignItems: 'flex-end',
        gap: 4,
    },
    streakIconBlue: { textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
    streakText: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
    streakMetaTitle: {
        color: colors.text,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    streakMetaText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    streakMetaTextComplete: {
        color: colors.primary,
    },

    myRoutinesRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 20,
        marginBottom: 8,
        gap: 12,
    },
    myRoutinesTitle: { color: colors.text, fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
    reorderText: { color: colors.primary, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
    headerActionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerSelectBtn: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
        borderColor: colors.border,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    headerSelectText: {
        color: colors.text,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    headerReorderBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    headerReorderBtnActiveText: {
        color: isDark ? '#0a0a0a' : '#fff',
    },
    reorderModeContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    reorderHintText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        marginBottom: 14,
    },
    reorderListShell: {
        flex: 1,
    },
    bulkActions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    bulkCancelBtn: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
        borderColor: colors.border,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    bulkCancelText: {
        color: colors.text,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 11,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    bulkDeleteBtn: {
        alignItems: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 999,
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    bulkDeleteText: {
        color: '#fff',
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 11,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    bulkDeleteBtnDisabled: {
        opacity: 0.45,
    },

    // Quick Activities
    quickCard: {
        width: 110,
        height: 110,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    },
    quickCardText: {
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold'
    },

    // Routine Cards
    routineCard: {
        backgroundColor: colors.bgCard, borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: colors.border, marginBottom: 8,
        overflow: 'visible',
    },
    routineCardExpanded: {
        marginBottom: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    routineCardActive: {
        borderColor: colors.primary,
        shadowColor: colors.primary, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 10,
        backgroundColor: isDark ? colors.bgElevated : colors.bgCard,
    },
    routineCardSelected: {
        borderColor: colors.primary,
        backgroundColor: isDark ? colors.bgElevated : colors.bgCard,
        shadowColor: colors.primary,
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    routineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    routineIconSquare: {
        width: 48, height: 48, borderRadius: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },
    routineName: {
        color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold',
    },
    routineMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
    routineDetailsCard: {
        marginTop: 0,
        marginHorizontal: 0,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 13,
        backgroundColor: isDark ? colors.bgElevated : colors.surface,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: colors.border,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    routineDetailsHandle: {
        alignSelf: 'center',
        width: 34,
        height: 3,
        borderRadius: 999,
        backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
        marginBottom: 10,
    },
    routineDetailsLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1,
        marginBottom: 6,
    },
    routineDetailsText: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    routineActions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    startBadge: {
        backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 5,
        borderRadius: 999,
    },
    startBadgeText: { color: isDark ? '#0a0a0a' : '#fff', fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.5 },
    moreBadge: {
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        borderRadius: 999,
        height: 34,
        justifyContent: 'center',
        width: 34,
    },
    selectionDot: {
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        borderColor: colors.border,
        borderRadius: 999,
        borderWidth: 1,
        height: 34,
        justifyContent: 'center',
        width: 34,
    },
    selectionDotActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    // Create New Routine
    createBtn: {
        marginTop: 16, paddingVertical: 18, borderWidth: 2,
        borderStyle: 'dashed', borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
        borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
    },
    createBtnText: {
        color: colors.textMuted, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 2, textTransform: 'uppercase',
    },

    // Empty
    emptyCard: {
        backgroundColor: colors.bgCard, borderRadius: 20, padding: 32,
        alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 8, gap: 10,
    },
    emptyTitle: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },

    // Calendar
    calendarCard: {
        marginTop: 28, backgroundColor: colors.bgCard, borderRadius: 16,
        borderWidth: 1, borderColor: colors.border,
        overflow: 'hidden',
    },
    calendarHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16,
    },
    calendarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    calendarTitle: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
    calendarBody: { paddingHorizontal: 16, paddingBottom: 20 },
    monthRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, paddingHorizontal: 2,
    },
    monthText: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 12, marginLeft: 2 },
    seeMoreText: { color: colors.primary, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
    monthNav: { flexDirection: 'row', gap: 8 },
    monthNavBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        alignItems: 'center', justifyContent: 'center',
    },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: {
        width: '14.28%',
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 6,
    },
    calDayHeader: {
        color: colors.textMuted, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
    },
    calDayText: { color: colors.text, fontSize: 13 },
    calDayDimmed: { color: isDark ? '#333' : '#ccc' },
    calDayTodayRing: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    calDayToday: {
        color: colors.primary, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold',
    },
    calDayHighlighted: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }, elevation: 4,
    },
    calDayHighlightedText: { color: isDark ? '#0a0a0a' : '#fff', fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },

    // Delete Confirmation Modal
    deleteOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
    },
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    deleteModal: {
        width: 300, backgroundColor: colors.bg,
        borderRadius: 20, padding: 24, alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
    },
    deleteIconCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    deleteTitle: {
        color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 8,
    },
    deleteMsg: {
        color: colors.textSecondary, fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium',
        textAlign: 'center', lineHeight: 20, marginBottom: 24,
    },
    deleteBtnRow: {
        flexDirection: 'row', gap: 12, width: '100%',
    },
    deleteCancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.border,
    },
    deleteCancelText: {
        color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold',
    },
    deleteConfirmBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
        backgroundColor: '#ef4444',
    },
    deleteConfirmText: {
        color: '#fff', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold',
    },

    actionSheetDock: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -4 },
        elevation: 0,
    },
    actionSheetContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
    },
    actionSheetHandle: {
        alignSelf: 'center',
        width: 42,
        height: 4,
        borderRadius: 999,
        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.14)',
        marginBottom: 14,
    },
    actionTitle: {
        color: colors.textSecondary, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
    },
    actionRoutineName: {
        color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 18,
        letterSpacing: -0.2, textAlign: 'center',
    },
    sheetOptionGroup: {
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    sheetOptionRow: {
        width: '100%',
        minHeight: 58,
        paddingHorizontal: 16,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sheetDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 48,
    },
    sheetOptionText: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    sheetOptionTextDanger: {
        color: '#ef4444',
    },

    // Start-blocked modal
    startBlockedModal: {
        width: 312,
        backgroundColor: colors.bg,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    startBlockedIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary + '16',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    startBlockedTitle: {
        color: colors.text,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 8,
    },
    startBlockedMsg: {
        color: colors.textSecondary,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_500Medium',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    startBlockedStrong: {
        color: colors.text,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    startBlockedBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: colors.primary,
    },
    startBlockedBtnText: {
        color: isDark ? '#0a0a0a' : '#fff',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
});
