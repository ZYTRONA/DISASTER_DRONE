/**
 * SettingsScreen - App settings
 * Currently focused on theme mode selection.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../themes/colors';
import { ModernHeader } from '../components/ModernHeader';
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

  useEffect(() => {
    const checkBackend = async () => {
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
    };

    checkBackend();
  }, []);

  const getStatusColor = () => {
    if (backendStatus === 'healthy') return '#10b981';
    if (backendStatus === 'unreachable') return '#ef4444';
    if (backendStatus === 'checking') return '#f59e0b';
    return '#8b5cf6';
  };

  const getStatusText = () => {
    if (backendStatus === 'healthy') return '✅ Connected';
    if (backendStatus === 'unreachable') return '❌ Not Reachable';
    if (backendStatus === 'checking') return '⏳ Checking...';
    return '⚠️ Error';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />
      {/* Header */}
      <ModernHeader
        title="Settings"
        subtitle="App preferences"
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.themeInfoCard}>
            <Text style={styles.themeInfoText}>Light mode is enabled permanently.</Text>
          </View>
        </View>

        {/* Backend Diagnostics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Status</Text>
          <View style={[styles.themeInfoCard, { borderColor: getStatusColor(), borderWidth: 2 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              {backendStatus === 'checking' && <ActivityIndicator size="small" color={getStatusColor()} />}
              <Text style={[styles.themeInfoText, { color: getStatusColor(), marginLeft: backendStatus === 'checking' ? 8 : 0 }]}>
                {getStatusText()}
              </Text>
            </View>
            <Text style={[styles.themeInfoText, { fontSize: 12, opacity: 0.7 }]}>
              Backend URL: {backendUrl}
            </Text>
            {backendStatus === 'unreachable' && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }}>
                <Text style={[styles.themeInfoText, { fontSize: 12, color: '#ef4444', fontWeight: '600' }]}>
                  ⚠️  Cannot Connect to Backend
                </Text>
                <Text style={[styles.themeInfoText, { fontSize: 11, marginTop: 8 }]}>
                  Please ensure:
                  {'\n'}1. Backend server is running (python server.py)
                  {'\n'}2. Correct IP/Port in .env file
                  {'\n'}3. Network connection is active
                  {'\n'}4. Firewall allows port 5000
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
