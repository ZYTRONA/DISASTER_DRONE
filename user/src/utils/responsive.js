/**
 * Responsive Utilities - Scale values based on screen dimensions
 * Ensures layout adapts smoothly to all device sizes
 */

import { Dimensions, Platform } from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

/**
 * REM scaling - responsive multiplier based on screen width
 * Base: 375px (iPhone SE width)
 */
export const rem = (baseValue) => {
  return (windowWidth / 375) * baseValue;
};

/**
 * Get responsive font size
 */
export const responsiveFontSize = (baseFontSize) => {
  const scale = windowWidth / 375;
  return Math.round(baseFontSize * scale);
};

/**
 * Get responsive padding based on screen dimensions
 */
export const getResponsivePadding = () => {
  if (windowWidth < 375) {
    return { horizontal: 12, vertical: 12 }; // Very small phones
  } else if (windowWidth < 768) {
    return { horizontal: 16, vertical: 16 }; // Phones
  } else if (windowWidth < 1024) {
    return { horizontal: 20, vertical: 20 }; // Tablets
  } else {
    return { horizontal: 24, vertical: 24 }; // Large tablets/landscapes
  }
};

/**
 * Get responsive spacing scale
 */
export const getResponsiveSpacing = () => {
  const scale = windowWidth / 375;
  return {
    xs: Math.round(4 * scale),
    sm: Math.round(8 * scale),
    md: Math.round(12 * scale),
    lg: Math.round(16 * scale),
    xl: Math.round(24 * scale),
    xxl: Math.round(32 * scale),
    xxxl: Math.round(40 * scale),
  };
};

/**
 * Get responsive border radius
 */
export const getResponsiveBorderRadius = () => {
  const scale = windowWidth / 375;
  return {
    xs: Math.round(4 * scale),
    sm: Math.round(8 * scale),
    md: Math.round(12 * scale),
    lg: Math.round(16 * scale),
    xl: Math.round(24 * scale),
    full: 999,
  };
};

/**
 * Check if device is in landscape
 */
export const isLandscape = () => {
  return windowWidth > windowHeight;
};

/**
 * Check device category
 */
export const getDeviceType = () => {
  if (windowWidth < 600) {
    return 'mobile';
  } else if (windowWidth < 900) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Get max width for content (prevent stretching on very wide screens)
 */
export const getContentMaxWidth = () => {
  const deviceType = getDeviceType();
  if (deviceType === 'mobile') {
    return '100%';
  } else if (deviceType === 'tablet') {
    return 600;
  } else {
    return 800;
  }
};

/**
 * Calculate grid column count based on screen width
 */
export const getGridColumns = (minColumnWidth = 100) => {
  const availableWidth = windowWidth - 32; // Account for padding
  return Math.max(1, Math.floor(availableWidth / minColumnWidth));
};

/**
 * Get responsive button height
 */
export const getResponsiveButtonHeight = () => {
  if (windowWidth < 375) return 40;
  if (windowWidth < 768) return 48;
  return 56;
};

/**
 * Dimensions object with reactive updates
 */
export const useResponsiveDimensions = () => {
  return {
    width: windowWidth,
    height: windowHeight,
    isSmallPhone: windowWidth < 375,
    isPhone: windowWidth < 768,
    isTablet: windowWidth >= 768 && windowWidth < 1024,
    isLarge: windowWidth >= 1024,
  };
};
