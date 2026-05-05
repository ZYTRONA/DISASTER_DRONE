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
      if (Number(id) === Number(dbId)) {
        if (status === 'Assigned') setTrackStage(3);
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

  const setRequest = useCallback(async (newRefId, newDbId, itemsSummary) => {
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
        timestamp: new Date().toISOString(),
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
      const { resource, urgency, name, people, location, notes } = requestData;

      // Capitalize urgency to match backend expected values ('Critical' | 'High' | 'Normal')
      const urgencyValue = urgency
        ? urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase()
        : 'Normal';

      // Transform request data to API format
      const payload = {
        resource: resource || 'General',
        urgency: urgencyValue,
        cart: {
          items_count: people || 1,
          notes: `${name} - ${notes || 'No additional notes'}`,
        },
        note: `${name} requested ${resource} for ${people} people${notes ? ': ' + notes : ''}`,
        lat: location?.lat || 0,
        lon: location?.lon || 0,
      };

      console.log('📤 Submitting request:', payload);
      const response = await submitRequestAPI(payload);
      
      // Store the refId and dbId from response
      if (response?.refId && response?.id) {
        await setRequest(response.refId, response.id, payload.note);
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
