/**
 * GlassCard Component - Reusable glassmorphism card with smooth animations
 * Provides modern glass morphism design with blur effect and smooth transitions
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, THEME } from '../themes/colors';
import {
  createFadeInAnimation,
  createScaleAnimation,
  AnimationDurations,
  glassShadow,
} from '../utils/animationUtils';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  glassCardContainer: {
    borderRadius: THEME.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  glassCardContent: {
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  glassCardInner: {
    padding: THEME.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
});

/**
 * GlassCard - Modern glassmorphism card component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {number} [props.blurAmount=90] - Blur intensity (0-100)
 * @param {boolean} [props.animated=true] - Enable entrance animation
 * @param {boolean} [props.interactive=false] - Enable tap feedback
 * @param {Function} [props.onPress] - Callback on card press
 * @param {Object} [props.style] - Additional styles
 * @param {string} [props.backgroundColor] - Custom glass background color
 * @param {number} [props.borderOpacity=0.3] - Border opacity
 * @returns {React.ReactElement}
 */
function GlassCard({
  children,
  blurAmount = 90,
  animated = true,
  interactive = false,
  onPress,
  style,
  backgroundColor = Colors.glassLight,
  borderOpacity = 0.3,
  ...props
}) {
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(animated ? 0.95 : 1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Stagger animations for smooth entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: AnimationDurations.normal,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: AnimationDurations.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, scaleAnim]);

  const handlePressIn = () => {
    if (interactive) {
      Animated.timing(pressAnim, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (interactive) {
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { scale: Animated.multiply(scaleAnim, pressAnim) },
    ],
  };

  const borderColor = `rgba(255, 255, 255, ${borderOpacity})`;

  const CardContent = (
    <Animated.View
      style={[
        styles.glassCardContainer,
        animatedStyle,
        style,
        interactive && { flex: interactive ? 1 : undefined },
      ]}
      {...props}
    >
      <BlurView intensity={blurAmount} style={styles.absoluteFill}>
        <View
          style={[
            styles.absoluteFill,
            { backgroundColor },
          ]}
        />
      </BlurView>
      
      <View
        style={[
          styles.glassCardContent,
          {
            borderColor,
          },
        ]}
      >
        <View style={styles.glassCardInner}>
          {children}
        </View>
      </View>
    </Animated.View>
  );

  if (interactive && onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

export default GlassCard;
