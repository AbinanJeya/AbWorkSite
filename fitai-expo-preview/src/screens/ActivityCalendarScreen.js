import React, { memo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useActivityData } from '../contexts/ActivityDataContext';
import { useTranslation, getMonthNames } from '../services/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_W - 32) / 7;
const RING_SIZE = CELL_SIZE * 0.65;
const RING_STROKE = 2.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// ─── Memoized Day Cell (pure View, no SVG) ────────

const MiniProgressRing = memo(({ pct, colors, isDark, goalMet }) => {
    const trackColor = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,23,42,0.12)';
    const fillColor = goalMet ? colors.primary + '14' : 'transparent';

    return (
        <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={trackColor}
                strokeWidth={RING_STROKE}
                fill={fillColor}
            />
            {pct > 0 ? (
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={colors.primary}
                    strokeWidth={RING_STROKE}
                    fill="transparent"
                    strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - pct)}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
            ) : null}
        </Svg>
    );
});

const DayCell = memo(({ day, dateStr, steps, stepGoal, hasFood, onPress, colors, isDark }) => {
    if (!day) return <View style={cellStyles.cell} />;

    const pct = stepGoal > 0 ? Math.min(steps / stepGoal, 1) : 0;
    const isToday = todayStr === dateStr;
    const goalMet = pct >= 1;

    return (
        <TouchableOpacity style={cellStyles.cell} onPress={onPress} activeOpacity={0.7}>
            <View style={cellStyles.ring}>
                <MiniProgressRing pct={pct} colors={colors} isDark={isDark} goalMet={goalMet} />
            </View>
            <View style={cellStyles.dayTextWrap}>
                <Text style={[
                    cellStyles.dayText,
                    { color: isToday ? colors.primary : colors.text },
                    isToday && cellStyles.todayText,
                ]}>{day}</Text>
            </View>
            {(goalMet || hasFood) && (
                <View style={cellStyles.indicators}>
                    {goalMet && <MaterialIcons name="stars" size={7} color={colors.primary} />}
                    {hasFood && <View style={[cellStyles.dot, { backgroundColor: colors.primary }]} />}
                </View>
            )}
        </TouchableOpacity>
    );
});

const cellStyles = StyleSheet.create({
    cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
    ring: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
    dayTextWrap: {
        position: 'absolute',
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: { fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' },
    todayText: { fontFamily: 'SpaceGrotesk_700Bold' },
    indicators: { position: 'absolute', bottom: -2, flexDirection: 'row', alignItems: 'center', gap: 2 },
    dot: { width: 3, height: 3, borderRadius: 1.5 },
});

// ─── Memoized Month Block ─────────────────────────

const MonthBlock = memo(({ item, stepHistory, diaryHistory, stepGoal, colors, isDark, navigation, monthNames }) => {
    return (
        <View style={monthStyles.container}>
            <Text style={[monthStyles.header, { color: colors.text }]}>
                {monthNames[item.month]} {item.year}
            </Text>
            <View style={monthStyles.weekRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <Text key={i} style={[monthStyles.weekText, { color: colors.textSecondary }]}>{d}</Text>
                ))}
            </View>
            <View style={monthStyles.grid}>
                {item.grid.map((cell, idx) => {
                    if (!cell) return <View key={idx} style={cellStyles.cell} />;

                    const steps = stepHistory[cell.dateStr] || 0;
                    const dEntry = diaryHistory[cell.dateStr];
                    const hasFood = dEntry && (
                        (dEntry.breakfast?.length || 0) > 0 ||
                        (dEntry.lunch?.length || 0) > 0 ||
                        (dEntry.dinner?.length || 0) > 0 ||
                        (dEntry.snacks?.length || 0) > 0
                    );

                    return (
                        <DayCell
                            key={idx}
                            day={cell.day}
                            dateStr={cell.dateStr}
                            steps={steps}
                            stepGoal={stepGoal}
                            hasFood={!!hasFood}
                            colors={colors}
                            isDark={isDark}
                            onPress={() => navigation.navigate('DaySummary', { selectedDate: cell.dateStr })}
                        />
                    );
                })}
            </View>
        </View>
    );
});

const monthStyles = StyleSheet.create({
    container: { marginTop: 24 },
    header: { fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 12, marginLeft: 8 },
    weekRow: { flexDirection: 'row', marginBottom: 8 },
    weekText: { flex: 1, textAlign: 'center', fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
});

// ─── Screen ───────────────────────────────────────

export default function ActivityCalendarScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { t } = useTranslation();
    const monthNames = getMonthNames(t);

    // Pre-computed grids + pre-cached data — zero work on mount
    const { stepHistory, diaryHistory, stepGoal, stepMonths, fetchMonthData } = useActivityData();

    const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
        viewableItems.forEach(item => {
            if (item.isViewable) {
                fetchMonthData(item.item.year, item.item.month);
            }
        });
    }).current;

    const renderMonth = ({ item }) => (
        <MonthBlock
            item={item}
            stepHistory={stepHistory}
            diaryHistory={diaryHistory}
            stepGoal={stepGoal}
            colors={colors}
            isDark={isDark}
            navigation={navigation}
            monthNames={monthNames}
        />
    );

    return (
        <View style={[screenStyles.container, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
            <View style={[screenStyles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={screenStyles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[screenStyles.title, { color: colors.text }]}>Activity History</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={stepMonths}
                renderItem={renderMonth}
                keyExtractor={item => item.key}
                contentContainerStyle={screenStyles.list}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
                initialNumToRender={4}
                maxToRenderPerBatch={2}
                windowSize={9}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                    length: 420, 
                    offset: 420 * index,
                    index,
                })}
            />
        </View>
    );
}

const screenStyles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
});
