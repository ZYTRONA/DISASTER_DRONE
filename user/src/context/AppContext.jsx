/**
 * NDRF Mobile App Context
 * Manages global app state (category, cart, tracking, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onStatusUpdate, offStatusUpdate } from '../services/socket';
import { submitRequest as submitRequestAPI } from '../services/api';

export const AppContext = React.createContext();

const THEME_MODE_KEY = 'ndrf_theme_mode';

const normalizeUrgency = (urgency) => {
  const normalized = String(urgency || '').trim().toLowerCase();
  const urgencyMap = {
    critical: 'Critical',
    high: 'High',
    urgent: 'Urgent',
    normal: 'Normal',
  };
  return urgencyMap[normalized] || 'Normal';
};

const idsMatch = (left, right) => {
  if (left === undefined || left === null || right === undefined || right === null) return false;
  return String(left) === String(right) || Number(left) === Number(right);
};

const normalizeLocation = (location) => {
  const lat = Number(location?.lat ?? location?.latitude ?? location?.coords?.latitude);
  const lon = Number(location?.lon ?? location?.lng ?? location?.longitude ?? location?.coords?.longitude);
  const accuracy = Number(location?.accuracy ?? location?.coords?.accuracy);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('GPS location is missing. Please enable location and try again.');
  }
  if (Math.abs(lat) < 0.000001 && Math.abs(lon) < 0.000001) {
    throw new Error('GPS location is invalid. Please wait for GPS lock and try again.');
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('GPS location is outside valid coordinate range.');
  }

  return {
    lat,
    lon,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
  };
};

export function AppProvider({ children }) {
  // Category & Cart
  const [category, setCategory] = useState(null);
  const [cart, setCart] = useState({});

  // Request tracking
  const [refId, setRefId] = useState('');
  const [dbId, setDbId] = useState(null);
  const [trackStage, setTrackStage] = useState(1);

  // Recent requests history
  const [recentRequests, setRecentRequests] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [themeMode, setThemeModeState] = useState('light');

  // Load recent requests on app start
  useEffect(() => {
    loadRecentRequests();
    // Force light mode so screens always use white backgrounds.
    setThemeModeState('light');
    AsyncStorage.setItem(THEME_MODE_KEY, 'light').catch(() => {});
  }, []);

  const loadRecentRequests = async () => {
    try {
      const saved = await AsyncStorage.getItem('ndrf_recent');
      if (saved) setRecentRequests(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load recent requests:', err);
    }
  };

  const setThemeMode = useCallback(async (mode) => {
    const normalized = 'light';
    setThemeModeState(normalized);

    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, normalized);
    } catch (err) {
      console.error('Failed to save theme mode:', err);
    }
  }, []);

  // Socket.IO listener for real-time tracking
  useEffect(() => {
    if (!dbId) return;

    const handleStatusUpdate = ({ id, status }) => {
      if (idsMatch(id, dbId)) {
        if (status === 'Assigned') setTrackStage(2);
        if (status === 'In Transit') setTrackStage(3);
        if (status === 'Delivered') setTrackStage(4);
        if (status === 'UserConfirmed') setTrackStage(5);
      }
    };

    try {
      onStatusUpdate(handleStatusUpdate);
      return () => {
        try {
          offStatusUpdate(handleStatusUpdate);
        } catch (err) {
          console.warn('⚠️ Error removing socket listener:', err.message);
        }
      };
    } catch (err) {
      console.warn('⚠️ Socket not ready yet, will retry on next mount:', err.message);
      return undefined;
    }
  }, [dbId]);

  // Cart operations
  const initCart = useCallback((items) => {
    const newCart = {};
    items.forEach((item) => {
      newCart[item.id] = 0;
    });
    setCart(newCart);
  }, []);

  const setQty = useCallback((itemId, quantity) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: Math.max(0, quantity),
    }));
  }, []);

  const getCartTotal = useCallback(() => {
    return Object.values(cart).reduce((sum, qty) => sum + Number(qty), 0);
  }, [cart]);

  // Request lifecycle
  const chooseCategory = useCallback((cat, items) => {
    setCategory(cat);
    initCart(items);
  }, [initCart]);

  const resetWorkflow = useCallback(() => {
    setCategory(null);
    setCart({});
    setRefId('');
    setDbId(null);
    setTrackStage(1);
    setStatusMsg(null);
    setLoading(false);
  }, []);

  const setRequest = useCallback(async (newRefId, newDbId, itemsSummary, submittedAt = null) => {
    setRefId(newRefId);
    setDbId(newDbId);
    setTrackStage(2);

    // Save to recent requests
    try {
      const entry = {
        refId: newRefId,
        dbId: newDbId,
        resource: category,
        note: itemsSummary,
        timestamp: submittedAt || new Date().toISOString(),
      };

      const saved = await AsyncStorage.getItem('ndrf_recent');
      const existing = saved ? JSON.parse(saved) : [];
      const deduped = existing.filter((item) => item.refId !== newRefId);
      const updated = [entry, ...deduped].slice(0, 20);
      await AsyncStorage.setItem('ndrf_recent', JSON.stringify(updated));
      setRecentRequests(updated);
    } catch (err) {
      console.error('Failed to save recent request:', err);
    }
  }, [category]);

  // Submit new request to backend
  const submitRequest = useCallback(async (requestData) => {
    try {
      setLoading(true);
      const { resource, urgency, name, people, location, notes, items = [] } = requestData;
      const selectedUrgency = normalizeUrgency(urgency);
      const gps = normalizeLocation(location);
      const requesterName = String(name || 'Requester').trim();
      const itemSummary = items.length
        ? items.map((item) => `${item.quantity || item.qty || 1} ${item.unit || ''} ${item.name || item.id}`.trim()).join(', ')
        : 'No item details';
      const requestNote = `${requesterName} requested ${resource || 'General'} for ${people || 1} people. Items: ${itemSummary}${notes ? '. Notes: ' + notes : ''}`;
      
      // Transform request data to API format
      const payload = {
        resource: resource || 'General',
        cart: {
          items_count: people || 1,
          notes: notes || 'No additional notes',
          items,
        },
        items,
        note: requestNote,
        lat: gps.lat,
        lon: gps.lon,
        latitude: gps.lat,
        longitude: gps.lon,
        location_accuracy: gps.accuracy,
        people: people || 1,
        people_affected: people || 1,
        urgency: selectedUrgency,
        priority: selectedUrgency,
      };

      console.log('📤 Submitting request:', payload);
      const response = await submitRequestAPI(payload);
      
      // Store the refId and dbId from response. Backend currently returns ref_id.
      const responseRefId = response?.refId || response?.ref_id;
      const responseDbId = response?.id || response?.request_id;
      if (responseRefId && responseDbId) {
        const submittedAt = response?.submitted_at_ist || response?.submitted_at || response?.created_at_ist || response?.created_at;
        await setRequest(responseRefId, responseDbId, payload.note, submittedAt);
      }
      
      setStatusMsg({
        type: 'success',
        text: 'Request submitted successfully!',
      });
      
      setLoading(false);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit request';
      console.error('❌ Submit request error:', errorMsg);
      
      setStatusMsg({
        type: 'error',
        text: errorMsg,
      });
      
      setLoading(false);
      throw err;
    }
  }, [setRequest]);

  const value = {
    // Category & Cart
    category,
    cart,
    chooseCategory,
    setQty,
    getCartTotal,
    initCart,

    // Request
    refId,
    dbId,
    trackStage,
    setRequest,
    submitRequest,
    setTrackStage,

    // Recent requests
    recentRequests,
    loadRecentRequests,

    // UI
    loading,
    setLoading,
    statusMsg,
    setStatusMsg,
    themeMode,
    setThemeMode,
    resetWorkflow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
