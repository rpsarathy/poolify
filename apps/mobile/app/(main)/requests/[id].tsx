import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestsService } from '../../../src/services/requests.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { openWhatsApp } from '../../../src/utils/whatsapp';
import type { RideRequest } from '@poolify/shared';
import { COLORS, SPACING, RADIUS } from '../../../src/constants/theme';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: COLORS.warningBg, color: COLORS.warning },
  approved: { bg: COLORS.successBg, color: COLORS.success },
  rejected: { bg: COLORS.dangerBg, color: COLORS.danger },
  cancelled: { bg: 'rgba(90,94,114,0.15)', color: COLORS.textMuted },
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const user = useAuthStore((s) => s.user);

  async function load() { try { setRequest(await requestsService.getRequest(id)); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [id]);

  async function handleApprove() { setActing(true); try { setRequest(await requestsService.approve(id)); } catch { Alert.alert('Error', 'Could not approve.'); } finally { setActing(false); } }
  async function handleReject() { setActing(true); try { setRequest(await requestsService.reject(id)); } catch { Alert.alert('Error', 'Could not reject.'); } finally { setActing(false); } }
  async function handleCancel() { setActing(true); try { setRequest(await requestsService.cancel(id)); } catch { Alert.alert('Error', 'Could not cancel.'); } finally { setActing(false); } }

  async function handleWhatsApp(phone: string, name: string) {
    const opened = await openWhatsApp(phone, `Hi ${name}, I'm your carpool match from Poolify! 🚗`);
    if (!opened) Alert.alert('WhatsApp not installed');
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;
  if (!request) return <Text style={{ padding: SPACING.lg, color: COLORS.textSecondary }}>Not found.</Text>;

  const isDriver = request.driverId === user?._id;
  const isRider = request.riderId === user?._id;
  const contactPhone = isDriver ? request.contactInfo?.riderPhone : request.contactInfo?.driverPhone;
  const contactName = isDriver ? 'the rider' : 'your driver';
  const s = STATUS_STYLES[request.status] || STATUS_STYLES.cancelled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Request Details</Text>

      <View style={styles.section}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{request.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ROUTE</Text>
        <View style={styles.routeRow}><Ionicons name="radio-button-on" size={14} color={COLORS.success} /><Text style={styles.info}>{request.pickupLocation?.address}</Text></View>
        <View style={styles.routeRow}><Ionicons name="radio-button-on" size={14} color={COLORS.danger} /><Text style={styles.info}>{request.dropoffLocation?.address}</Text></View>
      </View>

      {request.message && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MESSAGE</Text>
          <Text style={styles.info}>{request.message}</Text>
        </View>
      )}

      {request.status === 'approved' && contactPhone && (
        <TouchableOpacity style={styles.whatsappButton} onPress={() => handleWhatsApp(contactPhone, contactName)} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.whatsappText}>Chat on WhatsApp</Text>
        </TouchableOpacity>
      )}

      {isDriver && request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={handleApprove} disabled={acting} activeOpacity={0.8}>
            {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Approve</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={handleReject} disabled={acting} activeOpacity={0.8}>
            <Text style={styles.actionText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {isRider && (request.status === 'pending' || request.status === 'approved') && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={acting} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: SPACING.sm },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.xs },
  info: { fontSize: 14, color: COLORS.text, flex: 1 },
  whatsappButton: { backgroundColor: COLORS.whatsapp, padding: SPACING.md, borderRadius: 50, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  whatsappText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  actions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  actionButton: { flex: 1, padding: SPACING.md, borderRadius: 50, alignItems: 'center' },
  approveButton: { backgroundColor: COLORS.success },
  rejectButton: { backgroundColor: COLORS.danger },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelButton: { borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: COLORS.dangerBg, borderRadius: 50, padding: SPACING.md, alignItems: 'center' },
  cancelText: { color: COLORS.danger, fontWeight: '600', fontSize: 15 },
});
