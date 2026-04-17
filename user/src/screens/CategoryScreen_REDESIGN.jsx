/**
 * CategoryScreen - REDESIGNED for Dark OLED
 * SOS button + Resource grid + Urgency selector
 * Minimal steps → home to submitted in 3 taps
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../themes/colors';
import { CATEGORIES, RESOURCE_LABELS, URGENCY_LEVELS } from '../utils/constants';

const { width } = Dimensions.get('window');
const GRID_COLS = 3;
const ITEM_SIZE = (width - 40) / GRID_COLS - 8;

export default function CategoryScreen({ navigation }) {
  const { chooseCategory } = useAppContext();
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedUrgency, setSelectedUrgency] = useState('normal');

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const sosScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
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

  const handleSOSPress = () => {
    // SOS pulse animation
    Animated.sequence([
      Animated.timing(sosScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(sosScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    Alert.alert(
      '🚨 Confirm SOS',
      'This will send an immediate critical priority request. Are you sure?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Send SOS',
          onPress: () => {
            setSelectedResource('Emergency');
            setSelectedUrgency('critical');
            handleProceed();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource.id);
    // Pulse animation on select
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleProceed = () => {
    if (!selectedResource) {
      Alert.alert('Select Resource', 'Please choose what you need assistance with');
      return;
    }

    // Navigate to ItemSelectionScreen
    navigation.navigate('Items', {
      category: selectedResource,
      urgency: selectedUrgency,
    });
  };

  const resourceIcon = (iconName) => {
    const iconMap = {
      restaurant: 'pizza',
      medical: 'medical',
      medkit: 'medical',
    };
    return iconMap[iconName] || iconName;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* SOS Button - Very Top */}
        <Animated.View
          style={[
            styles.sosButton,
            { transform: [{ scale: sosScaleAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.sosButtonInner}
            onPress={handleSOSPress}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={32} color={Colors.textInverse} />
            <Text style={styles.sosButtonText}>SOS Emergency</Text>
            <Text style={styles.sosButtonSubtext}>Tap for immediate help</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.headerTitle}>What do you need?</Text>
          <Text style={styles.headerSubtitle}>Select from available resources</Text>
        </Animated.View>

        {/* Resource Grid */}
        <View style={styles.gridContainer}>
          {CATEGORIES.map((resource, index) => (
            <TouchableOpacity
              key={resource.id}
              activeOpacity={0.7}
              onPress={() => handleResourceSelect(resource)}
              style={[
                styles.gridItem,
                selectedResource === resource.id && styles.gridItemSelected,
              ]}
            >
              <Animated.View
                style={[
                  styles.gridItemInner,
                  {
                    backgroundColor: resource.bg,
                    borderColor: selectedResource === resource.id ? resource.color : Colors.border,
                    borderWidth: selectedResource === resource.id ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={resourceIcon(resource.icon)}
                  size={44}
                  color={resource.color}
                  style={styles.gridIcon}
                />
                <Text style={styles.gridLabel}>{RESOURCE_LABELS[resource.nameKey]}</Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Urgency Selector */}
        <View style={styles.urgencySection}>
          <Text style={styles.sectionTitle}>Response Priority</Text>
          <View style={styles.urgencyContainer}>
            {URGENCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                activeOpacity={0.7}
                onPress={() => setSelectedUrgency(level.id)}
                style={[
                  styles.urgencyButton,
                  selectedUrgency === level.id && styles.urgencyButtonActive,
                ]}
              >
                <View
                  style={[
                    styles.urgencyDot,
                    {
                      backgroundColor: level.color,
                      borderColor: selectedUrgency === level.id ? Colors.textPrimary : Colors.border,
                    },
                  ]}
                />
                <View style={styles.urgencyTextContainer}>
                  <Text style={styles.urgencyLabel}>{level.label}</Text>
                  <Text style={styles.urgencyDescription}>{level.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Warning for Critical */}
        {selectedUrgency === 'critical' && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>Critical requests get priority dispatch within minutes</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !selectedResource && styles.submitButtonDisabled,
          ]}
          onPress={handleProceed}
          activeOpacity={0.8}
          disabled={!selectedResource}
        >
          <Text style={styles.submitButtonText}>
            {selectedResource ? `Request ${RESOURCE_LABELS[CATEGORIES.find(c => c.id === selectedResource)?.nameKey]}` : 'Select a resource'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.textInverse} style={styles.submitButtonIcon} />
        </TouchableOpacity>

        <View style={styles.spacing} />
      </ScrollView>
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

  // SOS Button
  sosButton: {
    marginBottom: 24,
  },
  sosButtonInner: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textInverse,
    marginTop: 12,
  },
  sosButtonSubtext: {
    fontSize: 12,
    color: Colors.textInverse,
    marginTop: 4,
  },

  // Header
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gaps: 8,
  },
  gridItem: {
    width: '32%',
    marginBottom: 12,
  },
  gridItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  gridItemInner: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    borderWidth: 1,
  },
  gridIcon: {
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Urgency
  urgencySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  urgencyContainer: {
    gap: 10,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  urgencyButtonActive: {
    backgroundColor: Colors.surfaceHover,
    borderColor: Colors.primary,
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 2,
  },
  urgencyTextContainer: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  urgencyDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
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
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  submitButtonIcon: {
    marginLeft: 8,
  },

  spacing: {
    height: 20,
  },
};
