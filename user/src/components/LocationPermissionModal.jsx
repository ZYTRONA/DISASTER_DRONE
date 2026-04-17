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
  getDeviceType,
} from '../utils/responsive';
import { requestLocationPermission, checkLocationPermission, checkLocationServicesEnabled } from '../services/location';

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
      <BlurView intensity={90} style={getStyles().blurContainer}>
        <View style={getStyles().container}>
          {permissionStatus === 'services_disabled' ? (
            <>
              <View style={getStyles().iconContainer}>
                <Ionicons name="warning" size={rem(64)} color={Colors.error} />
              </View>

              <Text style={getStyles().title}>Location Services Off</Text>

              <Text style={getStyles().description}>
                Your device's GPS/Location services are turned OFF. Please enable them to use this feature.
              </Text>

              <TouchableOpacity
                style={[getStyles().button, getStyles().buttonPrimary]}
                onPress={handleOpenLocationSettings}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={rem(18)} color="white" style={getStyles().buttonIcon} />
                <Text style={getStyles().buttonTextPrimary} numberOfLines={1}>
                  Open Device Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[getStyles().button, getStyles().buttonSecondary]}
                onPress={() => {
                  setPermissionStatus('pending');
                  handleRequestPermission();
                }}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={getStyles().buttonTextSecondary} numberOfLines={1}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </>
          ) : permissionStatus === 'pending' ? (
            <>
              {/* Icon */}
              <View style={getStyles().iconContainer}>
                <Ionicons name="location" size={rem(64)} color={Colors.primary} />
              </View>

              {/* Title */}
              <Text style={getStyles().title}>Location Access Needed</Text>

              {/* Description */}
              <Text style={getStyles().description}>
                We need your location to deliver relief supplies to you accurately.
              </Text>

              {/* Permission List - REMOVED FOR SIMPLICITY */}

              {/* Buttons */}
              <TouchableOpacity
                style={[getStyles().button, getStyles().buttonPrimary]}
                onPress={handleRequestPermission}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={rem(18)} color="white" style={getStyles().buttonIcon} />
                    <Text style={getStyles().buttonTextPrimary} numberOfLines={1}>
                      Grant Location Access
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[getStyles().button, getStyles().buttonSecondary]}
                onPress={handleSkip}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={getStyles().buttonTextSecondary} numberOfLines={1}>
                  Ask Later
                </Text>
              </TouchableOpacity>
            </>
          ) : permissionStatus === 'granted' ? (
            <>
              <View style={getStyles().successIcon}>
                <Ionicons name="checkmark-circle" size={rem(80)} color={Colors.success} />
              </View>
              <Text style={getStyles().successTitle}>Permission Granted!</Text>
              <Text style={getStyles().successDescription}>Your location access is now enabled. You're ready to request relief supplies.</Text>
            </>
          ) : (
            <>
              <View style={getStyles().errorIcon}>
                <Ionicons name="alert-circle" size={rem(80)} color={Colors.error} />
              </View>
              <Text style={getStyles().errorTitle}>Permission Denied</Text>
              <Text style={getStyles().errorDescription}>
                Location permission was denied. You can enable it in Settings → Permissions if you change your mind.
              </Text>
              <TouchableOpacity
                style={[getStyles().button, getStyles().buttonPrimary]}
                onPress={() => onComplete(false)}
                activeOpacity={0.8}
              >
                <Text style={getStyles().buttonTextPrimary} numberOfLines={1}>
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

/**
 * Feature list item component
 * @param {{icon: string, text: string, color: string}} props
 */
function FeatureItem({ icon, text, color }) {
  return (
    <View style={getStyles().featureItem}>
      <View style={[getStyles().featureIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={rem(20)} color={color} />
      </View>
      <Text style={getStyles().featureText}>{text}</Text>
    </View>
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
  const deviceType = getDeviceType();

  return StyleSheet.create({
    blurContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
      marginHorizontal: rem(16),
      paddingHorizontal: isTablet ? rem(32) : rem(20),
      paddingVertical: isTablet ? rem(44) : rem(36),
      borderRadius: radius.xl,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      maxWidth: isTablet ? '70%' : '100%',
      maxHeight: height * 0.85,
    },
    scrollContent: {
      width: '100%',
      flexGrow: 1,
      justifyContent: 'center',
    },
    iconContainer: {
      width: rem(isTablet ? 130 : 110),
      height: rem(isTablet ? 130 : 110),
      borderRadius: rem(isTablet ? 65 : 55),
      backgroundColor: Colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      fontSize: responsiveFontSize(isTablet ? 28 : 26),
      fontWeight: '800',
      color: Colors.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    description: {
      fontSize: responsiveFontSize(isTablet ? 16 : 15),
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: responsiveFontSize(isTablet ? 26 : 24),
      marginBottom: spacing.xl,
      fontWeight: '400',
      paddingHorizontal: spacing.sm,
    },
    descriptionBold: {
      fontWeight: '600',
      color: Colors.primary,
    },
    featuresList: {
      width: '100%',
      marginBottom: spacing.xl,
      gap: spacing.md,
      display: 'none', // Hidden for simple version
    },
    actionsGrid: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: isTablet ? rem(24) : rem(20),
      marginBottom: spacing.xl,
      paddingVertical: spacing.sm,
      flexWrap: 'wrap',
      display: 'none', // Hidden for simple version
    },
    actionButton: {
      width: rem(isTablet ? 85 : 70),
      height: rem(isTablet ? 85 : 70),
      borderRadius: radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: Colors.surfaceAlt,
    },
    featureIcon: {
      width: rem(isTablet ? 52 : 44),
      height: rem(isTablet ? 52 : 44),
      borderRadius: radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    featureText: {
      fontSize: responsiveFontSize(isTablet ? 15 : 14),
      fontWeight: '500',
      color: Colors.textPrimary,
      flex: 1,
    },
    button: {
      width: '100%',
      paddingVertical: rem(isTablet ? 16 : 14),
      paddingHorizontal: rem(isTablet ? 20 : 16),
      borderRadius: radius.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonPrimary: {
      backgroundColor: Colors.primary,
    },
    buttonSecondary: {
      backgroundColor: Colors.surfaceAlt,
      borderWidth: 2,
      borderColor: Colors.primary + '40',
    },
    buttonIcon: {
      marginRight: spacing.xs,
    },
    buttonTextPrimary: {
      fontSize: responsiveFontSize(isTablet ? 16 : 15),
      fontWeight: '600',
      color: 'white',
      flexShrink: 1,
    },
    buttonTextSecondary: {
      fontSize: responsiveFontSize(isTablet ? 16 : 15),
      fontWeight: '600',
      color: Colors.primary,
      flexShrink: 1,
    },
    successIcon: {
      marginBottom: spacing.lg,
    },
    successTitle: {
      fontSize: responsiveFontSize(isTablet ? 26 : 22),
      fontWeight: '700',
      color: Colors.success,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    successDescription: {
      fontSize: responsiveFontSize(isTablet ? 16 : 14),
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: responsiveFontSize(isTablet ? 24 : 20),
    },
    errorIcon: {
      marginBottom: spacing.lg,
    },
    errorTitle: {
      fontSize: responsiveFontSize(isTablet ? 26 : 22),
      fontWeight: '700',
      color: Colors.error,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    errorDescription: {
      fontSize: responsiveFontSize(isTablet ? 16 : 14),
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: responsiveFontSize(isTablet ? 24 : 20),
      marginBottom: spacing.xl,
    },
  });
};
