import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    scrollTo,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const ROW_HEIGHT = 88;
const ROW_GAP = 12;
const ROW_SIZE = ROW_HEIGHT + ROW_GAP;
const EDGE_THRESHOLD = 96;
const AUTO_SCROLL_STEP = 22;
const SPRING_CONFIG = {
    damping: 18,
    mass: 0.35,
    stiffness: 240,
    restDisplacementThreshold: 0.2,
    restSpeedThreshold: 0.2,
};

const ROUTINE_ICONS = [
    { lib: MaterialCommunityIcons, name: 'dumbbell' },
    { lib: MaterialIcons, name: 'fitness-center' },
    { lib: MaterialIcons, name: 'directions-run' },
    { lib: MaterialCommunityIcons, name: 'arm-flex' },
];

const clampValue = (value, min, max) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
};

const buildPositionMap = (routines) => {
    const next = {};
    routines.forEach((routine, index) => {
        next[routine.id] = index;
    });
    return next;
};

const buildOrderIdsFromPositions = (positions) => {
    'worklet';
    return Object.keys(positions).sort((left, right) => positions[left] - positions[right]);
};

const movePositionMap = (positions, activeId, targetIndex) => {
    'worklet';
    const currentIndex = positions[activeId];
    if (currentIndex === targetIndex) return positions;

    const next = { ...positions };

    Object.keys(next).forEach((id) => {
        const position = next[id];

        if (id === activeId) {
            next[id] = targetIndex;
            return;
        }

        if (currentIndex < targetIndex && position > currentIndex && position <= targetIndex) {
            next[id] = position - 1;
        } else if (currentIndex > targetIndex && position >= targetIndex && position < currentIndex) {
            next[id] = position + 1;
        }
    });

    return next;
};

const triggerPickupHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const triggerPassHaptic = () => {
    void Haptics.selectionAsync();
};

const triggerDropHaptic = () => {
    void Haptics.selectionAsync();
};

const ReorderRow = memo(function ReorderRow({
    routine,
    colors,
    isDark,
    generalLabel,
    exercisesLabel,
    positions,
    activeId,
    dragTop,
    scrollY,
    scrollRef,
    scrollGesture,
    containerHeight,
    itemCount,
    onDragStateChange,
    onOrderResolved,
}) {
    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const startTop = useSharedValue(0);
    const startScrollY = useSharedValue(0);
    const didHandleDrop = useSharedValue(false);
    const lastHoverIndex = useSharedValue(0);

    const hash = useMemo(
        () => (routine.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
        [routine.id]
    );
    const iconConfig = ROUTINE_ICONS[hash % ROUTINE_ICONS.length];
    const IconLib = iconConfig.lib;
    const exerciseCount = routine.exercises?.length || 0;
    const metaText = ((routine.exercises || [])
        .slice(0, 2)
        .map((exercise) => exercise.muscleGroup || exercise.name)
        .filter(Boolean)
        .join(', ') || generalLabel) + ` - ${exerciseCount} ${exercisesLabel}`;

    const animatedStyle = useAnimatedStyle(() => {
        const isActive = activeId.value === routine.id;
        const top = isActive ? dragTop.value : withSpring((positions.value[routine.id] || 0) * ROW_SIZE, SPRING_CONFIG);

        return {
            position: 'absolute',
            left: 0,
            right: 0,
            top,
            zIndex: isActive ? 100 : 1,
            transform: [{ scale: withSpring(isActive ? 1.015 : 1, SPRING_CONFIG) }],
        };
    }, [routine.id]);

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .activateAfterLongPress(180)
                .minDistance(1)
                .blocksExternalGesture(scrollGesture)
                .onStart(() => {
                    didHandleDrop.value = false;
                    startTop.value = (positions.value[routine.id] || 0) * ROW_SIZE;
                    startScrollY.value = scrollY.value;
                    lastHoverIndex.value = positions.value[routine.id] || 0;
                    dragTop.value = startTop.value;
                    activeId.value = routine.id;
                    runOnJS(onDragStateChange)(true);
                    runOnJS(triggerPickupHaptic)();
                })
                .onUpdate((event) => {
                    if (activeId.value !== routine.id) return;

                    const maxTop = Math.max(0, (itemCount - 1) * ROW_SIZE);
                    const contentHeight = Math.max(ROW_HEIGHT, itemCount * ROW_SIZE - ROW_GAP);
                    const maxScrollY = Math.max(0, contentHeight - containerHeight.value);

                    let nextScrollY = scrollY.value;
                    const currentTop = clampValue(
                        startTop.value + event.translationY + (scrollY.value - startScrollY.value),
                        0,
                        maxTop
                    );
                    const visibleTop = currentTop - scrollY.value;
                    const visibleBottom = visibleTop + ROW_HEIGHT;

                    if (visibleTop < EDGE_THRESHOLD) {
                        nextScrollY = clampValue(scrollY.value - AUTO_SCROLL_STEP, 0, maxScrollY);
                    } else if (visibleBottom > containerHeight.value - EDGE_THRESHOLD) {
                        nextScrollY = clampValue(scrollY.value + AUTO_SCROLL_STEP, 0, maxScrollY);
                    }

                    if (nextScrollY !== scrollY.value) {
                        scrollY.value = nextScrollY;
                        scrollTo(scrollRef, 0, nextScrollY, false);
                    }

                    const nextTop = clampValue(
                        startTop.value + event.translationY + (scrollY.value - startScrollY.value),
                        0,
                        maxTop
                    );

                    dragTop.value = nextTop;

                    const targetIndex = clampValue(
                        Math.round(nextTop / ROW_SIZE),
                        0,
                        Math.max(0, itemCount - 1)
                    );

                    if (targetIndex !== positions.value[routine.id]) {
                        positions.value = movePositionMap(positions.value, routine.id, targetIndex);
                    }

                    if (targetIndex !== lastHoverIndex.value) {
                        lastHoverIndex.value = targetIndex;
                        runOnJS(triggerPassHaptic)();
                    }
                })
                .onEnd(() => {
                    if (activeId.value !== routine.id) return;

                    didHandleDrop.value = true;
                    const finalIndex = positions.value[routine.id] || 0;
                    const finalTop = finalIndex * ROW_SIZE;
                    const nextOrderIds = buildOrderIdsFromPositions(positions.value);

                    dragTop.value = withSpring(finalTop, SPRING_CONFIG, (finished) => {
                        if (finished && activeId.value === routine.id) {
                            activeId.value = null;
                            runOnJS(onDragStateChange)(false);
                        }
                    });

                    runOnJS(onOrderResolved)(nextOrderIds);
                    runOnJS(triggerDropHaptic)();
                })
                .onFinalize(() => {
                    if (!didHandleDrop.value && activeId.value === routine.id) {
                        dragTop.value = withSpring((positions.value[routine.id] || 0) * ROW_SIZE, SPRING_CONFIG);
                        activeId.value = null;
                        runOnJS(onDragStateChange)(false);
                    }

                    didHandleDrop.value = false;
                }),
        [
            activeId,
            containerHeight,
            didHandleDrop,
            dragTop,
            itemCount,
            onDragStateChange,
            onOrderResolved,
            positions,
            routine.id,
            scrollGesture,
            scrollRef,
            scrollY,
            lastHoverIndex,
            startScrollY,
            startTop,
        ]
    );

    return (
        <Animated.View style={animatedStyle}>
            <View style={styles.routineCard}>
                <View style={styles.routineRow}>
                    <View style={styles.routineIconSquare}>
                        <IconLib name={iconConfig.name} size={22} color={colors.textMuted} />
                    </View>

                    <View style={styles.routineTextBlock}>
                        <Text style={styles.routineName} numberOfLines={1}>
                            {routine.name}
                        </Text>
                        <Text style={styles.routineMeta} numberOfLines={1}>
                            {metaText}
                        </Text>
                    </View>

                    <GestureDetector gesture={panGesture}>
                        <View style={styles.handleBadge}>
                            <MaterialIcons name="drag-handle" size={24} color={colors.textSecondary} />
                        </View>
                    </GestureDetector>
                </View>
            </View>
        </Animated.View>
    );
});

export default function RoutineReorderList({
    routines,
    colors,
    isDark,
    generalLabel,
    exercisesLabel,
    onOrderChange,
}) {
    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const scrollRef = useAnimatedRef();
    const scrollY = useSharedValue(0);
    const positions = useSharedValue(buildPositionMap(routines));
    const activeId = useSharedValue(null);
    const dragTop = useSharedValue(0);
    const containerHeight = useSharedValue(0);
    const scrollGesture = useMemo(() => Gesture.Native(), []);
    const routinesRef = useRef(routines);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        routinesRef.current = routines;
        positions.value = buildPositionMap(routines);
    }, [positions, routines]);

    const handleOrderResolved = useCallback(
        (nextOrderIds) => {
            const routinesById = new Map(routinesRef.current.map((routine) => [routine.id, routine]));
            const nextRoutines = nextOrderIds
                .map((id) => routinesById.get(id))
                .filter(Boolean);

            const previousIds = routinesRef.current.map((routine) => routine.id).join('|');
            const nextIds = nextRoutines.map((routine) => routine.id).join('|');

            if (nextIds && nextIds !== previousIds) {
                onOrderChange(nextRoutines);
            }
        },
        [onOrderChange]
    );

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const contentHeight = Math.max(ROW_HEIGHT, routines.length * ROW_SIZE - ROW_GAP);

    return (
        <View
            style={styles.container}
            onLayout={(event) => {
                containerHeight.value = event.nativeEvent.layout.height;
            }}
        >
            <GestureDetector gesture={scrollGesture}>
                <AnimatedScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    scrollEnabled={!isDragging}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={{ height: contentHeight }}>
                        {routines.map((routine) => (
                            <ReorderRow
                                key={routine.id}
                                routine={routine}
                                colors={colors}
                                isDark={isDark}
                                generalLabel={generalLabel}
                                exercisesLabel={exercisesLabel}
                                positions={positions}
                                activeId={activeId}
                                dragTop={dragTop}
                                scrollY={scrollY}
                                scrollRef={scrollRef}
                                scrollGesture={scrollGesture}
                                containerHeight={containerHeight}
                                itemCount={routines.length}
                                onDragStateChange={setIsDragging}
                                onOrderResolved={handleOrderResolved}
                            />
                        ))}
                    </View>
                </AnimatedScrollView>
            </GestureDetector>
        </View>
    );
}

const getStyles = (colors, isDark) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scroll: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 40,
        },
        routineCard: {
            height: ROW_HEIGHT,
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.primary,
            shadowOpacity: isDark ? 0.16 : 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
        },
        routineRow: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        routineIconSquare: {
            width: 48,
            height: 48,
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
        },
        routineTextBlock: {
            flex: 1,
            minWidth: 0,
        },
        routineName: {
            color: colors.text,
            fontSize: 14,
            fontFamily: 'SpaceGrotesk_700Bold',
        },
        routineMeta: {
            color: colors.textSecondary,
            fontSize: 11,
            marginTop: 2,
        },
        handleBadge: {
            width: 38,
            height: 38,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            borderWidth: 1,
            borderColor: colors.border,
        },
    });
