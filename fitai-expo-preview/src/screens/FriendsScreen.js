import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, ELEVATION } from '../theme';
import { formatSteps, getFriendProfiles, getInviteLink, removeFriend } from '../services/friends';

export default function FriendsScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState([]);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    const loadFriends = useCallback(async () => {
        setLoading(true);
        try {
            const [profiles, link] = await Promise.all([
                getFriendProfiles(),
                getInviteLink(),
            ]);
            setFriends(profiles);
            setInviteLink(link);
        } catch (error) {
            console.error('Friends screen load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadFriends();
    }, [loadFriends]));

    const handleRemove = useCallback((friend) => {
        Alert.alert(
            'Remove friend',
            `Remove ${friend.displayName} from your friends list?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeFriend(friend.uid);
                        await loadFriends();
                    },
                },
            ]
        );
    }, [loadFriends]);

    const handleCopyLink = useCallback(async () => {
        await Clipboard.setStringAsync(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }, [inviteLink]);

    const handleShareInvite = useCallback(async () => {
        try {
            await Share.share({
                message: `Join me on AbWork and add me with this invite link:\n\n${inviteLink}`,
            });
        } catch (error) {
            console.error('Friend invite share error:', error);
        }
    }, [inviteLink]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Friends</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Leaderboard')}>
                    <MaterialIcons name="emoji-events" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>SOCIAL CIRCLE</Text>
                    <Text style={styles.heroTitle}>Manage your training circle</Text>
                    <Text style={styles.heroSubtitle}>
                        Share your link, accept invites, and keep the leaderboard personal instead of random.
                    </Text>
                    <View style={styles.heroActions}>
                        <TouchableOpacity style={styles.primaryAction} onPress={handleShareInvite}>
                            <MaterialIcons name="ios-share" size={16} color={colors.bgDark} />
                            <Text style={styles.primaryActionText}>Invite friends</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryAction} onPress={handleCopyLink}>
                            <MaterialIcons name={copied ? 'check' : 'content-copy'} size={15} color={colors.text} />
                            <Text style={styles.secondaryActionText}>{copied ? 'Copied' : 'Copy link'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your friends</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
                        <Text style={styles.sectionLink}>Open leaderboard</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator color={colors.primary} size="large" />
                        <Text style={styles.loadingText}>Syncing your friends list</Text>
                    </View>
                ) : friends.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="group-add" size={30} color={colors.primary} />
                        <Text style={styles.emptyTitle}>No friends yet</Text>
                        <Text style={styles.emptyText}>
                            Share your invite link. When someone accepts it, they will show up here automatically.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.friendList}>
                        {friends.map((friend) => (
                            <View key={friend.uid} style={styles.friendCard}>
                                <View style={styles.friendAvatar}>
                                    <Text style={styles.friendInitial}>
                                        {(friend.displayName || 'A').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.friendBody}>
                                    <Text style={styles.friendName}>{friend.displayName}</Text>
                                    <Text style={styles.friendStats}>
                                        {formatSteps(friend.stepsToday)} today • {formatSteps(friend.weeklyAvg)} weekly avg
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(friend)}>
                                    <MaterialIcons name="person-remove" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        color: colors.text,
        fontSize: 20,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 24,
        backgroundColor: colors.bgCard,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopWidth: 1,
        borderTopColor: colors.topHighlight,
        ...ELEVATION.card,
    },
    heroEyebrow: {
        color: colors.primary,
        fontSize: 11,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1.4,
        marginBottom: 8,
    },
    heroTitle: {
        color: colors.text,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'SpaceGrotesk_500Medium',
        marginTop: 10,
    },
    heroActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: colors.primary,
    },
    primaryActionText: {
        color: colors.bgDark,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
    },
    secondaryActionText: {
        color: colors.text,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    linkText: {
        color: colors.textMuted,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
        marginTop: 14,
    },
    sectionHeader: {
        marginTop: 28,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    sectionLink: {
        color: colors.primary,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    loadingState: {
        marginTop: 36,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    emptyCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    friendList: {
        gap: 12,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
    },
    friendAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDim,
    },
    friendInitial: {
        color: colors.primary,
        fontSize: 18,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    friendBody: {
        flex: 1,
    },
    friendName: {
        color: colors.text,
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 4,
    },
    friendStats: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    removeBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceAlt,
    },
});
