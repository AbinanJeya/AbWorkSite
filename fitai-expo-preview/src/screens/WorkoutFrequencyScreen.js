import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import {
    buildWorkoutTargetSettingsPatch,
    getSettings,
    getUserProfile,
    saveSettings,
    saveUserProfile,
} from '../services/storage';
import { getCurrentUser, saveProfileToCloud } from '../services/auth';

const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function WorkoutFrequencyScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();
    const [selectedTarget, setSelectedTarget] = useState(3);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [settings, profile] = await Promise.all([getSettings(), getUserProfile()]);
                if (!mounted) return;
                setSelectedTarget(
                    Number(profile?.workoutDaysPerWeekTarget || settings?.workoutDaysPerWeekTarget || 3)
                );
            } catch {
                if (mounted) setSelectedTarget(3);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const handleContinue = async () => {
        try {
            const [settings, profile] = await Promise.all([getSettings(), getUserProfile()]);
            const targetPatch = buildWorkoutTargetSettingsPatch(settings, selectedTarget);
            const nextProfile = {
                ...(profile || {}),
                workoutDaysPerWeekTarget: targetPatch.workoutDaysPerWeekTarget,
            };

            await saveSettings(targetPatch);
            await saveUserProfile(nextProfile);

            const user = getCurrentUser();
            if (user?.uid) {
                await saveProfileToCloud(user.uid, nextProfile);
            }

            navigation.replace('NutritionQuestionnaire');
        } catch (error) {
            console.error('Workout frequency save error:', error);
            Alert.alert('Error', 'Failed to save your weekly gym target.');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AbWork</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.eyebrow}>SET YOUR STREAK TARGET</Text>
                <Text style={styles.title}>How many days per week do you usually go to the gym?</Text>
                <Text style={styles.subtitle}>
                    Your workout streak will count full weeks where you hit this target.
                </Text>

                <View style={styles.optionsGrid}>
                    {TARGET_OPTIONS.map((target) => {
                        const selected = target === selectedTarget;
                        return (
                            <TouchableOpacity
                                key={target}
                                style={[styles.optionCard, selected && styles.optionCardSelected]}
                                onPress={() => setSelectedTarget(target)}
                                activeOpacity={0.82}
                            >
                                {target === 3 && (
                                    <View style={styles.recommendedBadge}>
                                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                    </View>
                                )}
                                <Text style={[styles.optionValue, selected && styles.optionValueSelected]}>{target}</Text>
                                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                                    {target === 1 ? 'day / week' : 'days / week'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.noteCard}>
                    <MaterialIcons name="emoji-events" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.noteTitle}>Weekly streaks stay fair</Text>
                        <Text style={styles.noteText}>
                            If you hit {selectedTarget} {selectedTarget === 1 ? 'day' : 'days'} in a week, that week counts toward your streak and can earn the weekly XP bonus.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.ctaButton} onPress={handleContinue}>
                    <Text style={styles.ctaText}>Continue</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={colors.bgDark} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDark },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    headerTitle: { color: colors.text, fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
    content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 120 },
    eyebrow: {
        color: colors.primary,
        fontSize: 12,
        letterSpacing: 2,
        fontFamily: 'SpaceGrotesk_700Bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    title: {
        color: colors.text,
        fontSize: 30,
        lineHeight: 36,
        fontFamily: 'SpaceGrotesk_700Bold',
        textAlign: 'center',
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'SpaceGrotesk_500Medium',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 28,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    optionCard: {
        width: '30%',
        minWidth: 92,
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        paddingVertical: 22,
        paddingHorizontal: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    optionCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryDim,
    },
    recommendedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    recommendedText: {
        color: colors.primary,
        fontSize: 9,
        letterSpacing: 1.2,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    optionValue: {
        color: colors.text,
        fontSize: 34,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    optionValueSelected: { color: colors.primary },
    optionLabel: {
        color: colors.textSecondary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 6,
    },
    optionLabelSelected: { color: colors.text },
    noteCard: {
        marginTop: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgCard,
        padding: 18,
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
    },
    noteTitle: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 6,
    },
    noteText: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: colors.bgDark,
    },
    ctaButton: {
        height: 56,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    ctaText: {
        color: colors.bgDark,
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
});
