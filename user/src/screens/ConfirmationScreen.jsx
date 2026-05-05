/**
 * ConfirmationScreen - Current request tracking dashboard.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../themes/colors';
import { TRACKING_STAGES, HELPLINES, FOOD_ITEMS, MEDICINE_ITEMS, FIRST_AID_ITEMS } from '../utils/constants';
import { confirmReceipt, getRequestStatus } from '../services/api';
import { onStatusUpdate, offStatusUpdate, onConnectionChange, getSocket } from '../services/socket';
import { formatDateTime } from '../utils/dateTime';
import styles from './ConfirmationScreen.styles.js';

const POLL_INTERVAL_MS = 15000;

const STAGE_STATUS = {
  1: 'Pending',
  2: 'Assigned',
  3: 'In Transit',
  4: 'Delivered',
  5: 'UserConfirmed',
};

const STATUS_STAGE = {
  Pending: 1,
  Assigned: 2,
  'In Transit': 3,
  Delivered: 4,
  UserConfirmed: 5,
};

const STATUS_COLORS = {
  Pending: '#64748b',
  Assigned: '#f59e0b',
  'In Transit': '#2563eb',
  Delivered: '#0ea5e9',
  UserConfirmed: '#10b981',
};

const PRIORITY_COLORS = {
  Critical: '#dc2626',
  High: '#ea580c',
  Urgent: '#2563eb',
  Normal: '#059669',
};

function idsMatch(left, right) {
  if (left === undefined || left === null || right === undefined || right === null) return false;
  return String(left) === String(right) || Number(left) === Number(right);
}

function normalizeStatus(value) {
  const status = String(value || '').trim();
  if (status.toLowerCase() === 'in transit') return 'In Transit';
  if (status.toLowerCase() === 'userconfirmed') return 'UserConfirmed';
  return STATUS_STAGE[status] ? status : '';
}

function stageFromStatus(status, fallbackStage = 1) {
  const normalized = normalizeStatus(status);
  return STATUS_STAGE[normalized] || fallbackStage;
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') || null;
}

function formatCoordinate(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not available';
  return number.toFixed(5);
}

function InfoCard({ icon, label, value, accent = Colors.primary }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: `${accent}14` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value || 'Not available'}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, color = Colors.primary }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Not available'}</Text>
      </View>
    </View>
  );
}

export default function ConfirmationScreen({ navigation }) {
  const { refId, dbId, trackStage, setTrackStage, category, cart, resetWorkflow } = useAppContext();

  const [isOnline, setIsOnline] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [liveRequest, setLiveRequest] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(Boolean(dbId));
  const pollIntervalRef = useRef(null);

  const selectedItems = useMemo(() => {
    const catalogs = {
      Food: FOOD_ITEMS,
      Medicine: MEDICINE_ITEMS,
      FirstAid: FIRST_AID_ITEMS,
    };
    const itemCatalog = catalogs[category] || [...FOOD_ITEMS, ...MEDICINE_ITEMS, ...FIRST_AID_ITEMS];
    const itemMap = new Map(itemCatalog.map((item) => [item.id, item]));
    return Object.entries(cart || {})
      .filter(([, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => {
        const item = itemMap.get(itemId);
        return {
          id: itemId,
          qty: Number(qty),
          icon: item?.icon || 'cube-outline',
          name: item?.en || itemId,
          unit: item?.unit || 'units',
        };
      });
  }, [cart, category]);

  const request = liveRequest || {};
  const status = normalizeStatus(request.status) || STAGE_STATUS[trackStage] || 'Pending';
  const activeStage = TRACKING_STAGES[trackStage - 1] || TRACKING_STAGES[0];
  const progressPercent = Math.min(100, Math.max(0, Math.round(((trackStage - 1) / (TRACKING_STAGES.length - 1)) * 100)));
  const statusColor = STATUS_COLORS[status] || Colors.primary;
  const priority = pickFirst(request.priority, request.urgency, 'Normal');
  const priorityColor = PRIORITY_COLORS[priority] || Colors.primary;
  const resource = pickFirst(request.resource, category, 'Relief');
  const reference = pickFirst(request.refId, request.ref_id, refId, 'Pending');
  const createdAt = pickFirst(request.created_at_ist, request.timestamp_ist, request.created_at, request.timestamp);
  const note = pickFirst(request.note, request.notes, request.cart?.notes);
  const peopleAffected = pickFirst(request.people_affected, request.people, request.cart?.items_count);
  const disasterType = pickFirst(request.disaster_type, request.disaster);
  const lat = pickFirst(request.lat, request.latitude);
  const lon = pickFirst(request.lon, request.longitude);

  const applyStatus = useCallback((nextStatus) => {
    setTrackStage((prevStage) => stageFromStatus(nextStatus, prevStage));
    setLiveRequest((prev) => prev ? { ...prev, status: normalizeStatus(nextStatus) || nextStatus } : prev);
  }, [setTrackStage]);

  const loadDetails = useCallback(async () => {
    if (!dbId) {
      setLoadingDetails(false);
      return;
    }

    try {
      setLoadingDetails(true);
      const data = await getRequestStatus(dbId);
      setLiveRequest(data);
      if (data?.status) applyStatus(data.status);
    } catch (_) {
      Toast.show({
        type: 'info',
        text1: 'Saved tracking shown',
        text2: 'Live request details are unavailable right now.',
      });
    } finally {
      setLoadingDetails(false);
    }
  }, [applyStatus, dbId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    const handleStatusUpdate = (update) => {
      if (idsMatch(update.id, dbId)) {
        applyStatus(update.status);
        Toast.show({ type: 'success', text1: 'Status update', text2: `Request: ${normalizeStatus(update.status) || update.status}` });
      }
    };

    try {
      onStatusUpdate(handleStatusUpdate);
    } catch (_) {}

    return () => {
      try { offStatusUpdate(handleStatusUpdate); } catch (_) {}
    };
  }, [applyStatus, dbId]);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onConnectionChange((connected) => setIsOnline(connected));
    } catch (_) {
      setIsOnline(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!dbId) return undefined;

    const poll = async () => {
      if (isOnline) return;
      try {
        const data = await getRequestStatus(dbId);
        setLiveRequest(data);
        if (data?.status) applyStatus(data.status);
      } catch (_) {}
    };

    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollIntervalRef.current);
  }, [applyStatus, dbId, isOnline]);

  const handleConfirmReceipt = async () => {
    if (!dbId || confirming) return;
    setConfirming(true);
    try {
      await confirmReceipt(dbId);

      try {
        const socket = getSocket();
        socket.emit('status_update', { id: dbId, status: 'UserConfirmed' });
      } catch (_) {}

      applyStatus('UserConfirmed');
      Toast.show({ type: 'success', text1: 'Confirmed', text2: 'Receipt confirmed. Stay safe.' });
    } catch (_) {
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

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.pop()}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Request Tracking</Text>
          <Text style={styles.headerSubtitle}>Reference {reference}</Text>
        </View>
        <TouchableOpacity
          style={[styles.livePill, { borderColor: loadingDetails ? Colors.warning : statusColor }]}
          onPress={loadDetails}
          activeOpacity={0.75}
        >
          {loadingDetails ? (
            <ActivityIndicator size="small" color={Colors.warning} />
          ) : (
            <Ionicons name="refresh" size={17} color={statusColor} />
          )}
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color="#92400e" />
          <Text style={styles.offlineText}>Offline. Updates are being checked every 15 seconds.</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { borderColor: `${statusColor}35` }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: `${statusColor}18` }]}>
              <Ionicons name="navigate-circle" size={34} color={statusColor} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}45` }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{activeStage?.title || 'Request Submitted'}</Text>
          <Text style={styles.heroSub}>{activeStage?.subtitle || 'Operations center has received your request.'}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: statusColor }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>Step {trackStage} of {TRACKING_STAGES.length}</Text>
            <Text style={[styles.progressPercent, { color: statusColor }]}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoCard icon="cube-outline" label="Resource" value={resource} accent={Colors.primary} />
          <InfoCard icon="flash-outline" label="Priority" value={priority} accent={priorityColor} />
          <InfoCard icon="people-outline" label="People" value={peopleAffected ? `${peopleAffected}` : null} accent={Colors.teal} />
          <InfoCard icon="time-outline" label="Placed" value={formatDateTime(createdAt)} accent={Colors.secondary} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Request Details</Text>
          </View>
          <View style={styles.detailPanel}>
            <DetailRow icon="finger-print-outline" label="Request ID" value={dbId ? `${dbId}` : 'Not available'} />
            <DetailRow icon="pricetag-outline" label="Reference ID" value={reference} color={Colors.teal} />
            <DetailRow icon="alert-circle-outline" label="Disaster Type" value={disasterType || 'General relief'} color={Colors.warning} />
            <DetailRow icon="document-text-outline" label="Notes" value={note || 'No additional note recorded'} color={Colors.secondary} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.orderItems}>
            {selectedItems.length === 0 ? (
              <View style={styles.emptyOrderState}>
                <Text style={styles.emptyOrderText}>{note || 'No items captured for this request.'}</Text>
              </View>
            ) : (
              selectedItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={[styles.qtyBadge, { backgroundColor: category === 'Food' ? Colors.food : Colors.medicine }]}>
                    <Text style={styles.qtyBadgeText}>{item.qty}</Text>
                  </View>
                  <Ionicons name={item.icon} size={22} color={Colors.primary} />
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemUnit}>Quantity: {item.qty} {item.unit}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.locationPanel}>
            <View style={styles.locationPin}>
              <Ionicons name="pin" size={24} color={Colors.primary} />
            </View>
            <View style={styles.locationMeta}>
              <Text style={styles.locationTitle}>Requester coordinates</Text>
              <Text style={styles.locationValue}>Lat {formatCoordinate(lat)}  /  Lon {formatCoordinate(lon)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.trackingHeaderRow}>
            <View style={styles.sectionHeaderCompact}>
              <Ionicons name="git-branch-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Live Tracking</Text>
            </View>
            <Text style={styles.trackingStepText}>Step {trackStage}/{TRACKING_STAGES.length}</Text>
          </View>

          <View style={styles.timeline}>
            {TRACKING_STAGES.map((stage, index) => {
              const active = trackStage >= stage.stage;
              const current = trackStage === stage.stage;
              return (
                <View key={stage.stage} style={styles.timelineItem}>
                  {index < TRACKING_STAGES.length - 1 && (
                    <View style={[styles.connector, trackStage > stage.stage ? { backgroundColor: statusColor } : styles.connectorInactive]} />
                  )}
                  <View style={[
                    styles.stageCircle,
                    active ? { backgroundColor: statusColor, borderColor: statusColor } : styles.stageCircleInactive,
                    current && styles.stageCircleCurrent,
                  ]}>
                    <Ionicons name={active ? 'checkmark' : 'ellipse-outline'} size={active ? 16 : 14} color={active ? '#fff' : Colors.textMuted} />
                  </View>
                  <View style={styles.stageInfo}>
                    <Text style={[styles.stageName, active ? styles.stageNameActive : styles.stageNameInactive]}>{stage.title}</Text>
                    <Text style={[styles.stageDesc, active ? styles.stageDescActive : styles.stageDescInactive]}>{stage.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {trackStage >= 4 && trackStage < 5 && (
          <TouchableOpacity
            style={[styles.confirmBtn, confirming && { opacity: 0.6 }]}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={19} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirm Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {trackStage === 5 && (
          <View style={styles.finalMessage}>
            <Ionicons name="shield-checkmark" size={34} color={Colors.success} />
            <Text style={styles.finalText}>Delivery Confirmed</Text>
            <Text style={styles.finalSub}>Thank you for confirming safe receipt.</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Emergency Support</Text>
          </View>
          <View style={styles.helplines}>
            {HELPLINES.slice(0, 4).map((helpline) => (
              <TouchableOpacity
                key={helpline.name}
                style={[styles.helplineBtn, { borderLeftColor: helpline.color }]}
                onPress={() => handleCallHelpline(helpline.number)}
              >
                <Text style={styles.helplineName}>{helpline.name}</Text>
                <Text style={styles.helplinePhoneBtn}>{helpline.number}</Text>
                <Ionicons name="call" size={18} color={helpline.color} />
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
