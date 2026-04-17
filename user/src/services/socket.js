/**
 * Socket.IO Client Service
 * Real-time communication with Flask backend
 * 
 * Priority:
 * 1. Environment variable (EXPO_PUBLIC_SOCKET_URL)
 * 2. AsyncStorage (user-configured value)
 * 3. Fallback localhost
 */

import { io } from 'socket.io-client';
import { getBackendUrl, storeBackendUrl } from './storage';
import { getAuthToken } from './api';

// Will be initialized on app startup
let socket = null;
let lastConnectErrorAt = 0;
let lastConnectErrorKey = '';

const SOCKET_TRANSPORT_MODE = (process.env.EXPO_PUBLIC_SOCKET_TRANSPORT || 'polling').toLowerCase();

const resolveTransports = () => {
  if (SOCKET_TRANSPORT_MODE === 'websocket') {
    return ['websocket'];
  }

  if (SOCKET_TRANSPORT_MODE === 'both') {
    return ['websocket', 'polling'];
  }

  // Default to polling for Flask/Socket.IO compatibility on mobile networks.
  return ['polling'];
};

const logConnectError = (error, backendUrl) => {
  const now = Date.now();
  const message = error?.message || 'unknown socket error';
  const key = `${backendUrl}|${message}`;

  // Avoid spamming identical transient connect errors during reconnect attempts.
  if (key === lastConnectErrorKey && now - lastConnectErrorAt < 10000) {
    return;
  }

  lastConnectErrorKey = key;
  lastConnectErrorAt = now;
  console.warn(`⚠️ Socket reconnecting (${message}) -> ${backendUrl}`);
};

const createSocket = (backendUrl, extraHeaders) => {
  const transports = resolveTransports();

  const client = io(backendUrl, {
    transports,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 4,
    timeout: 8000,
    extraHeaders,
  });

  client.on('connect', () => {
    console.log('✅ Socket.IO connected:', client.id);
  });

  client.on('disconnect', (reason) => {
    console.log('⚠️  Socket.IO disconnected:', reason);
  });

  client.on('connect_error', (error) => {
    logConnectError(error, backendUrl);
  });

  client.on('reconnecting', (attempt) => {
    console.log(`🔄 Socket.IO reconnecting (attempt ${attempt})...`);
  });

  client.on('error', (error) => {
    console.warn('⚠️ Socket.IO error:', error?.message || error);
  });

  client.on('auth_error', (error) => {
    console.warn('⚠️ Socket authentication error:', error?.message || error);
  });

  return client;
};

/**
 * Initialize Socket.IO with backend URL from environment or storage
 */
export const initializeSocket = async () => {
  try {
    // Priority: Environment variable > AsyncStorage > Fallback
    let BACKEND_URL = process.env.EXPO_PUBLIC_SOCKET_URL;
    
    if (!BACKEND_URL) {
      BACKEND_URL = await getBackendUrl();
    }
    
    if (!BACKEND_URL) {
      BACKEND_URL = 'http://localhost:5000'; // Fallback
    }

    // Prepare auth headers with JWT if available
    const extraHeaders = {
      'User-Agent': `NDRF-MobileApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0'}`,
    };

    try {
      const token = await getAuthToken();
      if (token) {
        extraHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[Socket] Failed to retrieve auth token:', err.message);
    }

    socket = createSocket(BACKEND_URL, extraHeaders);

    console.log('✅ Socket.IO initialized with URL:', BACKEND_URL, '| transport:', resolveTransports().join(','));
    return socket;
  } catch (err) {
    console.error('❌ Failed to initialize Socket.IO:', err);
    throw err;
  }
};

/**
 * Reinitialize Socket.IO with new backend URL
 */
export const reinitializeSocket = async (newUrl) => {
  try {
    // Disconnect old socket
    if (socket) {
      socket.disconnect();
    }

    const BACKEND_URL = newUrl || (await getBackendUrl()) || 'http://localhost:5000';

    // Store URL if provided
    if (newUrl) {
      await storeBackendUrl(newUrl);
    }

    // Prepare auth headers with JWT if available
    const extraHeaders = {
      'User-Agent': `NDRF-MobileApp/${process.env.EXPO_PUBLIC_APP_VERSION || '1.0'}`,
    };

    try {
      const token = await getAuthToken();
      if (token) {
        extraHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[Socket] Failed to retrieve auth token:', err.message);
    }

    socket = createSocket(BACKEND_URL, extraHeaders);

    console.log('✅ Socket.IO reinitialized with URL:', BACKEND_URL, '| transport:', resolveTransports().join(','));
    return socket;
  } catch (err) {
    console.error('❌ Failed to reinitialize Socket.IO:', err);
    throw err;
  }
};

/**
 * Get the current Socket.IO instance
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return socket;
};

/**
 * Register callback for status updates
 */
export const onStatusUpdate = (callback) => {
  getSocket().on('status_update', callback);
};

/**
 * Unregister callback for status updates
 */
export const offStatusUpdate = (callback) => {
  getSocket().off('status_update', callback);
};

/**
 * Emit custom event to server
 */
export const emitEvent = (eventName, data) => {
  try {
    getSocket().emit(eventName, data);
  } catch (err) {
    console.error(`Failed to emit event '${eventName}':`, err);
  }
};

/**
 * Listen for custom server events
 */
export const onEvent = (eventName, callback) => {
  getSocket().on(eventName, callback);
};

/**
 * Stop listening to custom server events
 */
export const offEvent = (eventName, callback) => {
  getSocket().off(eventName, callback);
};
