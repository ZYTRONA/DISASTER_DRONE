/**
 * CategoryScreen - Step 1: Choose Food or Medicine with Modern UI
 * Glassmorphism design with smooth animations and responsive layout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  StatusBar,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { THEME, Colors } from '../themes/colors';
import { CATEGORIES, FOOD_ITEMS, MEDICINE_ITEMS, HELPLINES, LANGUAGES } from '../utils/constants';
import ModernHeader from '../components/ModernHeader';
import GlassCard from '../components/GlassCard';
import styles from './CategoryScreen.styles.js';
import { useSlideInAnimation, useStaggeredAnimation, usePressAnimation } from '../utils/animationHooks';

const { width } = Dimensions.get('window');

/**
 * @typedef {Object} ScreenProps
 * @property {any} navigation - React Navigation stack navigator
 */

/** @suppress {checkTypes} TypeScript JSDoc arrow function parameters */
export default function CategoryScreen(
  /** @type {any} */ { navigation }
) {
  const { chooseCategory } = useAppContext();
  const insets = useSafeAreaInsets();
  const [showLangModal, setShowLangModal] = useState(false);

  // Animations
  const { translateY, opacity } = useSlideInAnimation(40, 100);
  const categoryAnimations = useStaggeredAnimation(CATEGORIES.length, 80);
  const helplineAnimations = useStaggeredAnimation(HELPLINES.length, 60);

  /**
   * Handle category selection - Food or Medicine
   */
  function handleCategorySelect(categoryId) {
    const items = categoryId === 'Food' ? FOOD_ITEMS : MEDICINE_ITEMS;
    chooseCategory(categoryId, items);
    navigation.push('Items');
  }

  /**
   * Handle language change
   */
  function handleLanguageChange(langCode) {
    setShowLangModal(false);
  }

  /**
   * Handle emergency helpline call
   */
  function handleHelplineCall(helpline) {
    const phoneNumber = `tel:${helpline.number}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('Call Not Supported', `Cannot dial ${helpline.name} (${helpline.number}) on this device.`, [
            { text: 'OK' },
          ]);
        }
      })
      .catch((err) => {
        Alert.alert('Error', `Failed to dial: ${err.message}`, [{ text: 'OK' }]);
      });
  }

  return (
    <SafeAreaView style={[styles.container]} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />

      {/* Modern Header */}
      <ModernHeader
        subtitle="Emergency Relief India"
        title="Quick Relief"
        actions={[
          {
            icon: 'globe',
            label: 'EN',
            onPress: () => setShowLangModal(true),
            testID: 'lang-button',
          },
          {
            icon: 'settings',
            onPress: () => navigation.push('Settings'),
            testID: 'settings-button',
          },
        ]}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Category Cards Section */}
        <Animated.View style={[styles.section, { opacity, transform: [{ translateY }] }]}>
          <Text style={styles.sectionTitle}>Category</Text>

          <View style={styles.cardsContainer}>
            {CATEGORIES.map((cat, index) => (
              <Animated.View
                key={cat.id}
                style={[
                  { flex: 1, opacity: categoryAnimations[index] },
                  { transform: [{ scale: categoryAnimations[index] }] },
                ]}
              >
                <CategoryCardItem
                  category={cat}
                  onPress={() => handleCategorySelect(cat.id)}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Emergency Helplines Section */}
        <Animated.View style={[styles.section, { opacity: Animated.add(opacity, -0.2) }]}>
          <Text style={styles.sectionTitle}>Emergency Helplines</Text>

          <View style={styles.helplinesGrid}>
            {HELPLINES.map((helpline, index) => (
              <Animated.View
                key={helpline.name}
                style={[
                  { opacity: helplineAnimations[index] },
                  { transform: [{ translateY: Animated.multiply(helplineAnimations[index], 20) }] },
                ]}
              >
                <HelplineCardItem helpline={helpline} onPress={() => handleHelplineCall(helpline)} />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <BlurView intensity={60} style={{ flex: 1 }} />
          <View style={styles.modalContent}>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    item.code === 'en' && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      item.code === 'en' && styles.languageOptionTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Category Card Item Component - Enhanced Glassmorphism with Vibrant Premium Colors
 */
function CategoryCardItem({ category, onPress }) {
  const { scale, onPressIn, onPressOut } = usePressAnimation();
  
  // Premium vibrant colors - more saturated
  const bgColor =
    category.id === 'Food'
      ? 'rgba(255, 193, 7, 0.7)'      // More vibrant gold
      : 'rgba(244, 67, 54, 0.7)';     // More vibrant red
  
  const accentColor =
    category.id === 'Food' ? '#FFC107' : '#F44336';  // Brighter accent

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          styles.categoryCard,
          { transform: [{ scale }] },
        ]}
      >
        {/* Base vibrant gradient-like background */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: bgColor,
          }}
        />
        
        {/* Premium glass overlay */}
        <BlurView intensity={35} style={StyleSheet.absoluteFill}>
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />
        </BlurView>

        <View
          style={[
            styles.categoryCardInner,
            { 
              borderColor: 'rgba(255, 255, 255, 0.6)',
              borderWidth: 1.5,
              zIndex: 10,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryIcon,
              { 
                fontSize: 56,
                color: accentColor,
                textShadowColor: 'rgba(0, 0, 0, 0.25)',
                textShadowOffset: { width: 0, height: 3 },
                textShadowRadius: 6,
                marginBottom: 8,
              },
            ]}
          >
            {category.icon}
          </Text>
          <Text style={[
            styles.categoryName,
            {
              fontSize: 22,
              fontWeight: '800',
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.2)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            },
          ]}>
            {category.id === 'Food' ? 'Food' : 'Medicine'}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/**
 * Helpline Card Item Component - Enhanced Glassmorphism with Premium Colors
 */
function HelplineCardItem({ helpline, onPress }) {
  const { scale, onPressIn, onPressOut } = usePressAnimation();
  
  // Convert hex color to RGB with maximum vibrancy for premium look
  const rgbValues = helpline.color.substring(1).match(/.{1,2}/g).map(x => parseInt(x, 16)).join(', ');
  const bgColor = `rgba(${rgbValues}, 0.80)`; // Increased to 0.80 for maximum vibrant colors

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          styles.helplineCard,
          { transform: [{ scale }] },
        ]}
      >
        {/* Premium vibrant background - maximum color saturation */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: bgColor,
          }}
        />

        {/* Premium glass overlay - very subtle */}
        <BlurView intensity={25} style={StyleSheet.absoluteFill}>
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          />
        </BlurView>

        <View
          style={[
            styles.helplineCardInner,
            { 
              borderColor: 'rgba(255, 255, 255, 0.6)',
              borderWidth: 1.5,
              zIndex: 0,
            },
          ]}
        />

        <Text
          style={[
            styles.helplineIcon,
            { 
              fontSize: 36,
              color: helpline.color,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 3 },
              textShadowRadius: 6,
              marginRight: 12,
            },
          ]}
        >
          {helpline.icon}
        </Text>

        <View style={[
          styles.helplineContent,
          {
            zIndex: 10,
            flex: 1,
          },
        ]}>
          <Text style={[
            styles.helplineName,
            {
              fontSize: 18,
              fontWeight: '800',
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.25)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            },
          ]}>{helpline.name}</Text>
          <Text style={[
            styles.helplineNumber,
            {
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)',
              textShadowColor: 'rgba(0, 0, 0, 0.15)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            },
          ]}>{helpline.number}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

import { StyleSheet } from 'react-native';



