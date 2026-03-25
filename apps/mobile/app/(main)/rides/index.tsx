import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ridesService } from '../../../src/services/rides.service';
import type { Ride } from '@poolify/shared';
import { COLORS, SPACING, RADIUS } from '../../../src/constants/theme';

function RideCard({ ride, onCancel }: { ride: Ride; onCancel: (id: string) => void }) {
  const router = useRouter();
  const isRecurring = ride.scheduleType === 'recurring';
  const schedule = isRecurring
    ? `${ride.recurringSchedule?.daysOfWeek.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')} at ${ride.recurringSchedule?.departureTime}`
    : new Date(ride.oneOffSchedule?.departureDateTime ?? '').toLocaleString();

  const statusColor = ride.status === 'active' ? COLORS.success : ride.status === 'full' ? COLORS.warning : COLORS.danger;
  const statusBg = ride.status === 'active' ? COLORS.successBg : ride.status === 'full' ? COLORS.warningBg : COLORS.dangerBg;

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(main)/rides/${ride._id}`)} activeOpacity={0.8}>
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.timeBadge}>{isRecurring ? ride.recurringSchedule?.departureTime : 'One-time'}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.route} numberOfLines={1}>
            {ride.origin.address.split(',')[0]} → {ride.destination.address.split(',')[0]}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{ride.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.schedule}>{schedule}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.seats}>💺 {ride.availableSeats}/{ride.totalSeats} seats</Text>
          {ride.status === 'active' && (
            <TouchableOpacity onPress={() => onCancel(ride._id)}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RidesIndexScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    try { setRides(await ridesService.getMyRides()); }
    finally { setLoading(false); }
  }

  async function handleCancel(id: string) {
    Alert.alert('Cancel ride?', 'This will cancel the ride for all passengers.', [
      { text: 'No' },
      { text: 'Yes, cancel', style: 'destructive', onPress: async () => {
        await ridesService.deleteRide(id);
        setRides((prev) => prev.filter((r) => r._id !== id));
      }},
    ]);
  }

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>My Rides</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(main)/rides/post')}>
          <Ionicons name="add" size={20} color={COLORS.background} />
          <Text style={styles.addText}>Post Ride</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : rides.length === 0 ? (
        <View style={styles.empty}>
          <Image source={require('../../../assets/logo.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
          <Text style={styles.emptyText}>No rides posted yet</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/rides/post')}>
            <Text style={styles.emptyLink}>Post your first ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={rides} keyExtractor={(r) => r._id} renderItem={({ item }) => <RideCard ride={item} onCancel={handleCancel} />} contentContainerStyle={{ padding: SPACING.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50 },
  addText: { color: COLORS.background, fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder },
  cardImagePlaceholder: { height: 100, backgroundColor: COLORS.surfaceLight, justifyContent: 'flex-end', padding: SPACING.sm },
  timeBadge: { backgroundColor: 'rgba(0,0,0,0.5)', color: COLORS.text, fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', overflow: 'hidden' },
  cardBody: { padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  route: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  schedule: { fontSize: 13, color: COLORS.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seats: { fontSize: 13, color: COLORS.textSecondary },
  cancelLink: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  emptyLink: { color: COLORS.primary, fontWeight: '600' },
});
