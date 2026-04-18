/**
 * Rest Timer Notification Service
 * 
 * Uses @notifee/react-native to show a live countdown timer in the Android
 * notification tray and lock screen. Uses Android's native Chronometer widget
 * so the OS handles the countdown rendering — no JS polling needed.
 * 
 * Plan B: Module-level shared state for background event handling.
 */

import notifee, {
    AndroidImportance,
    AndroidVisibility,
    EventType,
} from '@notifee/react-native';

// ─── Shared module-level state (Plan B) ───────────────────────────────
// These are read/written by both the React component and the background
// event handler, avoiding the need for an EventEmitter bridge.
let _restTimerCallback = null;   // fn(action) called from background events
let _currentExerciseName = '';

const CHANNEL_ID = 'rest-timer';
const NOTIFICATION_ID = 'rest-timer-active';
const COMPLETE_NOTIFICATION_ID = 'rest-timer-complete';
const COMPLETE_CHANNEL_ID = 'rest-complete';

// ─── Channel setup ────────────────────────────────────────────────────
let channelCreated = false;

async function ensureChannel() {
    if (channelCreated) return;
    await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Rest Timer',
        description: 'Countdown timer between workout sets',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,   // visible on lock screen
        sound: '',                              // no sound on update
        vibration: false,
    });
    channelCreated = true;
}

async function ensureCompleteChannel() {
    await notifee.createChannel({
        id: COMPLETE_CHANNEL_ID,
        name: 'Rest Complete',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [0, 200, 100, 200, 100, 200],
    });
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Register a callback that the background event handler will invoke
 * when the user taps an action button on the notification.
 * 
 * @param {function} cb - receives 'minus15' | 'plus15' | 'skip'
 */
export function setRestTimerCallback(cb) {
    _restTimerCallback = cb;
}

/**
 * Show (or update) the rest timer notification with a live countdown.
 * 
 * @param {number} remainingSeconds - seconds left on the timer
 * @param {string} exerciseName - name of the current exercise
 */
export async function showRestTimerNotification(remainingSeconds, exerciseName = '') {
    try {
        await ensureChannel();
        _currentExerciseName = exerciseName;

        const targetTimestamp = Date.now() + remainingSeconds * 1000;

        await notifee.displayNotification({
            id: NOTIFICATION_ID,
            title: `Resting${exerciseName ? ` — ${exerciseName}` : ''}`,
            body: 'Tap to return to workout',
            android: {
                channelId: CHANNEL_ID,
                asForegroundService: true,
                ongoing: true,                  // can't swipe away
                onlyAlertOnce: true,            // don't buzz on every update
                showTimestamp: true,
                showChronometer: true,
                chronometerDirection: 'down',
                timestamp: targetTimestamp,
                visibility: AndroidVisibility.PUBLIC,
                pressAction: { id: 'default', launchActivity: 'default' },
                actions: [
                    { title: '−15s', pressAction: { id: 'minus15' } },
                    { title: '+15s', pressAction: { id: 'plus15' } },
                    { title: 'Skip', pressAction: { id: 'skip' } },
                ],
            },
        });
    } catch (err) {
        console.warn('Failed to show rest timer notification:', err);
    }
}

/**
 * Update the countdown on an existing notification without re-creating it.
 * 
 * @param {number} remainingSeconds - new seconds remaining
 */
export async function updateRestTimerNotification(remainingSeconds) {
    try {
        const targetTimestamp = Date.now() + remainingSeconds * 1000;

        await notifee.displayNotification({
            id: NOTIFICATION_ID,
            title: `Resting${_currentExerciseName ? ` — ${_currentExerciseName}` : ''}`,
            body: 'Tap to return to workout',
            android: {
                channelId: CHANNEL_ID,
                asForegroundService: true,
                ongoing: true,
                onlyAlertOnce: true,
                showTimestamp: true,
                showChronometer: true,
                chronometerDirection: 'down',
                timestamp: targetTimestamp,
                visibility: AndroidVisibility.PUBLIC,
                pressAction: { id: 'default', launchActivity: 'default' },
                actions: [
                    { title: '−15s', pressAction: { id: 'minus15' } },
                    { title: '+15s', pressAction: { id: 'plus15' } },
                    { title: 'Skip', pressAction: { id: 'skip' } },
                ],
            },
        });
    } catch (err) {
        console.warn('Failed to update rest timer notification:', err);
    }
}

/**
 * Cancel the active rest timer notification and stop the foreground service.
 */
export async function cancelRestTimerNotification() {
    try {
        await notifee.stopForegroundService();
        await notifee.cancelNotification(NOTIFICATION_ID);
        _currentExerciseName = '';
    } catch (err) {
        console.warn('Failed to cancel rest timer notification:', err);
    }
}

/**
 * Show a brief "Rest Complete!" notification with sound + vibration.
 * Auto-dismissed after 4 seconds.
 */
export async function showTimerCompleteNotification() {
    try {
        await ensureChannel();
        await ensureCompleteChannel();

        await notifee.displayNotification({
            id: COMPLETE_NOTIFICATION_ID,
            title: 'Rest Complete! 💪',
            body: 'Time to hit the next set',
            android: {
                channelId: COMPLETE_CHANNEL_ID,
                autoCancel: true,
                visibility: AndroidVisibility.PUBLIC,
                pressAction: { id: 'default', launchActivity: 'default' },
                timeoutAfter: 4000,
            },
        });
    } catch (err) {
        console.warn('Failed to show timer complete notification:', err);
    }
}

export async function openRestTimerAlarmSoundSettings() {
    try {
        await ensureCompleteChannel();
        await notifee.openNotificationSettings(COMPLETE_CHANNEL_ID);
    } catch (err) {
        console.warn('Failed to open rest timer sound settings:', err);
    }
}

// ─── Background event handler ─────────────────────────────────────────
// This is called by Notifee when the user taps an action button while the
// app is backgrounded. It uses the module-level callback (Plan B).

export function handleNotifeeEvent({ type, detail }) {
    if (type === EventType.ACTION_PRESS) {
        const actionId = detail?.pressAction?.id;
        if (actionId && _restTimerCallback) {
            _restTimerCallback(actionId);
        }
    }
}
