/**
 * React Native StyleSheet Types Extension
 * Allows string and numeric fontWeights for React Native compatibility
 */

declare module 'react-native' {
  interface TextStyle {
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | string | number | undefined;
  }
}

export {};
