import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme, ELEVATION } from '../theme';

export function BarcodeScannerModal({ visible, onClose, onScan }) {
    const { colors, isDark } = useTheme();
    const { width, height } = useWindowDimensions();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const frameSize = Math.min(width * 0.72, 290);
    const frameLeft = Math.max(20, Math.round((width - frameSize) / 2));
    const frameTop = Math.max(120, Math.round((height - frameSize) / 2) - 20);
    const frameBottom = frameTop + frameSize;
    const captionLeft = Math.max(20, Math.round((width - 270) / 2));
    const blurIntensity = isDark ? 90 : 65;
    const blurTint = isDark ? 'dark' : 'light';
    const useNativeBlur = Platform.OS === 'ios' || (Platform.OS === 'android' && Number(Platform.Version) >= 31);

    useEffect(() => {
        if (visible) {
            setScanned(false);
            if (!permission?.granted) {
                requestPermission();
            }
        }
    }, [visible, permission]);

    const handleBarcodeScanned = ({ type, data }) => {
        if (!scanned) {
            setScanned(true);
            onScan(data);
            onClose();
        }
    };

    if (!visible) return null;

    const renderOverlayPane = (paneStyle) => {
        if (!useNativeBlur) {
            return (
                <View
                    style={[
                        styles.fallbackPane,
                        paneStyle,
                        { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.56)' : 'rgba(255, 255, 255, 0.20)' },
                    ]}
                />
            );
        }

        return (
            <BlurView
                intensity={blurIntensity}
                tint={blurTint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
                style={[styles.blurPane, paneStyle]}
            />
        );
    };

    if (!permission) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Modal>
        );
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[styles.container, { padding: 20, backgroundColor: colors.bgDark }]}>
                    <Text style={{ textAlign: 'center', color: colors.text, fontSize: 18, marginBottom: 20 }}>
                        We need your permission to use the camera
                    </Text>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                        <Text style={[styles.btnText, { color: colors.textOnPrimary }]}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.surface, marginTop: 10, borderWidth: 1, borderColor: colors.border }]} onPress={onClose}>
                        <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide">
            <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                    }}
                />
                <View style={styles.overlay} pointerEvents="none">
                    {renderOverlayPane([styles.blurTop, { height: frameTop }])}
                    <View style={styles.midRow}>
                        {renderOverlayPane([styles.blurSide, { width: frameLeft, top: frameTop, height: frameSize }])}
                        <View style={[styles.scanFrame, { left: frameLeft, top: frameTop, width: frameSize, height: frameSize, borderColor: colors.primary }]}>
                            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
                            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
                            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
                            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />
                            <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
                        </View>
                        {renderOverlayPane([styles.blurSide, { left: frameLeft + frameSize, right: 0, top: frameTop, height: frameSize }])}
                    </View>
                    {renderOverlayPane([styles.blurBottom, { top: frameBottom }])}
                    <View style={[styles.captionPill, { top: frameBottom + 18, left: captionLeft, backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                        <Text style={[styles.scanText, { color: colors.text }]}>Line up a barcode within the frame to scan</Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, shadowColor: colors.shadowSoft }]} onPress={onClose}>
                    <Text style={[styles.closeBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    blurPane: {
        position: 'absolute',
    },
    fallbackPane: {
        position: 'absolute',
    },
    blurTop: {
        top: 0,
        left: 0,
        right: 0,
    },
    blurBottom: {
        left: 0,
        right: 0,
        bottom: 0,
    },
    blurSide: {
    },
    midRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    scanFrame: {
        position: 'absolute',
        borderWidth: 2,
        borderRadius: 28,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        ...ELEVATION.card,
    },
    corner: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderWidth: 3,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 24,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 24,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 24,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 24,
    },
    scanLine: {
        position: 'absolute',
        left: 22,
        right: 22,
        top: '50%',
        height: 2,
        borderRadius: 999,
        opacity: 0.9,
    },
    captionPill: {
        position: 'absolute',
        width: 270,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
    scanText: {
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        textAlign: 'center',
    },
    closeBtn: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        ...ELEVATION.card,
    },
    closeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    btn: {
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
