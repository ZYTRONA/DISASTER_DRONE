/**
 * OrderDetailScreen - Track individual order status
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { onStatusUpdate, offStatusUpdate } from '../services/socket';
import { TRACKING_STAGES, HELPLINES } from '../utils/constants';

/**
 * @param {Object} props - Navigation props
 * @returns {React.ReactElement}
 */
export default function OrderDetailScreen({ navigation, route }) {
  const { order } = route.params;
  const {
    dbId: contextDbId,
    refId: contextRefId,
    trackStage: contextTrackStage,
  } = useAppContext();
  
  const [stage, setStage] = useState(1);

  useEffect(() => {
    // Use context state for the active order and completed status for past orders.
    const isCurrentOrder = order.refId === contextRefId;
    if (isCurrentOrder) {
      setStage(contextTrackStage || 1);
    } else {
      setStage(5);
    }
  }, [order, contextRefId, contextTrackStage]);

  useEffect(() => {
    // Set up real-time tracking if this is the current order
    if (order.refId === contextRefId && contextDbId) {
      const handleStatusUpdate = ({ id, status }) => {
        if (Number(id) === Number(contextDbId)) {
          if (status === 'Assigned') setStage(2);
          if (status === 'In Transit') setStage(3);
          if (status === 'Delivered') setStage(4);
          if (status === 'UserConfirmed') setStage(5);
        }
      };

      try {
        onStatusUpdate(handleStatusUpdate);
        return () => {
          try {
            offStatusUpdate(handleStatusUpdate);
          } catch (err) {
            console.warn('Error removing listener:', err.message);
          }
        };
      } catch (err) {
        console.warn('Socket not ready:', err.message);
      }
    }
  }, [order, contextRefId, contextDbId]);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Unknown date';
    }
  };

  const currentStageInfo = useMemo(() => {
    return TRACKING_STAGES[stage - 1] || TRACKING_STAGES[0];
  }, [stage]);

  const stageColor = useMemo(() => {
    if (stage >= 5) return '#10b981';
    if (stage === 4) return '#0ea5e9';
    if (stage === 3) return '#2563eb';
    if (stage === 2) return '#f59e0b';
    return '#64748b';
  }, [stage]);

  const handleCallSupport = (category) => {
    const helpline = HELPLINES.find((item) => item.name === 'NDRF Helpline') || HELPLINES[0];

    Linking.openURL(`tel:${helpline.number}`).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Call failed',
        text2: `Dial ${helpline.number} manually`,
      });
    });

    Toast.show({
      type: 'success',
      text1: 'Calling Support',
      text2: `Connecting to ${category} helpline (${helpline.number})`,
    });
  };

  const renderStageIndicator = () => {
    const finalStage = TRACKING_STAGES.length;

    return (
      <View style={styles.stageIndicator}>
        {TRACKING_STAGES.map((stg, index) => {
          const step = index + 1;
          const isCompleted = stage > step || (stage >= finalStage && step === finalStage);
          const isCurrent = stage === step && stage < finalStage;
          const isLineCompleted = stage > step;

          return (
            <View key={index} style={styles.stageItem}>
              {index < TRACKING_STAGES.length - 1 && (
                <View
                  style={[
                    styles.stageLine,
                    isLineCompleted && styles.stageLineCompleted,
                  ]}
                />
              )}
              <View
                style={[
                  styles.stageCircle,
                  isCurrent && styles.stageCircleCurrent,
                  isCompleted && styles.stageCircleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                ) : isCurrent ? (
                  <View style={styles.stagePulse} />
                ) : (
                  <Text style={styles.stageNumber}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.stageLabelWrap}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.stageLabel,
                    (isCurrent || isCompleted) && styles.stageLabelActive,
                  ]}
                >
                  {stg.title}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Reference */}
        <View style={styles.refSection}>
          <Text style={styles.refLabel}>Reference ID</Text>
          <View style={styles.refBox}>
            <Text style={styles.refValue}>{order.refId}</Text>
            <TouchableOpacity>
              <Ionicons name="copy" size={18} color="#2563eb" />
            </TouchableOpacity>
          </View>
          <Text style={styles.placedDate}>Placed on {formatDate(order.timestamp)}</Text>
        </View>

        {/* Order Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={20} color="#2563eb" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{order.resource}</Text>
            </View>
          </View>
          {order.note && (
            <View style={styles.detailItem}>
              <Ionicons name="document-text-outline" size={20} color="#7c3aed" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>{order.note}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tracking Status */}
        <View style={styles.trackingSection}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: stageColor },
                ]}
              >
                <Text style={styles.statusEmoji}>{currentStageInfo.icon}</Text>
              </View>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>{currentStageInfo.title}</Text>
                <Text style={styles.statusDesc}>{currentStageInfo.subtitle}</Text>
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {renderStageIndicator()}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => handleCallSupport(order.resource)}
          >
            <Ionicons name="call-outline" size={18} color="#fff" />
            <Text style={styles.helpButtonText}>
              Call {order.resource} Support
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  refSection: {
    marginBottom: 24,
  },
  refLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  refBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  refValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'monospace',
  },
  placedDate: {
    fontSize: 12,
    color: '#64748b',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    color: '#1e293b',
    marginTop: 2,
    fontWeight: '500',
  },
  trackingSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 22,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  statusDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  timeline: {
    paddingVertical: 12,
  },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  stageItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 2,
  },
  stageLine: {
    position: 'absolute',
    left: '50%',
    top: 21,
    width: '100%',
    height: 2,
    backgroundColor: '#e2e8f0',
    zIndex: 0,
  },
  stageLineCompleted: {
    backgroundColor: '#10b981',
  },
  stageCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    zIndex: 1,
  },
  stageCircleCurrent: {
    backgroundColor: '#2563eb',
    borderColor: '#1e40af',
  },
  stageCircleCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  stageNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  stagePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  stageLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#64748b',
    width: '100%',
    paddingHorizontal: 2,
    includeFontPadding: false,
    textAlign: 'center',
    fontWeight: '500',
  },
  stageLabelWrap: {
    marginTop: 8,
    minHeight: 34,
    width: '100%',
    alignItems: 'center',
  },
  stageLabelActive: {
    color: '#1e293b',
    fontWeight: '600',
  },
  supportSection: {
    marginBottom: 24,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  spacer: {
    height: 20,
  },
});
