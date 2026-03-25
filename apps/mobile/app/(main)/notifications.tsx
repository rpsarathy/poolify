import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useNotificationsStore } from '../../src/store/notifications.store';
import { notificationsService } from '../../src/services/notifications.service';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import type { Notification } from '@poolify/shared';

function NotifCard({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, !notif.read && styles.unread]}
      onPress={() => onRead(notif._id)}
      activeOpacity={0.8}
    >
      <Text style={styles.notifTitle}>{notif.title}</Text>
      <Text style={styles.notifBody}>{notif.body}</Text>
      <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, setNotifications, markRead, markAllRead, unreadCount } = useNotificationsStore();
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { notifications: data } = await notificationsService.getAll();
      setNotifications(data);
    } finally { setLoading(false); }
  }

  async function handleRead(id: string) {
    markRead(id);
    await notificationsService.markRead(id).catch(() => {});
  }

  async function handleMarkAllRead() {
    markAllRead();
    await notificationsService.markAllRead().catch(() => {});
  }

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all read ({unreadCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={({ item }) => <NotifCard notif={item} onRead={handleRead} />}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  markAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  notifBody: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  notifTime: { fontSize: 11, color: COLORS.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
