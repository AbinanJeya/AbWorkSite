import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ELEVATION } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

const icons = {
    run: 'directions-run',
    strength: 'fitness-center',
    cardio: 'favorite',
    yoga: 'self-improvement',
    cycling: 'directions-bike',
    swimming: 'pool',
    default: 'fitness-center',
};

const WorkoutCard = React.memo(({ name, type, duration, time, caloriesBurned, completed, onToggle, opacity = 1 }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const icon = icons[type] || icons.default;

    const iconColors = {
        run: { bg: colors.blueBg, text: colors.blue500 },
        walk: { bg: colors.primaryDim, text: colors.primary },
        strength: { bg: colors.orangeBg, text: colors.orange500 },
        cardio: { bg: colors.orangeBg, text: colors.orange500 },
        yoga: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
        cycling: { bg: colors.primaryDim, text: colors.primary },
        swimming: { bg: colors.blueBg, text: colors.blue500 },
        default: { bg: colors.primaryDim, text: colors.primary },
    };

    const typeColors = iconColors[type] || iconColors.default;

    return (
        <View style={[styles.card, { opacity }]}> 
            <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: typeColors.bg }]}>
                    <MaterialIcons name={icon} size={22} color={typeColors.text} />
                </View>
                <View style={styles.body}>
                    <Text style={styles.name}>{name}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.meta}>{time ? `${time}` : 'Completed'}</Text>
                        {duration !== undefined ? (
                            <View style={[styles.metaBadge, styles.durationBadge]}>
                                <MaterialIcons name="schedule" size={12} color={colors.primary} />
                                <Text style={[styles.metaBadgeText, styles.durationBadgeText]}>{duration} min</Text>
                            </View>
                        ) : null}
                        {typeof caloriesBurned === 'number' && caloriesBurned > 0 ? (
                            <View style={styles.metaBadge}>
                                <MaterialIcons name="local-fire-department" size={12} color={colors.orange500} />
                                <Text style={styles.metaBadgeText}>{caloriesBurned} kcal</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
                {onToggle && (
                    <TouchableOpacity onPress={onToggle} style={styles.checkArea}>
                        <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
                            {completed && <MaterialIcons name="check" size={14} color={colors.bgDark} />}
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

export default WorkoutCard;

const getStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.cardBg || colors.bgCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        shadowColor: colors.shadowSoft,
        ...ELEVATION.card,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
    },
    name: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 14,
        color: colors.text,
    },
    meta: {
        fontSize: 12,
        color: colors.slate400,
        marginTop: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        flexWrap: 'wrap',
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.orangeBg,
    },
    metaBadgeText: {
        color: colors.orange500,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    durationBadge: {
        backgroundColor: colors.primaryDim,
    },
    durationBadgeText: {
        color: colors.primary,
    },
    checkArea: {
        padding: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
});
