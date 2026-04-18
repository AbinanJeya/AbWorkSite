import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Alert } from 'react-native';
import { getSyncQueue, clearSyncQueueItems } from './storage';

const KEYS = {
    MEALS: '@abwork_meals',
    WORKOUTS: '@abwork_workouts',
    STEPS: '@abwork_steps',
    SETTINGS: '@abwork_settings',
    DIARY: '@abwork_diary',
    ROUTINES: '@abwork_routines',
    WORKOUT_HISTORY: '@abwork_workout_history',
    USER_PROFILE: '@abwork_user_profile',
    XP: '@abwork_xp',
    CHAT_HISTORY: '@abwork_chat_history',
    SAVED_MEALS: '@abwork_saved_meals',
    SAVED_RECIPES: '@abwork_saved_recipes',
    WATER_PREFIX: 'water_',
};

/**
 * Grabs EVERY single offline database on the phone, packages it into a massive JSON blob,
 * and pushes it securely to the currently logged in user's cloud document.
 */
export async function forceCloudBackup(silent = true) {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || !user.uid) return false;

        const db = getFirestore();
        const payload = {
            lastSynced: new Date().toISOString(),
            appVersion: '1.0.0',
            data: {}
        };

        // Extract all 12 databases from the phone's harddrive
        for (const [keyName, storageKey] of Object.entries(KEYS)) {
            if (keyName === 'WATER_PREFIX') continue;
            const rawData = await AsyncStorage.getItem(storageKey);
            if (rawData) {
                payload.data[keyName] = JSON.parse(rawData);
            }
        }

        const allKeys = await AsyncStorage.getAllKeys();
        const waterKeys = allKeys.filter((storageKey) => storageKey.startsWith(KEYS.WATER_PREFIX));
        if (waterKeys.length > 0) {
            const waterEntries = await AsyncStorage.multiGet(waterKeys);
            payload.waterLogs = waterEntries.reduce((acc, [storageKey, rawValue]) => {
                if (!rawValue) return acc;

                const dateKey = storageKey.replace(KEYS.WATER_PREFIX, '');
                if (!dateKey) return acc;

                try {
                    acc[dateKey] = JSON.parse(rawValue);
                } catch {
                    acc[dateKey] = rawValue;
                }

                return acc;
            }, {});
        }

        // Push massive payload to Firestore (creates or overwrites the doc)
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, payload, { merge: true });

        if (!silent) console.log("✅ Custom Cloud Backup Successful!");
        return true;
    } catch (error) {
        console.error("❌ Cloud Backup Failed: ", error);
        if (!silent) Alert.alert("Sync Error", "Failed to backup data to the cloud.");
        return false;
    }
}

/**
 * Reaches out to Firestore, downloads the giant JSON backup blob, 
 * and carefully injects each chunk back into the phone's offline database keys.
 */
export async function restoreFromCloud(uid) {
    try {
        if (!uid) return false;

        const db = getFirestore();
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            console.log("⚠️ No cloud backup found for this user. Starting fresh.");
            return false;
        }

        const payload = docSnap.data();
        if (!payload || !payload.data) {
            // Older legacy profiles might just have top-level keys
            console.log("⚠️ Legacy cloud profile detected. Handled safely.");
            return false;
        }

        const cloudData = payload.data;

        // Inject each cloud chunk back into AsyncStorage
        const promises = [];
        for (const [keyName, storageKey] of Object.entries(KEYS)) {
            if (cloudData[keyName]) {
                const jsonString = JSON.stringify(cloudData[keyName]);
                promises.push(AsyncStorage.setItem(storageKey, jsonString));
            }
        }

        await Promise.all(promises);

        const waterLogs = payload.waterLogs;
        if (waterLogs && typeof waterLogs === 'object') {
            const waterWrites = Object.entries(waterLogs).map(([dateKey, logs]) =>
                AsyncStorage.setItem(`${KEYS.WATER_PREFIX}${dateKey}`, JSON.stringify(logs))
            );
            await Promise.all(waterWrites);
        }

        console.log("✅ Cloud Restore Successful! All 12 databases rebuilt.");
        return true;

    } catch (error) {
        console.error("❌ Cloud Restore Failed: ", error);
        return false;
    }
}

export async function wipeCloudData() {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.uid) return false;

        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            lastSynced: new Date().toISOString(),
            appVersion: '1.0.0',
            data: {},
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Cloud wipe failed:', error);
        return false;
    }
}

export async function processSyncQueue() {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.uid) return 0;

        const queue = await getSyncQueue();
        if (!Array.isArray(queue) || queue.length === 0) return 0;

        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        const existingWaterLogs = docSnap.exists() ? (docSnap.data()?.waterLogs || {}) : {};

        const mergedWaterLogs = { ...existingWaterLogs };
        const handledItems = [];
        let requiresFullBackup = false;

        queue.forEach((item) => {
            if (item?.type === 'water' && item?.date) {
                mergedWaterLogs[item.date] = item.data ?? [];
                handledItems.push(item);
                return;
            }

            requiresFullBackup = true;
        });

        if (handledItems.length > 0) {
            await setDoc(userDocRef, {
                lastSynced: new Date().toISOString(),
                waterLogs: mergedWaterLogs,
            }, { merge: true });

            await clearSyncQueueItems(handledItems);
        }

        if (requiresFullBackup) {
            await forceCloudBackup(true);
        }

        return handledItems.length;
    } catch (error) {
        console.error('Cloud sync queue processing failed:', error);
        return 0;
    }
}
