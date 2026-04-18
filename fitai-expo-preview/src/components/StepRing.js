import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme, MOTION } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const StepRing = React.memo(({ steps = 0, goal = 10000, size = 220 }) => {
    const { colors, themeMode } = useTheme();
    const styles = getStyles(colors);

    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(steps / goal, 1);
    const center = size / 2;
    const progressValue = useSharedValue(circumference);

    React.useEffect(() => {
        progressValue.value = withTiming(circumference * (1 - progress), { duration: MOTION.slow });
    }, [circumference, progress, progressValue]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: progressValue.value,
    }));

    const stepsRemaining = Math.max(goal - steps, 0);
    const progressLabel = progress >= 1
        ? 'Goal hit'
        : progress >= 0.72
            ? 'Strong pace'
            : stepsRemaining < 1500
                ? 'Almost there'
                : `${stepsRemaining.toLocaleString()} left`;

    return (
        <View style={styles.container}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={themeMode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={colors.primary}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                />
            </Svg>
            <View style={styles.centerContent}>
                <MaterialCommunityIcons name="shoe-print" size={28} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={styles.count}>{steps.toLocaleString()}</Text>
                <Text style={styles.goal}>/ {goal.toLocaleString()} steps</Text>
                <View style={styles.pacePill}>
                    <Text style={styles.paceText}>{progressLabel}</Text>
                </View>
            </View>
        </View>
    );
});

export default StepRing;

const getStyles = (colors) => StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 28,
        marginBottom: 4,
    },
    count: {
        fontSize: 36,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: colors.text,
    },
    goal: {
        fontSize: 14,
        color: colors.slate400,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    pacePill: {
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: colors.primaryDim,
        borderWidth: 1,
        borderColor: colors.primaryMid,
    },
    paceText: {
        fontSize: 11,
        color: colors.primary,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 0.2,
    },
});
