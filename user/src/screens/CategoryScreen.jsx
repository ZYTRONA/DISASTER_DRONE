/**
 * CategoryScreen - Step 1: Choose Food or Medicine
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { THEME } from '../themes/colors';
import { CATEGORIES, FOOD_ITEMS, MEDICINE_ITEMS, HELPLINES, LANGUAGES } from '../utils/constants';
import styles from './CategoryScreen.styles.js';

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
  const isLightMode = true;

  const palette = {
    screenBg: '#ffffff',
    headerBg: '#2563eb',
    headerText: '#ffffff',
    headerSubText: 'rgba(255,255,255,0.78)',
    controlBg: 'rgba(255,255,255,0.18)',
    controlBorder: 'rgba(255,255,255,0.45)',
    sectionTitle: '#000000',
    helplineBg: '#ffffff',
    helplineTitle: '#000000',
    helplineSub: '#000000',
    modalBg: '#ffffff',
    modalText: '#000000',
    modalBorder: '#e2e8f0',
    modalActiveBg: '#f1f5f9',
    modalActiveText: '#000000',
    overlayBg: 'rgba(148,163,184,0.18)',
    cardBorder: '#e2e8f0',
    foodBg: '#ffffff',
    medBg: '#ffffff',
  };

  /**
   * Handle category selection - Food or Medicine
   * @param {any} categoryId
   */
  function handleCategorySelect(categoryId) {
    const items = categoryId === 'Food' ? FOOD_ITEMS : MEDICINE_ITEMS;
    chooseCategory(categoryId, items);
    navigation.push('Items');
  }

  /**
   * Handle language change
   * @param {any} langCode
   */
  function handleLanguageChange(langCode) {
    // Implementation for handling language change
    setShowLangModal(false);
  }

  /**
   * Handle emergency helpline call
   * @param {any} helpline
   */
  function handleHelplineCall(helpline) {
    const phoneNumber = `tel:${helpline.number}`;
    Linking.canOpenURL(phoneNumber).then((supported) => {
      if (supported) {
        Linking.openURL(phoneNumber);
      } else {
        Alert.alert(
          'Call Not Supported',
          `Cannot dial ${helpline.name} (${helpline.number}) on this device.`,
          [{ text: 'OK' }]
        );
      }
    }).catch((err) => {
      Alert.alert('Error', `Failed to dial: ${err.message}`, [{ text: 'OK' }]);
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.screenBg }]} edges={['left', 'right', 'bottom']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={palette.headerBg}
        translucent={false}
      />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, THEME.spacing.md),
            backgroundColor: palette.headerBg,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerSmall, { color: palette.headerSubText }]}>{'Emergency Relief India'}</Text>
        </View>

        {/* Language & Settings Buttons */}
        <View style={[{ flexDirection: 'row', gap: THEME.spacing.sm },]}>
          <TouchableOpacity
            style={[styles.langButton, { backgroundColor: palette.controlBg, borderColor: palette.controlBorder }]}
            onPress={() => setShowLangModal(true)}
          >
            <Ionicons name="globe" size={16} color={palette.headerText} style={{ marginRight: 4 }} />
            <Text style={[styles.langButtonText, { color: palette.headerText }]}>{'EN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: palette.controlBg, borderColor: palette.controlBorder }]}
            onPress={() => navigation.push('Settings')}
          >
            <Ionicons name="settings" size={20} color={palette.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: isLightMode ? '#ffffff' : palette.screenBg }]}
        contentContainerStyle={[styles.contentContainer, { backgroundColor: isLightMode ? '#ffffff' : palette.screenBg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Cards */}
        <View style={[styles.section,]}>
          <Text style={[styles.sectionTitle, { color: palette.sectionTitle }]}>
            {'CATEGORY'}
          </Text>

          <View style={[styles.cardsContainer,]}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                  },
                ]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <View style={styles.categoryLabelWrap}>
                  <Text style={[styles.categoryName, { color: '#000000' }]}>
                    {cat.id === 'Food' ? 'Food' : 'Medicine'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Helplines */}
        <View style={[styles.section,]}>
          <Text style={[styles.sectionTitle, { color: palette.sectionTitle }]}>
            {'Emergency Helplines'}
          </Text>

          <View style={styles.helplinesGrid}>
            {HELPLINES.map((helpline) => (
              <TouchableOpacity
                key={helpline.name}
                style={[
                  styles.helplineCard,
                  {
                    borderLeftColor: helpline.color,
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleHelplineCall(helpline)}
                activeOpacity={0.7}
              >
                <Text style={styles.helplineIcon}>{helpline.icon}</Text>
                <View>
                  <Text style={[styles.helplineName, { color: palette.helplineTitle }]}>{helpline.name}</Text>
                  <Text style={[styles.helplineNumber, { color: palette.helplineSub }]}>{helpline.number}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: palette.overlayBg }]}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: palette.modalBg }]}>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { borderBottomColor: palette.modalBorder },
                    'en' === item.code && [styles.languageOptionActive, { backgroundColor: palette.modalActiveBg }],
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      { color: palette.modalText },
                      'en' === item.code && [styles.languageOptionTextActive, { color: palette.modalActiveText }],
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



