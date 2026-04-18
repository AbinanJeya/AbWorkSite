import React from 'react';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

/**
 * StyledRefreshControl
 * Properly colors the native pull-to-refresh spinner and uses 
 * progressViewOffset to push it completely below the status bar/hole-punch.
 */
export function StyledRefreshControl({ refreshing, onRefresh, ...rest }) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    
    // Align the dragged spinner roughly with the header (profile pic row)
    // React Native's default offset usually pushes it down somewhat, so we don't need a huge addition.
    const offset = Math.max(insets.top - 10, 20);

    return (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary} 
            colors={[colors.primary]} 
            progressBackgroundColor={isDark ? '#333333' : '#FFFFFF'}
            progressViewOffset={offset} 
            {...rest}
        />
    );
}

// Dummy backward compat for screens during removal
export const RefreshOverlay = () => null;
export const RefreshHeader = () => null;
