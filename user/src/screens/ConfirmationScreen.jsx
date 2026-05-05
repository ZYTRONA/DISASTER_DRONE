/**
 * ConfirmationScreen — IMPROVED
 *
 * Changes:
 *  - Uses onConnectionChange from socket service to show offline warning
 *  - Polls /requests/:id every 15s as fallback when socket is offline
 *  - Better error state for confirmReceipt
 *  - Prevents confirm button double-tap
 *  - Clears polling interval properly on unmount
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Linking, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../themes/colors';
import { ModernHeader } from '../components/ModernHeader';
import { TRACKING_STAGES, HELPLINES, FOOD_ITEMS, MEDICINE_ITEMS } from '../utils/constants';
import { confirmReceipt, getRequestStatus } from '../services/api';
import { onStatusUpdate, offStatusUpdate, onConnectionChange, getSocket } from '../services/socket';
import styles from './ConfirmationScreen.styles.js';

const POLL_INTERVAL_MS = 15000;

export default function ConfirmationScreen({ navigation }) {
  const { refId, dbId, trackStage, setTrackStage, category, cart, resetWorkflow } = useAppContext();

  const [isOnline, setIsOnline]             = useState(true);
  const [confirming, setConfirming]         = useState(false);
  const pollIntervalRef                     = useRef(null);

  const selectedItems = useMemo(() => {
    const itemCatalog = category === 'Food' ? FOOD_ITEMS : MEDICINE_ITEMS;
    const itemMap     = new Map(itemCatalog.map((item) => [item.id, item]));
    return Object.entries(cart)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => {
        const item = itemMap.get(itemId);
        return { id: itemId, qty: Number(qty), icon: item?.icon || '📦', name: item?.en || itemId, unit: item?.unit || 'units' };
      });
  }, [cart, category]);

  const activeStage    = useMemo(() => TRACKING_STAGES.find((s) => s.stage === trackStage) || TRACKING_STAGES[0], [trackStage]);
  const progressPercent = useMemo(() => {
    const total = TRACKING_STAGES.length;
    if (total <= 1) return 100;
    return Math.min(100, Math.max(0, Math.round(((trackStage - 1) / (total - 1)) * 100)));
  }, [trackStage]);

  const applyStatus = useCallback((status) => {
    if (status === 'Assigned')      setTrackStage(2);
    if (status === 'In Transit')    setTrackStage(3);
    if (status === 'Delivered')     setTrackStage(4);
    if (status === 'UserConfirmed') setTrackStage(5);
  }, [setTrackStage]);

  // Socket: real-time status updates
  useEffect(() => {
    const handleStatusUpdate = (update) => {
      if (Number(update.id) === Number(dbId)) {
        applyStatus(update.status);
        Toast.show({ type: 'success', text1: 'Status Update', text2: `Order: ${update.status}` });
      }
    };

    try {
      onStatusUpdate(handleStatusUpdate);
    } catch (_) {}

    return () => {
      try { offStatusUpdate(handleStatusUpdate); } catch (_) {}
    };
  }, [dbId, applyStatus]);

  // Connection state tracking
  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onConnectionChange((connected) => setIsOnline(connected));
    } catch (_) {
      setIsOnline(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Polling fallback when socket is offline
  useEffect(() => {
    if (!dbId) return;

    const poll = async () => {
      if (isOnline) return; // socket handles it when online
      try {
        const data = await getRequestStatus(dbId);
        if (data?.status) applyStatus(data.status);
      } catch (_) {}
    };

    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollIntervalRef.current);
  }, [dbId, isOnline, applyStatus]);

  const handleConfirmReceipt = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await confirmReceipt(dbId);

      // Attempt socket emit for real-time GCS sync
      try {
        const socket = getSocket();
        socket.emit('status_update', { id: dbId, status: 'UserConfirmed' });
      } catch (_) {}

      setTrackStage(5);
      Toast.show({ type: 'success', text1: 'Confirmed', text2: 'Receipt confirmed. Stay safe.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to confirm receipt. Try again.' });
    } finally {
      setConfirming(false);
    }
  };

  const handleNewRequest = () => {
    resetWorkflow();
    navigation.popToTop();
  };

  const handleCallHelpline = async (phoneNumber) => {
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (_) {
      Toast.show({ type: 'error', text1: 'Unable to call', text2: `Dial ${phoneNumber} manually` });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />

      <ModernHeader
        title="Request Tracking"
        subtitle="Monitor your relief request"
        onBackPress={() => navigation.pop()}
      />

      {/* Offline banner */}
      {!isOnline && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: '#fef3c7', paddingHorizontal: 16, paddingVertical: 8,
          borderBottomWidth: 1, borderBottomColor: '#fde68a',
        }}>
          <Ionicons name="wifi-outline" size={16} color="#92400e" />
          <Text style={{ fontSize: 12, color: '#92400e', flex: 1 }}>
            Offline — updates are being polled every 15 seconds
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Ionicons name="radio" size={28} color={Colors.primary} style={styles.brandLogo} />
          <Text style={styles.brandTitle}>zydro</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="checkmark-done" size={30} color={Colors.success} />
          </View>
          <Text style={styles.heroTitle}>Request Submitted</Text>
          <Text style={styles.heroSub}>Operations center has received your request.</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <Text style={styles.heroMetaLabel}>Reference</Text>
              <Text style={styles.heroMetaValue}>{refId || 'Pending'}</Text>
            </View>
            <View style={styles.heroMetaChip}>
              <Text style={styles.heroMetaLabel}>Category</Text>
              <Text style={styles.heroMetaValue}>{category || 'Relief'}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current Stage</Text>
            <Text style={styles.statValue}>{activeStage?.title || 'Submitted'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={styles.statValue}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderItems}>
            {selectedItems.length === 0 ? (
              <View style={styles.emptyOrderState}>
                <Text style={styles.emptyOrderText}>No items captured for this request.</Text>
              </View>
            ) : (
              selectedItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={[styles.qtyBadge, { backgroundColor: category === 'Food' ? Colors.food : Colors.medicine }]}>
                    <Text style={styles.qtyBadgeText}>{item.qty}</Text>
                  </View>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemUnit}>Quantity: {item.qty} {item.unit}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Tracking */}
        <View style={styles.sectionCard}>
          <View style={styles.trackingHeaderRow}>
            <Text style={styles.sectionTitle}>Live Tracking</Text>
            <Text style={styles.trackingStepText}>Step {trackStage}/{TRACKING_STAGES.length}</Text>
          </View>

          <View style={styles.timeline}>
            {TRACKING_STAGES.map((stage, index) => (
              <View key={stage.stage} style={styles.timelineItem}>
                <View style={[
                  styles.stageCircle,
                  trackStage >= stage.stage ? styles.stageCircleActive : styles.stageCircleInactive,
                ]}>
                  <Text style={styles.stageIcon}>{stage.icon}</Text>
                </View>
                <View style={styles.stageInfo}>
                  <Text style={[styles.stageName, trackStage >= stage.stage ? styles.stageNameActive : styles.stageNameInactive]}>
                    {stage.title}
                  </Text>
                  <Text style={[styles.stageDesc, trackStage >= stage.stage ? styles.stageDescActive : styles.stageDescInactive]}>
                    {stage.subtitle}
                  </Text>
                </View>
                {index < TRACKING_STAGES.length - 1 && (
                  <View style={[styles.connector, trackStage > stage.stage ? styles.connectorActive : styles.connectorInactive]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Confirm receipt */}
        {trackStage >= 3 && trackStage < 5 && (
          <TouchableOpacity
            style={[styles.confirmBtn, confirming && { opacity: 0.6 }]}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            {confirming
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.confirmBtnText}>Confirm Receipt</Text>
            }
          </TouchableOpacity>
        )}

        {trackStage === 5 && (
          <View style={styles.finalMessage}>
            <Ionicons name="shield-checkmark" size={34} color={Colors.success} />
            <Text style={styles.finalText}>Delivery Confirmed</Text>
            <Text style={styles.finalSub}>Thank you for confirming safe receipt.</Text>
          </View>
        )}

        {/* Emergency Helplines */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency Helplines</Text>
          <View style={styles.helplines}>
            {HELPLINES.map((helpline) => (
              <TouchableOpacity
                key={helpline.name}
                style={[styles.helplineBtn, { borderLeftColor: helpline.color }]}
                onPress={() => handleCallHelpline(helpline.number)}
              >
                <Text style={styles.helplineIcon}>{helpline.icon}</Text>
                <View style={styles.helplineInfo}>
                  <Text style={styles.helplineName}>{helpline.name}</Text>
                  <Text style={styles.helplinePhoneBtn}>{helpline.number}</Text>
                </View>
                <Ionicons name="call" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.newRequestBtn} onPress={handleNewRequest}>
        <Text style={styles.newRequestBtnText}>+ Submit Another Request</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
