/**
 * SettingsScreen - App settings
 * Currently focused on theme mode selection.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../themes/colors';
import { checkBackendHealth, getApi } from '../services/api';
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
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendUrl, setBackendUrl] = useState('');

  const checkBackend = useCallback(async () => {
    setBackendStatus('checking');

    try {
      const url = getApi().defaults.baseURL || 'http://localhost:5000';
      setBackendUrl(url);

      const isHealthy = await checkBackendHealth();
      setBackendStatus(isHealthy ? 'healthy' : 'unreachable');
    } catch (err) {
      setBackendStatus('error');
      const url = getApi().defaults.baseURL || 'http://localhost:5000';
      setBackendUrl(url);
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const getStatusColor = () => {
    if (backendStatus === 'healthy') return '#10b981';
    if (backendStatus === 'unreachable') return '#ef4444';
    if (backendStatus === 'checking') return '#f59e0b';
    return '#8b5cf6';
  };

  const getStatusText = () => {
    if (backendStatus === 'healthy') return 'Connected';
    if (backendStatus === 'unreachable') return 'Not Reachable';
    if (backendStatus === 'checking') return 'Checking...';
    return 'Error';
  };

  const getStatusIcon = () => {
    if (backendStatus === 'healthy') return 'checkmark-circle';
    if (backendStatus === 'unreachable') return 'close-circle';
    if (backendStatus === 'checking') return 'time';
    return 'warning';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <Ionicons name="radio" size={28} color={Colors.primary} style={styles.brandLogo} />
        <Text style={styles.brandTitle}>zydro</Text>
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.themeInfoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="sunny-outline" size={20} color={Colors.primary} />
              <Text style={styles.themeInfoText}>Light mode is enabled permanently.</Text>
            </View>
          </View>
        </View>

        {/* Backend Diagnostics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Status</Text>
          <View style={[styles.backendCard, { borderColor: getStatusColor() }]}>
            <View style={styles.backendHeader}>
              <View style={[styles.statusIconWrap, { backgroundColor: `${getStatusColor()}15` }]}>
                {backendStatus === 'checking' ? (
                  <ActivityIndicator size="small" color={getStatusColor()} />
                ) : (
                  <Ionicons name={getStatusIcon()} size={22} color={getStatusColor()} />
                )}
              </View>
              <View style={styles.backendTitleWrap}>
                <Text style={[styles.backendStatusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
                <Text style={styles.backendSubtitle}>Ground station API connection</Text>
              </View>
            </View>

            <View style={styles.urlBox}>
              <Text style={styles.urlLabel}>Backend URL</Text>
              <Text style={styles.urlValue} numberOfLines={2}>{backendUrl}</Text>
            </View>

            {backendStatus === 'unreachable' && (
              <View style={styles.warningCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="warning-outline" size={18} color={Colors.error} />
                  <Text style={styles.warningTitle}>Cannot connect to backend</Text>
                </View>
                <Text style={styles.warningDescription}>
                  Ensure the backend server is running, the .env IP/port is correct, and this device can access port 5000.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.backendButton, backendStatus === 'checking' && styles.backendButtonDisabled]}
              onPress={checkBackend}
              activeOpacity={0.8}
              disabled={backendStatus === 'checking'}
            >
              <Text style={styles.backendButtonText}>
                {backendStatus === 'checking' ? 'Checking Backend' : 'Check Backend'}
              </Text>
              <Ionicons name="refresh" size={20} color="#ffffff" style={styles.backendButtonIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
