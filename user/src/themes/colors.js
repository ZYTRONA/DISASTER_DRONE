/**
 * NDRF Mobile Theme - Modern Light Design System for Disaster Relief
 * Light theme with modern vibrant colors, clean SVG icons, smooth animations
 */

export const fw = (weight) => /** @type {any} */ (weight);

export const Colors = {
  // Modern Light Theme - Primary Colors
  primary: '#0066ff',      // Modern Blue (safe/confirmed) - Vibrant & professional
  primaryLight: '#4d94ff', // Light blue
  primaryAccent: '#0052cc', // Dark blue accent

  secondary: '#ff7f00',    // Modern Orange (in-progress) - Warm & energetic
  secondaryLight: '#ffaa47', // Light orange
  
  // Critical/SOS Color
  danger: '#d32f2f',       // Deep Red (SOS/critical) - Bold & commanding
  dangerLight: '#f57c77',  // Light red
  dangerBg: 'rgba(211, 47, 47, 0.08)',

  // Light Theme Backgrounds
  background: '#ffffff',   // Pure white, clean & bright
  surface: '#f5f7fa',      // Very light gray surface
  surfaceAlt: '#eeeff5',   // Medium light surface
  surfaceHover: '#e8eaef', // Light surface hover
  
  // Borders & Dividers (light theme)
  border: 'rgba(0, 0, 0, 0.08)',
  borderFocus: '#0066ff',  // Blue border on focus

  // Status Colors - Light optimized
  success: '#2e7d32',      // Modern Green
  successBg: 'rgba(46, 125, 50, 0.08)',
  warning: '#f57c00',      // Modern Orange
  warningBg: 'rgba(245, 124, 0, 0.08)',
  error: '#d32f2f',        // Modern Red
  errorBg: 'rgba(211, 47, 47, 0.08)',
  
  // Text Colors - Light theme optimized
  textPrimary: '#212121',      // Dark text for light backgrounds
  textSecondary: '#666666',    // Medium gray text
  textMuted: '#999999',        // Muted text
  textLabel: '#555555',        // Label text
  textInverse: '#ffffff',      // Light text on dark

  // Accent Colors - Modern palette
  teal: '#00897b',
  tealbg: 'rgba(0, 137, 123, 0.08)',
  amber: '#ff9800',
  amberbg: 'rgba(255, 152, 0, 0.08)',
  red: '#d32f2f',
  redbg: 'rgba(211, 47, 47, 0.08)',
  green: '#2e7d32',
  greenbg: 'rgba(46, 125, 50, 0.08)',
  blue: '#0066ff',
  bluebg: 'rgba(0, 102, 255, 0.08)',

  // Glass/Overlay Effects - Light theme
  glassLight: 'rgba(255, 255, 255, 0.9)',      // Primary glass
  glassDark: 'rgba(245, 247, 250, 0.95)',      // Lighter glass
  glassAccent: 'rgba(0, 102, 255, 0.05)',      // Blue tinted glass

  // Gradients - Modern light theme
  gradientTeal: ['#00897b', '#26a69a'],        // Teal gradient
  gradientAmber: ['#ff9800', '#ffb74d'],       // Amber gradient
  gradientRed: ['#d32f2f', '#ff5252'],         // Red gradient

  // Modern Category Colors
  food: '#ff9800',         // Modern Orange
  foodBg: 'rgba(255, 152, 0, 0.08)',
  
  medicine: '#d32f2f',     // Modern Red
  medicineBg: 'rgba(211, 47, 47, 0.08)',
  
  // Preserved original colors for compatibility
  primaryOld: '#2563eb',
  secondary_old: '#7c3aed',
  background_light: '#ffffff',
  surface_light: '#f5f7fa',
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
