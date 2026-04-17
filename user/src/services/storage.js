/**
 * Storage Service
 * AsyncStorage wrapper for data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_REQUESTS_KEY = 'ndrf_recent';
const APP_LANGUAGE_KEY = 'ndrf_language';
const BACKEND_URL_KEY = 'ndrf_backend_url';
const DEFAULT_BACKEND_URL = 'http://10.145.74.62:5000'; // Updated IP address

/**
 * Get recent requests from storage
 */
export const getRecentRequests = async () => {
  try {
    const data = await AsyncStorage.getItem(RECENT_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('❌ Failed to load recent requests:', err);
    return [];
  }
};

/**
 * Save request to recent requests list
 * Keeps only the last 5 requests
 */
export const saveRecentRequest = async (request) => {
  try {
    const existing = await getRecentRequests();
    const updated = [request, ...existing].slice(0, 5);
    await AsyncStorage.setItem(RECENT_REQUESTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('❌ Failed to save request:', err);
    throw err;
  }
};

/**
 * Clear all recent requests
 */
export const clearRecentRequests = async () => {
  try {
    await AsyncStorage.removeItem(RECENT_REQUESTS_KEY);
  } catch (err) {
    console.error('❌ Failed to clear recent requests:', err);
    throw err;
  }
};

/**
 * Save app language preference
 */
export const saveLanguagePreference = async (language) => {
  try {
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, language);
  } catch (err) {
    console.error('❌ Failed to save language preference:', err);
    throw err;
  }
};

/**
 * Get saved backend URL
 */
export const getBackendUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(BACKEND_URL_KEY);
    return url || DEFAULT_BACKEND_URL;
  } catch (err) {
    console.error('❌ Failed to get backend URL:', err);
    return DEFAULT_BACKEND_URL;
  }
};

/**
 * Save backend URL
 */
export const saveBackendUrl = async (url) => {
  try {
    await AsyncStorage.setItem(BACKEND_URL_KEY, url);
    console.log('✅ Backend URL saved:', url);
    return url;
  } catch (err) {
    console.error('❌ Failed to save backend URL:', err);
    throw err;
  }
};

/**
 * Reset backend URL to default
 */
export const resetBackendUrl = async () => {
  try {
    await AsyncStorage.removeItem(BACKEND_URL_KEY);
    console.log('✅ Backend URL reset to default:', DEFAULT_BACKEND_URL);
    return DEFAULT_BACKEND_URL;
  } catch (err) {
    console.error('❌ Failed to reset backend URL:', err);
    throw err;
  }
};

