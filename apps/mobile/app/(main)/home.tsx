import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { useNotificationsStore } from '../../src/store/notifications.store';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const router = useRouter();
  const greeting = getGreeting();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.headerTitle}>POOLIFY</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(main)/notifications')} style={styles.bellContainer}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
        <Text style={styles.greetingName}>{greeting}</Text>
        <Text style={styles.greetingNameAccent}>{user?.name?.split(' ')[0] ?? 'there'}</Text>
      </View>

      {/* Find a Ride Card */}
      <TouchableOpacity
        style={styles.findCard}
        onPress={() => router.push('/(main)/rides/search')}
        activeOpacity={0.85}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="navigate" size={28} color={COLORS.text} />
          </View>
          <Text style={styles.cardTitle}>Find a Ride</Text>
          <Text style={styles.cardDesc}>Browse available pools near you</Text>
        </View>
        <View style={styles.cardDecor}>
          <Ionicons name="search" size={80} color="rgba(255,255,255,0.08)" />
        </View>
      </TouchableOpacity>

      {/* Offer a Ride Card */}
      {(user?.role === 'driver' || user?.role === 'both') && (
        <TouchableOpacity
          style={styles.offerCard}
          onPress={() => router.push('/(main)/rides/post')}
          activeOpacity={0.85}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="car" size={28} color={COLORS.text} />
            </View>
            <Text style={styles.cardTitle}>Offer a Ride</Text>
            <Text style={styles.cardDesc}>Share your journey and earn</Text>
          </View>
          <View style={styles.cardDecor}>
            <Ionicons name="add-circle" size={80} color="rgba(255,255,255,0.08)" />
          </View>
        </TouchableOpacity>
      )}

      {/* Shortcuts */}
      <View style={styles.shortcutsSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>Shortcuts</Text>
        </View>
        <View style={styles.shortcuts}>
          <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/(main)/requests')}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.shortcutLabel}>MY{'\n'}REQUESTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/(main)/rides')}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.shortcutLabel}>MY{'\n'}RIDES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/(main)/notifications')}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
              {unreadCount > 0 && <View style={styles.shortcutDot} />}
            </View>
            <Text style={styles.shortcutLabel}>ALERTS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Rides section */}
      <View style={styles.upcomingSection}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.upcomingTitle}>Upcoming Rides</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/rides')}>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Placeholder ride cards */}
        <View style={styles.rideCard}>
          <View style={styles.rideImagePlaceholder}>
            <Text style={styles.rideTimeBadge}>6:45 PM</Text>
          </View>
          <View style={styles.rideInfo}>
            <View style={styles.rideNameRow}>
              <Text style={styles.rideName}>Your Next Ride</Text>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>ACTIVE</Text>
              </View>
            </View>
            <View style={styles.rideLocationRow}>
              <Ionicons name="location" size={14} color={COLORS.textSecondary} />
              <Text style={styles.rideLocation}>No rides posted yet</Text>
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push('/(main)/rides')}
            >
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: { backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  bellContainer: { position: 'relative' },
  bellDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },

  // Greeting
  greeting: { marginBottom: SPACING.lg },
  welcomeLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary, letterSpacing: 2, marginBottom: SPACING.xs },
  greetingName: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  greetingNameAccent: { fontSize: 32, fontWeight: '800', color: COLORS.primary },

  // Action Cards
  findCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 204, 0.15)',
    // Gradient simulation via background
    backgroundGradient: 'linear-gradient(135deg, #1E2235 0%, #0D2A2A 100%)',
  },
  offerCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  cardContent: { zIndex: 1 },
  cardIconContainer: { marginBottom: SPACING.md },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary },
  cardDecor: { position: 'absolute', right: -10, bottom: -10, opacity: 0.5 },

  // Shortcuts
  shortcutsSection: { marginBottom: SPACING.xl },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionLine: { width: 24, height: 2, backgroundColor: COLORS.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  shortcuts: { flexDirection: 'row', gap: SPACING.md },
  shortcut: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  shortcutIcon: { position: 'relative' },
  shortcutDot: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  shortcutLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600', letterSpacing: 0.5 },

  // Upcoming Rides
  upcomingSection: { marginBottom: SPACING.lg },
  upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  upcomingTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  viewAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary, letterSpacing: 0.5 },

  rideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rideImagePlaceholder: {
    height: 140,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
    // Dark city skyline vibe
    backgroundImage: 'linear-gradient(180deg, #1A2040 0%, #0F1225 100%)',
  },
  rideTimeBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  rideInfo: { padding: SPACING.md },
  rideNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  rideName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  confirmedBadge: { backgroundColor: COLORS.successBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  confirmedText: { fontSize: 10, fontWeight: '700', color: COLORS.success, letterSpacing: 0.5 },
  rideLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  rideLocation: { fontSize: 13, color: COLORS.textSecondary },
  detailsButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  detailsButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});
