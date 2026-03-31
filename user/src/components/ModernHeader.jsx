/**
 * Modern Header Component - Glassmorphism design with smooth animations
 * Reusable animated header for all screens with modern glass effect
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, THEME } from '../themes/colors';
import { usePressAnimation } from '../utils/animationHooks';

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: THEME.typography.size.xs,
    fontWeight: '500',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: THEME.typography.size.h2,
    fontWeight: '900',
    color: Colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    alignItems: 'center',
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: THEME.typography.size.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
});

/**
 * Glass Button Component - Reusable button with glass effect
 */
function GlassButton({ icon, label, onPress, style, testID }) {
  const { scale, onPressIn, onPressOut } = usePressAnimation();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      testID={testID}
    >
      <Animated.View style={[styles.glassButton, style, { transform: [{ scale }] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={icon} size={18} color={Colors.textPrimary} />
          {label && <Text style={styles.buttonText}>{label}</Text>}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function ModernHeader(props) {
  const { subtitle, title, onBackPress, actions } = props;
  const insets = useSafeAreaInsets();
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [title, titleOpacity]);

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Math.max(insets.top, THEME.spacing.md) },
      ]}
    >
      <BlurView intensity={80} style={styles.headerBlur} />
      <View style={styles.headerBackground} />

      <Animated.View
        style={[
          styles.headerInner,
          { opacity: titleOpacity },
        ]}
      >
        <View style={styles.headerContent}>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <View style={styles.headerActions}>
          {onBackPress && (
            <GlassButton
              icon="chevron-back"
              onPress={onBackPress}
              style={styles.backButton}
              testID="header-back-button"
            />
          )}

          {actions &&
            actions.map((action, idx) => (
              <GlassButton
                key={idx}
                icon={action.icon}
                label={action.label}
                onPress={action.onPress}
                testID={action.testID}
              />
            ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default ModernHeader;
