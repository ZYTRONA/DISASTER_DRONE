import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../themes/colors';
import { checkBackendHealth, getApi } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const url = getApi().defaults.baseURL || 'http://localhost:5000';
        setBackendUrl(url);
        const healthy = await checkBackendHealth();
        setBackendStatus(healthy ? 'healthy' : 'unreachable');
      } catch {
        setBackendStatus('error');
        setBackendUrl(getApi().defaults.baseURL || 'http://localhost:5000');
      }
    };
    check();
  }, []);

  const statusConfig = {
    healthy:     { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: 'checkmark-circle', label: 'Connected' },
    unreachable: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: 'close-circle',     label: 'Not Reachable' },
    checking:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: 'time',             label: 'Checking...' },
    error:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: 'warning',          label: 'Error' },
  };
  const sc = statusConfig[backendStatus] || statusConfig.error;

  const infoRows = [
    { icon: 'server-outline',   label: 'Backend URL',  value: backendUrl || '—' },
    { icon: 'phone-portrait-outline', label: 'App Version', value: '1.0.0' },
    { icon: 'shield-checkmark-outline', label: 'Mode', value: 'Light (Fixed)' },
  ];

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* App Info Card */}
        <View style={s.appCard}>
          <View style={s.appIconWrap}>
            <Text style={s.appIconText}>Z</Text>
          </View>
          <Text style={s.appName}>zydro</Text>
          <Text style={s.appSub}>Disaster Relief Coordination</Text>
        </View>

        {/* Connection Status */}
        <Text style={s.sectionLabel}>CONNECTION</Text>
        <View style={[s.statusCard, { borderColor: sc.color }]}>
          <View style={[s.statusIconWrap, { backgroundColor: sc.bg }]}>
            {backendStatus === 'checking'
              ? <ActivityIndicator size="small" color={sc.color} />
              : <Ionicons name={sc.icon} size={22} color={sc.color} />}
          </View>
          <View style={s.statusInfo}>
            <Text style={[s.statusLabel, { color: sc.color }]}>{sc.label}</Text>
            <Text style={s.statusUrl} numberOfLines={1}>{backendUrl || 'Initializing...'}</Text>
          </View>
          <View style={[s.statusDot, { backgroundColor: sc.color }]} />
        </View>

        {backendStatus === 'unreachable' && (
          <View style={s.warnBox}>
            <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            <Text style={s.warnText}>
              Make sure the backend is running and the IP in .env is correct.
            </Text>
          </View>
        )}

        {/* App Info */}
        <Text style={s.sectionLabel}>APP INFO</Text>
        <View style={s.infoCard}>
          {infoRows.map((row, i) => (
            <View key={i} style={[s.infoRow, i < infoRows.length - 1 && s.infoRowBorder]}>
              <View style={s.infoIconWrap}>
                <Ionicons name={row.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Help */}
        <Text style={s.sectionLabel}>HELP</Text>
        <View style={s.infoCard}>
          {[
            { icon: 'call-outline',    label: 'Emergency',    value: '112' },
            { icon: 'radio-outline',   label: 'NDRF Helpline', value: '1078' },
            { icon: 'medkit-outline',  label: 'Ambulance',    value: '108' },
          ].map((row, i, arr) => (
            <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
              <View style={s.infoIconWrap}>
                <Ionicons name={row.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={[s.infoValue, { color: Colors.primary, fontWeight: '700' }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f7fa' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f7fa', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#212121' },
  scroll:       { paddingHorizontal: 16, paddingTop: 20 },

  appCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  appIconWrap:  { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appIconText:  { color: '#fff', fontSize: 32, fontWeight: '900' },
  appName:      { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
  appSub:       { fontSize: 13, color: '#999', marginTop: 4 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },

  statusCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 12 },
  statusIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusInfo:   { flex: 1 },
  statusLabel:  { fontSize: 15, fontWeight: '700' },
  statusUrl:    { fontSize: 11, color: '#999', marginTop: 2 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },

  warnBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  warnText:     { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  infoCard:     { backgroundColor: '#fff', borderRadius: 14, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  infoRowBorder:{ borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,102,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  infoLabel:    { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  infoValue:    { fontSize: 13, color: '#666', maxWidth: 160 },
});
