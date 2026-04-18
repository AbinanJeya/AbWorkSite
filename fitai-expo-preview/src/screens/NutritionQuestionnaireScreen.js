import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { saveUserProfile, getUserProfile } from '../services/storage';
import { getCurrentUser, saveProfileToCloud } from '../services/auth';

const QUESTIONS = [
    {
        id: 'dietaryRestrictions',
        title: 'Any dietary restrictions?',
        multiple: true,
        options: [
            { label: 'None', val: 'none' },
            { label: 'Vegetarian', val: 'vegetarian' },
            { label: 'Vegan', val: 'vegan' },
            { label: 'Keto', val: 'keto' },
            { label: 'Gluten-Free', val: 'gluten_free' },
            { label: 'Dairy-Free', val: 'dairy_free' },
            { label: 'Low Carb', val: 'low_carb' },
        ]
    },
    {
        id: 'struggle',
        title: 'What do you struggle with most?',
        multiple: false,
        options: [
            { label: 'Consistency', val: 'consistency' },
            { label: 'Cravings', val: 'cravings' },
            { label: 'Weekend Eating', val: 'weekends' },
            { label: 'Fast Food', val: 'fast_food' },
            { label: 'Lack of Time', val: 'time' },
        ]
    },
    {
        id: 'planType',
        title: 'Plan Preference?',
        multiple: false,
        options: [
            { label: 'Strict Plan', val: 'strict', icon: 'list-alt' },
            { label: 'Flexible Approach', val: 'flexible', icon: 'shuffle' },
        ]
    },
    {
        id: 'mealCount',
        title: 'Meals per day?',
        multiple: false,
        options: [
            { label: '2 Meals', val: 2 },
            { label: '3 Meals', val: 3 },
            { label: '4 Meals', val: 4 },
            { label: '5 Meals', val: 5 },
            { label: '6+ Meals', val: 6 },
        ]
    },
    {
        id: 'cookingStyle',
        title: 'Your Cooking Vibe?',
        multiple: false,
        options: [
            { label: 'Quick & Easy (15m)', val: 'minimalist', icon: 'timer' },
            { label: 'Home Cook (30-45m)', val: 'standard', icon: 'restaurant' },
            { label: 'Elite Chef (Loves prep)', val: 'chef', icon: 'skillet' },
            { label: 'Takeout Pro (Healthy hacks)', val: 'takeout', icon: 'delivery-dining' },
        ]
    },
    {
        id: 'energyWindow',
        title: 'Peak Energy Window?',
        multiple: false,
        options: [
            { label: 'Early Bird (5am-9am)', val: 'morning', icon: 'wb-twilight' },
            { label: 'Mid-day Warrior (11am-2pm)', val: 'midday', icon: 'wb-sunny' },
            { label: 'Evening Surge (5pm-8pm)', val: 'evening', icon: 'brightness-3' },
            { label: 'Night Owl (10pm+)', val: 'night', icon: 'bedtime' },
        ]
    }
];

export default function NutritionQuestionnaireScreen({ navigation, route }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({
        dietaryRestrictions: ['none'],
        struggle: 'consistency',
        planType: 'flexible',
        mealCount: 3,
        cookingStyle: 'minimalist',
        energyWindow: 'midday'
    });

    const question = QUESTIONS[currentStep];

    const toggleOption = (val) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (question.multiple) {
            let current = answers[question.id] || [];
            if (val === 'none') {
                setAnswers({ ...answers, [question.id]: ['none'] });
            } else {
                let filtered = current.filter(x => x !== 'none');
                if (filtered.includes(val)) {
                    filtered = filtered.filter(x => x !== val);
                    if (filtered.length === 0) filtered = ['none'];
                } else {
                    filtered.push(val);
                }
                setAnswers({ ...answers, [question.id]: filtered });
            }
        } else {
            setAnswers({ ...answers, [question.id]: val });
        }
    };

    const handleNext = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Finalize
            try {
                const existing = await getUserProfile() || {};
                const fullProfile = {
                    ...existing,
                    ...answers,
                    onboardingComplete: true
                };

                await saveUserProfile(fullProfile);
                
                const user = getCurrentUser();
                if (user?.uid) {
                    await saveProfileToCloud(user.uid, fullProfile);
                }

                if (route.params?.fromSettings) {
                    navigation.goBack();
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to save preferences.');
            }
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                {currentStep > 0 && (
                    <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(currentStep - 1)}>
                        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <Text style={styles.stepText}>Step {currentStep + 1} of {QUESTIONS.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{question.title}</Text>
                
                <View style={styles.optionsGrid}>
                    {question.options.map((opt) => {
                        const isSelected = question.multiple 
                            ? answers[question.id].includes(opt.val)
                            : answers[question.id] === opt.val;
                        
                        return (
                            <TouchableOpacity
                                key={String(opt.val)}
                                style={[styles.optionCard, isSelected && styles.optionSelected]}
                                onPress={() => toggleOption(opt.val)}
                                activeOpacity={0.7}
                            >
                                {opt.icon && (
                                    <MaterialIcons name={opt.icon} size={20} color={isSelected ? colors.bgDark : colors.primary} style={{ marginBottom: 8 }} />
                                )}
                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                    {opt.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkWrap}>
                                        <MaterialIcons name="check-circle" size={16} color={colors.bgDark} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>
                        {currentStep === QUESTIONS.length - 1 ? 'Finish Setup' : 'Continue'}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color={colors.bgDark} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDark },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },
    stepText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    content: { paddingHorizontal: 20, paddingTop: 10 },
    title: { color: colors.text, fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 24, textAlign: 'center' },
    optionsGrid: { gap: 12 },
    optionCard: {
        backgroundColor: colors.bgCard, borderRadius: 16, padding: 18,
        borderWidth: 1.5, borderColor: colors.border, position: 'relative',
    },
    optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionLabel: { color: colors.text, fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' },
    optionLabelSelected: { color: colors.bgDark, fontFamily: 'SpaceGrotesk_700Bold' },
    checkWrap: { position: 'absolute', top: 18, right: 18 },
    footer: { paddingHorizontal: 20, paddingTop: 12 },
    nextBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18,
    },
    nextBtnText: { color: colors.bgDark, fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold' },
});
