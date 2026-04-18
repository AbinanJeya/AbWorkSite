import React, { useRef, useState } from 'react';
import {
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { APP_ICON_PRESET_COLORS, APP_ICON_PRESETS } from '../services/appIcon';
import { getProjectedHex, isColorBright, useTheme } from '../theme';

export const PRESET_COLORS = ['#25f46a', '#007AFF', '#FF9500', '#FF0000'];
export const APP_ICON_COLOR_PRESETS = APP_ICON_PRESETS.map((preset) => ({
    preset,
    color: APP_ICON_PRESET_COLORS[preset],
}));

const WHEEL_SIZE = 240;

export function hsvToHex(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r;
    let g;
    let b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (value) => Math.round((value + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function createSettingsStyles(colors, isDark) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bgDark },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
        },
        backBtn: {
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerTitle: {
            color: colors.text,
            fontSize: 24,
            fontFamily: 'SpaceGrotesk_700Bold',
            flex: 1,
        },
        content: { paddingBottom: 120 },
        section: { paddingHorizontal: 16, marginBottom: 16, marginTop: 8 },
        sectionTitle: {
            color: colors.text,
            fontSize: 12,
            fontFamily: 'SpaceGrotesk_700Bold',
            letterSpacing: 2,
            marginBottom: 12,
        },
        themeCard: {
            backgroundColor: colors.bgCard,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadowSoft,
            elevation: 3,
        },
        darkModeRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 16,
        },
        darkModeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
        darkModeIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
        },
        darkModeTitle: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
        darkModeSub: { color: colors.textSecondary, fontSize: 10, marginTop: 1, paddingRight: 12 },
        themeDesc: {
            fontSize: 12,
            fontFamily: 'SpaceGrotesk_500Medium',
            color: colors.textMuted,
            marginLeft: 4,
        },
        themeModeOptions: {
            flexDirection: 'row',
            backgroundColor: isDark ? colors.surfaceAlt : '#f1f5f9',
            borderRadius: 12,
            padding: 4,
            marginBottom: 12,
            gap: 4,
        },
        modeBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 8,
            gap: 6,
        },
        modeBtnActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        modeBtnText: {
            fontSize: 13,
            fontFamily: 'SpaceGrotesk_600SemiBold',
            color: colors.textSecondary,
        },
        modeBtnTextActive: {
            color: '#fff',
        },
        accentSection: {
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        accentLabel: {
            color: colors.textSecondary,
            fontSize: 10,
            fontFamily: 'SpaceGrotesk_700Bold',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 10,
            paddingLeft: 2,
        },
        iconSectionSub: {
            color: colors.textMuted,
            fontSize: 12,
            fontFamily: 'SpaceGrotesk_500Medium',
            marginBottom: 8,
            paddingHorizontal: 2,
        },
        accentRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        swatchRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, paddingHorizontal: 4 },
        swatch: { width: 32, height: 32, borderRadius: 16 },
        swatchActive: {
            borderWidth: 2,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            transform: [{ scale: 1.1 }],
        },
        swatchNone: {
            backgroundColor: colors.bgCard,
            borderWidth: 1.5,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        noneLine: {
            width: '140%',
            height: 1.5,
            backgroundColor: colors.textSecondary,
            transform: [{ rotate: '45deg' }],
            position: 'absolute',
        },
        colorWheelBtn: {
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
        },
        aiCard: {
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        aiHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        aiLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        aiTitle: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
        secureBadge: {
            backgroundColor: colors.primaryDim,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
        },
        secureBadgeText: {
            color: colors.primary,
            fontSize: 9,
            fontFamily: 'SpaceGrotesk_700Bold',
            letterSpacing: 1,
        },
        apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
        apiInput: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.text,
            fontSize: 13,
            borderWidth: 1,
            borderColor: colors.border,
        },
        saveBadge: {
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
        },
        saveBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
        getKeyBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingLeft: 2,
        },
        getKeyText: { color: colors.primary, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
        actionCard: {
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        actionCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        actionIconCircle: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primaryDim,
            alignItems: 'center',
            justifyContent: 'center',
        },
        actionCardTitle: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
        actionCardSub: { color: colors.textSecondary, fontSize: 10, marginTop: 1 },
        personalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 4,
        },
        personalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
        personalLabel: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' },
        personalValue: {
            color: colors.textSecondary,
            fontSize: 13,
            fontFamily: 'SpaceGrotesk_400Regular',
            flex: 1,
            textAlign: 'right',
            marginLeft: 16,
        },
        personalActionText: { color: colors.primary, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            zIndex: 1000,
        },
        wheelModal: {
            backgroundColor: colors.bgCard,
            borderRadius: 24,
            padding: 24,
            width: 300,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        wheelTitle: {
            color: colors.text,
            fontSize: 18,
            fontFamily: 'SpaceGrotesk_700Bold',
            marginBottom: 4,
        },
        wheelSubtitle: {
            color: colors.primary,
            fontSize: 12,
            fontFamily: 'SpaceGrotesk_500Medium',
            marginBottom: 10,
            textAlign: 'center',
        },
        wheelContainer: {
            width: WHEEL_SIZE,
            height: WHEEL_SIZE,
            borderRadius: WHEEL_SIZE / 2,
            backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
            overflow: 'hidden',
            position: 'relative',
        },
        wheelCursor: {
            position: 'absolute',
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 4,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 4 },
        },
        wheelApplyBtn: {
            width: '100%',
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: 'center',
        },
        wheelApplyText: { color: '#000', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
        modalContent: {
            backgroundColor: colors.bgCard,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border,
        },
        modalIconBg: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        modalTitle: {
            color: colors.text,
            fontSize: 20,
            fontFamily: 'SpaceGrotesk_700Bold',
            marginBottom: 8,
            textAlign: 'center',
        },
        modalMessage: {
            color: colors.slate400,
            fontSize: 14,
            fontFamily: 'SpaceGrotesk_500Medium',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
        },
        modalBtn: {
            backgroundColor: colors.bgCard,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 12,
            width: '100%',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        modalBtnText: {
            color: colors.primary,
            fontSize: 15,
            fontFamily: 'SpaceGrotesk_700Bold',
            textAlign: 'center',
        },
        searchInput: {
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.text,
            fontSize: 13,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
        },
    });
}

export function SettingsScreenShell({ title, children }) {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 32 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {children}
            </ScrollView>
        </View>
    );
}

export function ColorWheelModal({ visible, onClose, onSavePreset }) {
    const { colors, isDark, baseHSV } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const minVal = isDark ? 0.6 : 0.2;
    const maxVal = isDark ? 1.0 : 0.6;
    const [wheelHue, setWheelHue] = useState(baseHSV.h);
    const [wheelSat, setWheelSat] = useState(baseHSV.s);
    const [wheelVal, setWheelVal] = useState(baseHSV.v);
    const wheelPanRef = useRef(null);
    const wheelLayout = useRef({ pageX: 0, pageY: 0 });
    const sliderPanRef = useRef(null);
    const sliderLayout = useRef({ width: 0, pageX: 0 });

    const handleWheelTouchGlobal = (pageX, pageY) => {
        const cx = wheelLayout.current.pageX + (WHEEL_SIZE / 2);
        const cy = wheelLayout.current.pageY + (WHEEL_SIZE / 2);
        const dx = pageX - cx;
        const dy = pageY - cy;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        setWheelHue(angle);
        setWheelSat(1);
    };

    if (!wheelPanRef.current) {
        wheelPanRef.current = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (event) => handleWheelTouchGlobal(event.nativeEvent.pageX, event.nativeEvent.pageY),
            onPanResponderMove: (event) => handleWheelTouchGlobal(event.nativeEvent.pageX, event.nativeEvent.pageY),
        });
    }

    const handleSliderTouch = (pageX) => {
        const { pageX: sliderX, width } = sliderLayout.current;
        if (width === 0) return;
        let progress = (pageX - sliderX) / width;
        progress = Math.max(0, Math.min(1, progress));
        setWheelVal(progress);
    };

    if (!sliderPanRef.current) {
        sliderPanRef.current = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (event) => handleSliderTouch(event.nativeEvent.pageX),
            onPanResponderMove: (event) => handleSliderTouch(event.nativeEvent.pageX),
        });
    }

    const safeV = minVal + (wheelVal * (maxVal - minVal));
    const selectedWheelColor = hsvToHex(wheelHue, wheelSat, safeV);
    const displayPercentage = Math.round(wheelVal * 100);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => onClose(null)}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>
                <View style={[styles.wheelModal, { width: 320, padding: 32, borderRadius: 32 }]}>
                    <View style={{ alignItems: 'center', marginBottom: 32 }}>
                        <Text style={[styles.wheelTitle, { fontSize: 20 }]}>Custom Accent</Text>
                        <Text style={[styles.wheelSubtitle, { color: colors.textSecondary }]}>Pick your unique brand hue</Text>
                    </View>

                    <View
                        style={styles.wheelContainer}
                        {...wheelPanRef.current.panHandlers}
                        onLayout={(event) => {
                            event.target.measure((x, y, width, height, pageX, pageY) => {
                                wheelLayout.current = { pageX, pageY };
                            });
                        }}
                    >
                        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            {Array.from({ length: 72 }, (_, index) => {
                                const hue = index * 5;
                                const angleRad = (hue - 90) * Math.PI / 180;
                                const radius = WHEEL_SIZE / 2 - 16;
                                return (
                                    <View
                                        key={index}
                                        style={{
                                            position: 'absolute',
                                            left: WHEEL_SIZE / 2 + Math.cos(angleRad) * radius - 20,
                                            top: WHEEL_SIZE / 2 + Math.sin(angleRad) * radius - 20,
                                            width: 40,
                                            height: 40,
                                            borderRadius: 20,
                                            backgroundColor: hsvToHex(hue, 1, safeV),
                                        }}
                                    />
                                );
                            })}
                        </View>

                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                left: 32,
                                top: 32,
                                right: 32,
                                bottom: 32,
                                borderRadius: 999,
                                backgroundColor: colors.bgCard,
                                shadowColor: '#000',
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: selectedWheelColor,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    shadowOffset: { width: 0, height: 2 },
                                    borderWidth: 4,
                                    borderColor: isDark ? '#333' : '#fff',
                                }}
                            />
                        </View>

                        <View
                            style={[
                                styles.wheelCursor,
                                {
                                    left: WHEEL_SIZE / 2 + Math.cos((wheelHue - 90) * Math.PI / 180) * (WHEEL_SIZE / 2 - 16) - 16,
                                    top: WHEEL_SIZE / 2 + Math.sin((wheelHue - 90) * Math.PI / 180) * (WHEEL_SIZE / 2 - 16) - 16,
                                    borderColor: selectedWheelColor,
                                },
                            ]}
                            pointerEvents="none"
                        />
                    </View>

                    <View style={{ width: '100%', marginTop: 32, marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 1 }}>Brightness</Text>
                            <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' }}>{displayPercentage}%</Text>
                        </View>
                        <View
                            style={{ width: '100%', height: 40, justifyContent: 'center' }}
                            {...sliderPanRef.current.panHandlers}
                            onLayout={(event) => {
                                event.target.measure((x, y, width, height, pageX, pageY) => {
                                    sliderLayout.current = { width, pageX };
                                });
                            }}
                        >
                            <View pointerEvents="none" style={{ width: '100%', height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', backgroundColor: colors.surface }}>
                                {Array.from({ length: 20 }).map((_, index) => (
                                    <View key={index} style={{ flex: 1, backgroundColor: hsvToHex(wheelHue, 1, minVal + (index / 19) * (maxVal - minVal)) }} />
                                ))}
                            </View>
                            <View
                                style={{
                                    position: 'absolute',
                                    left: `${wheelVal * 100}%`,
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    marginLeft: -14,
                                    backgroundColor: '#fff',
                                    borderWidth: 3,
                                    borderColor: selectedWheelColor,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.3,
                                    shadowRadius: 5,
                                    shadowOffset: { width: 0, height: 2 },
                                }}
                                pointerEvents="none"
                            />
                        </View>
                    </View>

                    <View style={{ width: '100%', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.wheelApplyBtn, { backgroundColor: selectedWheelColor, shadowColor: selectedWheelColor, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 4 } }]}
                            onPress={() => onClose({ h: wheelHue, s: wheelSat, v: wheelVal })}
                        >
                            <Text style={[styles.wheelApplyText, { color: isColorBright(selectedWheelColor) ? '#000' : '#fff' }]}>Confirm Selection</Text>
                        </TouchableOpacity>
                        {onSavePreset && (
                            <TouchableOpacity
                                style={{ paddingVertical: 14, alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: selectedWheelColor }}
                                onPress={() => onSavePreset({ h: wheelHue, s: wheelSat, v: wheelVal })}
                            >
                                <Text style={{ color: selectedWheelColor, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' }}>Save as Custom Preset</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={{ paddingVertical: 14, alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                            onPress={() => onClose(null)}
                        >
                            <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function AlertModal({ visible, title, message, onClose }) {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.modalIconBg, { backgroundColor: colors.primary + '22' }]}>
                        <MaterialIcons name="info-outline" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>
                    <TouchableOpacity style={styles.modalBtn} onPress={onClose}>
                        <Text style={styles.modalBtnText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

export function ConfirmModal({ visible, title, message, actionText, onCancel, onConfirm, isDestructive = false }) {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.modalIconBg, { backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.1)' : colors.primary + '22' }]}>
                        <MaterialIcons name={isDestructive ? 'warning-amber' : 'help-outline'} size={28} color={isDestructive ? '#ef4444' : colors.primary} />
                    </View>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>
                    <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                        <TouchableOpacity
                            style={[styles.modalBtn, { flex: 1, backgroundColor: colors.bgCard, borderColor: colors.border }]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.modalBtnText, { color: colors.slate400 }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, { flex: 1, backgroundColor: isDestructive ? 'rgba(239, 68, 68, 1)' : colors.primary, borderColor: colors.border }]}
                            onPress={onConfirm}
                        >
                            <Text style={[styles.modalBtnText, { color: isDestructive ? '#ffffff' : colors.bgDark }]}>{actionText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function getThemeDescription(themeMode) {
    if (themeMode === 'oled') return 'Ultra-black optimized for AMOLED screens';
    if (themeMode === 'dark') return 'Classic slate-dark experience';
    return 'Bright and clean light appearance';
}

export function getRenderedPresetColor(color, isDark) {
    return getProjectedHex(color, isDark);
}
