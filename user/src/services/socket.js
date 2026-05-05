/**
 * Socket.IO Client Service — IMPROVED
 *
 * Changes from original:
 *  - Joins 'mobile' room on connect so GCS broadcasts reach only relevant clients
 *  - Tracks connection state (isConnected) for UI to read
 *  - onConnectionChange callback for components to react to connect/disconnect
 *  - Deduplicates listeners (prevents stacking on React re-renders)
 *  - Removed auth header on socket (JWT in HTTP headers doesn't work with Socket.IO polling)
 *  - Added emitWithAck for reliable command sending
 */

import { io } from 'socket.io-client';
import { getBackendUrl, storeBackendUrl } from './storage';

let socket = null;
let _isConnected = false;
let _connectionListeners = [];
let lastConnectErrorAt = 0;
let lastConnectErrorKey = '';

const SOCKET_TRANSPORT_MODE = (
  process.env.EXPO_PUBLIC_SOCKET_TRANSPORT || 'polling'
).toLowerCase();

const resolveTransports = () => ['polling'];

const logConnectError = (error, backendUrl) => {
  const now = Date.now();
  const message = error?.message || 'unknown socket error';
  const key = `${backendUrl}|${message}`;
  if (key === lastConnectErrorKey && now - lastConnectErrorAt < 10000) return;
  lastConnectErrorKey = key;
  lastConnectErrorAt = now;
  console.warn(`⚠️ Socket reconnecting (${message}) -> ${backendUrl}`);
};

const notifyConnectionListeners = (connected) => {
  _connectionListeners.forEach((cb) => {
    try { cb(connected); } catch (_) {}
  });
};

const createSocket = (backendUrl) => {
  const transports = resolveTransports();

  const client = io(backendUrl, {
    transports: ['polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    forceNew: false,
  });

  client.on('connect', () => {
    console.log('✅ Socket.IO connected:', client.id);
    _isConnected = true;
    notifyConnectionListeners(true);

    // Join 'mobile' room so GCS can target broadcasts
    client.emit('join', { room: 'mobile' });
  });

  client.on('disconnect', (reason) => {
    console.log('⚠️  Socket.IO disconnected:', reason);
    _isConnected = false;
    notifyConnectionListeners(false);
  });

  client.on('connect_error', (error) => {
    logConnectError(error, backendUrl);
    _isConnected = false;
    notifyConnectionListeners(false);
  });

  client.on('error', (error) => {
    console.warn('⚠️ Socket.IO error:', error?.message || error);
  });

  return client;
};

/**
 * Initialize Socket.IO with backend URL from environment or storage
 */
export const initializeSocket = async () => {
  try {
    let BACKEND_URL =
      process.env.EXPO_PUBLIC_SOCKET_URL ||
      (await getBackendUrl()) ||
      'http://localhost:5000';

    socket = createSocket(BACKEND_URL);
    console.log(
      '✅ Socket.IO initialized:',
      BACKEND_URL,
      '| transport:',
      resolveTransports().join(',')
    );
    return socket;
  } catch (err) {
    console.error('❌ Failed to initialize Socket.IO:', err);
    throw err;
  }
};

/**
 * Reinitialize Socket.IO with a new backend URL
 */
export const reinitializeSocket = async (newUrl) => {
  try {
    if (socket) socket.disconnect();

    const BACKEND_URL =
      newUrl || (await getBackendUrl()) || 'http://localhost:5000';

    if (newUrl) await storeBackendUrl(newUrl);

    socket = createSocket(BACKEND_URL);
    console.log('✅ Socket.IO reinitialized:', BACKEND_URL);
    return socket;
  } catch (err) {
    console.error('❌ Failed to reinitialize Socket.IO:', err);
    throw err;
  }
};

/**
 * Get the current Socket.IO instance (throws if not initialized)
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return socket;
};

/**
 * Returns current connection state without throwing
 */
export const isConnected = () => _isConnected;

/**
 * Register a callback that fires when connection state changes
 * Returns an unsubscribe function
 */
export const onConnectionChange = (callback) => {
  _connectionListeners.push(callback);
  // Immediately fire with current state
  try { callback(_isConnected); } catch (_) {}
  return () => {
    _connectionListeners = _connectionListeners.filter((cb) => cb !== callback);
  };
};

/**
 * Register callback for status updates (deduplication-safe)
 */
export const onStatusUpdate = (callback) => {
  const sock = getSocket();
  sock.off('status_update', callback); // remove first to avoid duplication
  sock.on('status_update', callback);
};

export const offStatusUpdate = (callback) => {
  getSocket().off('status_update', callback);
};

/**
 * Register callback for request updates
 */
export const onRequestUpdate = (callback) => {
  const sock = getSocket();
  sock.off('request_update', callback);
  sock.on('request_update', callback);
};

export const offRequestUpdate = (callback) => {
  getSocket().off('request_update', callback);
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
 * Emit with acknowledgement (resolves when server acks or rejects on timeout)
 */
export const emitWithAck = (eventName, data, timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket ack timeout')), timeoutMs);
    try {
      getSocket().emit(eventName, data, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
};

export const onEvent = (eventName, callback) => {
  const sock = getSocket();
  sock.off(eventName, callback);
  sock.on(eventName, callback);
};

export const offEvent = (eventName, callback) => {
  getSocket().off(eventName, callback);
};