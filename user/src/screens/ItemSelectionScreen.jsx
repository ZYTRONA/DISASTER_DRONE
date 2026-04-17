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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../themes/colors';
import { FOOD_ITEMS, MEDICINE_ITEMS, FIRST_AID_ITEMS } from '../utils/constants';

const { width } = Dimensions.get('window');
const ITEM_GRID_COLS = 2;

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
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const itemsList = items
        .filter((item) => selectedItems[item.id])
        .map((item) => ({
          id: item.id,
          name: item.en,
          unit: item.unit,
          quantity: selectedItems[item.id],
        }));

      const requestData = {
        resource: category,
        urgency: urgency || 'normal',
        items: itemsList,
        people,
        notes,
        timestamp: new Date().toISOString(),
      };

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
    urgencyLevel === 'critical'
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
            <Text style={styles.sectionTitle}>Available {category}</Text>
            <View style={styles.itemsGrid}>
              {items.map((item) => {
                const quantity = selectedItems[item.id] || 0;
                const isSelected = quantity > 0;
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
                      <View style={[styles.itemIcon, styles.iconFallback]}>
                        <Ionicons
                          name={item.icon}
                          size={40}
                          color={Colors.primary}
                        />
                      </View>
                      <Text style={styles.itemName}>{item.en}</Text>
                      <Text style={styles.itemUnit}>{item.unit}</Text>

                      {isSelected && (
                        <View style={styles.quantityController}>
                          <TouchableOpacity
                            onPress={() => decrementQuantity(item.id)}
                            style={styles.quantityButton}
                          >
                            <Ionicons
                              name="remove"
                              size={16}
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
                              size={16}
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
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  itemCard: {
    width: `${100 / ITEM_GRID_COLS - 1}%`,
    marginBottom: 8,
  },
  itemCardInner: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  itemIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  iconFallback: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  quantityController: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: Colors.primary + '10',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    width: 24,
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
