import { Capacitor } from '@capacitor/core';

// Check if app is running on mobile (Capacitor)
export const isMobile = (): boolean => {
    return Capacitor.isNativePlatform();
};

// Check if app is running on specific platforms
export const isAndroid = (): boolean => {
    return Capacitor.getPlatform() === 'android';
};

export const isIOS = (): boolean => {
    return Capacitor.getPlatform() === 'ios';
};

export const isWeb = (): boolean => {
    return Capacitor.getPlatform() === 'web';
};

// Get current platform
export const getCurrentPlatform = (): string => {
    return Capacitor.getPlatform();
};