import * as SQLite from 'expo-sqlite';
import { syncWorkoutCalendarWidgetSnapshot } from './workoutCalendarWidget';

let db = null;
let dbPromise = null;

async function syncWorkoutWidgetSnapshot() {
    try {
        const history = await dbGetWorkoutHistory();
        await syncWorkoutCalendarWidgetSnapshot(history);
    } catch (error) {
        console.warn('Workout calendar widget snapshot sync failed:', error);
    }
}

/**
 * Initializes and returns the SQLite database instance.
 * Sets up the workout_history table if it doesn't exist.
 */
export async function getDb() {
    if (db) return db;
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        try {
            const database = await SQLite.openDatabaseAsync('fitai.db');
            await database.execAsync(`
                PRAGMA journal_mode = WAL;
                CREATE TABLE IF NOT EXISTS workout_history (
                    id TEXT PRIMARY KEY NOT NULL,
                    routineName TEXT,
                    startedAt TEXT,
                    finishedAt TEXT,
                    elapsedSeconds INTEGER,
                    exerciseLogs TEXT,
                    imported INTEGER,
                    type TEXT,
                    activityType TEXT,
                    caloriesBurned INTEGER,
                    isExternal INTEGER,
                    source TEXT,
                    createdAt TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_workout_date ON workout_history(startedAt);
            `);
            db = database;
            console.log('SQLite: Database initialized');
            return db;
        } catch (error) {
            console.error('SQLite: Failed to initialize database', error);
            throw error;
        } finally {
            dbPromise = null;
        }
    })();

    return dbPromise;
}

/**
 * Maps a database row back to the application's workout object format.
 */
function mapRowToWorkout(row) {
    return {
        ...row,
        exerciseLogs: row.exerciseLogs ? JSON.parse(row.exerciseLogs) : [],
        imported: !!row.imported,
        isExternal: !!row.isExternal,
    };
}
/**
 * Fetches all workout history, sorted by start date (newest first).
 */
export async function dbGetWorkoutHistory() {
    const database = await getDb();
    const rows = await database.getAllAsync(
        'SELECT * FROM workout_history ORDER BY startedAt DESC'
    );
    return rows.map(mapRowToWorkout);
}

/**
 * Fetches the most recent workout sessions.
 */
export async function dbGetRecentWorkouts(limit = 10) {
    const database = await getDb();
    const rows = await database.getAllAsync(
        'SELECT * FROM workout_history ORDER BY startedAt DESC LIMIT ?',
        [limit]
    );
    return rows.map(mapRowToWorkout);
}

/**
 * Fetches only the timestamps and IDs of workouts for efficient calendar marking.
 */
export async function dbGetWorkoutMarkers() {
    const database = await getDb();
    return await database.getAllAsync(
        'SELECT id, startedAt, finishedAt, source FROM workout_history'
    );
}

/**
 * Saves a single workout session to the database.
 * Uses REPLACE to handle updates/deduplication by ID.
 */
export async function dbSaveWorkoutSession(session) {
    const database = await getDb();
    const {
        id, routineName, startedAt, finishedAt, elapsedSeconds,
        exerciseLogs, imported, type, activityType, caloriesBurned,
        isExternal, source
    } = session;

    await database.runAsync(
        `INSERT OR REPLACE INTO workout_history (
            id, routineName, startedAt, finishedAt, elapsedSeconds,
            exerciseLogs, imported, type, activityType, caloriesBurned,
            isExternal, source, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            routineName || null,
            startedAt || null,
            finishedAt || null,
            elapsedSeconds || 0,
            JSON.stringify(exerciseLogs || []),
            imported ? 1 : 0,
            type || null,
            activityType || null,
            caloriesBurned || 0,
            isExternal ? 1 : 0,
            source || null,
            new Date().toISOString()
        ]
    );
    await syncWorkoutWidgetSnapshot();
}

/**
 * Bulk saves workout sessions. Efficient for migrations and imports.
 */
export async function dbBulkSaveWorkouts(sessions) {
    const database = await getDb();
    
    // Using a transaction for bulk operations is critical for performance
    await database.withTransactionAsync(async () => {
        for (const s of sessions) {
            await database.runAsync(
                `INSERT OR REPLACE INTO workout_history (
                    id, routineName, startedAt, finishedAt, elapsedSeconds,
                    exerciseLogs, imported, type, activityType, caloriesBurned,
                    isExternal, source, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    s.id,
                    s.routineName || null,
                    s.startedAt || null,
                    s.finishedAt || null,
                    s.elapsedSeconds || 0,
                    JSON.stringify(s.exerciseLogs || []),
                    s.imported ? 1 : 0,
                    s.type || null,
                    s.activityType || null,
                    s.caloriesBurned || 0,
                    s.isExternal ? 1 : 0,
                    s.source || null,
                    new Date().toISOString()
                ]
            );
        }
    });
    await syncWorkoutWidgetSnapshot();
}

/**
 * Deletes workouts by criteria.
 */
export async function dbDeleteWorkouts(condition = '1=1', params = []) {
    const database = await getDb();
    await database.runAsync(`DELETE FROM workout_history WHERE ${condition}`, params);
    await syncWorkoutWidgetSnapshot();
}

/**
 * Optimized query for specific range (used for calendars/streaks).
 */
export async function dbGetWorkoutsInRange(startDate, endDate) {
    const database = await getDb();
    const rows = await database.getAllAsync(
        `SELECT * FROM workout_history
         WHERE startedAt BETWEEN ? AND ?
            OR (startedAt IS NULL AND finishedAt BETWEEN ? AND ?)
         ORDER BY COALESCE(startedAt, finishedAt) DESC`,
        [startDate, endDate, startDate, endDate]
    );
    return rows.map(mapRowToWorkout);
}

/**
 * Completely wipes the workout history table.
 */
export async function dbClearWorkoutHistory() {
    const database = await getDb();
    await database.runAsync('DELETE FROM workout_history');
    await syncWorkoutWidgetSnapshot();
}
