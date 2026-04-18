export const NOTIFICATION_DEFAULTS = {
    masterEnabled: true,
    promptCompleted: false,
    workout: {
        enabled: true,
        restTimerEnabled: true,
        workoutDayReminderEnabled: true,
    },
    nutrition: {
        enabled: true,
        breakfastEnabled: true,
        lunchEnabled: true,
        dinnerEnabled: true,
        snacksEnabled: false,
    },
    hydration: {
        enabled: true,
    },
    steps: {
        enabled: true,
    },
    sleep: {
        enabled: true,
        bedtimeEnabled: false,
    },
};

export const NOTIFICATION_CATEGORY_META = {
    workout: {
        title: 'Workout',
        subtitle: 'Rest timer alerts and training reminders',
        icon: 'fitness-center',
        toggles: [
            {
                key: 'restTimerEnabled',
                title: 'Rest timer alerts',
                description: 'Show the live rest timer and the rest-complete alert during workouts.',
            },
            {
                key: 'workoutDayReminderEnabled',
                title: 'Workout day reminders',
                description: 'Nudge you on days when you are behind your weekly workout target.',
            },
        ],
    },
    nutrition: {
        title: 'Nutrition',
        subtitle: 'Meal logging reminders based on your habits',
        icon: 'restaurant',
        toggles: [
            {
                key: 'breakfastEnabled',
                title: 'Breakfast reminder',
                description: 'Remind you to log breakfast if that slot is still empty after your usual morning window.',
            },
            {
                key: 'lunchEnabled',
                title: 'Lunch reminder',
                description: 'Remind you to log lunch if it has not been added by your usual midday window.',
            },
            {
                key: 'dinnerEnabled',
                title: 'Dinner reminder',
                description: 'Remind you to log dinner if the evening meal is still missing.',
            },
            {
                key: 'snacksEnabled',
                title: 'Snack reminder',
                description: 'Send lighter snack nudges later in the day when snack logging fits your pattern.',
            },
        ],
    },
    hydration: {
        title: 'Hydration',
        subtitle: 'Water logging reminders when you fall behind pace',
        icon: 'water-drop',
        toggles: [],
    },
    steps: {
        title: 'Steps',
        subtitle: 'Walking nudges based on your daily step progress',
        icon: 'directions-walk',
        toggles: [],
    },
    sleep: {
        title: 'Sleep',
        subtitle: 'Bedtime reminders',
        icon: 'bedtime',
        toggles: [
            {
                key: 'bedtimeEnabled',
                title: 'Bedtime reminder',
                description: 'Send a wind-down reminder near your usual bedtime or evening preference.',
            },
        ],
    },
};

function cloneDefaults() {
    return JSON.parse(JSON.stringify(NOTIFICATION_DEFAULTS));
}

function mergeNested(base, patch) {
    const next = Array.isArray(base) ? [...base] : { ...base };
    Object.entries(patch || {}).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
            next[key] = mergeNested(base[key], value);
        } else {
            next[key] = value;
        }
    });
    return next;
}

export function resolveNotificationSettings(rawNotifications = null, legacySettings = null) {
    const defaults = cloneDefaults();
    const legacyEnabled = legacySettings?.notificationsEnabled;
    const legacyPromptCompleted = legacySettings?.notificationPromptCompleted;
    const current = rawNotifications && typeof rawNotifications === 'object'
        ? mergeNested(defaults, rawNotifications)
        : defaults;

    if (typeof legacyEnabled === 'boolean') {
        current.masterEnabled = legacyEnabled;
        current.workout.enabled = legacyEnabled;
    }

    if (typeof legacyPromptCompleted === 'boolean') {
        current.promptCompleted = legacyPromptCompleted;
    }

    current.masterEnabled = current.masterEnabled !== false;
    current.promptCompleted = !!current.promptCompleted;
    current.workout.enabled = current.workout.enabled !== false;
    current.workout.restTimerEnabled = current.workout.restTimerEnabled !== false;
    current.workout.workoutDayReminderEnabled = current.workout.workoutDayReminderEnabled !== false;
    current.nutrition.enabled = current.nutrition.enabled !== false;
    current.nutrition.breakfastEnabled = current.nutrition.breakfastEnabled !== false;
    current.nutrition.lunchEnabled = current.nutrition.lunchEnabled !== false;
    current.nutrition.dinnerEnabled = current.nutrition.dinnerEnabled !== false;
    current.nutrition.snacksEnabled = current.nutrition.snacksEnabled === true;
    current.hydration.enabled = current.hydration.enabled !== false;
    current.steps.enabled = current.steps.enabled !== false;
    current.sleep.enabled = current.sleep.enabled !== false;
    current.sleep.bedtimeEnabled = current.sleep.bedtimeEnabled === true;
    return current;
}

export function mergeNotificationSettings(currentNotifications = null, patch = null, legacySettings = null) {
    const current = resolveNotificationSettings(currentNotifications, legacySettings);
    if (!patch || typeof patch !== 'object') {
        return current;
    }
    return resolveNotificationSettings(mergeNested(current, patch));
}

export function isNotificationEnabled(notificationSettings, category, toggleKey = null) {
    const settings = resolveNotificationSettings(notificationSettings);
    if (!settings.masterEnabled) return false;
    if (!category) return settings.masterEnabled;
    const categorySettings = settings[category];
    if (!categorySettings || categorySettings.enabled === false) return false;
    if (!toggleKey) return true;
    return categorySettings[toggleKey] !== false;
}

export function getNotificationCategorySummary(notificationSettings, category) {
    const settings = resolveNotificationSettings(notificationSettings);
    const categorySettings = settings?.[category];
    if (!settings.masterEnabled || !categorySettings || categorySettings.enabled === false) {
        return 'Off';
    }
    const meta = NOTIFICATION_CATEGORY_META[category];
    if (!meta?.toggles?.length) {
        return 'On';
    }
    const enabledCount = meta.toggles.reduce((count, toggle) => count + (categorySettings[toggle.key] !== false ? 1 : 0), 0);
    return `${enabledCount}/${meta.toggles.length} on`;
}
