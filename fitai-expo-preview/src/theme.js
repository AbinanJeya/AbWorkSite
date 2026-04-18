import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, getWorkoutHistory, saveSettings } from './services/storage';
import {
    DEFAULT_APP_ICON_PRESET,
    getAppIconPresetFromAccentHex,
    getAppIconPresetFromVariant,
    getCurrentAppIconVariant,
    normalizeAppIconPreset,
    syncAppIconVariant,
} from './services/appIcon';
import { syncWorkoutCalendarWidgetSnapshot, syncWorkoutCalendarWidgetTheme } from './services/workoutCalendarWidget';

export function hexToRgba(hex, alpha = 1) {
    if (!hex || hex.length !== 7) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isColorBright(hex) {
    if (!hex || hex.length !== 7) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Relative visual luminance formula
    const luma = (r * 299 + g * 587 + b * 114) / 1000;
    return luma > 160;
}

function brightenHex(hex, amount = 0.2) {
    if (!hex || hex.length !== 7) return hex;

    const brightenChannel = (channel) => {
        const value = Math.round(channel * (1 + amount));
        return Math.max(0, Math.min(255, value));
    };

    const r = brightenChannel(parseInt(hex.slice(1, 3), 16));
    const g = brightenChannel(parseInt(hex.slice(3, 5), 16));
    const b = brightenChannel(parseInt(hex.slice(5, 7), 16));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate full color palette from accent color + dark/light mode.
 * 
 * IMPORTANT: Backgrounds, cards, borders, text are all NEUTRAL (gray/white).
 * The accent color ONLY applies to interactive elements: buttons, toggles,
 * sliders, progress rings, active labels, links, badges.
 */
export function generateColors(accent, mode = 'oled') {
    const isDark = mode !== 'light';
    const isOled = mode === 'oled';
    
    // When accent is empty (none/off), use high contrast black/white
    const resolvedAccent = accent || (isDark ? '#ffffff' : '#000000');
    const accentText = isColorBright(resolvedAccent) ? '#000000' : '#ffffff';

    if (isDark) {
        const bgColor = isOled ? '#000000' : '#121212';
        const cardBgColor = isOled ? brightenHex('#121212', 0.2) : '#1e1e1e';
        const elevatedBgColor = isOled ? brightenHex('#151515', 0.2) : '#202020';
        const borderColor = isOled ? 'rgba(255, 255, 255, 0.05)' : '#2a2a2a';
        const borderLightColor = isOled ? 'rgba(255, 255, 255, 0.08)' : '#334155';
        const topHighlightColor = isOled ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
        const surfaceAltColor = isOled ? brightenHex('#171717', 0.2) : '#262626';
        const inputBgColor = isOled ? brightenHex('#141414', 0.2) : '#262626';

        return {
            // Accent — only for interactive/highlight elements
            primary: resolvedAccent,
            textOnPrimary: accentText,
            primaryDim: hexToRgba(resolvedAccent, 0.10),
            primaryMid: hexToRgba(resolvedAccent, 0.20),
            primaryGlow: hexToRgba(resolvedAccent, 0.30),
            primaryStrong: hexToRgba(resolvedAccent, 0.42),

            // Backgrounds
            bg: bgColor,
            bgDark: bgColor,
            bgCard: cardBgColor,
            bgCardSolid: cardBgColor,
            bgElevated: elevatedBgColor,
            surface: cardBgColor,
            surfaceLight: elevatedBgColor,
            surfaceAlt: surfaceAltColor,

            // Borders
            border: borderColor,
            borderLight: borderLightColor,
            borderStrong: bgColor,
            topHighlight: topHighlightColor,

            // Text
            text: '#f8fafc',
            textSecondary: isOled ? '#a1a1aa' : '#94a3b8',
            textMuted: isOled ? '#52525b' : '#64748b',
            textTertiary: isOled ? '#3f3f46' : '#475569',
            white: '#ffffff',

            // Utility colors
            orange500: '#f97316',
            orangeBg: 'rgba(249, 115, 22, 0.1)',
            blue500: '#3b82f6',
            blueBg: 'rgba(59, 130, 246, 0.1)',
            blue400: '#60a5fa',
            yellow400: '#facc15',
            slate400: '#94a3b8',
            slate500: '#64748b',
            slate800: '#1e293b',
            slate900: '#0f172a',
            red500: '#ef4444',
            green500: '#22c55e',
            greenBg: 'rgba(34, 197, 94, 0.12)',
            amber500: '#f59e0b',
            amberBg: 'rgba(245, 158, 11, 0.12)',
            violet500: '#a855f7',
            violetBg: 'rgba(168, 85, 247, 0.14)',
            shadow: 'rgba(0,0,0,0.5)',
            shadowSoft: 'rgba(0,0,0,0.25)',

            // Component-specific
            inputBg: inputBgColor,
            cardBg: cardBgColor,
            modalBg: isOled ? '#080808' : '#121212',
            tabBarBg: isOled ? 'rgba(0, 0, 0, 0.98)' : 'rgba(18, 18, 18, 0.98)',
            headerBg: isOled ? 'rgba(0, 0, 0, 0.98)' : 'rgba(18, 18, 18, 0.98)',
        };
    } else {
        // ─── Light mode ───
        return {
            primary: resolvedAccent,
            textOnPrimary: accentText,
            primaryDim: hexToRgba(resolvedAccent, 0.10),
            primaryMid: hexToRgba(resolvedAccent, 0.15),
            primaryGlow: hexToRgba(resolvedAccent, 0.25),
            primaryStrong: hexToRgba(resolvedAccent, 0.34),

            bg: '#F8F9FA',
            bgDark: '#F8F9FA',
            bgCard: '#FFFFFF',
            bgCardSolid: '#FFFFFF',
            bgElevated: '#FFFFFF',
            surface: '#f1f5f9',
            surfaceLight: '#e2e8f0',
            surfaceAlt: '#eef2f7',

            border: '#e2e8f0',
            borderLight: '#cbd5e1',
            borderStrong: '#94a3b8',
            topHighlight: 'rgba(255, 255, 255, 0.8)',

            text: '#1A1C1E',
            textSecondary: '#64748b',
            textMuted: '#94a3b8',
            textTertiary: '#cbd5e1',
            white: '#ffffff',

            orange500: '#f97316',
            orangeBg: 'rgba(249, 115, 22, 0.06)',
            blue500: '#3b82f6',
            blueBg: 'rgba(59, 130, 246, 0.06)',
            blue400: '#60a5fa',
            yellow400: '#facc15',
            slate400: '#94a3b8',
            slate500: '#64748b',
            slate800: '#1e293b',
            slate900: '#0f172a',
            red500: '#ef4444',
            green500: '#16a34a',
            greenBg: 'rgba(22, 163, 74, 0.08)',
            amber500: '#d97706',
            amberBg: 'rgba(217, 119, 6, 0.10)',
            violet500: '#7c3aed',
            violetBg: 'rgba(124, 58, 237, 0.08)',
            shadow: 'rgba(15,23,42,0.16)',
            shadowSoft: 'rgba(15,23,42,0.08)',

            inputBg: '#f1f5f9',
            cardBg: '#FFFFFF',
            modalBg: '#F8F9FA',
            tabBarBg: 'rgba(255, 255, 255, 0.95)',
            headerBg: 'rgba(248, 249, 250, 0.90)',
        };
    }
}

export function hexToHsv(hex) {
    if (!hex || hex.length !== 7) return { h: 142, s: 0.85, v: 0.96 }; // default #25f46a
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s, v: v };
}

export function hsvToHex(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (val) => Math.round((val + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getBaseAccentHex(hsv) {
    if (!hsv || typeof hsv.h !== 'number' || typeof hsv.s !== 'number' || typeof hsv.v !== 'number') {
        return '#25f46a';
    }
    return hsvToHex(hsv.h, hsv.s, Math.max(0, Math.min(1, hsv.v)));
}

// Applies the mathematical mode-specific brightness constraints to a given hex string, producing what the actual UI will render
export function getProjectedHex(hex, dark) {
    if (!hex) return hex;
    const hsv = hexToHsv(hex);
    const minVal = dark ? 0.6 : 0.2;
    const maxVal = dark ? 1.0 : 0.6;

    // Treat the incoming V as the theoretical percentage
    const relativeV = Math.max(0, Math.min(1.0, hsv.v));
    const projectedV = minVal + (relativeV * (maxVal - minVal));

    return hsvToHex(hsv.h, hsv.s, projectedV);
}

// Default palette
export const COLORS = generateColors('#25f46a', 'oled');

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [themeMode, setThemeModeState] = useState('oled');
    // SINGLE memory location for the user's unified brand hue/sat/val percentage
    const [baseHSV, setBaseHSV] = useState({ h: 142, s: 0.85, v: 1.0 });
    const [appIconPreset, setAppIconPresetState] = useState(DEFAULT_APP_ICON_PRESET);

    const isDark = themeMode !== 'light';

    const getClampedHex = (hsv, dark) => {
        const minVal = dark ? 0.6 : 0.2;
        const maxVal = dark ? 1.0 : 0.6;
        const relativeV = Math.max(0, Math.min(1.0, hsv.v));
        const projectedV = minVal + (relativeV * (maxVal - minVal));
        return hsvToHex(hsv.h, hsv.s, projectedV);
    };

    const activeAccent = getClampedHex(baseHSV, isDark);
    const [colors, setColorsState] = useState(COLORS);

    useEffect(() => {
        async function load() {
            const s = await getSettings();
            
            // Migration logic: if themeMode is missing but isDark exists
            let mode = s.themeMode;
            if (!mode) {
                if (s.isDark === false) mode = 'light';
                else mode = 'oled'; // Default to oled for existing dark users
            }

            let loadedHSV = s.baseHSV;
            if (!loadedHSV) {
                const legacyHex = s.accent || s.darkAccent || s.lightAccent || '#25f46a';
                loadedHSV = hexToHsv(legacyHex);
            }

            let loadedAppIconPreset = normalizeAppIconPreset(s.appIconPreset);
            if (!loadedAppIconPreset) {
                const currentVariant = await getCurrentAppIconVariant();
                loadedAppIconPreset =
                    getAppIconPresetFromVariant(currentVariant) ||
                    getAppIconPresetFromAccentHex(getBaseAccentHex(loadedHSV)) ||
                    DEFAULT_APP_ICON_PRESET;
                await saveSettings({ appIconPreset: loadedAppIconPreset });
            }

            setThemeModeState(mode);
            setBaseHSV(loadedHSV);
            setAppIconPresetState(loadedAppIconPreset);

            const dark = mode !== 'light';
            const activeHex = getClampedHex(loadedHSV, dark);
            setColorsState(generateColors(activeHex, mode));
            syncWorkoutCalendarWidgetTheme(activeHex, dark);

            try {
                const history = await getWorkoutHistory();
                await syncWorkoutCalendarWidgetSnapshot(history);
            } catch (error) {
                console.warn('Workout calendar widget seed failed:', error);
            }
        }
        load();
    }, []);

    const setAccentHSV = async (hsv) => {
        setBaseHSV(hsv);
        const dark = themeMode !== 'light';
        const activeHex = getClampedHex(hsv, dark);
        setColorsState(generateColors(activeHex, themeMode));
        syncWorkoutCalendarWidgetTheme(activeHex, dark);
        await saveSettings({ baseHSV: hsv, accent: null, lightAccent: null, darkAccent: null }); 
    };

    const setAccent = async (hexColor) => {
        if (!hexColor) {
            const dark = themeMode !== 'light';
            await setAccentHSV({ h: 0, s: 0, v: dark ? 1 : 0 });
            return;
        }
        const parsedHSV = hexToHsv(hexColor);
        await setAccentHSV(parsedHSV);
    };

    const setThemeMode = async (mode) => {
        setThemeModeState(mode);
        const dark = mode !== 'light';
        const activeHex = getClampedHex(baseHSV, dark);
        setColorsState(generateColors(activeHex, mode));
        syncWorkoutCalendarWidgetTheme(activeHex, dark);
        await saveSettings({ themeMode: mode, isDark: dark });
    };

    const setAppIconPreset = async (preset) => {
        const normalizedPreset = normalizeAppIconPreset(preset) || DEFAULT_APP_ICON_PRESET;
        setAppIconPresetState(normalizedPreset);
        await saveSettings({ appIconPreset: normalizedPreset });
        await syncAppIconVariant(normalizedPreset);
    };

    return (
        <ThemeContext.Provider value={{
            colors,
            isDark,
            themeMode,
            setThemeMode,
            accent: activeAccent,     
            baseHSV,
            setAccentHSV,
            setAccent,
            appIconPreset,
            setAppIconPreset,
            getProjectedHex: (hex) => getProjectedHex(hex, isDark),
            // Legacy shims to prevent crash
            toggleDarkMode: () => {
                const next = themeMode === 'light' ? 'oled' : 'light';
                setThemeMode(next);
            },
            setDarkMode: (dark) => setThemeMode(dark ? 'oled' : 'light'),
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        return {
            colors: COLORS,
            isDark: true,
            themeMode: 'oled',
            setThemeMode: () => { },
            accent: '#25f46a',
            baseHSV: { h: 142, s: 0.85, v: 1.0 },
            setAccentHSV: () => { },
            setAccent: () => { },
            appIconPreset: DEFAULT_APP_ICON_PRESET,
            setAppIconPreset: () => { },
            toggleDarkMode: () => { },
            setDarkMode: () => { },
            getProjectedHex: (hex) => hex,
        };
    }
    return context;
}

export const FONTS = {
    regular: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    semibold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
};

export const SPACING = {
    xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, xxxxl: 40,
};

export const RADIUS = {
    sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, full: 9999,
};

export const MOTION = {
    instant: 120,
    quick: 180,
    base: 260,
    slow: 420,
};

export const ELEVATION = {
    card: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 18,
        elevation: 6,
    },
    lifted: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 22,
        elevation: 10,
    },
};
