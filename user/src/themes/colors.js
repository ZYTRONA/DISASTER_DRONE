/**
 * NDRF Mobile Theme - Modern Glassmorphism Design System
 * Enhanced colors, spacing, typography, and glass effects for premium UI/UX
 */

/**
 * Type safe fontWeight helper to bypass strict TypeScript TextStyle checks
 * @param {string | number} weight - Font weight value
 * @returns {any} Font weight value with type assertion
 */
export const fw = (weight) => /** @type {any} */ (weight);

export const Colors = {
  // Modern Light Brand Colors
  primary: '#2563eb',      // Vibrant blue
  primaryLight: '#3b82f6', // Light blue
  primaryAccent: '#0ea5e9', // Cyan accent

  secondary: '#7c3aed',    // Purple
  secondaryLight: '#a78bfa', // Light purple

  // Modern Category Colors - Light Palette
  food: '#f59e0b',         // Warm amber
  foodBg: '#fef3c7',       // Light amber background
  foodDark: '#d97706',     // Dark amber
  
  medicine: '#ef4444',     // Red
  medicineBg: '#fee2e2',   // Light red background
  medicineDark: '#dc2626', // Dark red

  // Modern Light UI Colors
  background: '#f8f9fc',   // Light gray background
  surface: '#ffffff',      // White surface
  surfaceAlt: '#f1f5f9',   // Light gray alt
  surfaceAlt2: '#e2e8f0',  // Medium gray alt
  border: '#e2e8f0',       // Light border
  borderLight: '#f1f5f9',  // Very light border
  borderFocus: '#3b82f6',  // Blue focus

  // Glassmorphism Colors - Transparent overlays
  glassLight: 'rgba(255, 255, 255, 0.8)',      // Primary glass
  glassDark: 'rgba(255, 255, 255, 0.6)',       // Secondary glass
  glassExtraDark: 'rgba(255, 255, 255, 0.4)',  // Subtle glass
  glassAccent: 'rgba(37, 99, 235, 0.1)',       // Blue tinted glass
  glassPurple: 'rgba(124, 58, 237, 0.1)',      // Purple tinted glass

  // Gradient Colors
  gradientBlue: ['#3b82f6', '#0ea5e9'],        // Blue to cyan
  gradientPurple: ['#7c3aed', '#a78bfa'],      // Purple gradient
  gradientFood: ['#f59e0b', '#fbbf24'],        // Amber gradient
  gradientMedicine: ['#ef4444', '#f87171'],    // Red gradient

  // Modern Text Hierarchy - Light Mode
  textPrimary: '#1e293b',      // Dark gray text
  textSecondary: '#475569',    // Medium gray text
  textMuted: '#94a3b8',        // Light gray text
  textInverse: '#ffffff',      // White text
  textLabel: '#64748b',        // Label text

  // Modern Accent Colors
  blue: '#3b82f6',
  blueDark: '#1e40af',
  blueLight: '#dbeafe',
  cyan: '#06b6d4',
  cyanLight: '#cffafe',
  green: '#10b981',
  greenDark: '#059669',
  greenLight: '#d1fae5',
  yellow: '#eab308',
  yellowLight: '#fef08a',
  orange: '#f97316',
  orangeLight: '#fed7aa',
  red: '#ef4444',
  redLight: '#fecaca',
  purple: '#9333ea',
  purpleLight: '#e9d5ff',
  pink: '#ec4899',
  pinkLight: '#fbcfe8',
  indigo: '#4f46e5',
  indigoLight: '#e0e7ff',

  // Modern Status Colors
  success: '#10b981',
  successLight: '#d1fae5',
  successBg: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningBg: '#fffbeb',
  error: '#ef4444',
  errorLight: '#fecaca',
  errorBg: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoBg: '#eff6ff',

  // Emergency Services Colors
  emergency: '#dc2626',
  emergencyLight: '#fee2e2',
  emergencyBg: '#fef2f2',
  ndrf: '#1e40af',
  ndrfLight: '#dbeafe',
  ndrfBg: '#eff6ff',
  flood: '#0369a1',
  floodLight: '#cffafe',
  ambulance: '#10b981',
  ambulanceLight: '#d1fae5',
  disaster: '#9333ea',
  disasterLight: '#e9d5ff',

  // Transparency & Overlays
  overlay: 'rgba(0, 0, 0, 0.3)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(15, 23, 42, 0.1)',

  // Gradients (as strings for use with LinearGradient)
  gradients: {
    primary: ['#3b82f6', '#1e40af'],
    success: ['#10b981', '#059669'],
    danger: ['#ef4444', '#dc2626'],
    warning: ['#f59e0b', '#d97706'],
  }
};

export const THEME = {
  // Premium spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Premium border radius - modern rounded design
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },

  // Premium typography system
  typography: {
    size: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
      h1: 32,
      h2: 28,
      h3: 24,
      h4: 20,
    },
    weight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '900',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // Premium shadows - subtle & elegant
  shadow: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Premium borders
  border: {
    thin: 0.5,
    light: 1,
    normal: 1.5,
    medium: 2,
    heavy: 3,
  },

  // Transition/animation timings
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },
};
