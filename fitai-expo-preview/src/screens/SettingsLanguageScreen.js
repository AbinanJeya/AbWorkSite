import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LANGUAGES, useTranslation } from '../services/i18n';
import { createSettingsStyles, SettingsScreenShell } from '../components/SettingsShared';
import { useTheme } from '../theme';

export default function SettingsLanguageScreen() {
    const { colors, isDark } = useTheme();
    const styles = createSettingsStyles(colors, isDark);
    const { lang, changeLanguage, t } = useTranslation();
    const [langSearch, setLangSearch] = useState('');

    const filteredLanguages = LANGUAGES.filter((item) =>
        item.name.toLowerCase().includes(langSearch.toLowerCase()) ||
        item.native.toLowerCase().includes(langSearch.toLowerCase())
    );

    return (
        <SettingsScreenShell title={t('language')}>
            <View style={styles.section}>
                <View style={styles.actionCard}>
                    <TextInput
                        style={styles.searchInput}
                        value={langSearch}
                        onChangeText={setLangSearch}
                        placeholder={t('selectLanguage')}
                        placeholderTextColor={colors.textMuted}
                    />
                    <ScrollView style={{ maxHeight: 500 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {filteredLanguages.map((item) => (
                            <TouchableOpacity
                                key={item.code}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 10,
                                    paddingHorizontal: 8,
                                    borderRadius: 8,
                                    backgroundColor: lang === item.code ? colors.primary + '12' : 'transparent',
                                }}
                                onPress={() => {
                                    changeLanguage(item.code);
                                    setLangSearch('');
                                }}
                            >
                                <View>
                                    <Text style={{ color: lang === item.code ? colors.primary : colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' }}>{item.native}</Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium' }}>{item.name}</Text>
                                </View>
                                {lang === item.code && <MaterialIcons name="check" size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </SettingsScreenShell>
    );
}
