/**
 * React Hooks for Common Animations
 * Simplify animation usage with reusable hooks
 */

import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import {
  AnimationDurations,
  AnimationEasings,
} from './animationUtils';

/**
 * useFadeInAnimation - Fade in animation on component mount
 * @param {number} delay - Optional delay before animation starts
 * @returns {Object} { opacity: Animated.Value, start: Function }
 */
export const useFadeInAnimation = (delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: AnimationDurations.normal,
        easing: AnimationEasings.easeOut,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [opacity, delay]);

  return { opacity };
};

/**
 * useSlideInAnimation - Slide in from bottom animation
 * @param {number} distance - Distance to slide from (pixels)
 * @param {number} delay - Optional delay
 * @returns {Object} { translateY: Animated.Value, opacity: Animated.Value }
 */
export const useSlideInAnimation = (distance = 40, delay = 0) => {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: AnimationDurations.normal,
          easing: AnimationEasings.easeOut,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: AnimationDurations.normal,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateY, opacity, delay]);

  return { translateY, opacity };
};

/**
 * useScaleAnimation - Scale animation on mount
 * @param {number} fromScale - Starting scale
 * @param {number} delay - Optional delay
 * @returns {Object} { scale: Animated.Value }
 */
export const useScaleAnimation = (fromScale = 0.9, delay = 0) => {
  const scale = useRef(new Animated.Value(fromScale)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(scale, {
        toValue: 1,
        duration: AnimationDurations.normal,
        easing: AnimationEasings.easeOut,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scale, delay]);

  return { scale };
};

/**
 * usePressAnimation - Animated button press feedback
 * @returns {Object} { scale: Animated.Value, onPressIn: Function, onPressOut: Function }
 */
export const usePressAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return { scale, onPressIn, onPressOut };
};

/**
 * useStaggeredAnimation - Staggered animation for lists
 * @param {number} itemCount - Number of items
 * @param {number} delayBetween - Delay between items (ms)
 * @returns {Array<Animated.Value>} Animated values for each item
 */
export const useStaggeredAnimation = (itemCount = 0, delayBetween = 50) => {
  const animatedValues = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: AnimationDurations.normal,
        easing: AnimationEasings.easeOut,
        delay: index * delayBetween,
        useNativeDriver: Platform.OS !== 'web',
      })
    );

    Animated.parallel(animations).start();
  }, [animatedValues, delayBetween]);

  return animatedValues;
};

/**
 * usePulseAnimation - Continuous pulse animation
 * @param {number} scale - Max scale value
 * @returns {Object} { scale: Animated.Value }
 */
export const usePulseAnimation = (scale = 1.05) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: scale,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => pulse());
    };

    pulse();

    return () => {
      pulseAnim.setValue(1);
    };
  }, [pulseAnim, scale]);

  return { scale: pulseAnim };
};

/**
 * useRotationAnimation - Continuous rotation animation
 * @param {number} duration - Animation duration (ms)
 * @returns {Object} { rotation: Animated.Value }
 */
export const useRotationAnimation = (duration = 2000) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        rotation.setValue(0);
        spin();
      });
    };

    spin();

    return () => {
      rotation.setValue(0);
    };
  }, [rotation, duration]);

  return {
    rotation: rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
  };
};
