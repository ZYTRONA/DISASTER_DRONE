/**
 * LocationPermissionModal - Request location permission on app start
 * Uses a clear, user-friendly modal to explain why location is needed
 * Fully responsive across all devices
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../themes/colors';
import {
  rem,
  responsiveFontSize,
  getResponsiveSpacing,
  getResponsiveBorderRadius,
} from '../utils/responsive';
import { requestLocationPermission, checkLocationServicesEnabled } from '../services/location';

/**
 * @typedef {Object} LocationPermissionModalProps
 * @property {boolean} visible - Modal visibility state
 * @property {(granted: boolean) => void} onComplete - Callback when permission flow is complete
 */

/**
 * @param {LocationPermissionModalProps} props
 * @returns {React.ReactElement}
 */
export default function LocationPermissionModal({ visible, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('pending'); // pending, granted, denied, services_disabled
  const styles = getStyles();

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      // First check if location services are enabled
      const servicesEnabled = await checkLocationServicesEnabled();
      if (!servicesEnabled) {
        setPermissionStatus('services_disabled');
        setLoading(false);
        return;
      }

      const granted = await requestLocationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        setTimeout(() => {
          onComplete(true);
        }, 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      console.error('❌ Permission error:', message);
      Alert.alert('Permission Error', message, [{ text: 'Try Again', onPress: () => setLoading(false) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLocationSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else if (Platform.OS === 'ios') {
        await Linking.openURL('App-Prefs:Privacy&path=LOCATION');
      }
    } catch (err) {
      Alert.alert('Settings', 'Please open Settings → Location and enable GPS/Location services.');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Location Required',
      'Location access is required to submit relief requests. You can enable it in Settings later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue Anyway',
          onPress: () => onComplete(false),
          style: 'default',
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <BlurView intensity={90} style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {permissionStatus === 'services_disabled' ? (
            <>
              <View style={[styles.iconContainer, styles.iconError]}>
                <Ionicons name="warning" size={rem(64)} color={Colors.error} />
              </View>

              <Text style={styles.title}>Location Services Off</Text>

              <Text style={styles.description}>
                Your device's GPS/Location services are turned OFF. Please enable them to use this feature.
              </Text>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleOpenLocationSettings}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={rem(18)} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonTextPrimary} numberOfLines={1}>
                  Open Device Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setPermissionStatus('pending');
                  handleRequestPermission();
                }}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextSecondary} numberOfLines={1}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </>
          ) : permissionStatus === 'pending' ? (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={rem(64)} color={Colors.primary} />
              </View>

              <Text style={styles.title}>Location Access Needed</Text>

              <Text style={styles.description}>
                We need your location to deliver relief supplies to you accurately.
              </Text>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleRequestPermission}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={rem(18)} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonTextPrimary} numberOfLines={1}>
                      Grant Location Access
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleSkip}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextSecondary} numberOfLines={1}>
                  Ask Later
                </Text>
              </TouchableOpacity>
            </>
          ) : permissionStatus === 'granted' ? (
            <>
              <View style={[styles.iconContainer, styles.iconSuccess]}>
                <Ionicons name="checkmark-circle" size={rem(80)} color={Colors.success} />
              </View>
              <Text style={[styles.title, styles.titleSuccess]}>Permission Granted</Text>
              <Text style={styles.description}>Your location access is now enabled. You can request relief supplies.</Text>
            </>
          ) : (
            <>
              <View style={[styles.iconContainer, styles.iconError]}>
                <Ionicons name="alert-circle" size={rem(80)} color={Colors.error} />
              </View>
              <Text style={[styles.title, styles.titleError]}>Permission Denied</Text>
              <Text style={styles.description}>
                Location permission was denied. You can enable it in Settings → Permissions if you change your mind.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => onComplete(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonTextPrimary} numberOfLines={1}>
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

/**
 * Get responsive styles based on device dimensions
 */
const getStyles = () => {
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 600;
  const spacing = getResponsiveSpacing();
  const radius = getResponsiveBorderRadius();

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      paddingHorizontal: rem(20),
      paddingVertical: rem(16),
    },
    card: {
      width: '100%',
      maxWidth: isTablet ? rem(480) : rem(420),
      maxHeight: Math.min(height * 0.9, rem(580)),
      backgroundColor: '#ffffff',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: isTablet ? rem(28) : rem(20),
      paddingVertical: isTablet ? rem(28) : rem(20),
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
    },
    scroll: {
      width: '100%',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: rem(isTablet ? 96 : 84),
      height: rem(isTablet ? 96 : 84),
      borderRadius: rem(isTablet ? 48 : 42),
      backgroundColor: Colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    iconSuccess: {
      backgroundColor: Colors.successBg,
    },
    iconError: {
      backgroundColor: Colors.errorBg,
    },
    title: {
      fontSize: responsiveFontSize(isTablet ? 24 : 22),
      fontWeight: '700',
      color: Colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    titleSuccess: {
      color: Colors.success,
    },
    titleError: {
      color: Colors.error,
    },
    description: {
      fontSize: responsiveFontSize(isTablet ? 15 : 14),
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: responsiveFontSize(isTablet ? 22 : 20),
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.xs,
    },
    button: {
      width: '100%',
      minHeight: rem(isTablet ? 52 : 48),
      paddingVertical: rem(12),
      paddingHorizontal: rem(16),
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: Colors.primary,
    },
    buttonSecondary: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    buttonIcon: {
      marginRight: spacing.sm,
    },
    buttonTextPrimary: {
      fontSize: responsiveFontSize(isTablet ? 15 : 14),
      fontWeight: '600',
      color: 'white',
      flexShrink: 1,
    },
    buttonTextSecondary: {
      fontSize: responsiveFontSize(isTablet ? 15 : 14),
      fontWeight: '600',
      color: Colors.primary,
      flexShrink: 1,
    },
  });
};
