/**
 * Location Service
 * Geolocation using expo-location
 */

import * as Location from 'expo-location';

const toCoords = (position) => ({
  lat: position.coords.latitude,
  lon: position.coords.longitude,
  altitude: position.coords.altitude,
  accuracy: position.coords.accuracy,
});

/**
 * Request foreground location permission and get current position
 */
export const getCurrentLocation = async () => {
  try {
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      throw new Error('Location services are disabled. Please turn on GPS/location and try again.');
    }

    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Location permission denied. Please allow location access and retry.');
    }

    // Get coordinates with retry on timeout
    let location = null;
    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
    } catch (_) {
      // Retry with lower accuracy if timeout
      console.warn('⚠️ Location timeout, retrying with lower accuracy...');
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 15000,
        });
      } catch (_) {
        location = null;
      }
    }

    if (!location) {
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 5000,
      });

      if (lastKnown) {
        const fallback = toCoords(lastKnown);
        console.warn('⚠️ Using last known location:', fallback);
        return fallback;
      }

      throw new Error('Current location is unavailable. Make sure location services are enabled and try again.');
    }

    const coords = toCoords(location);

    console.log('✅ Location acquired:', coords);
    return coords;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Location error:', message);
    throw err;
  }
};

/**
 * Check if location permission is granted
 */
export const checkLocationPermission = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('❌ Permission check error:', err);
    return false;
  }
};

/**
 * Check if location services are enabled on the device
 * Returns true if GPS/Location is ON, false if OFF
 */
export const checkLocationServicesEnabled = async () => {
  try {
    const isEnabled = await Location.hasServicesEnabledAsync();
    console.log(isEnabled ? '✅ Location services enabled' : '❌ Location services disabled');
    return isEnabled;
  } catch (err) {
    console.error('❌ Location services check error:', err);
    return false;
  }
};

/**
 * Request location permission upfront (at app startup)
 * Returns true if permission is granted, false otherwise
 */
export const requestLocationPermission = async () => {
  try {
    // First check if services are enabled
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      throw new Error('Location services are disabled. Please turn on GPS/location in your device settings.');
    }

    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      console.log('✅ Location permission granted');
      return true;
    } else if (status === 'denied') {
      console.warn('⚠️ Location permission denied by user');
      return false;
    } else {
      console.warn('⚠️ Location permission status:', status);
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Permission request error:', message);
    throw err;
  }
};
