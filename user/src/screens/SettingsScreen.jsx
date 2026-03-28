/**
 * SettingsScreen - App settings
 * Currently focused on theme mode selection.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './SettingsScreen.styles.js';

/**
 * @typedef {Object} SettingsScreenProps
 * @property {Object} navigation - React Navigation stack navigator
 */

/**
 * @param {SettingsScreenProps} props
 * @returns {React.ReactElement}
 */
export default function SettingsScreen(
  /** @type {any} */ { navigation }
) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <ScrollView
        style={{ backgroundColor: '#ffffff' }}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: '#ffffff' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#2563eb' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: '#ffffff' }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Theme Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#000000' }]}>Theme</Text>
          <View style={styles.themeInfoCard}>
            <Text style={styles.themeInfoText}>Light mode is enabled permanently.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
