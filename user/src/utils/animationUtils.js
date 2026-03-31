/**
 * Animation Utilities and Constants
 * Centralized animation timing and easing configurations for consistent motion
 */

import { Animated, Platform, Easing } from 'react-native';

/**
 * Standard animation durations (milliseconds)
 */
export const AnimationDurations = {
  instant: 100,           // Quick feedback
  fast: 200,              // Snappy interactions
  normal: 300,            // Standard transitions
  slow: 500,              // Prominent animations
  verySlow: 700,          // Statement animations
};

/**
 * Standard easing curves for consistent motion feel
 */
export const AnimationEasings = {
  default: Easing.bezier(0.4, 0.0, 0.2, 1.0),        // Material elevation
  easeInOut: Easing.inOut(Easing.cubic),             // Smooth in and out
  easeOut: Easing.out(Easing.cubic),                 // Natural deceleration
  easeIn: Easing.in(Easing.cubic),                   // Natural acceleration
  elastic: Easing.elastic(1),                         // Bouncy feel
  bounce: Easing.bounce,                              // Bouncy animation
};

/**
 * Create fade-in animation using Animated API
 * @param {number} delay - Optional delay before animation starts
 * @returns {Object} Animation setup object
 */
export const createFadeInAnimation = (delay = 0) => {
  const animatedValue = new Animated.Value(0);
  
  return {
    animatedValue,
    startAnimation: () => {
      return Animated.timing(animatedValue, {
        toValue: 1,
        duration: AnimationDurations.normal,
        easing: AnimationEasings.easeOut,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    },
    opacity: animatedValue,
  };
};

/**
 * Create slide-up animation
 * @param {number} distance - Distance to slide (pixels)
 * @param {number} delay - Optional delay
 * @returns {Object} Animation setup object
 */
export const createSlideUpAnimation = (distance = 20, delay = 0) => {
  const animatedValue = new Animated.Value(distance);
  
  return {
    animatedValue,
    startAnimation: () => {
      return Animated.timing(animatedValue, {
        toValue: 0,
        duration: AnimationDurations.normal,
        easing: AnimationEasings.easeOut,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    },
    transform: [{ translateY: animatedValue }],
  };
};

/**
 * Create scale animation
 * @param {number} fromScale - Starting scale value
 * @param {number} toScale - Target scale value (default 1)
 * @param {number} delay - Optional delay
 * @returns {Object} Animation setup object
 */
export const createScaleAnimation = (fromScale = 0.9, toScale = 1, delay = 0) => {
  const animatedValue = new Animated.Value(fromScale);
  
  return {
    animatedValue,
    startAnimation: () => {
      return Animated.timing(animatedValue, {
        toValue: toScale,
        duration: AnimationDurations.normal,
        easing: AnimationEasings.easeOut,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    },
    scale: animatedValue,
    transform: [{ scale: animatedValue }],
  };
};

/**
 * Create staggered animation sequence for multiple items
 * @param {number} itemCount - Number of items to animate
 * @param {number} delayBetweenItems - Delay between each item (ms)
 * @param {number} baseDuration - Base animation duration
 * @returns {Array} Array of delay values for staggered effect
 */
export const createStaggeredDelays = (
  itemCount = 1,
  delayBetweenItems = 50,
  baseDuration = AnimationDurations.normal
) => {
  const delays = [];
  for (let i = 0; i < itemCount; i++) {
    delays.push(i * delayBetweenItems);
  }
  return delays;
};

/**
 * Create bounce animation with spring effect
 * @param {number} delay - Optional delay
 * @returns {Object} Animation setup object
 */
export const createBounceAnimation = (delay = 0) => {
  const animatedValue = new Animated.Value(0.8);
  
  return {
    animatedValue,
    startAnimation: () => {
      return Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        speed: 8,
        bounciness: 12,
      }).start();
    },
    scale: animatedValue,
    transform: [{ scale: animatedValue }],
  };
};

/**
 * Parallel animations - run multiple animations together
 * @param {Array<Function>} animationStartFunctions - Array of animation start functions
 * @returns {Function} Function to start all animations in parallel
 */
export const runParallelAnimations = (animationStartFunctions = []) => {
  return () => {
    Animated.parallel(
      animationStartFunctions.map(fn => fn())
    ).start();
  };
};

/**
 * Sequence animations - run multiple animations one after another
 * @param {Array<Function>} animationStartFunctions - Array of animation start functions
 * @returns {Function} Function to start animations in sequence
 */
export const runSequenceAnimations = (animationStartFunctions = []) => {
  return () => {
    Animated.sequence(
      animationStartFunctions.map(fn => fn())
    ).start();
  };
};

/**
 * Glass morphism shadow style
 * Subtle shadow for glassmorphism cards
 */
export const glassShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 24,
  elevation: 8,
};

/**
 * Subtle glass morphism shadow
 */
export const glassSubtleShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
};

/**
 * Smooth transition style for buttons and interactive elements
 */
export const smoothTransition = {
  transitionDuration: AnimationDurations.fast,
  transitionTimingFunction: 'ease-out',
};
