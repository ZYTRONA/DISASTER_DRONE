/**
 * OrderDetailScreen - Modern request tracking dashboard.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { confirmReceipt, getRequestStatus } from '../services/api';
import { onStatusUpdate, offStatusUpdate, getSocket } from '../services/socket';
import { HELPLINES, TRACKING_STAGES } from '../utils/constants';
import { Colors } from '../themes/colors';
import { formatDateTime } from '../utils/dateTime';

const STATUS_STAGE = {
  Pending: 1,
  Assigned: 2,
  'In Transit': 3,
  Delivered: 4,
  UserConfirmed: 5,
};

const STAGE_STATUS = {
  1: 'Pending',
  2: 'Assigned',
  3: 'In Transit',
  4: 'Delivered',
  5: 'UserConfirmed',
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

function idsMatch(left, right) {
  if (left === undefined || left === null || right === undefined || right === null) return false;
  return String(left) === String(right) || Number(left) === Number(right);
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

export default function OrderDetailScreen({ navigation, route }) {
  const order = route.params?.order || {};
  const {
    dbId: contextDbId,
    refId: contextRefId,
    trackStage: contextTrackStage,
    setTrackStage,
  } = useAppContext();

  const requestId = pickFirst(order.dbId, order.id, order._id, contextRefId === order.refId ? contextDbId : null);
  const isCurrentOrder = order.refId === contextRefId || idsMatch(order.dbId, contextDbId);
  const initialStage = isCurrentOrder ? contextTrackStage || 1 : stageFromStatus(order.status, 1);

  const [stage, setStage] = useState(initialStage);
  const [liveRequest, setLiveRequest] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(Boolean(requestId));
  const [confirming, setConfirming] = useState(false);

  const request = useMemo(() => ({ ...order, ...(liveRequest || {}) }), [order, liveRequest]);
  const status = normalizeStatus(request.status) || STAGE_STATUS[stage] || 'Pending';
  const currentStage = TRACKING_STAGES[stage - 1] || TRACKING_STAGES[0];
  const progressPercent = Math.round(((stage - 1) / (TRACKING_STAGES.length - 1)) * 100);
  const statusColor = STATUS_COLORS[status] || Colors.primary;
  const priority = pickFirst(request.priority, request.urgency, request.severity, 'Normal');
  const priorityColor = PRIORITY_COLORS[priority] || Colors.primary;
  const resource = pickFirst(request.resource, request.category, 'Relief');
  const reference = pickFirst(request.refId, request.ref_id, request.request_ref, 'Pending');
  const createdAt = pickFirst(request.timestamp_ist, request.created_at_ist, request.timestamp, request.created_at, request.createdAt);
  const note = pickFirst(request.note, request.notes, request.description);
  const peopleAffected = pickFirst(request.people_affected, request.people, request.cart?.items_count);
  const disasterType = pickFirst(request.disaster_type, request.disaster);
  const lat = pickFirst(request.lat, request.latitude);
  const lon = pickFirst(request.lon, request.longitude);

  const applyStatus = useCallback((nextStatus) => {
    const nextStage = stageFromStatus(nextStatus, stage);
    setStage(nextStage);
    setLiveRequest((prev) => prev ? { ...prev, status: normalizeStatus(nextStatus) || nextStatus } : prev);
    if (isCurrentOrder) setTrackStage(nextStage);
  }, [isCurrentOrder, setTrackStage, stage]);

  useEffect(() => {
    if (isCurrentOrder) setStage(contextTrackStage || 1);
  }, [contextTrackStage, isCurrentOrder]);

  useEffect(() => {
    let mounted = true;

    const loadDetails = async () => {
      if (!requestId) {
        setLoadingDetails(false);
        return;
      }

      try {
        setLoadingDetails(true);
        const data = await getRequestStatus(requestId);
        if (!mounted) return;
        setLiveRequest(data);
        setStage(stageFromStatus(data?.status, isCurrentOrder ? contextTrackStage || 1 : initialStage));
      } catch (err) {
        if (mounted) {
          Toast.show({
            type: 'info',
            text1: 'Showing saved request',
            text2: 'Live details are unavailable right now.',
          });
        }
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    };

    loadDetails();
    return () => { mounted = false; };
  }, [contextTrackStage, initialStage, isCurrentOrder, requestId]);

  useEffect(() => {
    if (!requestId) return undefined;

    const handleStatusUpdate = ({ id, status: nextStatus }) => {
      if (idsMatch(id, requestId)) {
        applyStatus(nextStatus);
        Toast.show({ type: 'success', text1: 'Status updated', text2: normalizeStatus(nextStatus) || nextStatus });
      }
    };

    try {
      onStatusUpdate(handleStatusUpdate);
      return () => {
        try { offStatusUpdate(handleStatusUpdate); } catch (_) {}
      };
    } catch (err) {
      return undefined;
    }
  }, [applyStatus, requestId]);

  const handleConfirmReceipt = async () => {
    if (!requestId || confirming) return;
    setConfirming(true);
    try {
      await confirmReceipt(requestId);
      try {
        getSocket().emit('status_update', { id: requestId, status: 'UserConfirmed' });
      } catch (_) {}
      applyStatus('UserConfirmed');
      Toast.show({ type: 'success', text1: 'Receipt confirmed', text2: 'Thank you. Stay safe.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not confirm receipt', text2: 'Please try again.' });
    } finally {
      setConfirming(false);
    }
  };

  const handleCallSupport = async (number) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch (_) {
      Toast.show({ type: 'error', text1: 'Call failed', text2: `Dial ${number} manually` });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Request Tracking</Text>
          <Text style={styles.headerSubtitle}>Reference {reference}</Text>
        </View>
        <View style={[styles.livePill, { borderColor: loadingDetails ? Colors.warning : statusColor }]}>
          {loadingDetails ? (
            <ActivityIndicator size="small" color={Colors.warning} />
          ) : (
            <View style={[styles.liveDot, { backgroundColor: statusColor }]} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { borderColor: `${statusColor}35` }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIcon, { backgroundColor: `${statusColor}18` }]}>
              <Ionicons name="navigate-circle" size={34} color={statusColor} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}45` }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{currentStage.title}</Text>
          <Text style={styles.heroSubtitle}>{currentStage.subtitle}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: statusColor }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>Step {stage} of {TRACKING_STAGES.length}</Text>
            <Text style={[styles.progressPercent, { color: statusColor }]}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoCard icon="cube-outline" label="Resource" value={resource} accent={Colors.primary} />
          <InfoCard icon="flash-outline" label="Priority" value={priority} accent={priorityColor} />
          <InfoCard icon="people-outline" label="People" value={peopleAffected ? `${peopleAffected}` : null} accent={Colors.teal} />
          <InfoCard icon="time-outline" label="Placed" value={formatDateTime(createdAt)} accent={Colors.secondary} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Request Details</Text>
          </View>
          <View style={styles.detailPanel}>
            <DetailRow icon="finger-print-outline" label="Request ID" value={requestId ? `${requestId}` : 'Not available'} />
            <DetailRow icon="pricetag-outline" label="Reference ID" value={reference} color={Colors.teal} />
            <DetailRow icon="alert-circle-outline" label="Disaster Type" value={disasterType || 'General relief'} color={Colors.warning} />
            <DetailRow icon="document-text-outline" label="Items / Notes" value={note || 'No additional note recorded'} color={Colors.secondary} />
          </View>
        </View>

        <View style={styles.section}>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Timeline</Text>
          </View>
          <View style={styles.timelinePanel}>
            {TRACKING_STAGES.map((item, index) => {
              const active = stage >= item.stage;
              const current = stage === item.stage;
              const lineActive = stage > item.stage;

              return (
                <View key={item.stage} style={styles.timelineItem}>
                  {index < TRACKING_STAGES.length - 1 && (
                    <View style={[styles.timelineLine, lineActive && { backgroundColor: statusColor }]} />
                  )}
                  <View style={[
                    styles.timelineIcon,
                    active && { backgroundColor: statusColor, borderColor: statusColor },
                    current && styles.timelineIconCurrent,
                  ]}>
                    <Ionicons
                      name={active ? 'checkmark' : 'ellipse-outline'}
                      size={active ? 16 : 14}
                      color={active ? '#fff' : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text style={[styles.timelineTitle, active && styles.timelineTitleActive]}>{item.title}</Text>
                    <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {stage >= 4 && stage < 5 && (
          <TouchableOpacity
            style={[styles.confirmButton, confirming && styles.disabledButton]}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={19} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Emergency Support</Text>
          </View>
          <View style={styles.supportGrid}>
            {HELPLINES.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.supportCard, { borderLeftColor: item.color }]}
                onPress={() => handleCallSupport(item.number)}
              >
                <Text style={styles.supportName}>{item.name}</Text>
                <Text style={styles.supportNumber}>{item.number}</Text>
                <Ionicons name="call" size={16} color={item.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  livePill: {
    minWidth: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '900',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  infoCard: {
    width: '48.5%',
    minHeight: 118,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    padding: 12,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  detailPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  locationPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.glassAccent,
    padding: 14,
  },
  locationPin: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  locationMeta: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  locationValue: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  timelinePanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 70,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 31,
    top: 34,
    bottom: -8,
    width: 2,
    backgroundColor: Colors.surfaceAlt,
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.surfaceAlt,
    zIndex: 1,
  },
  timelineIconCurrent: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineCopy: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 12,
  },
  timelineTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '800',
  },
  timelineTitleActive: {
    color: Colors.textPrimary,
  },
  timelineSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
  },
  confirmButton: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.65,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  supportGrid: {
    gap: 10,
  },
  supportCard: {
    minHeight: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  supportNumber: {
    marginRight: 12,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '800',
  },
});
