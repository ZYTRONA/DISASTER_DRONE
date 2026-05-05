/**
 * OrderHistoryScreen - View all orders and track them
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { TRACKING_STAGES } from '../utils/constants';

/**
 * @param {Object} props - Navigation props
 * @returns {React.ReactElement}
 */
export default function OrderHistoryScreen({ navigation }) {
  const {
    recentRequests,
    refId: activeRefId,
    trackStage,
  } = useAppContext();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(recentRequests || []);
  }, [recentRequests]);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Unknown date';
    }
  };

  const getStatusColor = (order, index) => {
    if (order.refId === activeRefId) return '#2563eb';
    if (index === 0) return '#10b981';
    return '#64748b';
  };

  const getStatusText = (order, index) => {
    if (order.refId === activeRefId) {
      return TRACKING_STAGES[trackStage - 1]?.title || 'In Progress';
    }

    if (index === 0) return 'Most Recent';
    return 'Completed';
  };

  const handleTrackOrder = (order) => {
    navigation.navigate('OrderDetail', { order });
  };

  const renderOrderCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleTrackOrder(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.refId}>Order #{item.refId}</Text>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item, index) },
          ]}
        >
          <Text style={styles.statusText} numberOfLines={1}>
            {getStatusText(item, index)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="cube-outline" size={18} color="#2563eb" />
          <Text style={styles.category}>{item.resource}</Text>
        </View>
        {item.note && (
          <View style={styles.infoRow}>
            <Ionicons name="list-outline" size={18} color="#7c3aed" />
            <Text style={styles.note} numberOfLines={2}>
              {item.note}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.trackAction}>
          <Text style={styles.trackLink}>Track Order</Text>
          <Ionicons name="chevron-forward" size={20} color="#2563eb" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#0066ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item, index) => `${item.refId}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && styles.listContentEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          orders.length > 0 ? (
            <Text style={styles.sectionTitle}>
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>
              Your orders will appear here once you place them
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('Category')}
            >
              <Text style={styles.startButtonText}>Place Your First Order</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  listContentEmpty: {
    justifyContent: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
  },
  startButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  orderCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardHeaderInfo: {
    flex: 1,
    paddingRight: 12,
  },
  refId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    maxWidth: '45%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  note: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  trackAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  trackLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  separator: {
    height: 8,
  },
});
