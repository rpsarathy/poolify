import {
  View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { api } from '../../src/services/api';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    Alert.alert('Sign out?', 'You will be signed out of Poolify.', [
      { text: 'Cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await api.post('/auth/logout').catch(() => {});
          logout();
        },
      },
    ]);
  }

  const router = useRouter();

  if (!user) {
    router.replace('/(auth)/login');
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.pageTitle}>Profile</Text>

      <View style={styles.header}>
        {user.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{user.name?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role ?? 'rider'}</Text>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Info</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.rowLabel}>Phone</Text>
          </View>
          <Text style={styles.rowValue}>{user.phone || 'Not set'}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.rowLabel}>Gender</Text>
          </View>
          <Text style={styles.rowValue}>{user.gender || 'Not set'}</Text>
        </View>
      </View>

      {/* Driver Profile */}
      {user.driverProfile && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Profile</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="car-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.rowLabel}>Seats</Text>
            </View>
            <Text style={styles.rowValue}>{user.driverProfile.availableSeats}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="people-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.rowLabel}>Preference</Text>
            </View>
            <Text style={styles.rowValue}>{user.driverProfile.genderPreference.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="business-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.rowLabel}>Office</Text>
            </View>
            <Text style={styles.rowValue} numberOfLines={1}>
              {user.driverProfile.officeLocation?.address?.split(',').slice(0, 2).join(',') || 'Not set'}
            </Text>
          </View>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Poolify v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
  pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: SPACING.md, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: COLORS.primary, fontSize: 32, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: { marginTop: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  roleText: { color: COLORS.primary, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, padding: SPACING.md, paddingBottom: SPACING.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rowLabel: { fontSize: 14, color: COLORS.textSecondary },
  rowValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: COLORS.dangerBg,
    borderRadius: 50,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  logoutText: { color: COLORS.danger, fontWeight: '600', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xl },
});
