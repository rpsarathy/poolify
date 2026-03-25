import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { requestsService } from '../../../src/services/requests.service';
import type { RideRequest } from '@poolify/shared';
import { COLORS, SPACING, RADIUS } from '../../../src/constants/theme';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: COLORS.warningBg, color: COLORS.warning },
  approved: { bg: COLORS.successBg, color: COLORS.success },
  rejected: { bg: COLORS.dangerBg, color: COLORS.danger },
  cancelled: { bg: 'rgba(90,94,114,0.15)', color: COLORS.textMuted },
};

function RequestCard({ req, onPress }: { req: RideRequest; onPress: () => void }) {
  const s = STATUS_STYLES[req.status] || STATUS_STYLES.cancelled;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{req.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.date}>{new Date(req.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.route}>
        {(req.pickupLocation?.address ?? '').split(',')[0]} → {(req.dropoffLocation?.address ?? '').split(',')[0]}
      </Text>
    </TouchableOpacity>
  );
}

export default function RequestsScreen() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('outgoing');
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      setRequests(tab === 'incoming' ? await requestsService.getIncoming() : await requestsService.getOutgoing());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab]);

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Requests</Text>
      <View style={styles.tabs}>
        {(['outgoing', 'incoming'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === 'outgoing' ? 'My Requests' : 'Incoming'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No {tab} requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r._id}
          renderItem={({ item }) => <RequestCard req={item} onPress={() => router.push(`/(main)/requests/${item._id}`)} />}
          contentContainerStyle={{ padding: SPACING.md }}
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, padding: SPACING.lg, paddingBottom: SPACING.sm },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.sm },
  tab: { flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center', borderRadius: RADIUS.sm },
  activeTab: { backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  activeTabText: { color: COLORS.primary, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  date: { fontSize: 12, color: COLORS.textMuted },
  route: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
