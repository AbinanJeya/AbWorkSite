import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings } from '../services/storage';
import {
    AlertModal,
    APP_ICON_COLOR_PRESETS,
    ColorWheelModal,
    createSettingsStyles,
    getRenderedPresetColor,
    getThemeDescription,
    hsvToHex,
    PRESET_COLORS,
    SettingsScreenShell,
} from '../components/SettingsShared';
import { useTranslation } from '../services/i18n';
import { useTheme } from '../theme';

export default function SettingsThemesScreen() {
    const { colors, isDark, themeMode, setThemeMode, accent, setAccent, setAccentHSV, appIconPreset, setAppIconPreset } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const { t } = useTranslation();
    const [accentColor, setAccentColor] = useState(accent ?? '#25f46a');
    const [customPresets, setCustomPresets] = useState([]);
    const [showColorWheel, setShowColorWheel] = useState(false);
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });

    useEffect(() => {
        setAccentColor(accent);
    }, [accent]);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            (async () => {
                const settings = await getSettings();
                if (!active) return;
                setCustomPresets(settings.customPresets || []);
            })();
            return () => {
                active = false;
            };
        }, [themeMode])
    );

    const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

    const changeAccent = (colorPayload) => {
        if (typeof colorPayload === 'object' && colorPayload !== null) {
            setAccentHSV(colorPayload);
        } else {
            setAccentColor(colorPayload);
            setAccent(colorPayload);
        }
    };

    const handleSaveCustomPreset = async (presetHSV) => {
        const newHex = hsvToHex(presetHSV.h, presetHSV.s, presetHSV.v).toLowerCase();
        let updatedList = [...customPresets];
        if (!updatedList.includes(newHex) && !PRESET_COLORS.map((color) => color.toLowerCase()).includes(newHex)) {
            updatedList.push(newHex);
            setCustomPresets(updatedList);
            await saveSettings({ customPresets: updatedList });
            showAlert('Preset Saved', 'Your custom color has been added to your preset list.');
        }
        changeAccent(presetHSV);
        setShowColorWheel(false);
    };

    const handleDeleteCustomPreset = async (hexToRemove) => {
        const updatedList = customPresets.filter((color) => color !== hexToRemove);
        setCustomPresets(updatedList);
        await saveSettings({ customPresets: updatedList });
        if (accentColor?.toLowerCase() === hexToRemove.toLowerCase()) {
            changeAccent(PRESET_COLORS[0]);
        }
    };

    return (
        <SettingsScreenShell title="Themes">
            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <View style={styles.themeModeOptions}>
                        <TouchableOpacity
                            style={[styles.modeBtn, themeMode === 'light' && styles.modeBtnActive]}
                            onPress={() => setThemeMode('light')}
                        >
                            <MaterialIcons name="light-mode" size={18} color={themeMode === 'light' ? '#fff' : colors.textSecondary} />
                            <Text style={[styles.modeBtnText, themeMode === 'light' && styles.modeBtnTextActive]}>Light</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, themeMode === 'dark' && styles.modeBtnActive]}
                            onPress={() => setThemeMode('dark')}
                        >
                            <MaterialIcons name="dark-mode" size={18} color={themeMode === 'dark' ? '#fff' : colors.textSecondary} />
                            <Text style={[styles.modeBtnText, themeMode === 'dark' && styles.modeBtnTextActive]}>Dark</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, themeMode === 'oled' && styles.modeBtnActive]}
                            onPress={() => setThemeMode('oled')}
                        >
                            <MaterialIcons name="nights-stay" size={18} color={themeMode === 'oled' ? '#fff' : colors.textSecondary} />
                            <Text style={[styles.modeBtnText, themeMode === 'oled' && styles.modeBtnTextActive]}>OLED</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.themeDesc}>{getThemeDescription(themeMode)}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <Text style={styles.accentLabel}>{t('accentColor')}</Text>
                    <View style={styles.accentRow}>
                        <View style={styles.swatchRow}>
                            <TouchableOpacity
                                style={[styles.swatch, styles.swatchNone, !accentColor && styles.swatchActive]}
                                onPress={() => changeAccent('')}
                            >
                                <View style={styles.noneLine} />
                            </TouchableOpacity>
                            {PRESET_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.swatch,
                                        { backgroundColor: getRenderedPresetColor(color, isDark) },
                                        (accentColor || '').toLowerCase() === color.toLowerCase() && styles.swatchActive,
                                    ]}
                                    onPress={() => changeAccent(color)}
                                />
                            ))}
                        </View>
                        <TouchableOpacity style={styles.colorWheelBtn} onPress={() => setShowColorWheel(true)}>
                            <MaterialIcons name="color-lens" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {customPresets.length > 0 && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? '#27272a' : '#f3f4f6' }}>
                            <Text style={{ color: colors.slate400, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 1.5, marginBottom: 8, paddingLeft: 2 }}>CUSTOM</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchRow}>
                                {customPresets.map((color, index) => (
                                    <View key={color + index}>
                                        <TouchableOpacity
                                            style={[
                                                styles.swatch,
                                                { backgroundColor: getRenderedPresetColor(color, isDark) },
                                                (accentColor || '').toLowerCase() === color.toLowerCase() && styles.swatchActive,
                                            ]}
                                            onPress={() => changeAccent(color)}
                                        />
                                        <TouchableOpacity
                                            style={{ position: 'absolute', top: -4, right: -4, backgroundColor: colors.bgCard, borderRadius: 10, padding: 2, borderWidth: 1, borderColor: colors.border }}
                                            onPress={() => handleDeleteCustomPreset(color)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <MaterialIcons name="close" size={10} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.themeCard}>
                    <Text style={styles.accentLabel}>App Icon Colours</Text>
                    <Text style={styles.iconSectionSub}>Always uses the dark launcher icon style. Updates after the app is backgrounded.</Text>
                    <View style={styles.swatchRow}>
                        {APP_ICON_COLOR_PRESETS.map(({ preset, color }) => (
                            <TouchableOpacity
                                key={preset}
                                style={[styles.swatch, { backgroundColor: color }, appIconPreset === preset && styles.swatchActive]}
                                onPress={() => setAppIconPreset(preset)}
                                accessibilityLabel={`Set app icon colour to ${preset}`}
                            />
                        ))}
                    </View>
                </View>
            </View>

            {showColorWheel && (
                <ColorWheelModal
                    visible={showColorWheel}
                    onClose={(payload) => {
                        if (payload) changeAccent(payload);
                        setShowColorWheel(false);
                    }}
                    onSavePreset={handleSaveCustomPreset}
                />
            )}

            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
            />
        </SettingsScreenShell>
    );
}
