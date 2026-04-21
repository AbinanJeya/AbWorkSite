import { getSettings, getUserProfile, saveUserProfile } from './storage';

function createUser(overrides = {}) {
    return {
        uid: 'preview-user',
        email: 'preview@abwork.app',
        emailVerified: true,
        displayName: 'Preview User',
        ...overrides,
    };
}

let currentUser = createUser();
const authListeners = new Set();

function notifyAuthListeners() {
    const snapshot = currentUser ? { ...currentUser } : null;
    auth.currentUser = snapshot;
    authListeners.forEach((listener) => {
        try {
            listener(snapshot);
        } catch {
            // Preview-only auth callbacks should never block the UI.
        }
    });
}

export const auth = {
    currentUser: { ...currentUser },
    signOut: async () => {
        currentUser = null;
        notifyAuthListeners();
        return true;
    },
};

export function getCurrentUser() {
    return currentUser ? { ...currentUser } : null;
}

export function onAuthChange(listener) {
    authListeners.add(listener);
    listener(getCurrentUser());

    return () => {
        authListeners.delete(listener);
    };
}

export async function signUp(email, password) {
    if (!email?.trim() || !password?.trim()) {
        throw new Error('Missing credentials.');
    }

    currentUser = createUser({
        uid: `preview-${Date.now()}`,
        email: email.trim(),
        emailVerified: false,
        displayName: email.trim().split('@')[0] || 'Preview User',
    });
    notifyAuthListeners();
    return getCurrentUser();
}

export async function signIn(email, password) {
    if (!email?.trim() || !password?.trim()) {
        throw new Error('Missing credentials.');
    }

    currentUser = createUser({
        uid: `preview-${Date.now()}`,
        email: email.trim(),
        emailVerified: true,
        displayName: email.trim().split('@')[0] || 'Preview User',
    });
    notifyAuthListeners();
    return getCurrentUser();
}

export async function signInAsDemo() {
    currentUser = createUser({
        uid: `preview-demo-${Date.now()}`,
        email: 'demo@abwork.app',
        emailVerified: true,
        displayName: 'Demo User',
    });
    notifyAuthListeners();
    return getCurrentUser();
}

export async function sendVerificationEmail() {
    return true;
}

export async function sendPasswordResetEmail() {
    return true;
}

export async function signOut() {
    currentUser = null;
    notifyAuthListeners();
    return true;
}

export async function deleteAccount() {
    currentUser = null;
    notifyAuthListeners();
    await saveUserProfile({ onboardingComplete: false });
    return true;
}

export async function savePreviewProfile(_uid, profile) {
    await saveUserProfile(profile);
    return { ...profile };
}

export async function restorePreviewState() {
    const profile = await getUserProfile();
    const settings = await getSettings();
    return {
        ...profile,
        settings,
        needsHealthConnectReauth: false,
    };
}
