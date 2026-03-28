/**
 * NDRF Mobile Theme - Premium Design System
 * Enhanced colors, spacing, and typography for premium UI/UX
 */

/**
 * Type safe fontWeight helper to bypass strict TypeScript TextStyle checks
 * @param {string | number} weight - Font weight value
 * @returns {any} Font weight value with type assertion
 */
export const fw = (weight) => /** @type {any} */ (weight);

export const Colors = {
  // Premium brand colors - refined palette
  primary: '#0f172a',      // Deep slate for authority
  primaryLight: '#1e293b', // Light slate
  primaryAccent: '#3b82f6', // Bright blue accent

  secondary: '#6366f1',    // Indigo
  secondaryLight: '#818cf8', // Light indigo

  // Category colors with premium tones
  food: '#f59e0b',         // Warm amber
  foodBg: '#fef3c7',       // Premium light amber
  foodDark: '#d97706',     // Dark amber
  
  medicine: '#ef4444',     // Vibrant red
  medicineBg: '#fee2e2',   // Premium light red
  medicineDark: '#dc2626', // Dark red

  // Premium UI colors - glassmorphism ready
  background: '#ffffff',   // Pure white background
  surface: '#ffffff',      // Pure white surface
  surfaceAlt: '#f1f5f9',   // Alt surface (light gray)
  surfaceAlt2: '#e2e8f0',  // Darker alt
  border: '#cbd5e1',       // Premium border color
  borderLight: '#e2e8f0',  // Light border
  borderFocus: '#3b82f6',  // Blue focus

  // Premium text hierarchy
  textPrimary: '#0f172a',      // Deep text
  textSecondary: '#475569',    // Medium text
  textMuted: '#94a3b8',        // Muted text
  textInverse: '#ffffff',      // White text
  textLabel: '#64748b',        // Label text

  // Premium accent colors
  blue: '#3b82f6',
  blueDark: '#1e40af',
  cyan: '#06b6d4',
  green: '#10b981',
  greenDark: '#059669',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#dc2626',
  purple: '#9333ea',
  pink: '#ec4899',
  indigo: '#4f46e5',

  // Premium status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Helpline colors - emergency services
  emergency: '#dc2626',
  emergencyLight: '#fee2e2',
  ndrf: '#1e40af',
  ndrfLight: '#dbeafe',
  flood: '#0369a1',
  ambulance: '#10b981',
  disaster: '#9333ea',

  // Transparency & overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
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
