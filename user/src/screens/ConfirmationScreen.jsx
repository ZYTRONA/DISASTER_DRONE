/**
 * ConfirmationScreen - Step 3: Track delivery & confirm receipt
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { Colors, THEME } from '../themes/colors';
import { ModernHeader } from '../components/ModernHeader';
import { TRACKING_STAGES, HELPLINES, FOOD_ITEMS, MEDICINE_ITEMS } from '../utils/constants';
import { confirmReceipt } from '../services/api';
import { onStatusUpdate, offStatusUpdate, getSocket } from '../services/socket';
import styles from './ConfirmationScreen.styles.js';

/**
 * @typedef {Object} ConfirmationScreenProps
 * @property {Object} navigation - React Navigation stack navigator
 */

/**
 * @param {ConfirmationScreenProps} props
 * @returns {React.ReactElement}
 */
export default function ConfirmationScreen(
  /** @type {any} */ { navigation }
) {
  const {
    refId,
    dbId,
    trackStage,
    setTrackStage,
    category,
    cart,
    resetWorkflow,
  } = useAppContext();

  const selectedItems = useMemo(() => {
    const itemCatalog = category === 'Food' ? FOOD_ITEMS : MEDICINE_ITEMS;
    const itemMap = new Map(itemCatalog.map((item) => [item.id, item]));

    return Object.entries(cart)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => {
        const item = itemMap.get(itemId);
        return {
          id: itemId,
          qty: Number(qty),
          icon: item?.icon || '📦',
          name: item?.en || itemId,
          unit: item?.unit || 'units',
        };
      });
  }, [cart, category]);

  const activeStage = useMemo(
    () => TRACKING_STAGES.find((stage) => stage.stage === trackStage) || TRACKING_STAGES[0],
    [trackStage]
  );

  const progressPercent = useMemo(() => {
    const totalSteps = TRACKING_STAGES.length;
    if (totalSteps <= 1) {
      return 100;
    }
    return Math.min(100, Math.max(0, Math.round(((trackStage - 1) / (totalSteps - 1)) * 100)));
  }, [trackStage]);

  // Listen for real-time status updates
  useEffect(() => {
    /**
     * Handle status update from socket
     * @type {(update: {id: string|number, status: string}) => void}
     */
    const handleStatusUpdate = (/** @type {{id: string|number, status: string}} */ update) => {
      const { id, status } = update;
      if (Number(id) === Number(dbId)) {
        // Map ground station status to user tracking stages
        if (status === 'Assigned') setTrackStage(2); // Matched with team
        if (status === 'In Transit') setTrackStage(3); // Drone dispatched
        if (status === 'Delivered') setTrackStage(4); // Aid delivered
        if (status === 'UserConfirmed') setTrackStage(5); // Confirmed receipt

        Toast.show({
          type: 'success',
          text1: 'Status Update',
          text2: `Order status: ${status}`,
        });
      }
    };

    try {
      onStatusUpdate(handleStatusUpdate);
      return () => {
        try {
          offStatusUpdate(handleStatusUpdate);
        } catch (/** @type {any} */ err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.warn('[Warning] Error removing listener:', message);
        }
      };
    } catch (/** @type {any} */ err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn('[Warning] Socket not ready:', message);
      return undefined;
    }
  }, [dbId, setTrackStage]);

  const handleConfirmReceipt = async () => {
    try {
      await confirmReceipt(dbId);

      // Emit socket event for real-time ground station sync
      try {
        const socket = getSocket();
        socket.emit('status_update', { id: dbId, status: 'UserConfirmed' });
      } catch (/** @type {any} */ err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn('[Warning] Socket emit failed:', message);
      }

      setTrackStage(5);
      Toast.show({
        type: 'success',
        text1: 'Confirmed',
        text2: 'By you',
      });
    } catch (err) {
      console.error('[Error] Confirmation error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to confirm receipt',
      });
    }
  };

  const handleNewRequest = () => {
    resetWorkflow();
    navigation.popToTop();
  };

  const handleCallHelpline = async (phoneNumber) => {
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Unable to call',
        text2: `Please dial ${phoneNumber} manually`,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />
      {/* Header */}
      <ModernHeader
        title="Request Tracking"
        subtitle="Monitor your relief request"
        onBackPress={() => navigation.pop()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="checkmark-done" size={30} color={Colors.success} />
          </View>
          <Text style={styles.heroTitle}>{'Request Submitted'}</Text>
          <Text style={styles.heroSub}>{'Operations center has received your request successfully.'}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <Text style={styles.heroMetaLabel}>{'Reference'}</Text>
              <Text style={styles.heroMetaValue}>{refId || 'Pending'}</Text>
            </View>
            <View style={styles.heroMetaChip}>
              <Text style={styles.heroMetaLabel}>{'Category'}</Text>
              <Text style={styles.heroMetaValue}>{category || 'Relief'}</Text>
            </View>
          </View>
        </View>

        {/* Status Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{'Current Stage'}</Text>
            <Text style={styles.statValue}>{activeStage?.title || 'Submitted'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{'Progress'}</Text>
            <Text style={styles.statValue}>{`${progressPercent}%`}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{'Order Summary'}</Text>
          <View style={styles.orderItems}>
            {selectedItems.length === 0 && (
              <View style={styles.emptyOrderState}>
                <Text style={styles.emptyOrderText}>{'No items captured for this request.'}</Text>
              </View>
            )}

            {selectedItems.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View
                  style={[
                    styles.qtyBadge,
                    {
                      backgroundColor: category === 'Food' ? Colors.food : Colors.medicine,
                    },
                  ]}
                >
                  <Text style={styles.qtyBadgeText}>{item.qty}</Text>
                </View>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemUnit}>{`Quantity: ${item.qty} ${item.unit}`}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Live Tracking */}
        <View style={styles.sectionCard}>
          <View style={styles.trackingHeaderRow}>
            <Text style={styles.sectionTitle}>{'Live Order Tracking'}</Text>
            <Text style={styles.trackingStepText}>{`Step ${trackStage}/${TRACKING_STAGES.length}`}</Text>
          </View>

          <View style={styles.timeline}>
            {TRACKING_STAGES.map((stage, index) => (
              <View key={stage.stage} style={styles.timelineItem}>
                {/* Stage Circle */}
                <View
                  style={[
                    styles.stageCircle,
                    trackStage >= stage.stage ? styles.stageCircleActive : styles.stageCircleInactive,
                  ]}
                >
                  <Text style={styles.stageIcon}>{stage.icon}</Text>
                </View>

                {/* Stage Info */}
                <View style={styles.stageInfo}>
                  <Text
                    style={[
                      styles.stageName,
                      trackStage >= stage.stage ? styles.stageNameActive : styles.stageNameInactive,
                    ]}
                  >
                    {stage.title}
                  </Text>
                  <Text
                    style={[
                      styles.stageDesc,
                      trackStage >= stage.stage ? styles.stageDescActive : styles.stageDescInactive,
                    ]}
                  >
                    {stage.subtitle}
                  </Text>
                </View>

                {/* Connector Line */}
                {index < TRACKING_STAGES.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      trackStage > stage.stage ? styles.connectorActive : styles.connectorInactive,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Confirm Receipt Button */}
        {trackStage >= 3 && trackStage < 5 && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmReceipt}
          >
            <Text style={styles.confirmBtnText}>{'Confirm Receipt'}</Text>
          </TouchableOpacity>
        )}

        {/* Final Message */}
        {trackStage === 5 && (
          <View style={styles.finalMessage}>
            <Ionicons name="shield-checkmark" size={34} color={Colors.success} />
            <Text style={styles.finalText}>{'Delivery Confirmed'}</Text>
            <Text style={styles.finalSub}>{'Thank you for confirming safe receipt.'}</Text>
          </View>
        )}

        {/* Emergency Helplines */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{'Emergency Helplines'}</Text>
          <View style={styles.helplines}>
            {HELPLINES.map((helpline) => (
              <TouchableOpacity
                key={helpline.name}
                style={[
                  styles.helplineBtn,
                  { borderLeftColor: helpline.color },
                ]}
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

      {/* New Request Button */}
      <TouchableOpacity
        style={styles.newRequestBtn}
        onPress={handleNewRequest}
      >
        <Text style={styles.newRequestBtnText}>{'+ Submit Another Request'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}






