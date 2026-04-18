import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Vibration, Dimensions, Modal, TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, ELEVATION } from '../theme';
import { saveWorkoutSession } from '../services/storage';
import { addXP, awardWeeklyWorkoutTargetBonusIfEligible, XP_AMOUNTS } from '../services/leveling';
import { useWorkout } from '../contexts/WorkoutContext';
import { getExerciseHistory, getSettings, updateRoutine } from '../services/storage';
import {
    setRestTimerCallback,
    showRestTimerNotification,
    updateRestTimerNotification,
    cancelRestTimerNotification,
    showTimerCompleteNotification,
} from '../services/restTimerNotification';
import WeightKeypad from '../components/WeightKeypad';
import RestTimerPicker from '../components/RestTimerPicker';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import ExerciseActionModal from '../components/ExerciseActionModal';
import ExerciseReorderList from '../components/ExerciseReorderList';
import { useNavigation } from '@react-navigation/native';
function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return { hrs: String(hrs).padStart(2, '0'), mins: String(mins).padStart(2, '0'), secs: String(secs).padStart(2, '0') };
}

export default function ActiveWorkoutScreen({ isOverlay }) {
    const { colors, themeMode } = useTheme();
    const styles = getStyles(colors, themeMode);
    const insets = useSafeAreaInsets();
    const workout = useWorkout();
    const navigation = useNavigation();
    const { setIsModalOpen, restTimer, setRestTimer, restDuration, setRestDuration } = workout;
    const routine = workout.activeWorkout?.routine;

    if (!routine) return null;

    const buildExerciseLogs = () => (routine.exercises || []).map(ex => {
        const parts = (ex.restTime || '01:30').split(':');
        return {
            id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: ex.name,
            muscleGroup: ex.muscleGroup || '',
            equipment: ex.equipment || '',
            weightUnit: 'kg',
            restMin: parts[0] || '01',
            restSec: parts[1] || '30',
            bestWeight: ex.bestWeight || 0,
            bestE1RM: ex.bestE1RM || 0,
            sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
                id: `${Date.now()}-${i}`,
                setNum: i + 1,
                weight: ex.weight || '',
                reps: ex.reps || '12',
                prev: ex.weight ? `${ex.weight}${ex.weightUnit || 'kg'} x ${ex.reps || '12'}` : '',
                completed: false,
                isPR: false,
            })),
        };
    });

    const getInitialLogs = () => {
        if (workout.activeWorkout?.exerciseLogs) {
            return workout.activeWorkout.exerciseLogs.map((log, index) => ({
                id: log.id || `restored-ex-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                ...log
            }));
        }
        return buildExerciseLogs();
    };

    const getInitialElapsed = () => {
        if (workout.elapsedRef.current > 0) {
            return workout.elapsedRef.current;
        }
        return 0;
    };

    const [exerciseLogs, setExerciseLogs] = useState(getInitialLogs);
    const [elapsedSeconds, setElapsedSeconds] = useState(getInitialElapsed);
    const [routineModified, setRoutineModified] = useState(false);
    const [isReorderMode, setIsReorderMode] = useState(false);
    const startTimeRef = useRef(
        workout.activeWorkout ? workout.activeWorkout.startTime : Date.now()
    );
    const elapsedInterval = useRef(null);
    const restInterval = useRef(null);

    const [baseRestTimer, setBaseRestTimer] = useState(60);

    useEffect(() => {
        getSettings().then(s => {
            const baseTimer = s.baseRestTimer !== undefined ? s.baseRestTimer : 60;
            setBaseRestTimer(baseTimer);

            setExerciseLogs(prev => prev.map(log => {
                const exSecs = (parseInt(log.restMin) || 0) * 60 + (parseInt(log.restSec) || 0);
                if (exSecs < baseTimer) {
                    return {
                        ...log,
                        restMin: String(Math.floor(baseTimer / 60)).padStart(2, '0'),
                        restSec: String(baseTimer % 60).padStart(2, '0')
                    };
                }
                return log;
            }));
        });
    }, []);

    // Register rest timer background action callbacks.
    useEffect(() => {
        setRestTimerCallback((actionId) => {
            if (actionId === 'minus15') {
                setRestTimer(prev => {
                    const next = Math.max(0, (prev || 0) - 15);
                    if (next > 0) updateRestTimerNotification(next);
                    else cancelRestTimerNotification();
                    return next;
                });
            } else if (actionId === 'plus15') {
                setRestTimer(prev => {
                    const next = (prev || 0) + 15;
                    updateRestTimerNotification(next);
                    return next;
                });
            } else if (actionId === 'skip') {
                setRestTimer(null);
                cancelRestTimerNotification();
            }
        });
        return () => setRestTimerCallback(null);
    }, []);

    const handleMinimize = () => {
        workout.minimizeWorkout(exerciseLogs);
    };

    const handleAddExercise = (selectedEx) => {
        const defaultSecs = Math.max(90, baseRestTimer);
        const newEx = {
            id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: selectedEx.name,
            muscleGroup: selectedEx.bodyPart || selectedEx.target || '',
            equipment: selectedEx.equipment || '',
            weightUnit: 'kg',
            restMin: String(Math.floor(defaultSecs / 60)).padStart(2, '0'),
            restSec: String(defaultSecs % 60).padStart(2, '0'),
            bestWeight: 0,
            bestE1RM: 0,
            sets: [{
                id: `${Date.now()}-0`,
                setNum: 1,
                weight: '',
                reps: '12',
                prev: '',
                completed: false,
                isPR: false,
            }],
        };

        if (replaceExIndex !== null) {
            setExerciseLogs(prev => {
                const updated = [...prev];
                updated[replaceExIndex] = newEx;
                return updated;
            });
            setReplaceExIndex(null);
        } else {
            setExerciseLogs(prev => [...prev, newEx]);
        }
        setRoutineModified(true);
        setShowExSearch(false);
    };

    const handleRemoveExercise = () => {
        if (actionExIndex !== null) {
            setExerciseLogs(prev => prev.filter((_, i) => i !== actionExIndex));
            setActionExIndex(null);
            setActionModalVisible(false);
            setRoutineModified(true);

            // Auto finish if no exercises left
            if (exerciseLogs.length <= 1) {
                setShowDiscardModal(true);
            }
        }
    };

    // Keypad state
    const [keypadVisible, setKeypadVisible] = useState(false);

    // Custom Modals
    const [showExSearch, setShowExSearch] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionExIndex, setActionExIndex] = useState(null);
    const [replaceExIndex, setReplaceExIndex] = useState(null);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [keypadMode, setKeypadMode] = useState('weight');
    const [keypadTarget, setKeypadTarget] = useState(null);
    const [keypadInitVal, setKeypadInitVal] = useState('');
    const [keypadInitUnit, setKeypadInitUnit] = useState('KG');
    const [keypadLabel, setKeypadLabel] = useState('WEIGHT');
    const [keypadShowUnit, setKeypadShowUnit] = useState(true);
    // Rest Timer Picker state
    const [restPickerVisible, setRestPickerVisible] = useState(false);
    const [restPickerTargetIndex, setRestPickerTargetIndex] = useState(null);
    const [restPickerFocus, setRestPickerFocus] = useState('min');

    useEffect(() => {
        setIsModalOpen(
            actionModalVisible ||
            showExSearch ||
            keypadVisible ||
            showDiscardModal ||
            showFinishModal ||
            restPickerVisible
        );
    }, [actionModalVisible, showExSearch, keypadVisible, showDiscardModal, showFinishModal, restPickerVisible, setIsModalOpen]);

    const openKeypad = (mode, exIndex, setOrField, restPart = null) => {
        const ex = exerciseLogs[exIndex];
        setKeypadMode(mode);
        if (mode === 'weight') {
            setKeypadTarget({ exIndex, setId: setOrField.id });
            setKeypadInitVal(setOrField.weight || '0');
            setKeypadInitUnit(ex.weightUnit === 'kg' ? 'KG' : 'LBS');
            setKeypadLabel('WEIGHT');
            setKeypadShowUnit(true);
        } else if (mode === 'reps') {
            setKeypadTarget({ exIndex, setId: setOrField.id });
            setKeypadInitVal(setOrField.reps || '0');
            setKeypadLabel('REPS');
            setKeypadShowUnit(false);
        } else if (mode === 'rest') {
            setKeypadTarget({ exIndex });
            const mins = parseInt(ex.restMin) || 0;
            const secs = parseInt(ex.restSec) || 0;
            if (restPart === 'min') {
                setKeypadInitVal(String(mins));
                setKeypadLabel('REST MINUTES');
            } else if (restPart === 'sec') {
                setKeypadInitVal(String(secs));
                setKeypadLabel('REST SECONDS');
            } else {
                const totalSeconds = mins * 60 + secs;
                setKeypadInitVal(String(totalSeconds));
                setKeypadLabel('REST TIME');
            }
            setKeypadShowUnit(false);
        }
        setKeypadVisible(true);
    };

    const openRestPicker = (exIndex, focus = 'min') => {
        setRestPickerTargetIndex(exIndex);
        setRestPickerFocus(focus);
        setRestPickerVisible(true);
    };

    const handleKeypadDone = (value, unit) => {
        if (!keypadTarget) return;
        if (keypadMode === 'weight') {
            updateSetField(keypadTarget.exIndex, keypadTarget.setId, 'weight', value);
            const newUnit = unit === 'KG' ? 'kg' : 'lbs';
            setExerciseLogs(prev => {
                const updated = [...prev];
                updated[keypadTarget.exIndex] = { ...updated[keypadTarget.exIndex], weightUnit: newUnit };
                return updated;
            });
        } else if (keypadMode === 'reps') {
            updateSetField(keypadTarget.exIndex, keypadTarget.setId, 'reps', value);
        } else if (keypadMode === 'rest') {
            setExerciseLogs(prev => {
                const updated = [...prev];
                const target = { ...updated[keypadTarget.exIndex] };
                const total = parseInt(value) || 0;
                const mins = String(Math.floor(total / 60)).padStart(2, '0');
                const secs = String(total % 60).padStart(2, '0');
                target.restMin = mins;
                target.restSec = secs;
                updated[keypadTarget.exIndex] = target;
                return updated;
            });
        }
        setKeypadTarget(null);
    };

    const handleRestPickerDone = (formattedString, totalSeconds) => {
        if (restPickerTargetIndex === null) return;
        setExerciseLogs(prev => {
            const updated = [...prev];
            const target = { ...updated[restPickerTargetIndex] };
            const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const secs = String(totalSeconds % 60).padStart(2, '0');
            target.restMin = mins;
            target.restSec = secs;
            updated[restPickerTargetIndex] = target;
            return updated;
        });
        setRestPickerTargetIndex(null);
    };

    // Elapsed timer
    useEffect(() => {
        elapsedInterval.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(elapsedInterval.current);
    }, []);

    // Rest timer
    useEffect(() => {
        if (restTimer === null) { clearInterval(restInterval.current); return; }
        if (restTimer <= 0) {
            setRestTimer(null);
            cancelRestTimerNotification();
            showTimerCompleteNotification();
            // Staccato high-force hardware pulses (THUD...THUD...THUD pattern)
            const pattern = [0];
            for (let i = 0; i < 15; i++) {
                pattern.push(60); // 60ms hit (maximizes start/stop force)
                pattern.push(120); // 120ms wait
            }
            Vibration.vibrate(pattern);
            return;
        }
        restInterval.current = setInterval(() => {
            setRestTimer(prev => {
                if (prev <= 1) {
                    clearInterval(restInterval.current);
                    cancelRestTimerNotification();
                    showTimerCompleteNotification();
                    const pattern = [0];
                    for (let i = 0; i < 15; i++) {
                        pattern.push(60);
                        pattern.push(120);
                    }
                    Vibration.vibrate(pattern);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(restInterval.current);
    }, [restTimer !== null]);

    const getRestSeconds = (ex) => (parseInt(ex.restMin) || 0) * 60 + (parseInt(ex.restSec) || 0);

    const updateSetField = (exIndex, setId, field, value) => {
        setExerciseLogs(prev => {
            const updated = [...prev];
            const ex = { ...updated[exIndex] };
            ex.sets = ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
            updated[exIndex] = ex;
            return updated;
        });
    };

    const toggleSet = (exIndex, setId) => {
        const updated = [...exerciseLogs];
        const ex = { ...updated[exIndex] };
        let nextRestSecs = 0;
        let triggerPRCelebration = false;
        let triggerCompleteVibration = false;
        let triggerUndoVibration = false;

        ex.sets = ex.sets.map((s) => {
            if (s.id !== setId) return s;

            const wasCompleted = s.completed;
            let isPR = s.isPR || false;

            if (!wasCompleted) {
                const w = parseFloat(s.weight) || 0;
                const r = parseFloat(s.reps) || 0;
                const e1rm = w * (1 + r / 30);

                if (w > 0 && (w > ex.bestWeight || e1rm > ex.bestE1RM)) {
                    isPR = true;
                    ex.bestWeight = Math.max(ex.bestWeight, w);
                    ex.bestE1RM = Math.max(ex.bestE1RM, e1rm);
                    triggerPRCelebration = true;
                } else {
                    triggerCompleteVibration = true;
                }

                nextRestSecs = getRestSeconds(ex);
            } else {
                isPR = false;
                triggerUndoVibration = true;
            }

            return { ...s, completed: !wasCompleted, isPR };
        });

        updated[exIndex] = ex;
        setExerciseLogs(updated);

        if (nextRestSecs > 0) {
            setRestDuration(nextRestSecs);
            setRestTimer(nextRestSecs);
            showRestTimerNotification(nextRestSecs, ex.name);
        }

        if (triggerPRCelebration) {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) { }
        } else if (triggerCompleteVibration) {
            Vibration.vibrate(40);
        } else if (triggerUndoVibration) {
            Vibration.vibrate(15);
        }
    };

    const addSet = (exIndex) => {
        setExerciseLogs(prev => {
            const updated = [...prev];
            const ex = { ...updated[exIndex] };
            const last = ex.sets[ex.sets.length - 1];
            ex.sets = [...ex.sets, {
                id: `${Date.now()}-${ex.sets.length}`,
                setNum: ex.sets.length + 1,
                weight: last?.weight || '', reps: last?.reps || '12',
                prev: '', completed: false,
            }];
            updated[exIndex] = ex;
            return updated;
        });
        setRoutineModified(true);
    };

    const removeSet = (exIndex) => {
        setExerciseLogs(prev => {
            const updated = [...prev];
            const ex = { ...updated[exIndex] };
            if (ex.sets.length > 1) {
                ex.sets = ex.sets.slice(0, -1);
            }
            updated[exIndex] = ex;
            return updated;
        });
        setRoutineModified(true);
    };

    const executeDiscard = () => {
        setShowDiscardModal(false);
        cancelRestTimerNotification();
        workout.endWorkout();
        navigation.goBack();
    };

    const handleFinish = () => {
        if (routineModified && routine?.id) {
            Alert.alert(
                'Save Routine Changes?',
                'You modified the exercises and sets. Save these changes to your base routine?',
                [
                    { text: 'Finish Without Saving', onPress: () => setShowFinishModal(true) },
                    { 
                        text: 'Save & Finish', 
                        onPress: async () => {
                            const payload = {
                                exercises: exerciseLogs.map(ex => ({
                                    name: ex.name.trim(),
                                    sets: ex.sets,
                                    restTime: `${String(ex.restMin).padStart(2,'0')}:${String(ex.restSec).padStart(2,'0')}`,
                                    bodyPart: ex.muscleGroup || '',
                                    equipment: ex.equipment || '',
                                    isCustom: ex.isCustom || false
                                }))
                            };
                            try {
                                await updateRoutine(routine.id, payload);
                            } catch (e) {
                                console.error('Failed to update routine', e);
                            }
                            setShowFinishModal(true);
                        } 
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } else {
            setShowFinishModal(true);
        }
    };

    const executeFinish = async () => {
        setShowFinishModal(false);
        clearInterval(elapsedInterval.current);
        cancelRestTimerNotification();
        const session = {
            routineId: routine.id,
            routineName: routine.name,
            startedAt: new Date(startTimeRef.current).toISOString(),
            finishedAt: new Date().toISOString(),
            elapsedSeconds,
            exerciseLogs: exerciseLogs.map(ex => ({
                name: ex.name,
                sets: ex.sets.map(s => ({ ...s })),
            })),
        };
        await saveWorkoutSession(session);
        const xpResult = await addXP(XP_AMOUNTS.WORKOUT_COMPLETED, 'workout_completed');
        const weeklyBonusResult = await awardWeeklyWorkoutTargetBonusIfEligible();
        workout.endWorkout();
        const t = formatTime(elapsedSeconds);
        setTimeout(() => {
            Alert.alert(
                'Workout Complete',
                `Total Time: ${t.hrs}:${t.mins}:${t.secs}\nRoutine: ${routine.name}\n+${XP_AMOUNTS.WORKOUT_COMPLETED} XP${weeklyBonusResult.awarded ? `\n+${XP_AMOUNTS.WEEKLY_WORKOUT_TARGET_REACHED} XP weekly streak bonus` : ''}${xpResult.leveledUp ? ` - Level Up! Level ${xpResult.level}` : ''}`,
                [{ text: 'Great!', onPress: () => { navigation.goBack(); } }]
            );
        }, 300); // Slight delay for smooth modal close transition
    };

    const skipRest = () => { setRestTimer(null); cancelRestTimerNotification(); };
    const adjustRest = (delta) => setRestTimer(prev => {
        const next = Math.max(0, (prev || 0) + delta);
        if (next > 0) updateRestTimerNotification(next);
        else cancelRestTimerNotification();
        return next;
    });

    const time = formatTime(elapsedSeconds);
    const handleExerciseOrderChange = (nextExerciseLogs) => {
        setExerciseLogs(nextExerciseLogs);
        setRoutineModified(true);
    };

    const renderRestTimerCard = (isInline = false) => (
        <View style={[styles.restPopup, isInline && styles.restPopupInline]}>
            <View style={styles.restProgressBar}>
                <View style={[styles.restProgressFill, {
                    width: `${restDuration > 0 ? ((restDuration - restTimer) / restDuration) * 100 : 0}%`
                }]} />
            </View>
            <View style={styles.restPopupBody}>
                <View>
                    <Text style={styles.restPopupLabel}>RESTING</Text>
                    <Text style={styles.restPopupTime}>
                        {String(Math.floor(restTimer / 60)).padStart(2, '0')}:{String(restTimer % 60).padStart(2, '0')}
                    </Text>
                </View>
                <View style={styles.restPopupBtns}>
                    <TouchableOpacity style={styles.restPopupBtn} onPress={() => adjustRest(-15)}>
                        <Text style={styles.restPopupBtnText}>-15<Text style={{ fontSize: 7 }}>s</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.restPopupBtn} onPress={() => adjustRest(15)}>
                        <Text style={styles.restPopupBtnText}>+15<Text style={{ fontSize: 7 }}>s</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.restPopupBtn} onPress={skipRest}>
                        <Text style={[styles.restPopupBtnText, { color: colors.textSecondary }]}>Skip</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderExerciseItem = ({ item: exercise, index: exIndex }) => (
        <View
            key={exercise.id}
            style={styles.exerciseSection}
        >
            <TouchableOpacity
                style={styles.exerciseMenuBtn}
                onPress={() => {
                    setActionExIndex(exIndex);
                    setActionModalVisible(true);
                }}
            >
                <MaterialIcons name="more-vert" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Exercise header */}
            <View style={styles.exerciseHeader}>
                <View style={{ flex: 1 }}>
                    <View style={styles.exerciseNameRow}>
                        <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name.toUpperCase()}</Text>
                    </View>
                    <View style={styles.restRow}>
                        <View style={styles.restPill}>
                            <TouchableOpacity onPress={() => openRestPicker(exIndex)} style={styles.restPillCombined}>
                                <MaterialIcons name="timer" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                                <Text style={styles.restPillLabel}>REST TIMER:</Text>
                                <Text style={styles.restPillText}>
                                    {String(parseInt(exercise.restMin) || 0).padStart(2, '0')}:{String(parseInt(exercise.restSec) || 0).padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Column headers */}
            <View style={styles.colHeaders}>
                <Text style={[styles.colHeader, { width: 36, textAlign: 'center', marginLeft: 4 }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1, paddingLeft: 8 }]}>PREVIOUS</Text>
                <Text style={[styles.colHeader, { width: 58, textAlign: 'center' }]}>LBS</Text>
                <Text style={[styles.colHeader, { width: 58, textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.colHeader, { width: 38, textAlign: 'center' }]}>DONE</Text>
            </View>

            {/* Set rows */}
            {exercise.sets.map((set, si) => {
                const isActive = !set.completed && (si === 0 || exercise.sets[si - 1]?.completed);
                return (
                    <View
                        key={set.id}
                        style={[
                            styles.setRow,
                            set.completed && styles.setRowCompleted,
                            isActive && styles.setRowActive,
                        ]}
                    >
                        <Text style={[styles.setNum, set.completed && styles.setNumDone,
                        isActive && styles.setNumActive]}>{set.setNum}</Text>

                        <View style={styles.prevBadge}>
                            <Text style={styles.prevText}>{set.prev || '-'}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.inputCell, set.isPR && styles.inputCellPR]}
                            onPress={() => openKeypad('weight', exIndex, set)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[styles.inputText,
                                isActive && styles.inputTextActive,
                                set.completed && styles.inputTextDone,
                                set.isPR && styles.inputTextPR
                                ]}>{set.weight || '0'}</Text>

                                {set.isPR && (
                                    <View style={styles.prBadge}>
                                        <MaterialIcons name="emoji-events" size={10} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.inputCell}
                            onPress={() => openKeypad('reps', exIndex, set)}
                        >
                            <Text style={[styles.inputText,
                            set.completed && styles.inputTextDone,
                            ]}>{set.reps || '0'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.checkWrap,
                                set.completed ? styles.checkWrapFilled : styles.checkWrapEmpty,
                            ]}
                            onPress={() => toggleSet(exIndex, set.id)}
                        >
                            {set.completed ? (
                                <View style={styles.checkFilled}>
                                    <MaterialIcons name="check" size={14} color={colors.textOnPrimary} />
                                </View>
                            ) : (
                                <View style={[styles.checkEmpty, isActive && styles.checkEmptyActive]} />
                            )}
                        </TouchableOpacity>
                    </View>
                );
            })}

            <View style={styles.setActions}>
                <TouchableOpacity onPress={() => removeSet(exIndex)}>
                    <Text style={styles.setActionText}>- Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addSet(exIndex)}>
                    <Text style={styles.setActionText}>+ Add Set</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleMinimize} style={styles.minimizeBtn}>
                    <MaterialIcons name="expand-more" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.headerLeft}>
                    <MaterialIcons name="fitness-center" size={18} color={colors.primary} />
                    <View>
                        <Text style={styles.headerTitle}>{routine.name}</Text>
                        <Text style={styles.headerSubtitle}>Active Session</Text>
                    </View>
                </View>
                <View style={[styles.headerRight, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
                    <TouchableOpacity onPress={() => setIsReorderMode(!isReorderMode)}>
                        <MaterialIcons 
                            name={isReorderMode ? "check" : "list"} 
                            size={24} 
                            color={isReorderMode ? colors.primary : colors.textSecondary} 
                        />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.totalTimeLabel}>TOTAL TIME</Text>
                        <Text style={styles.totalTimeValue}>
                            {time.hrs}:{time.mins}:<Text style={styles.totalTimeSecs}>{time.secs}</Text>
                        </Text>
                    </View>
                </View>
            </View>

            {/* Exercises Scroll */}
            {isReorderMode ? (
                <View style={styles.reorderModeContent}>
                    <Text style={styles.reorderHintText}>Drag the handle to move exercises instantly.</Text>
                    <ExerciseReorderList
                        exercises={exerciseLogs}
                        colors={colors}
                        onOrderChange={handleExerciseOrderChange}
                        footer={restTimer !== null ? renderRestTimerCard(true) : null}
                    />
                </View>
            ) : (
                <FlatList
                    data={exerciseLogs}
                    keyExtractor={(item, index) => item.id ? item.id : `fallback-key-${index}`}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    renderItem={renderExerciseItem}
                    ListFooterComponent={<View style={{ height: 200 }} />}
                />
            )}

            {/* Rest timer popup */}
            {!isReorderMode && restTimer !== null && renderRestTimerCard(false)}

            {/* Bottom Bar */}
            {!isReorderMode ? (
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                    <TouchableOpacity
                        style={styles.addExerciseBtn}
                        onPress={() => setShowExSearch(true)}
                    >
                        <MaterialIcons name="add" size={18} color={colors.text} />
                        <Text style={styles.addExerciseText}>ADD EXERCISE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.discardBtn}
                        onPress={() => setShowDiscardModal(true)}
                    >
                        <MaterialIcons name="delete-outline" size={18} color={colors.red500} />
                        <Text style={styles.discardBtnText}>DISCARD WORKOUT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                        <MaterialIcons name="check-circle" size={18} color={colors.textOnPrimary} />
                        <Text style={styles.finishBtnText}>FINISH WORKOUT</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* Keypad */}
            <WeightKeypad
                visible={keypadVisible}
                onClose={() => setKeypadVisible(false)}
                initialValue={keypadInitVal}
                initialUnit={keypadInitUnit}
                onDone={handleKeypadDone}
                label={keypadLabel}
                showUnitToggle={keypadShowUnit}
            />

            {/* Rest Timer Combined Picker */}
            <RestTimerPicker
                visible={restPickerVisible}
                onClose={() => setRestPickerVisible(false)}
                initialValue={
                    restPickerTargetIndex !== null 
                        ? `${exerciseLogs[restPickerTargetIndex]?.restMin || '01'}:${exerciseLogs[restPickerTargetIndex]?.restSec || '30'}`
                        : '01:30'
                }
                initialFocus={restPickerFocus}
                onDone={handleRestPickerDone}
            />

            {/* Custom Settings Modals */}
            <Modal transparent visible={showDiscardModal} animationType="fade" onRequestClose={() => setShowDiscardModal(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setShowDiscardModal(false)}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>
                    <View style={styles.modalContent} pointerEvents="box-none">
                        <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <MaterialIcons name="delete-outline" size={28} color="#ef4444" />
                        </View>
                        <Text style={styles.modalTitle}>Discard Workout</Text>
                        <Text style={styles.modalMsg}>Are you sure you want to discard this workout? Your progress will not be saved.</Text>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowDiscardModal(false)}>
                                <Text style={styles.modalBtnCancelText}>Keep Going</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnConfirmDanger} onPress={executeDiscard}>
                                <Text style={styles.modalBtnConfirmTextDanger}>Discard</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={showFinishModal} animationType="fade" onRequestClose={() => setShowFinishModal(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setShowFinishModal(false)}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>
                    <View style={styles.modalContent} pointerEvents="box-none">
                        <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '18' }]}>
                            <MaterialIcons name="emoji-events" size={28} color={colors.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Finish Workout</Text>
                        <Text style={styles.modalMsg}>You are about to complete the "{routine.name}" workout. Great job!</Text>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowFinishModal(false)}>
                                <Text style={styles.modalBtnCancelText}>Not Yet</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnConfirm} onPress={executeFinish}>
                                <Text style={styles.modalBtnConfirmText}>Finish Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Search Modal */}
            <ExerciseSearchModal
                visible={showExSearch}
                onClose={() => {
                    setShowExSearch(false);
                    setReplaceExIndex(null);
                }}
                onSelect={handleAddExercise}
            />

            {/* Exercise Action Modal (Bottom Sheet Replace/Remove) */}
            <ExerciseActionModal
                visible={actionModalVisible}
                onClose={() => {
                    setActionModalVisible(false);
                    setActionExIndex(null);
                }}
                onReplace={() => {
                    setActionModalVisible(false);
                    setReplaceExIndex(actionExIndex);
                    setShowExSearch(true);
                }}
                onRemove={handleRemoveExercise}
                title={actionExIndex !== null ? exerciseLogs[actionExIndex]?.name : 'Exercise'}
            />
        </View>
    );
}

const { width: SW } = Dimensions.get('window');

const getStyles = (colors, themeMode) => {
    const isOled = themeMode === 'oled';
    const restTimerSurface = isOled ? '#141414' : colors.inputBg;
    const setRowSurface = isOled ? '#141414' : colors.cardBg;

    return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    minimizeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.inputBg,
        alignItems: 'center', justifyContent: 'center',
    },
    headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    headerTitle: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.3, textTransform: 'uppercase' },
    headerSubtitle: { color: colors.textSecondary, fontSize: 10, fontFamily: 'SpaceGrotesk_500Medium', letterSpacing: 1.5, textTransform: 'uppercase' },
    headerRight: { alignItems: 'flex-end' },
    totalTimeLabel: {
        color: colors.textSecondary, fontSize: 9, fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 2, textTransform: 'uppercase',
    },
    totalTimeValue: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
    totalTimeSecs: { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' },

    // Content
    content: { paddingHorizontal: 16, paddingTop: 16 },
    reorderModeContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    reorderHintText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        marginBottom: 14,
    },

    // Exercise section
    exerciseSection: {
        position: 'relative',
        marginBottom: 28,
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    exerciseHeader: { marginBottom: 10, paddingHorizontal: 4, paddingRight: 44 },
    exerciseMenuBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
        padding: 4,
    },
    exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    exerciseName: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.2, textTransform: 'uppercase' },
    restRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },

    restPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 6, paddingVertical: 3,
        backgroundColor: restTimerSurface,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 6,
    },
    restPillCombined: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        gap: 6,
    },
    restPillLabel: {
        color: colors.textMuted,
        fontSize: 8,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    restPillText: { color: colors.textMuted, fontSize: 9, fontFamily: 'SpaceGrotesk_700Bold', fontVariant: ['tabular-nums'], letterSpacing: 0.8 },

    // Column headers
    colHeaders: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 4, marginBottom: 6,
    },
    colHeader: { color: colors.textSecondary, fontSize: 9, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Set rows
    setRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: setRowSurface,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 10, padding: 8, marginBottom: 7,
    },
    setRowCompleted: {
        opacity: 0.55,
    },
    setRowActive: {
        backgroundColor: setRowSurface,
        borderColor: colors.primary,
    },
    setNum: { width: 36, textAlign: 'center', fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold', color: colors.textMuted, fontVariant: ['tabular-nums'] },
    setNumDone: { color: colors.textSecondary },
    setNumActive: { color: colors.text },

    prevBadge: {
        flex: 1, backgroundColor: colors.inputBg,
        borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8,
    },
    prevText: { color: colors.textMuted, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold', fontVariant: ['tabular-nums'] },

    inputCell: {
        width: 58, backgroundColor: colors.inputBg,
        borderRadius: 6, paddingVertical: 6, alignItems: 'center',
    },
    inputText: { color: colors.text, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold', fontVariant: ['tabular-nums'] },
    inputTextActive: { color: colors.primary },
    inputTextDone: { color: colors.textSecondary },
    inputTextPR: { color: colors.primary },

    checkWrap: { width: 36, alignItems: 'flex-end', paddingRight: 2 },
    checkWrapFilled: {
        backgroundColor: colors.inputBg,
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkWrapEmpty: {
        alignItems: 'flex-end',
        paddingRight: 2,
    },
    checkFilled: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    checkEmpty: {
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 2, borderColor: colors.borderLight,
    },
    checkEmptyActive: { borderColor: colors.border },

    // Set actions
    setActions: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 4, paddingTop: 4,
    },
    setActionText: { color: colors.textSecondary, fontSize: 10, fontFamily: 'SpaceGrotesk_600SemiBold' },

    // PR Badge Celebration
    inputCellPR: {
        backgroundColor: isOled ? 'rgba(37, 244, 106, 0.12)' : colors.primaryDim,
        borderColor: isOled ? 'rgba(37, 244, 106, 0.55)' : colors.primary,
        borderWidth: 1,
        shadowColor: colors.primary,
        shadowOpacity: isOled ? 0.16 : 0,
        shadowRadius: isOled ? 4 : 0,
        shadowOffset: { width: 0, height: isOled ? 2 : 0 },
        elevation: isOled ? 2 : 0,
    },
    prBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 999,
        paddingHorizontal: 0,
        paddingVertical: 0,
    },

    // Rest popup
    restPopup: {
        position: 'absolute', left: 16, right: 16, bottom: 210,
        backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 14, overflow: 'hidden', zIndex: 50,
        shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }, elevation: 10,
    },
    restPopupInline: {
        position: 'relative',
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        marginTop: 12,
        zIndex: 1,
    },
    restProgressBar: {
        height: 2, backgroundColor: colors.inputBg, width: '100%',
    },
    restProgressFill: { height: '100%', backgroundColor: colors.primary },
    restPopupBody: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 10, gap: 8,
    },
    restPopupLabel: {
        color: colors.textSecondary, fontSize: 8, fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 2.5, textTransform: 'uppercase',
    },
    restPopupTime: {
        color: colors.text, fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold',
        fontVariant: ['tabular-nums'], letterSpacing: -1.5, marginTop: 2,
    },
    restPopupBtns: { flexDirection: 'row', gap: 8 },
    restPopupBtn: {
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 8,
    },
    restPopupBtnText: { color: colors.text, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 },

    // Bottom bar
    bottomBar: {
        paddingHorizontal: 16, paddingTop: 8,
        backgroundColor: colors.bg,
    },
    addExerciseBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 14, paddingVertical: 12, marginBottom: 8,
    },
    addExerciseText: {
        color: colors.text,
        fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.8,
    },
    discardBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.red500 + '33',
        borderRadius: 14, paddingVertical: 12, marginBottom: 8,
    },
    discardBtnText: {
        color: colors.red500,
        fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.8,
    },
    finishBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.primary,
        borderRadius: 14, paddingVertical: 12,
        shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    finishBtnText: {
        color: colors.textOnPrimary,
        fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.8,
    },

    // Modals
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.bg,
        borderRadius: 24, padding: 24,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    modalIconContainer: {
        width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', color: colors.text,
        marginBottom: 8, textAlign: 'center', letterSpacing: -0.5,
    },
    modalMsg: {
        fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium', color: colors.textMuted,
        textAlign: 'center', marginBottom: 24, lineHeight: 20,
    },
    modalBtns: { width: '100%', gap: 12 },
    modalBtnCancel: {
        width: '100%', paddingVertical: 16, borderRadius: 16,
        backgroundColor: colors.bgCard,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    modalBtnCancelText: { color: colors.textSecondary, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
    modalBtnConfirm: {
        width: '100%', paddingVertical: 16, borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    modalBtnConfirmText: { color: colors.textOnPrimary, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
    modalBtnConfirmDanger: {
        width: '100%', paddingVertical: 16, borderRadius: 16,
        backgroundColor: colors.red500,
        alignItems: 'center', shadowColor: colors.red500, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    modalBtnConfirmTextDanger: { color: '#fff', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
});
};
