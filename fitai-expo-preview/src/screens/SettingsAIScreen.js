import React, { useState } from 'react';
import { Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings } from '../services/storage';
import { forceLocalBackup } from '../services/localSync';
import { useTranslation } from '../services/i18n';
import { createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

export default function SettingsAIScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState(null);
    const [geminiKey, setGeminiKey] = useState('');
    const [geminiKeyStatus, setGeminiKeyStatus] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            (async () => {
                const settings = await getSettings();
                if (!active) return;
                setApiKey(settings.openAIKey || '');
                setGeminiKey(settings.geminiKey || '');
            })();
            return () => {
                active = false;
            };
        }, [])
    );

    const handleSaveApiKey = async () => {
        await saveSettings({ openAIKey: apiKey });
        if (!apiKey || apiKey.trim().length < 10) {
            setApiKeyStatus('invalid');
            setTimeout(() => setApiKeyStatus(null), 3000);
            return;
        }
        setApiKeyStatus('checking');
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${apiKey.trim()}` },
            });
            if (response.ok) {
                setApiKeyStatus('valid');
                forceLocalBackup().catch(() => {});
            } else {
                setApiKeyStatus('invalid');
                setTimeout(() => setApiKeyStatus(null), 3000);
            }
        } catch {
            setApiKeyStatus('invalid');
            setTimeout(() => setApiKeyStatus(null), 3000);
        }
    };

    const handleSaveGeminiKey = async () => {
        await saveSettings({ geminiKey });
        if (!geminiKey || geminiKey.trim().length < 10) {
            setGeminiKeyStatus('invalid');
            setTimeout(() => setGeminiKeyStatus(null), 3000);
            return;
        }
        setGeminiKeyStatus('checking');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey.trim()}`);
            if (response.ok) {
                setGeminiKeyStatus('valid');
                forceLocalBackup().catch(() => {});
            } else {
                setGeminiKeyStatus('invalid');
                setTimeout(() => setGeminiKeyStatus(null), 3000);
            }
        } catch {
            setGeminiKeyStatus('invalid');
            setTimeout(() => setGeminiKeyStatus(null), 3000);
        }
    };

    return (
        <SettingsScreenShell title="AI Integration">
            <View style={styles.section}>
                <View style={styles.aiCard}>
                    <View style={styles.aiHeaderRow}>
                        <View style={styles.aiLeft}>
                            <MaterialIcons name="psychology" size={20} color={colors.primary} />
                            <Text style={styles.aiTitle}>{t('openaiKey')}</Text>
                        </View>
                        <View style={styles.secureBadge}>
                            <Text style={styles.secureBadgeText}>{t('secure')}</Text>
                        </View>
                    </View>
                    <View style={styles.apiKeyRow}>
                        <TextInput
                            style={styles.apiInput}
                            value={apiKey}
                            onChangeText={(value) => { setApiKey(value); setApiKeyStatus(null); }}
                            placeholder="sk-****************"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={[styles.saveBadge, apiKeyStatus === 'valid' && { backgroundColor: '#22c55e' }, apiKeyStatus === 'invalid' && { backgroundColor: '#ef4444' }]}
                            onPress={handleSaveApiKey}
                        >
                            <Text style={[styles.saveBadgeText, apiKeyStatus !== 'valid' && apiKeyStatus !== 'invalid' && { color: colors.textOnPrimary }]}>
                                {apiKeyStatus === 'checking' ? '...' : apiKeyStatus === 'valid' ? 'OK' : apiKeyStatus === 'invalid' ? 'ERR' : 'SAVE'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.getKeyBtn} onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}>
                        <Text style={styles.getKeyText}>{t('getApiKey')}</Text>
                        <MaterialIcons name="open-in-new" size={12} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.aiCard, { marginTop: 10 }]}>
                    <View style={styles.aiHeaderRow}>
                        <View style={styles.aiLeft}>
                            <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
                            <Text style={styles.aiTitle}>{t('geminiKey')}</Text>
                        </View>
                        <View style={styles.secureBadge}>
                            <Text style={styles.secureBadgeText}>{t('secure')}</Text>
                        </View>
                    </View>
                    <View style={styles.apiKeyRow}>
                        <TextInput
                            style={styles.apiInput}
                            value={geminiKey}
                            onChangeText={(value) => { setGeminiKey(value); setGeminiKeyStatus(null); }}
                            placeholder="AIza****************"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={[styles.saveBadge, geminiKeyStatus === 'valid' && { backgroundColor: '#22c55e' }, geminiKeyStatus === 'invalid' && { backgroundColor: '#ef4444' }]}
                            onPress={handleSaveGeminiKey}
                        >
                            <Text style={[styles.saveBadgeText, geminiKeyStatus !== 'valid' && geminiKeyStatus !== 'invalid' && { color: colors.textOnPrimary }]}>
                                {geminiKeyStatus === 'checking' ? '...' : geminiKeyStatus === 'valid' ? 'OK' : geminiKeyStatus === 'invalid' ? 'ERR' : 'SAVE'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.getKeyBtn} onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
                        <Text style={styles.getKeyText}>{t('getApiKey')}</Text>
                        <MaterialIcons name="open-in-new" size={12} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </SettingsScreenShell>
    );
}
