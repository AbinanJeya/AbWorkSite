import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
    Share, Alert, Platform, ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, hexToRgba } from '../theme';
import { getLeaderboardData, getInviteLink, formatSteps } from '../services/friends';
import { getSettings, getUserProfile, getStepAverage } from '../services/storage';
import { getTodayStepCount } from '../services/pedometer';
import * as Clipboard from 'expo-clipboard';

export default function LeaderboardScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();

    const [period, setPeriod] = useState('weekly');
    const [leaderboard, setLeaderboard] = useState([]);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => { loadData(); }, [period])
    );

    const loadData = async () => {
        const profile = await getUserProfile();
        const s = await getSettings();
        const steps = await getTodayStepCount();
        const userName = profile?.firstName || 'You';
        
        setLoading(true);

        // Daily = today's steps, Weekly = 7-day avg, Monthly = 30-day avg
        let userSteps;
        if (period === 'daily') {
            userSteps = steps;
        } else if (period === 'weekly') {
            userSteps = await getStepAverage(7);
        } else {
            userSteps = await getStepAverage(30);
        }

        const data = await getLeaderboardData(period, userSteps, userName);
        setLeaderboard(data);
        setLoading(false);

        const link = await getInviteLink();
        setInviteLink(link);
    };

    const handleShare = async () => {
        const link = await getInviteLink();
        setInviteLink(link);
        setShowInvite(true);
    };

    const handleCopyLink = async () => {
        await Clipboard.setStringAsync(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareInvite = async () => {
        try {
            await Share.share({
                message: `Join me on AbWork and let's compete!\n\n${inviteLink}`,
            });
        } catch { }
    };

    const you = leaderboard.find(e => e.isYou);
    const maxSteps = leaderboard.length > 0 ? leaderboard[0].steps : 1;

    const periods = [
        { key: 'daily', label: 'Daily' },
        { key: 'weekly', label: 'Weekly' },
        { key: 'monthly', label: 'Monthly' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header (Floating Glass) */}
            <View style={styles.header}>
                <View style={styles.headerGlass}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Leaderboard</Text>
                    <TouchableOpacity onPress={handleShare}>
                        <View style={styles.shareBtnWrap}>
                            <MaterialIcons name="person-add" size={20} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Period Toggle (Glass Pill) */}
            <View style={styles.toggleContainer}>
                <View style={[styles.periodToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                    {periods.map(p => (
                        <TouchableOpacity
                            key={p.key}
                            style={[
                                styles.periodBtn,
                                period === p.key && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.primary + '20' }
                            ]}
                            onPress={() => setPeriod(p.key)}
                        >
                            <Text style={[
                                styles.periodText,
                                period === p.key && { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }
                            ]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading && leaderboard.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: 'SpaceGrotesk_500Medium' }}>Syncing with friends...</Text>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={[styles.content, { paddingBottom: 120 }]} 
                    showsVerticalScrollIndicator={false}
                >
                    {/* Podium Section (Premium Depth) */}
                <View style={styles.podium}>
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                        <View style={styles.podiumSide}>
                            <View style={[styles.podiumAvatar, { borderColor: '#94a3b860' }]}>
                                {leaderboard[1].isAI ? (
                                    <View style={styles.aiAvatarSmall}>
                                        <MaterialCommunityIcons name="robot" size={28} color="#a855f7" />
                                    </View>
                                ) : (
                                    <View style={[styles.initialsAvatar, { backgroundColor: '#3b82f620' }]}>
                                        <Text style={[styles.initialsText, { color: '#3b82f6' }]}>{leaderboard[1].name[0].toUpperCase()}</Text>
                                    </View>
                                )}
                                <View style={[styles.podiumBadge, { backgroundColor: '#94a3b8' }]}>
                                    <Text style={styles.podiumBadgeText}>2</Text>
                                </View>
                            </View>
                            <Text style={styles.podiumName} numberOfLines={1}>
                                {leaderboard[1].isYou ? 'YOU' : leaderboard[1].name}
                            </Text>
                            <Text style={styles.podiumSteps}>{formatSteps(leaderboard[1].steps)}</Text>
                        </View>
                    )}

                    {/* 1st Place (Glowing) */}
                    {leaderboard[0] && (
                        <View style={styles.podiumCenter}>
                            <View style={styles.crownWrap}>
                                <MaterialCommunityIcons name="crown" size={24} color="#facc15" />
                            </View>
                            <View style={[styles.podiumAvatarBig, { borderColor: colors.primary, shadowColor: colors.primary, shadowRadius: 15, shadowOpacity: 0.3 }]}>
                                {leaderboard[0].isAI ? (
                                    <View style={styles.aiAvatarBig}>
                                        <MaterialCommunityIcons name="robot" size={44} color="#a855f7" />
                                    </View>
                                ) : (
                                    <View style={[styles.initialsAvatarBig, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.initialsTextBig, { color: colors.primary }]}>{leaderboard[0].name[0].toUpperCase()}</Text>
                                    </View>
                                )}
                                <View style={[styles.podiumBadgeBig, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.podiumBadgeTextBig}>1</Text>
                                </View>
                            </View>
                            <Text style={styles.podiumNameBig} numberOfLines={1}>
                                {leaderboard[0].isYou ? 'YOU' : leaderboard[0].name}
                            </Text>
                            <Text style={styles.podiumStepsBig}>{formatSteps(leaderboard[0].steps)} steps</Text>
                        </View>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                        <View style={styles.podiumSide}>
                            <View style={[styles.podiumAvatar, { borderColor: '#b4530960' }]}>
                                {leaderboard[2].isAI ? (
                                    <View style={styles.aiAvatarSmall}>
                                        <MaterialCommunityIcons name="robot" size={28} color="#a855f7" />
                                    </View>
                                ) : (
                                    <View style={[styles.initialsAvatar, { backgroundColor: '#b4530920' }]}>
                                        <Text style={[styles.initialsText, { color: '#b45309' }]}>{leaderboard[2].name[0].toUpperCase()}</Text>
                                    </View>
                                )}
                                <View style={[styles.podiumBadge, { backgroundColor: '#b45309' }]}>
                                    <Text style={styles.podiumBadgeText}>3</Text>
                                </View>
                            </View>
                            <Text style={styles.podiumName} numberOfLines={1}>
                                {leaderboard[2].isYou ? 'YOU' : leaderboard[2].name}
                            </Text>
                            <Text style={styles.podiumSteps}>{formatSteps(leaderboard[2].steps)}</Text>
                        </View>
                    )}
                </View>

                {/* List Header */}
                <View style={styles.listHeaderRow}>
                    <Text style={styles.listHeaderTitle}>RANKINGS</Text>
                    <View style={styles.listHeaderLine} />
                </View>

                {/* All entries as ranked cards */}
                {leaderboard.map((entry) => (
                    <View key={entry.rank} style={[styles.rankCard, entry.isYou && styles.youCard]}>
                        <View style={styles.rankNumWrap}>
                            <Text style={[styles.rankNum, entry.isYou && { color: colors.primary }]}>{entry.rank}</Text>
                        </View>
                        
                        <View style={[
                            styles.rankAvatar,
                            { backgroundColor: entry.isYou ? colors.primary + '15' : entry.isAI ? '#a855f715' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                        ]}>
                            {entry.isAI ? (
                                <MaterialCommunityIcons name="robot" size={20} color="#a855f7" />
                            ) : (
                                <Text style={[styles.avatarText, { color: entry.isYou ? colors.primary : colors.textSecondary }]}>
                                    {entry.name[0].toUpperCase()}
                                </Text>
                            )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 4 }}>
                            <View style={styles.rankNameRow}>
                                <Text style={[styles.rankName, entry.isYou && styles.youName]} numberOfLines={1}>
                                    {entry.isYou ? 'YOU' : entry.name}
                                </Text>
                                {entry.isAI && <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>}
                            </View>
                            <View style={styles.rankBarBg}>
                                <View style={[
                                    styles.rankBarFill, 
                                    { 
                                        width: `${Math.max(5, (entry.steps / maxSteps) * 100)}%`,
                                        backgroundColor: entry.isYou ? colors.primary : (entry.isAI ? '#a855f7' : colors.slate500)
                                    }
                                ]} />
                            </View>
                        </View>

                        <View style={styles.rankStepsWrap}>
                            <Text style={[styles.rankSteps, entry.isYou && { color: colors.primary }]}>
                                {formatSteps(entry.steps)}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Lead info (Glass Banner) */}
                {you && leaderboard.length > 1 && (
                    <View style={styles.leadInfo}>
                        <MaterialIcons name="insights" size={18} color={colors.primary} />
                        <Text style={styles.leadText}>
                            {you.rank === 1
                                ? `You're leading by ${(you.steps - leaderboard[1].steps).toLocaleString()} steps!`
                                : `${(leaderboard[0].steps - you.steps).toLocaleString()} steps behind ${leaderboard[0].name}`}
                        </Text>
                    </View>
                )}
            </ScrollView>
            )}

            {/* Bottom Banner (Floating Glass) */}
            {you && (
                <View style={styles.bannerContainer}>
                    <View style={styles.floatingBanner}>
                        <View style={[styles.bannerBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.bannerBadgeText}>{you.rank}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bannerTitle}>Rank {you.rank}</Text>
                            <Text style={styles.bannerSub}>
                                {you.rank === 1 ? 'Top of the world!' : `Keep pushing to #1`}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.bannerAction} onPress={handleShareInvite}>
                            <MaterialIcons name="ios-share" size={18} color={colors.text} />
                            <Text style={styles.bannerActionText}>INVITE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Invite Friends Modal */}
            <Modal visible={showInvite} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.inviteSheet}>
                        <View style={styles.inviteHeader}>
                            <Text style={styles.inviteTitle}>Invite Friends</Text>
                            <TouchableOpacity onPress={() => setShowInvite(false)}>
                                <View style={styles.inviteClose}>
                                    <Text style={styles.inviteCloseText}>✕</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inviteDesc}>
                            Share your unique link to challenge friends and climb the leaderboard together.
                        </Text>

                        <Text style={styles.inviteLinkLabel}>SHARABLE LINK</Text>
                        <View style={styles.linkRow}>
                            <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
                                <Text style={styles.copyBtnText}>{copied ? '✓' : '📋'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.shareInviteBtn} onPress={handleShareInvite}>
                            <Text style={styles.shareInviteBtnText}>📤  Share Invite</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDark },
    
    // Floating Glass Header
    header: { paddingHorizontal: 16, paddingVertical: 8, zIndex: 10 },
    headerGlass: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        padding: 10, borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    headerTitle: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    shareBtnWrap: {
        width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30',
    },

    // Toggle
    toggleContainer: { paddingHorizontal: 16, marginTop: 12 },
    periodToggle: {
        flexDirection: 'row', borderRadius: 16, padding: 4, 
        borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    periodText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },

    content: { paddingHorizontal: 16, paddingTop: 24 },

    // Podium 2.0
    podium: { 
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', 
        marginBottom: 32, gap: 12, paddingTop: 20 
    },
    podiumSide: { alignItems: 'center', width: 90 },
    podiumCenter: { alignItems: 'center', width: 130, zIndex: 5 },
    
    crownWrap: { marginBottom: -4, zIndex: 10 },
    
    podiumAvatar: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgCard,
        borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    podiumAvatarBig: {
        width: 110, height: 110, borderRadius: 55, backgroundColor: colors.bgCard,
        borderWidth: 4, alignItems: 'center', justifyContent: 'center', position: 'relative',
        shadowOffset: { width: 0, height: 8 }, elevation: 10,
    },
    
    aiAvatarSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#a855f715', alignItems: 'center', justifyContent: 'center' },
    aiAvatarBig: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#a855f715', alignItems: 'center', justifyContent: 'center' },
    
    initialsAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    initialsAvatarBig: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
    initialsText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20 },
    initialsTextBig: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28 },

    podiumBadge: {
        position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bgDark, elevation: 2,
    },
    podiumBadgeBig: {
        position: 'absolute', bottom: -8, right: 0, width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bgDark, elevation: 3,
    },
    podiumBadgeText: { color: '#ffffff', fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
    podiumBadgeTextBig: { color: '#ffffff', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
    
    podiumName: { color: colors.textSecondary, fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold', marginTop: 12 },
    podiumNameBig: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 12 },
    podiumSteps: { color: colors.slate400, fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },
    podiumStepsBig: { color: colors.primary, fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },

    // Rankings List Header
    listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 8 },
    listHeaderTitle: { color: colors.textMuted, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 1.5 },
    listHeaderLine: { flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },

    // Rank cards
    rankCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.bgCard, borderRadius: 20, padding: 12,
        borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', marginBottom: 10,
    },
    youCard: { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30', borderWidth: 1.5 },
    rankNumWrap: { width: 30, alignItems: 'center' },
    rankNum: { color: colors.textMuted, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
    rankAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16 },
    rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    rankName: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
    youName: { fontFamily: 'SpaceGrotesk_700Bold' },
    aiBadge: { backgroundColor: '#a855f720', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    aiBadgeText: { color: '#a855f7', fontSize: 9, fontFamily: 'SpaceGrotesk_700Bold' },
    
    rankBarBg: { height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
    rankBarFill: { height: '100%', borderRadius: 3 },
    
    rankStepsWrap: { paddingLeft: 8, alignItems: 'flex-end' },
    rankSteps: { color: colors.text, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },

    // Lead info
    leadInfo: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.primary + '05', 
        borderRadius: 16, padding: 16, marginTop: 12,
        borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.primary + '15',
    },
    leadText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium', flex: 1 },

    // Floating Bottom Banner
    bannerContainer: { position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 100 },
    floatingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        padding: 12, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
    },
    bannerBadge: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    bannerBadgeText: { color: '#ffffff', fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    bannerTitle: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
    bannerSub: { color: colors.textSecondary, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium' },
    bannerAction: { 
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 
    },
    bannerActionText: { color: colors.text, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },

    // Invite Modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    inviteSheet: {
        width: '90%', backgroundColor: colors.bgCard, borderRadius: 32, padding: 24,
        borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    inviteTitle: { color: colors.text, fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
    inviteClose: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        alignItems: 'center', justifyContent: 'center',
    },
    inviteCloseText: { color: colors.text, fontSize: 18 },
    inviteDesc: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 24 },
    inviteLinkLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 2, marginBottom: 10 },
    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
        borderRadius: 16, padding: 8, paddingLeft: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginBottom: 20,
    },
    linkText: { flex: 1, color: colors.primary, fontSize: 14, fontFamily: 'SpaceGrotesk_500Medium' },
    copyBtn: {
        width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    shareInviteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: colors.text, borderRadius: 16, paddingVertical: 16,
    },
    shareInviteBtnText: { color: colors.bg, fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
});
