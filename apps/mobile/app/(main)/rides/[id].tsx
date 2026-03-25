import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ridesService } from '../../../src/services/rides.service';
import { requestsService } from '../../../src/services/requests.service';
import { useAuthStore } from '../../../src/store/auth.store';
import type { Ride } from '@poolify/shared';
import { COLORS, SPACING, RADIUS } from '../../../src/constants/theme';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => { ridesService.getRide(id).then(setRide).finally(() => setLoading(false)); }, [id]);

  async function handleRequest() {
    if (!ride) return;
    setRequesting(true);
    try {
      await requestsService.create({
        rideId: ride._id,
        pickupLocation: { address: ride.origin.address, coordinates: ride.origin.coordinates },
        dropoffLocation: { address: ride.destination.address, coordinates: ride.destination.coordinates },
        requestedDates: [new Date().toISOString()],
        message: 'Hi, I would like to join your ride!',
      });
      Alert.alert('Request sent!', 'The driver will be notified.');
      router.push('/(main)/requests');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not send request.');
    } finally { setRequesting(false); }
  }

  if (loading) {
    return (
      <View style={[s.page, s.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[s.page, s.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={s.emptyText}>Ride not found</Text>
      </View>
    );
  }

  const isOwner = ride.driverId === user?._id;
  const isRecurring = ride.scheduleType === 'recurring';

  // Parse route parts
  const originParts = ride.origin.address.split(',');
  const originName = originParts[0]?.trim() || 'Pickup';
  const originDetail = originParts.slice(1, 3).join(',').trim();
  const destParts = ride.destination.address.split(',');
  const destName = destParts[0]?.trim() || 'Destination';
  const destDetail = destParts.slice(1, 3).join(',').trim();

  // Schedule text
  const scheduleDays = isRecurring
    ? ride.recurringSchedule?.daysOfWeek.map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join('-') ?? ''
    : new Date(ride.oneOffSchedule?.departureDateTime ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const scheduleTime = isRecurring
    ? ride.recurringSchedule?.departureTime ?? ''
    : new Date(ride.oneOffSchedule?.departureDateTime ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── LIVE ROUTE badge ── */}
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>LIVE ROUTE</Text>
        </View>

        {/* ── Route Card ── */}
        <View style={s.routeCard}>
          {/* Pickup */}
          <View style={s.routePoint}>
            <View style={s.routeIconCol}>
              <Ionicons name="location" size={22} color={COLORS.success} />
              <View style={s.routeLine} />
            </View>
            <View style={s.routeInfo}>
              <Text style={s.routeLabel}>PICKUP</Text>
              <Text style={s.routeName}>{originName}</Text>
              <Text style={s.routeDetail}>{originDetail}</Text>
            </View>
          </View>

          {/* Drop-off */}
          <View style={s.routePoint}>
            <View style={s.routeIconCol}>
              <View style={s.routeCircleRed} />
            </View>
            <View style={s.routeInfo}>
              <Text style={s.routeLabelDrop}>DROP-OFF</Text>
              <Text style={s.routeNameLarge}>{destName}</Text>
              <Text style={s.routeDetail}>{destDetail}</Text>
            </View>
          </View>
        </View>

        {/* ── Schedule & Availability ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            <Text style={s.statLabel}>SCHEDULE</Text>
            <Text style={s.statValue}>{scheduleDays}</Text>
            <Text style={s.statAccent}>{scheduleTime}</Text>
          </View>
          <View style={s.statCard}>
            <View style={s.seatIcons}>
              {Array.from({ length: ride.totalSeats }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="person"
                  size={18}
                  color={i < ride.availableSeats ? COLORS.success : COLORS.textMuted}
                />
              ))}
            </View>
            <Text style={s.statLabel}>AVAILABILITY</Text>
            <Text style={s.statValue}>{ride.availableSeats} of {ride.totalSeats} seats</Text>
            <Text style={ride.availableSeats > 0 ? s.statAccentGreen : s.statAccentRed}>
              {ride.availableSeats > 0 ? 'Open' : 'Full'}
            </Text>
          </View>
        </View>

        {/* ── Driver Card ── */}
        <View style={s.driverCard}>
          <View style={s.driverLeft}>
            <View style={s.driverAvatarWrap}>
              <View style={[s.driverAvatar, s.driverAvatarPh]}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <View style={s.driverRating}>
                <Text style={s.driverRatingText}>5.0</Text>
                <Ionicons name="star" size={8} color="#FBBF24" />
              </View>
            </View>
            <View>
              <Text style={s.driverName}>{isOwner ? user?.name ?? 'You' : 'Driver'}</Text>
              <Text style={s.driverBadgeText}>
                {isOwner ? 'Your Ride' : 'Verified Driver'}
              </Text>
            </View>
          </View>
          {!isOwner && (
            <TouchableOpacity>
              <Ionicons name="chatbubble" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Ride Info Tags ── */}
        <View style={s.tagsRow}>
          <View style={s.tag}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Text style={s.tagText}>{ride.genderPreference === 'any' ? 'Anyone' : ride.genderPreference.replace('_', ' ')}</Text>
          </View>
          <View style={s.tag}>
            <Ionicons name="repeat" size={14} color={COLORS.textSecondary} />
            <Text style={s.tagText}>{isRecurring ? 'Recurring' : 'One-time'}</Text>
          </View>
          <View style={[s.tag, { backgroundColor: ride.status === 'active' ? COLORS.successBg : COLORS.dangerBg }]}>
            <View style={[s.statusDot, { backgroundColor: ride.status === 'active' ? COLORS.success : COLORS.danger }]} />
            <Text style={[s.tagText, { color: ride.status === 'active' ? COLORS.success : COLORS.danger }]}>
              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        {!isOwner && ride.status === 'active' && ride.availableSeats > 0 && (
          <TouchableOpacity style={s.requestBtn} onPress={handleRequest} disabled={requesting} activeOpacity={0.85}>
            {requesting ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <View style={s.requestInner}>
                <Ionicons name="hand-left" size={18} color={COLORS.background} />
                <Text style={s.requestText}>REQUEST TO JOIN</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {isOwner && (
          <View style={s.ownerActions}>
            <TouchableOpacity
              style={s.ownerBtn}
              onPress={() => router.push('/(main)/requests')}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={18} color={COLORS.primary} />
              <Text style={s.ownerBtnText}>View Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.ownerBtn, s.ownerBtnDanger]}
              onPress={async () => {
                await ridesService.deleteRide(ride._id);
                router.replace('/(main)/rides');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.danger} />
              <Text style={[s.ownerBtnText, { color: COLORS.danger }]}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 60 },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.sm },

  // Live badge
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, marginBottom: SPACING.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  liveText: { fontSize: 11, fontWeight: '700', color: COLORS.success, letterSpacing: 1.5 },

  // Route card
  routeCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.md },
  routePoint: { flexDirection: 'row', gap: SPACING.md },
  routeIconCol: { alignItems: 'center', width: 24 },
  routeLine: { width: 2, height: 40, backgroundColor: COLORS.cardBorder, marginVertical: 4 },
  routeCircleRed: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#F87171', marginTop: 2 },
  routeInfo: { flex: 1, paddingBottom: SPACING.sm },
  routeLabel: { fontSize: 10, fontWeight: '700', color: '#86EFAC', letterSpacing: 2, marginBottom: 2 },
  routeLabelDrop: { fontSize: 10, fontWeight: '700', color: '#FCA5A5', letterSpacing: 2, marginBottom: 2 },
  routeName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  routeNameLarge: { fontSize: 22, fontWeight: '700', color: COLORS.text, fontStyle: 'italic' },
  routeDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statAccent: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  statAccentGreen: { fontSize: 16, fontWeight: '700', color: COLORS.success },
  statAccentRed: { fontSize: 16, fontWeight: '700', color: COLORS.danger },
  seatIcons: { flexDirection: 'row', gap: 2 },

  // Driver card
  driverCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  driverLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  driverAvatarWrap: { position: 'relative' },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.primary },
  driverAvatarPh: { backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  driverRating: { position: 'absolute', bottom: -4, left: -4, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  driverRatingText: { fontSize: 10, fontWeight: '700', color: COLORS.background },
  driverName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  driverBadgeText: { fontSize: 12, color: COLORS.textSecondary },

  // Tags
  tagsRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.xl },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.cardBorder },
  tagText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // Request button
  requestBtn: { paddingVertical: 18, borderRadius: 50, alignItems: 'center', backgroundColor: COLORS.primary, marginBottom: SPACING.md, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  requestInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  requestText: { fontSize: 16, fontWeight: '800', color: COLORS.background, letterSpacing: 2 },

  // Owner actions
  ownerActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  ownerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  ownerBtnDanger: { backgroundColor: COLORS.dangerBg, borderColor: 'rgba(239,68,68,0.3)' },
  ownerBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Back
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md },
  backText: { fontSize: 14, color: COLORS.textSecondary },
});
