import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
    AndroidImportance,
    AndroidVisibility,
    AuthorizationStatus,
    TriggerType,
} from '@notifee/react-native';
import {
    getDiaryHistory,
    getSettings,
    getUserProfile,
    getWater,
    getWorkoutHistory,
    syncFullStepHistory,
} from './storage';
import {
    NOTIFICATION_CATEGORY_META,
    getNotificationCategorySummary,
    isNotificationEnabled,
    mergeNotificationSettings,
    resolveNotificationSettings,
} from './notificationPreferences';

const NOTIFICATION_STATE_KEY = '@abwork_notification_state';
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_LEAD_MS = 60 * 1000;
const HORIZON_DAYS = 7;
const HYDRATION_GOAL = 2500;

export const NOTIFICATION_CHANNEL_IDS = {
    workoutLive: 'workout-live',
    workoutComplete: 'workout-complete',
    workoutReminders: 'workout-reminders',
    nutritionReminders: 'nutrition-reminders',
    hydrationReminders: 'hydration-reminders',
    stepsReminders: 'steps-reminders',
    sleepReminders: 'sleep-reminders',
};

function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function atLocalTime(date, hours, minutes = 0) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
    return next.getTime();
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function averageHour(timestamps = [], fallbackHour) {
    if (!timestamps.length) return fallbackHour;
    const total = timestamps.reduce((sum, value) => sum + value, 0);
    return Math.round(total / timestamps.length);
}

function clampHour(hour, fallbackHour) {
    if (!Number.isFinite(hour)) return fallbackHour;
    return Math.max(0, Math.min(23, Math.round(hour)));
}

function parseLoggedHour(rawTime) {
    if (typeof rawTime !== 'string') return null;
    const match = rawTime.trim().match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const meridiem = (match[3] || '').toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour;
}

function getEnergyWindowFallback(profile) {
    switch (profile?.energyWindow) {
        case 'morning':
            return { workoutHour: 8, bedtimeHour: 21 };
        case 'midday':
            return { workoutHour: 12, bedtimeHour: 22 };
        case 'evening':
            return { workoutHour: 18, bedtimeHour: 22 };
        case 'night':
            return { workoutHour: 20, bedtimeHour: 23 };
        default:
            return { workoutHour: 18, bedtimeHour: 22 };
    }
}

async function getNotificationState() {
    try {
        const raw = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            pendingIds: Array.isArray(parsed?.pendingIds) ? parsed.pendingIds : [],
            lastFingerprint: typeof parsed?.lastFingerprint === 'string' ? parsed.lastFingerprint : '',
            lastPersonalizedTimingSnapshot: parsed?.lastPersonalizedTimingSnapshot || {},
        };
    } catch {
        return {
            pendingIds: [],
            lastFingerprint: '',
            lastPersonalizedTimingSnapshot: {},
        };
    }
}

async function saveNotificationState(state) {
    await AsyncStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
}

export async function ensureNotificationChannels() {
    await Promise.all([
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.workoutLive,
            name: 'Workout Live',
            description: 'Active workout rest timer notification',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: '',
            vibration: false,
        }),
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.workoutComplete,
            name: 'Workout Complete',
            description: 'Rest timer complete alerts',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
            sound: 'default',
        }),
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.workoutReminders,
            name: 'Workout Reminders',
            description: 'Workout day reminder notifications',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
        }),
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.nutritionReminders,
            name: 'Nutrition Reminders',
            description: 'Meal logging reminders',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
        }),
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.hydrationReminders,
            name: 'Hydration Reminders',
            description: 'Water logging reminders',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
        }),
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.stepsReminders,
            name: 'Step Reminders',
            description: 'Walking progress reminders',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
        }),
        notifee.createChannel({
            id: NOTIFICATION_CHANNEL_IDS.sleepReminders,
            name: 'Sleep Reminders',
            description: 'Bedtime and sleep sync reminders',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            vibration: true,
        }),
    ]);
}

export async function requestAppNotificationPermission() {
    try {
        const settings = await notifee.requestPermission();
        const status = settings?.authorizationStatus;
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
    } catch (error) {
        console.warn('Failed to request notification permission:', error);
        return false;
    }
}

export async function getAppNotificationPermissionStatus() {
    try {
        const settings = await notifee.getNotificationSettings();
        const status = settings?.authorizationStatus;
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
    } catch {
        return false;
    }
}

export async function cancelScheduledReminderNotifications(category = null) {
    const state = await getNotificationState();
    const nextIds = [];
    const idsToCancel = [];

    state.pendingIds.forEach((id) => {
        if (!category || id.startsWith(`reminder:${category}:`)) {
            idsToCancel.push(id);
        } else {
            nextIds.push(id);
        }
    });

    if (idsToCancel.length) {
        await notifee.cancelTriggerNotifications(idsToCancel);
        await Promise.all(idsToCancel.map((id) => notifee.cancelNotification(id).catch(() => {})));
    }

    if (idsToCancel.length || category) {
        await saveNotificationState({
            ...state,
            pendingIds: nextIds,
        });
    }
}

function buildMealReminderTimes() {
    return {
        breakfast: { hour: 9, minute: 15 },
        lunch: { hour: 13, minute: 15 },
        dinner: { hour: 19, minute: 0 },
        snacks: { hour: 16, minute: 30 },
    };
}

function buildHydrationTimes(firstDrinkHour = 10) {
    const initial = clampHour(firstDrinkHour, 10);
    return [
        { id: 'midday', hour: Math.max(11, initial + 2), minute: 30, expectedMl: 700 },
        { id: 'afternoon', hour: 15, minute: 30, expectedMl: 1500 },
        { id: 'evening', hour: 19, minute: 0, expectedMl: 2100 },
    ];
}

function buildStepTimes() {
    return [
        { id: 'midday', hour: 12, minute: 30, ratio: 0.35 },
        { id: 'afternoon', hour: 16, minute: 30, ratio: 0.65 },
        { id: 'evening', hour: 19, minute: 15, ratio: 0.9 },
    ];
}

function inferTimingSnapshot({ workoutHistory, profile, hydrationLogsByDay }) {
    const fallback = getEnergyWindowFallback(profile);
    const workoutHours = (workoutHistory || [])
        .map((session) => {
            const stamp = session?.startedAt || session?.finishedAt || session?.timestamp;
            const time = stamp ? new Date(stamp) : null;
            return time && Number.isFinite(time.getTime()) ? time.getHours() : null;
        })
        .filter((hour) => Number.isFinite(hour))
        .slice(0, 12);

    const waterStartHours = Object.values(hydrationLogsByDay || {})
        .map((logs) => Array.isArray(logs) ? logs[0] : null)
        .map((firstLog) => parseLoggedHour(firstLog?.time))
        .filter((hour) => Number.isFinite(hour))
        .slice(0, 10);

    return {
        workoutHour: clampHour(averageHour(workoutHours, fallback.workoutHour), fallback.workoutHour),
        bedtimeHour: clampHour(fallback.bedtimeHour, 22),
        hydrationFirstHour: clampHour(averageHour(waterStartHours, 10), 10),
        meals: buildMealReminderTimes(),
    };
}

function getTodayWaterTotal(logs) {
    return Array.isArray(logs)
        ? logs.reduce((sum, log) => sum + (parseInt(log?.amount, 10) || 0), 0)
        : 0;
}

function getWeekStart(date) {
    const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    current.setDate(current.getDate() - current.getDay());
    return localDateKey(current);
}

function buildWorkoutCompletionMap(workoutHistory) {
    const byDay = new Set();
    const byWeek = new Map();

    (workoutHistory || []).forEach((session) => {
        const dateKey = String(session?.startedAt || session?.finishedAt || session?.timestamp || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
        byDay.add(dateKey);
        const date = new Date(`${dateKey}T12:00:00`);
        const weekStart = getWeekStart(date);
        byWeek.set(weekStart, (byWeek.get(weekStart) || 0) + 1);
    });

    return { byDay, byWeek };
}

function buildReminderNotification(id, channelId, title, body, pressActionId = 'default') {
    return {
        id,
        title,
        body,
        android: {
            channelId,
            pressAction: {
                id: pressActionId,
                launchActivity: 'default',
            },
            visibility: AndroidVisibility.PUBLIC,
        },
    };
}

function scheduleDescriptor(id, timestamp, channelId, title, body) {
    return { id, timestamp, notification: buildReminderNotification(id, channelId, title, body) };
}

async function buildReminderSchedule(now = new Date()) {
    const [settings, profile, diaryHistory, workoutHistory, fullStepHistory] = await Promise.all([
        getSettings(),
        getUserProfile(),
        getDiaryHistory(),
        getWorkoutHistory(),
        syncFullStepHistory(),
    ]);

    const notifications = resolveNotificationSettings(settings?.notifications, settings);
    if (!notifications.masterEnabled) {
        return {
            notifications,
            pending: [],
            timingSnapshot: {},
            fingerprint: JSON.stringify({ masterEnabled: false }),
        };
    }

    const hydrationLogsByDay = {};
    const horizonDates = Array.from({ length: HORIZON_DAYS }, (_, index) => {
        const day = startOfDay(new Date(now.getTime() + (index * DAY_MS)));
        return day;
    });

    await Promise.all(horizonDates.map(async (date) => {
        const key = localDateKey(date);
        hydrationLogsByDay[key] = await getWater(key);
    }));

    const timingSnapshot = inferTimingSnapshot({ workoutHistory, profile, hydrationLogsByDay });
    const mealTimes = timingSnapshot.meals;
    const hydrationTimes = buildHydrationTimes(timingSnapshot.hydrationFirstHour);
    const stepTimes = buildStepTimes();
    const workoutMap = buildWorkoutCompletionMap(workoutHistory);
    const pending = [];

    const todayKey = localDateKey(now);
    const todayDiary = diaryHistory?.[todayKey] || {};
    const todayCalories = ['breakfast', 'lunch', 'dinner', 'snacks']
        .flatMap((slot) => todayDiary?.[slot] || [])
        .reduce((sum, item) => sum + (Number(item?.calories) || 0), 0);
    const calorieGoal = settings?.calorieGoal || profile?.dailyCalories || 2000;
    const stepGoal = Math.max(1000, parseInt(settings?.stepGoal, 10) || 10000);

    horizonDates.forEach((date, index) => {
        const dateKey = localDateKey(date);
        const isToday = dateKey === todayKey;
        const dayDiary = diaryHistory?.[dateKey] || {};
        const waterLogs = hydrationLogsByDay[dateKey] || [];
        const waterTotal = getTodayWaterTotal(waterLogs);
        const steps = Number(fullStepHistory?.[dateKey] || 0);
        const dayHasWorkout = workoutMap.byDay.has(dateKey);
        const weekStart = getWeekStart(date);
        const weeklyTarget = Math.max(1, parseInt(settings?.workoutDaysPerWeekTarget, 10) || 3);
        const weeklyCount = workoutMap.byWeek.get(weekStart) || 0;
        const daysRemainingInWeek = Math.max(1, 7 - date.getDay());
        const stillBehindTarget = weeklyCount < weeklyTarget;

        if (isNotificationEnabled(notifications, 'workout', 'workoutDayReminderEnabled') && stillBehindTarget && !dayHasWorkout) {
            const primaryAt = atLocalTime(date, timingSnapshot.workoutHour, 0);
            if (primaryAt > now.getTime() + MIN_LEAD_MS) {
                pending.push(scheduleDescriptor(
                    `reminder:workout:primary:${dateKey}`,
                    primaryAt,
                    NOTIFICATION_CHANNEL_IDS.workoutReminders,
                    'Workout reminder',
                    `You are still chasing your ${weeklyTarget}-day weekly target. Logging a session today keeps you on track.`
                ));
            }

            const needSecondChance = stillBehindTarget && (date.getDay() >= 4 || weeklyTarget - weeklyCount >= daysRemainingInWeek);
            const secondaryAt = atLocalTime(date, Math.min(21, timingSnapshot.workoutHour + 2), 0);
            if (needSecondChance && secondaryAt > now.getTime() + MIN_LEAD_MS) {
                pending.push(scheduleDescriptor(
                    `reminder:workout:secondary:${dateKey}`,
                    secondaryAt,
                    NOTIFICATION_CHANNEL_IDS.workoutReminders,
                    'Still time for a workout',
                    'A quick session today keeps your weekly streak alive.'
                ));
            }
        }

        if (isNotificationEnabled(notifications, 'nutrition')) {
            [
                ['breakfast', 'breakfastEnabled', 'Breakfast reminder', 'Log breakfast to keep your nutrition streak moving.'],
                ['lunch', 'lunchEnabled', 'Lunch reminder', 'Lunch is still empty for today. Add it while it is fresh in your mind.'],
                ['dinner', 'dinnerEnabled', 'Dinner reminder', 'Dinner is not logged yet. Adding it now keeps your day accurate.'],
                ['snacks', 'snacksEnabled', 'Snack reminder', 'If you grabbed a snack today, log it so your totals stay honest.'],
            ].forEach(([slot, toggleKey, title, body]) => {
                if (!isNotificationEnabled(notifications, 'nutrition', toggleKey)) return;
                if (Array.isArray(dayDiary?.[slot]) && dayDiary[slot].length > 0) return;
                if (slot === 'snacks' && isToday && todayCalories >= calorieGoal * 0.9) return;
                const slotTime = mealTimes[slot];
                const timestamp = atLocalTime(date, slotTime.hour, slotTime.minute);
                if (timestamp <= now.getTime() + MIN_LEAD_MS) return;
                pending.push(scheduleDescriptor(
                    `reminder:nutrition:${slot}:${dateKey}`,
                    timestamp,
                    NOTIFICATION_CHANNEL_IDS.nutritionReminders,
                    title,
                    body
                ));
            });
        }

        if (isNotificationEnabled(notifications, 'hydration')) {
            hydrationTimes.forEach((checkpoint) => {
                const timestamp = atLocalTime(date, checkpoint.hour, checkpoint.minute);
                if (timestamp <= now.getTime() + MIN_LEAD_MS) return;
                if (waterTotal >= HYDRATION_GOAL) return;
                if (isToday && waterTotal >= checkpoint.expectedMl) return;
                pending.push(scheduleDescriptor(
                    `reminder:hydration:${checkpoint.id}:${dateKey}`,
                    timestamp,
                    NOTIFICATION_CHANNEL_IDS.hydrationReminders,
                    'Hydration reminder',
                    `You are a little behind on water. A quick refill helps you stay on pace for ${HYDRATION_GOAL}ml today.`
                ));
            });
        }

        if (isNotificationEnabled(notifications, 'steps')) {
            stepTimes.forEach((checkpoint) => {
                const timestamp = atLocalTime(date, checkpoint.hour, checkpoint.minute);
                if (timestamp <= now.getTime() + MIN_LEAD_MS) return;
                if (steps >= stepGoal) return;
                if (isToday && steps >= Math.round(stepGoal * checkpoint.ratio)) return;
                pending.push(scheduleDescriptor(
                    `reminder:steps:${checkpoint.id}:${dateKey}`,
                    timestamp,
                    NOTIFICATION_CHANNEL_IDS.stepsReminders,
                    'Step reminder',
                    `You are below pace for your ${stepGoal.toLocaleString()} step goal. A short walk now helps later.`
                ));
            });
        }

        if (isNotificationEnabled(notifications, 'sleep')) {
            if (isNotificationEnabled(notifications, 'sleep', 'bedtimeEnabled')) {
                const bedtimeAt = atLocalTime(date, timingSnapshot.bedtimeHour, 0);
                if (bedtimeAt > now.getTime() + MIN_LEAD_MS) {
                    pending.push(scheduleDescriptor(
                        `reminder:sleep:bedtime:${dateKey}`,
                        bedtimeAt,
                        NOTIFICATION_CHANNEL_IDS.sleepReminders,
                        'Bedtime reminder',
                        'Start winding down so tonight\'s recovery stays on track.'
                    ));
                }
            }

        }
    });

    const fingerprint = JSON.stringify({
        notifications,
        todayKey,
        todayCalories,
        calorieGoal,
        stepGoal,
        todaySteps: Number(fullStepHistory?.[todayKey] || 0),
        todayWater: getTodayWaterTotal(hydrationLogsByDay[todayKey] || []),
        workoutCountToday: workoutMap.byDay.has(todayKey) ? 1 : 0,
        timingSnapshot,
        pendingIds: pending.map((item) => item.id),
    });

    return { notifications, pending, timingSnapshot, fingerprint };
}

export async function rescheduleReminderNotifications(reason = 'manual') {
    try {
        const permissionGranted = await getAppNotificationPermissionStatus();
        const settings = await getSettings();
        const notifications = resolveNotificationSettings(settings?.notifications, settings);

        if (!notifications.masterEnabled || !permissionGranted) {
            await cancelScheduledReminderNotifications();
            await saveNotificationState({
                pendingIds: [],
                lastFingerprint: JSON.stringify({ masterEnabled: notifications.masterEnabled, permissionGranted }),
                lastPersonalizedTimingSnapshot: {},
            });
            return { scheduled: 0, reason, skipped: true };
        }

        await ensureNotificationChannels();

        const next = await buildReminderSchedule(new Date());
        const previousState = await getNotificationState();
        if (
            previousState.lastFingerprint &&
            previousState.lastFingerprint === next.fingerprint &&
            Array.isArray(previousState.pendingIds) &&
            previousState.pendingIds.length === next.pending.length
        ) {
            return {
                scheduled: next.pending.length,
                reason,
                skipped: false,
                unchanged: true,
            };
        }

        const existingIds = new Set(previousState.pendingIds || []);
        const nextIds = next.pending.map((item) => item.id);
        const nextIdSet = new Set(nextIds);
        const idsToCancel = [...existingIds].filter((id) => !nextIdSet.has(id));

        if (idsToCancel.length) {
            await notifee.cancelTriggerNotifications(idsToCancel);
            await Promise.all(idsToCancel.map((id) => notifee.cancelNotification(id).catch(() => {})));
        }

        await Promise.all(next.pending.map((item) => {
            const trigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: item.timestamp,
            };
            return notifee.createTriggerNotification(item.notification, trigger);
        }));

        await saveNotificationState({
            pendingIds: nextIds,
            lastFingerprint: next.fingerprint,
            lastPersonalizedTimingSnapshot: next.timingSnapshot,
        });

        return {
            scheduled: next.pending.length,
            reason,
            skipped: false,
        };
    } catch (error) {
        console.warn('Failed to reschedule reminder notifications:', error);
        return {
            scheduled: 0,
            reason,
            skipped: true,
            error,
        };
    }
}

export async function updateNotificationPreferences(patch = {}, options = {}) {
    const { skipPermissionRequest = false } = options;
    const settings = await getSettings();
    const currentNotifications = resolveNotificationSettings(settings?.notifications, settings);
    const nextNotifications = mergeNotificationSettings(currentNotifications, patch);
    let finalNotifications = nextNotifications;

    if (currentNotifications.masterEnabled === false && nextNotifications.masterEnabled && !skipPermissionRequest) {
        const granted = await requestAppNotificationPermission();
        if (!granted) {
            finalNotifications = mergeNotificationSettings(nextNotifications, {
                masterEnabled: false,
                promptCompleted: true,
            });
        }
    }

    const { saveSettings } = require('./storage');
    const updatedSettings = await saveSettings({
        notifications: finalNotifications,
        notificationsEnabled: finalNotifications.masterEnabled,
        notificationPromptCompleted: finalNotifications.promptCompleted,
    });
    try {
        const { setNotificationsEnabledCache } = require('./restTimerNotification');
        setNotificationsEnabledCache(isNotificationEnabled(finalNotifications, 'workout', 'restTimerEnabled'));
    } catch {
        // Ignore cache sync issues and rely on the persisted settings fallback.
    }

    return {
        settings: updatedSettings,
        notifications: finalNotifications,
        granted: finalNotifications.masterEnabled,
    };
}

export function getNotificationCategoryDefinitions() {
    return NOTIFICATION_CATEGORY_META;
}

export function getNotificationCategoryStatusLabel(notificationSettings, category) {
    return getNotificationCategorySummary(notificationSettings, category);
}
