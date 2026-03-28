/**
 * API Service for Mobile App
 * Centralized Axios instance for backend communication with environment variable support
 * 
 * Priority:
 * 1. Environment variable (EXPO_PUBLIC_API_URL)
 * 2. AsyncStorage (user-configured value)
 * 3. Fallback localhost
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl, storeBackendUrl } from './storage';

// Will be initialized on app startup
let api = null;
const REQUEST_TIMEOUT = process.env.EXPO_PUBLIC_TIMEOUT_MS || 10000;

/**
 * Initialize API with backend URL from environment or storage
 */
export const initializeApi = async () => {
  try {
    // Priority: Environment variable > AsyncStorage > Fallback
    let BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;
    
    if (!BACKEND_URL) {
      BACKEND_URL = await getBackendUrl();
    }
    
    if (!BACKEND_URL) {
      BACKEND_URL = 'http://localhost:5000'; // Fallback
    }

    api = axios.create({
      baseURL: BACKEND_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `NDRF-MobileApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0'}`,
      },
    });

    // Request interceptor with JWT support
    api.interceptors.request.use(
      async (config) => {
        // Add JWT token if available
        try {
          const token = await getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.warn('[API] Failed to retrieve auth token:', err.message);
        }

        console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with auth error handling
    api.interceptors.response.use(
      (response) => {
        console.log(`📥 API Response: ${response.status}`, response.data);
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and notify app
          console.warn('[API] Unauthorized (401) - clearing auth token');
          await clearAuthToken();
          // Could emit event here to redirect to login
        }
        console.error(
          '❌ API Error:',
          error.response?.data || error.message,
          `(${error.response?.status || 'No status'})`
        );
        return Promise.reject(error);
      }
    );

    console.log('✅ API initialized with URL:', BACKEND_URL);
    return api;
  } catch (err) {
    console.error('❌ Failed to initialize API:', err);
    throw err;
  }
};

/**
 * Reinitialize API with new backend URL
 */
export const reinitializeApi = async (newUrl) => {
  try {
    const BACKEND_URL = newUrl || (await getBackendUrl()) || 'http://localhost:5000';
    
    // Store URL if provided
    if (newUrl) {
      await storeBackendUrl(newUrl);
    }
    
    api = axios.create({
      baseURL: BACKEND_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `NDRF-MobileApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0'}`,
      },
    });

    // Reapply interceptors (same as initializeApi)
    api.interceptors.request.use(
      async (config) => {
        try {
          const token = await getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.warn('[API] Failed to retrieve auth token:', err.message);
        }
        console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
      (response) => {
        console.log(`📥 API Response: ${response.status}`, response.data);
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          console.warn('[API] Unauthorized (401) - clearing auth token');
          await clearAuthToken();
        }
        console.error(
          '❌ API Error:',
          error.response?.data || error.message,
          `(${error.response?.status || 'No status'})`
        );
        return Promise.reject(error);
      }
    );

    console.log('✅ API reinitialized with URL:', BACKEND_URL);
    return api;
  } catch (err) {
    console.error('❌ Failed to reinitialize API:', err);
    throw err;
  }
};

/**
 * Get the current API instance
 */
export const getApi = () => {
  if (!api) {
    throw new Error('API not initialized. Call initializeApi() first.');
  }
  return api;
};

/**
 * ===== AUTHENTICATION HELPERS =====
 */

/**
 * Store JWT token in AsyncStorage
 */
export const storeAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
    console.log('[API] Auth token stored');
  } catch (err) {
    console.error('[API] Failed to store auth token:', err);
  }
};

/**
 * Retrieve JWT token from AsyncStorage
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (err) {
    console.error('[API] Failed to retrieve auth token:', err);
    return null;
  }
};

/**
 * Clear JWT token from AsyncStorage
 */
export const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    console.log('[API] Auth token cleared');
  } catch (err) {
    console.error('[API] Failed to clear auth token:', err);
  }
};

/**
 * ===== REQUEST ENDPOINTS =====
 */

/**
 * Submit new disaster relief request
 */
export const submitRequest = async ({
  resource,
  cart,
  note,
  lat,
  lon,
}) => {
  const response = await getApi().post('/request', {
    resource,
    cart,
    note,
    lat,
    lon,
    urgency: 'Urgent',
    status: 'Urgent',
  });
  return response.data;
};

/**
 * Confirm receipt of aid
 */
export const confirmReceipt = async (requestId) => {
  const response = await getApi().post(`/user-confirm/${requestId}`);
  return response.data;
};

/**
 * Get all requests with optional filters
 */
export const getRequests = async (filters = {}) => {
  const response = await getApi().get('/requests', { params: filters });
  return response.data;
};

/**
 * Get tracking status for specific request
 */
export const getRequestStatus = async (requestId) => {
  const response = await getApi().get(`/requests/${requestId}`);
  return response.data;
};

/**
 * Get telemetry data for active drones
 */
export const getTelemetry = async () => {
  const response = await getApi().get('/telemetry');
  return response.data;
};

/**
 * Get list of available drones
 */
export const getDrones = async () => {
  const response = await getApi().get('/drones');
  return response.data;
};

/**
 * Get specific drone telemetry
 */
export const getDroneTelemetry = async (droneId) => {
  const response = await getApi().get(`/drones/${droneId}/telemetry`);
  return response.data;
};

/**
 * ===== AUTHENTICATION ENDPOINTS =====
 */

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  const response = await getApi().post('/auth/login', { email, password });
  if (response.data.token) {
    await storeAuthToken(response.data.token);
  }
  return response.data;
};

/**
 * Register new user account
 */
export const register = async (email, password, fullName) => {
  const response = await getApi().post('/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  if (response.data.token) {
    await storeAuthToken(response.data.token);
  }
  return response.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await getApi().post('/auth/logout');
  } catch (err) {
    console.warn('[API] Logout API call failed, but token will be cleared:', err.message);
  }
  await clearAuthToken();
};

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
  const response = await getApi().get('/auth/me');
  return response.data;
};
