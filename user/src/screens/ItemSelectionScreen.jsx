/**
 * ItemSelectionScreen - REDESIGNED
 * Show quantity chooser + item selection from Food/Medicine/FirstAid
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../themes/colors';
import { getCurrentLocation } from '../services/location';
import { FOOD_ITEMS, MEDICINE_ITEMS, FIRST_AID_ITEMS } from '../utils/constants';

const ITEM_GRID_COLS = 2;
const SLIDE_INTERVAL_MS = 2500;

const LOCAL_CATEGORY_IMAGES = {
  Food: require('../../assets/images/items/category_food.png'),
  Medicine: require('../../assets/images/items/category_medicine.png'),
  FirstAid: require('../../assets/images/items/category_firstaid.png'),
  Default: require('../../assets/images/items/default_item.png'),
};

const ITEM_SLIDESHOW_IMAGES = {
  biscuit: [
    require('../../assets/images/items/biscuit/1.png'),
    require('../../assets/images/items/biscuit/2.png'),
    require('../../assets/images/items/biscuit/3.png'),
  ],
  protein: [
    require('../../assets/images/items/protein/1.png'),
    require('../../assets/images/items/protein/2.png'),
    require('../../assets/images/items/protein/3.png'),
  ],
  milkpwd: [
    require('../../assets/images/items/milkpwd/1.png'),
    require('../../assets/images/items/milkpwd/2.png'),
    require('../../assets/images/items/milkpwd/3.png'),
  ],
  fruits: [
    require('../../assets/images/items/fruits/1.png'),
    require('../../assets/images/items/fruits/2.png'),
    require('../../assets/images/items/fruits/3.png'),
  ],
  noodles: [
    require('../../assets/images/items/noodles/1.png'),
    require('../../assets/images/items/noodles/2.png'),
    require('../../assets/images/items/noodles/3.png'),
  ],
  para: [
    require('../../assets/images/items/para/1.png'),
    require('../../assets/images/items/para/2.png'),
    require('../../assets/images/items/para/3.png'),
  ],
  ors: [
    require('../../assets/images/items/ors/1.png'),
    require('../../assets/images/items/ors/2.png'),
    require('../../assets/images/items/ors/3.png'),
  ],
  bandage: [
    require('../../assets/images/items/bandage/1.png'),
    require('../../assets/images/items/bandage/2.png'),
    require('../../assets/images/items/bandage/3.png'),
  ],
  antisep: [
    require('../../assets/images/items/antisep/1.png'),
    require('../../assets/images/items/antisep/2.png'),
    require('../../assets/images/items/antisep/3.png'),
  ],
  gloves: [
    require('../../assets/images/items/gloves/1.png'),
    require('../../assets/images/items/gloves/2.png'),
    require('../../assets/images/items/gloves/3.png'),
  ],
  bp: [
    require('../../assets/images/items/bp/1.png'),
    require('../../assets/images/items/bp/2.png'),
    require('../../assets/images/items/bp/3.png'),
  ],
  diab: [
    require('../../assets/images/items/diab/1.png'),
    require('../../assets/images/items/diab/2.png'),
    require('../../assets/images/items/diab/3.png'),
  ],
  insulin: [
    require('../../assets/images/items/insulin/1.png'),
    require('../../assets/images/items/insulin/2.png'),
    require('../../assets/images/items/insulin/3.png'),
  ],
  painrel: [
    require('../../assets/images/items/painrel/1.png'),
    require('../../assets/images/items/painrel/2.png'),
    require('../../assets/images/items/painrel/3.png'),
  ],
  cough: [
    require('../../assets/images/items/cough/1.png'),
    require('../../assets/images/items/cough/2.png'),
    require('../../assets/images/items/cough/3.png'),
  ],
  napkin: [
    require('../../assets/images/items/napkin/1.png'),
    require('../../assets/images/items/napkin/2.png'),
    require('../../assets/images/items/napkin/3.png'),
  ],
};

export default function ItemSelectionScreen({ navigation, route }) {
  const { category, urgency } = route.params || {};
  const { submitRequest } = useAppContext();

  // Get items based on category
  const getItemsList = () => {
    switch (category) {
      case 'Food':
        return FOOD_ITEMS;
      case 'Medicine':
        return MEDICINE_ITEMS;
      case 'FirstAid':
        return FIRST_AID_ITEMS;
      default:
        return [];
    }
  };

  const items = getItemsList();

  // Form state
  const [selectedItems, setSelectedItems] = useState({});
  const [people, setPeople] = useState(1);
  const [userName, setUserName] = useState(''); // User's name for request
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slideTick, setSlideTick] = useState(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSlideTick((prev) => (prev + 1) % 1000);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const getItemImageSource = (item) => {
    const fallbackImage =
      LOCAL_CATEGORY_IMAGES[category] ||
      LOCAL_CATEGORY_IMAGES.Default;

    const slideshowImages = ITEM_SLIDESHOW_IMAGES[item.id] || [fallbackImage];
    return slideshowImages[slideTick % slideshowImages.length] || fallbackImage;
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 0;
      if (current === 0) {
        return { ...prev, [itemId]: 1 };
      } else {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      }
    });
  };

  const incrementQuantity = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 1) + 1,
    }));
  };

  const decrementQuantity = (itemId) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || 1;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const incrementPeople = () => {
    setPeople((prev) => Math.min(99, prev + 1));
  };

  const decrementPeople = () => {
    setPeople((prev) => Math.max(1, prev - 1));
  };

  const validateForm = () => {
    if (Object.keys(selectedItems).length === 0) {
      Alert.alert('Select Items', 'Please select at least one item');
      return false;
    }
    if (!people || people < 1) {
      Alert.alert('Required', 'Please enter number of people');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // NEW: Validate name
    if (!userName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      // Get user location before submitting
      let location = { lat: 0, lon: 0 };
      try {
        location = await getCurrentLocation();
        console.log('✅ Location obtained:', location);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Could not get location';
        console.warn('⚠️ Location error:', errorMsg);
        Toast.show({
          type: 'info',
          text1: 'Location Not Available',
          text2: errorMsg,
          duration: 3000,
        });
        // Continue with 0,0 if location fails
      }

      const itemsList = items
        .filter((item) => selectedItems[item.id])
        .map((item) => ({
          id: item.id,
          name: item.en,
          unit: item.unit,
          quantity: selectedItems[item.id],
        }));

      console.log('🛒 Selected items:', itemsList);
      console.log('👤 User name:', userName);
      console.log('📍 Location:', location);

      const requestData = {
        resource: category,
        urgency: urgency || 'normal',
        name: userName.trim(), // Include user name - VALIDATED
        items: itemsList,
        people,
        notes,
        location, // Include location
        timestamp: new Date().toISOString(),
      };

      console.log('📋 Request data:', requestData);
      await submitRequest?.(requestData);

      Toast.show({
        type: 'success',
        text1: 'Request submitted!',
        text2: 'You can now track your delivery',
        duration: 2000,
      });

      navigation.replace('Confirmation', { requestData });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request';
      Alert.alert('Error', message);
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const urgencyLevel = urgency || 'normal';
  const urgencyColor =
    urgencyLevel === 'urgent'
      ? Colors.danger
      : urgencyLevel === 'high'
      ? Colors.secondary
      : Colors.primary;

  const selectedCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <Ionicons name="radio" size={28} color={Colors.primary} style={styles.brandLogo} />
            <Text style={styles.brandTitle}>zydro</Text>
          </View>

          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Select Items</Text>
              <Text style={styles.headerSubtitle}>
                {category} {selectedCount > 0 && `(${selectedCount})`}
              </Text>
            </View>
            <View style={styles.urgencyBadge}>
              <View
                style={[
                  styles.urgencyIndicator,
                  { backgroundColor: urgencyColor },
                ]}
              />
              <Text style={styles.urgencyText}>
                {urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)}
              </Text>
            </View>
          </Animated.View>

          {/* Items Grid */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Available {category}</Text>
              <Text style={styles.sectionMeta}>
                {Object.keys(selectedItems).length} selected
              </Text>
            </View>
            <View style={styles.itemsGrid}>
              {items.map((item) => {
                const quantity = selectedItems[item.id] || 0;
                const isSelected = quantity > 0;
                const imageSource = getItemImageSource(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => toggleItemSelection(item.id)}
                    style={styles.itemCard}
                  >
                    <Animated.View
                      style={[
                        styles.itemCardInner,
                        {
                          backgroundColor: isSelected
                            ? Colors.primary + '15'
                            : Colors.surface,
                          borderColor: isSelected ? Colors.primary : Colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.itemMediaWrap}>
                        <Image
                          source={imageSource}
                          style={styles.itemImage}
                        />

                        {isSelected ? (
                          <View style={styles.selectedBadge}>
                            <Ionicons name="checkmark" size={14} color="#ffffff" />
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.itemBody}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.en}
                        </Text>
                        <View style={styles.itemUnitBadge}>
                          <Text style={styles.itemUnit}>{item.unit}</Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View style={styles.quantityController}>
                          <TouchableOpacity
                            onPress={() => decrementQuantity(item.id)}
                            style={styles.quantityButton}
                          >
                            <Ionicons
                              name="remove"
                              size={15}
                              color={Colors.primary}
                            />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{quantity}</Text>
                          <TouchableOpacity
                            onPress={() => incrementQuantity(item.id)}
                            style={styles.quantityButton}
                          >
                            <Ionicons
                              name="add"
                              size={15}
                              color={Colors.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Details Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Your Details</Text>

            {/* Name Field - NEW */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name..."
                  placeholderTextColor={Colors.textMuted}
                  value={userName}
                  onChangeText={setUserName}
                  editable={!loading}
                  maxLength={50}
                />
              </View>
            </View>

            {/* People Count */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Number of People</Text>
              <View style={styles.peopleStepper}>
                <TouchableOpacity
                  style={styles.peopleActionButton}
                  onPress={decrementPeople}
                  disabled={loading || people <= 1}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={people <= 1 ? Colors.textMuted : Colors.primary}
                  />
                </TouchableOpacity>

                <View style={styles.peopleCountBox}>
                  <Ionicons
                    name="people"
                    size={18}
                    color={Colors.textSecondary}
                    style={styles.peopleIcon}
                  />
                  <Text style={styles.peopleCountText}>{people}</Text>
                </View>

                <TouchableOpacity
                  style={styles.peopleActionButton}
                  onPress={incrementPeople}
                  disabled={loading || people >= 99}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={people >= 99 ? Colors.textMuted : Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any specific requirements or details..."
                  placeholderTextColor={Colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || selectedCount === 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.textInverse} />
                <Text style={styles.submitButtonText}>
                  Submit Request ({selectedCount})
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Brand Header
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  brandLogo: {
    position: 'absolute',
    left: 0,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urgencyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Items Section
  itemsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  itemCard: {
    width: `${100 / ITEM_GRID_COLS - 1.5}%`,
    marginBottom: 8,
  },
  itemCardInner: {
    alignItems: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemMediaWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  itemImage: {
    width: '100%',
    height: 92,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: Colors.surface,
  },
  selectedBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  itemBody: {
    minHeight: 54,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'left',
    marginBottom: 4,
    lineHeight: 16,
  },
  itemUnitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemUnit: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quantityController: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    gap: 6,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    width: 20,
    textAlign: 'center',
  },

  // Form Section
  formSection: {
    marginBottom: 24,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  peopleStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  peopleActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleCountBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  peopleIcon: {
    marginTop: 1,
  },
  peopleCountText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingVertical: 10,
    maxHeight: 100,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  spacing: {
    height: 20,
  },
};
