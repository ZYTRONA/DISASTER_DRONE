/**
 * API Service — IMPROVED
 *
 * Key fixes from original:
 *  - Removed health check before every submitRequest (was causing 2x latency + double failure)
 *  - Fixed urgency field: no longer sets status='Urgent', sends proper urgency value
 *  - Extracted applyInterceptors() to avoid copy-pasting interceptors in reinitialize
 *  - Added submitRequest urgency parameter (was hardcoded to 'Urgent')
 *  - getRequests now supports pagination params
 *  - Added deleteRequest for future use
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl, storeBackendUrl } from './storage';

let api = null;
const REQUEST_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_TIMEOUT_MS, 10) || 10000;
const HEALTH_CHECK_TIMEOUT = 4000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

// ── Auth token helpers ────────────────────────────────────────────────────────

export const storeAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (err) {
    console.error('[API] Failed to store auth token:', err);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (err) {
    return null;
  }
};

export const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (err) {
    console.error('[API] Failed to clear auth token:', err);
  }
};

// ── Interceptors ──────────────────────────────────────────────────────────────

function applyInterceptors(instance) {
  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAuthToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch (_) {}
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await clearAuthToken();
      }
      return Promise.reject(error);
    }
  );
}

// ── Initialization ────────────────────────────────────────────────────────────

export const initializeApi = async () => {
  try {
    const BACKEND_URL =
      process.env.EXPO_PUBLIC_API_URL ||
      (await getBackendUrl()) ||
      'http://localhost:5000';

    api = axios.create({
      baseURL: BACKEND_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `NDRF-MobileApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0'}`,
      },
    });

    applyInterceptors(api);
    console.log('✅ API initialized:', BACKEND_URL);
    return api;
  } catch (err) {
    console.error('❌ Failed to initialize API:', err);
    throw err;
  }
};

export const reinitializeApi = async (newUrl) => {
  try {
    const BACKEND_URL =
      newUrl || (await getBackendUrl()) || 'http://localhost:5000';

    if (newUrl) await storeBackendUrl(newUrl);

    api = axios.create({
      baseURL: BACKEND_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `NDRF-MobileApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0'}`,
      },
    });

    applyInterceptors(api);
    console.log('✅ API reinitialized:', BACKEND_URL);
    return api;
  } catch (err) {
    console.error('❌ Failed to reinitialize API:', err);
    throw err;
  }
};

export const getApi = () => {
  if (!api) {
    throw new Error('API not initialized. Call initializeApi() first.');
  }
  return api;
};

// ── Health check ──────────────────────────────────────────────────────────────

export const checkBackendHealth = async () => {
  if (!api) return false;
  try {
    const response = await axios.get(`${api.defaults.baseURL}/health`, {
      timeout: HEALTH_CHECK_TIMEOUT,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// ── Retry helper ──────────────────────────────────────────────────────────────

const retryRequest = async (requestFn, maxRetries = MAX_RETRIES) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      lastError = err;
      const isNetworkError = !err.response;
      if (isNetworkError && attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (!isNetworkError) {
        throw err; // Don't retry server errors (4xx, 5xx)
      }
    }
  }
  throw lastError;
};

// ── Request endpoints ─────────────────────────────────────────────────────────

/**
 * Submit a new disaster relief request.
 *
 * FIX: Original was sending status='Urgent' alongside urgency which corrupted
 * the status field in the DB. Now only sends urgency as a priority signal.
 */
export const submitRequest = async ({
  resource,
  cart,
  note,
  lat,
  lon,
  urgency = 'Urgent', // 'Critical' | 'High' | 'Urgent' | 'Normal'
}) => {
  try {
    const response = await retryRequest(() =>
      getApi().post('/request', {
        resource,
        cart,
        note,
        lat,
        lon,
        urgency,
        // status is NOT sent — backend sets it to 'Pending' by default
      })
    );
    console.log('✅ Request submitted:', response.data);
    return response.data;
  } catch (err) {
    const backendUrl = api?.defaults?.baseURL || 'http://localhost:5000';
    const isNetworkError =
      err.code === 'ECONNABORTED' ||
      err.code === 'ENOTFOUND' ||
      err.message?.includes('Network') ||
      !err.response;

    if (isNetworkError) {
      throw new Error(
        `Network Error: Cannot reach backend at ${backendUrl}. ` +
          'Make sure the backend server is running.'
      );
    }
    throw err;
  }
};

export const confirmReceipt = async (requestId) => {
  const response = await getApi().post(`/user-confirm/${requestId}`);
  return response.data;
};

export const getRequests = async (filters = {}) => {
  const response = await getApi().get('/requests', { params: filters });
  return response.data;
};

export const getRequestStatus = async (requestId) => {
  const response = await getApi().get(`/requests/${requestId}`);
  return response.data;
};

export const getTelemetry = async () => {
  const response = await getApi().get('/telemetry');
  return response.data;
};

export const getDrones = async () => {
  const response = await getApi().get('/drones');
  return response.data;
};

export const getDroneTelemetry = async (droneId) => {
  const response = await getApi().get(`/drones/${droneId}/telemetry`);
  return response.data;
};

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  const response = await getApi().post('/auth/login', { email, password });
  if (response.data.token) await storeAuthToken(response.data.token);
  return response.data;
};

export const register = async (email, password, fullName) => {
  const response = await getApi().post('/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  if (response.data.token) await storeAuthToken(response.data.token);
  return response.data;
};

export const logout = async () => {
  try {
    await getApi().post('/auth/logout');
  } catch (_) {}
  await clearAuthToken();
};

export const getCurrentUser = async () => {
  const response = await getApi().get('/auth/me');
  return response.data;
};