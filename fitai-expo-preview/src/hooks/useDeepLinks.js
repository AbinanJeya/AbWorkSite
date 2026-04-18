import { useEffect, useState } from 'react';
import { Linking } from 'react-native';

/**
 * Hook to listen for abwork://invite/{userId} deep links.
 * Used to trigger the "Add Friend" flow when someone clicks an invite link.
 */
export function useDeepLinks() {
    const [pendingInvite, setPendingInvite] = useState(null);

    const handleUrl = (url) => {
        if (!url) return;
        console.log("🔗 Deep Link Received:", url);

        // Pattern: abwork://invite/USER_ID
        const pattern = /abwork:\/\/invite\/([a-zA-Z0-9_-]+)/;
        const match = url.match(pattern);
        
        if (match && match[1]) {
            const userId = match[1];
            if (userId !== 'guest') {
                setPendingInvite(userId);
            }
        }
    };

    useEffect(() => {
        // Handle when app is opened from a closed state via link
        Linking.getInitialURL().then(url => {
            if (url) handleUrl(url);
        });

        // Handle when app is already open in the background
        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    return { 
        pendingInvite, 
        clearInvite: () => setPendingInvite(null) 
    };
}
