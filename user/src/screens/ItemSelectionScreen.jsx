/**
 * ItemSelectionScreen - Step 2: Select items and quantities
 * 
 * @typedef {Object} ItemSelectionScreenProps
 * @property {Object} navigation - React Navigation stack navigator
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { Colors, THEME } from '../themes/colors';
import { FOOD_ITEMS, MEDICINE_ITEMS } from '../utils/constants';
import { getCurrentLocation } from '../services/location';
import { submitRequest } from '../services/api';
import styles from './ItemSelectionScreen.styles.js';

const { width } = Dimensions.get('window');

/**
 * @param {ItemSelectionScreenProps} props
 * @returns {React.ReactElement}
 */
export default function ItemSelectionScreen(
  /** @type {any} */ { navigation }
) {
  const {
    category,
    cart,
    setQty,
    getCartTotal,
    loading,
    setLoading,
    setRequest,
  } = useAppContext();

  const [gettingLocation, setGettingLocation] = useState(false);
  const items = category === 'Food' ? FOOD_ITEMS : MEDICINE_ITEMS;
  const cartTotal = getCartTotal();

  /**
   * Get item name in current language
   * @type {(item: any) => string}
   */
  const getItemName = (item) => {
    return item.en || item.en;
  };

  /**
   * Increment item quantity
   * @type {(itemId: string) => void}
   */
  const handleIncrement = (itemId) => {
    setQty(itemId, (cart[itemId] || 0) + 1);
  };

  /**
   * Decrement item quantity
   * @type {(itemId: string) => void}
   */
  const handleDecrement = (itemId) => {
    setQty(itemId, Math.max(0, (cart[itemId] || 0) - 1));
  };

  const handleSubmit = async () => {
    if (cartTotal === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Select at least one item',
      });
      return;
    }

    setGettingLocation(true);
    setLoading(true);

    try {
      // Get location
      const location = await getCurrentLocation();
      console.log('[Location]', location);

      // Generate reference ID
      const refId = 'NDRF-' + Date.now().toString(36).toUpperCase();

      // Build cart summary for database
      const cartSummary = items
        .filter((i) => (cart[i.id] || 0) > 0)
        .map((i) => `${getItemName(i)} x${cart[i.id]}`)
        .join(', ');

      // Submit request
      const response = await submitRequest({
        resource: category,
        cart,
        note: cartSummary,
        lat: location.lat,
        lon: location.lon,
      });

      console.log('[Request Submitted]', response);

      // Save to context
      setRequest(refId, response.id, cartSummary);

      // Navigate to confirmation
      navigation.push('Confirmation');

      Toast.show({
        type: 'success',
        text1: 'Request Submitted!',
        text2: 'Your request has been sent successfully',
      });
    } catch (/** @type {any} */ err) {
      const rawMessage = err instanceof Error ? err.message : 'Failed to send request';
      const message = rawMessage.toLowerCase().includes('location')
        ? 'Unable to get your location. Turn on GPS/location and try again.'
        : rawMessage;
      console.error('❌ Submission error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    } finally {
      setGettingLocation(false);
      setLoading(false);
    }
  };

  /**
   * Render FlatList item
   * @type {(props: {item: any}) => React.ReactElement}
   */
  const renderItem = (props) => {
    const { item } = props;
    return (
      <View
        style={[
          styles.itemRow,
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={[styles.itemHeader,]}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <View>
              <Text style={styles.itemName}>{getItemName(item)}</Text>
              <Text style={styles.itemUnit}>
                {cart[item.id] || 0} {item.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Quantity Stepper */}
        <View style={[styles.stepper,]}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleDecrement(item.id)}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.stepperValue}>{cart[item.id] || 0}</Text>

          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleIncrement(item.id)}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: category === 'Food' ? '#f59e0b' : '#ef4444' },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.pop()}>
          <Text style={styles.backButton}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'Select items and quantities'}</Text>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Location Note */}
      <View style={[styles.noteBox,]}>
        <Ionicons name="location" size={20} color={Colors.textPrimary} style={{ marginRight: THEME.spacing.sm }} />
        <Text style={[styles.noteText,]}>
          {'Your GPS location will be captured when you tap Send'}
        </Text>
      </View>

      {/* Cart Summary & Submit Button */}
      <View style={[styles.footer,]}>
        <View>
          <Text style={styles.cartLabel}>{'Selected items'}</Text>
          <Text style={styles.cartTotal}>{cartTotal} items</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (loading || gettingLocation || cartTotal === 0) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || gettingLocation || cartTotal === 0}
        >
          {gettingLocation || loading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.submitBtnText}>
              {'Send Request'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}





