import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { MaterialIcons } from '@expo/vector-icons';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const ROW_HEIGHT = 72;
const ROW_GAP = 8;
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

const clampValue = (value, min, max) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
};

const buildPositionMap = (items) => {
    const next = {};
    items.forEach((item, index) => {
        next[item.id] = index;
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

const getIconLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'E');

const ExerciseRow = memo(function ExerciseRow({
    exercise,
    colors,
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
    const styles = useMemo(() => getStyles(colors), [colors]);
    const startTop = useSharedValue(0);
    const startScrollY = useSharedValue(0);
    const didHandleDrop = useSharedValue(false);
    const lastHoverIndex = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        const isActive = activeId.value === exercise.id;
        const top = isActive ? dragTop.value : withSpring((positions.value[exercise.id] || 0) * ROW_SIZE, SPRING_CONFIG);

        return {
            position: 'absolute',
            left: 0,
            right: 0,
            top,
            zIndex: isActive ? 100 : 1,
            transform: [{ scale: withSpring(isActive ? 1.01 : 1, SPRING_CONFIG) }],
        };
    }, [exercise.id]);

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .activateAfterLongPress(180)
                .minDistance(1)
                .blocksExternalGesture(scrollGesture)
                .onStart(() => {
                    didHandleDrop.value = false;
                    startTop.value = (positions.value[exercise.id] || 0) * ROW_SIZE;
                    startScrollY.value = scrollY.value;
                    lastHoverIndex.value = positions.value[exercise.id] || 0;
                    dragTop.value = startTop.value;
                    activeId.value = exercise.id;
                    runOnJS(onDragStateChange)(true);
                    runOnJS(triggerPickupHaptic)();
                })
                .onUpdate((event) => {
                    if (activeId.value !== exercise.id) return;

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

                    if (targetIndex !== positions.value[exercise.id]) {
                        positions.value = movePositionMap(positions.value, exercise.id, targetIndex);
                    }

                    if (targetIndex !== lastHoverIndex.value) {
                        lastHoverIndex.value = targetIndex;
                        runOnJS(triggerPassHaptic)();
                    }
                })
                .onEnd(() => {
                    if (activeId.value !== exercise.id) return;

                    didHandleDrop.value = true;
                    const finalIndex = positions.value[exercise.id] || 0;
                    const finalTop = finalIndex * ROW_SIZE;
                    const nextOrderIds = buildOrderIdsFromPositions(positions.value);

                    dragTop.value = withSpring(finalTop, SPRING_CONFIG, (finished) => {
                        if (finished && activeId.value === exercise.id) {
                            activeId.value = null;
                            runOnJS(onDragStateChange)(false);
                        }
                    });

                    runOnJS(onOrderResolved)(nextOrderIds);
                    runOnJS(triggerDropHaptic)();
                })
                .onFinalize(() => {
                    if (!didHandleDrop.value && activeId.value === exercise.id) {
                        dragTop.value = withSpring((positions.value[exercise.id] || 0) * ROW_SIZE, SPRING_CONFIG);
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
            exercise.id,
            itemCount,
            onDragStateChange,
            onOrderResolved,
            positions,
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
            <View style={styles.exerciseCard}>
                <View style={styles.exerciseRow}>
                    <View style={styles.iconBadge}>
                        {exercise.gifUrl ? (
                            <Image source={{ uri: exercise.gifUrl }} style={styles.iconImg} />
                        ) : (
                            <Text style={styles.iconLetter}>{getIconLetter(exercise.name)}</Text>
                        )}
                    </View>

                    <View style={styles.textBlock}>
                        <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
                    </View>

                    <View style={styles.rightGroup}>
                        <GestureDetector gesture={panGesture}>
                            <View style={styles.handleBadge}>
                                <MaterialIcons name="drag-handle" size={24} color={colors.textSecondary} />
                            </View>
                        </GestureDetector>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
});

export default function ExerciseReorderList({
    exercises,
    colors,
    onOrderChange,
    footer = null,
}) {
    const styles = useMemo(() => getStyles(colors), [colors]);
    const scrollRef = useAnimatedRef();
    const scrollY = useSharedValue(0);
    const positions = useSharedValue(buildPositionMap(exercises));
    const activeId = useSharedValue(null);
    const dragTop = useSharedValue(0);
    const containerHeight = useSharedValue(0);
    const scrollGesture = useMemo(() => Gesture.Native(), []);
    const exercisesRef = useRef(exercises);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        exercisesRef.current = exercises;
        positions.value = buildPositionMap(exercises);
    }, [exercises, positions]);

    const handleOrderResolved = useCallback((nextOrderIds) => {
        const exercisesById = new Map(exercisesRef.current.map((exercise) => [exercise.id, exercise]));
        const nextExercises = nextOrderIds
            .map((id) => exercisesById.get(id))
            .filter(Boolean);

        const previousIds = exercisesRef.current.map((exercise) => exercise.id).join('|');
        const nextIds = nextExercises.map((exercise) => exercise.id).join('|');

        if (nextIds && nextIds !== previousIds) {
            onOrderChange(nextExercises);
        }
    }, [onOrderChange]);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const contentHeight = Math.max(ROW_HEIGHT, exercises.length * ROW_SIZE - ROW_GAP);

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
                        {exercises.map((exercise) => (
                            <ExerciseRow
                                key={exercise.id}
                                exercise={exercise}
                                colors={colors}
                                positions={positions}
                                activeId={activeId}
                                dragTop={dragTop}
                                scrollY={scrollY}
                                scrollRef={scrollRef}
                                scrollGesture={scrollGesture}
                                containerHeight={containerHeight}
                                itemCount={exercises.length}
                                onDragStateChange={setIsDragging}
                                onOrderResolved={handleOrderResolved}
                            />
                        ))}
                    </View>
                    {footer ? <View style={styles.footerWrap}>{footer}</View> : null}
                </AnimatedScrollView>
            </GestureDetector>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    footerWrap: {
        marginTop: 12,
    },
    exerciseCard: {
        height: ROW_HEIGHT,
        backgroundColor: colors.bgCard,
        borderRadius: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowSoft,
        shadowOpacity: 0.11,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
    },
    exerciseRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconImg: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    iconLetter: {
        color: colors.text,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    textBlock: {
        flex: 1,
        minWidth: 0,
    },
    exerciseName: {
        color: colors.text,
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: -0.1,
        textTransform: 'uppercase',
    },
    rightGroup: {
        alignItems: 'flex-end',
    },
    handleBadge: {
        width: 38,
        height: 34,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.border,
    },
});
