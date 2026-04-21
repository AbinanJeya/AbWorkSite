import { useEffect, useRef } from 'react';
import * as Network from 'expo-network';
import { onAuthChange } from '../services/auth';
import { processLocalQueue } from '../services/localSync';
import { getSyncQueue } from '../services/storage';

export function useSyncEngine() {
    useEffect(() => {
        let wasOffline = false;

        const checkAndSync = async () => {
            try {
                const state = await Network.getNetworkStateAsync();
                const isOnline = state.isConnected && state.isInternetReachable;
                
                if (isOnline && wasOffline) {
                    // Just came back online — flush the queue immediately
                    console.log('[SyncEngine] Network restored. Flushing sync queue...');
                    await processLocalQueue();
                } else if (isOnline) {
                    // Already online — only sync if queue has items (avoid pointless calls)
                    const queue = await getSyncQueue();
                    if (queue.length > 0) {
                        await processLocalQueue();
                    }
                }
                
                wasOffline = !isOnline;
            } catch (err) {
                console.error('[SyncEngine] Check failed:', err);
            }
        };

        // 1. Initial sync on mount
        checkAndSync();

        // 2. Poll every 30s but only sync if queue has items
        const interval = setInterval(checkAndSync, 30000);

        // 3. Listen for Auth changes (start syncing when user logs in)
        const unsubscribeAuth = onAuthChange((user) => {
            if (user) {
                checkAndSync();
            }
        });

        return () => {
            clearInterval(interval);
            unsubscribeAuth();
        };
    }, []);
}
