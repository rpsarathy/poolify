import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { usersService } from '../../src/services/users.service';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

const genders = ['male', 'female', 'other'] as const;

export default function ProfileScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();

  async function handleNext() {
    if (!phone || !gender) return;
    setLoading(true);
    try {
      const { user, accessToken } = await usersService.completeOnboarding({
        phone, gender, role: role ?? 'rider',
      });
      setUser(user);
      await useAuthStore.getState().setTokens(accessToken, '');
      if (role === 'driver' || role === 'both') {
        router.push('/(onboarding)/driver');
      } else {
        router.replace('/(main)/home');
      }
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tell us about yourself</Text>

      <Text style={styles.label}>Phone number (for WhatsApp)</Text>
      <TextInput
        style={styles.input}
        placeholder="+1 234 567 8900"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {genders.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, gender === g && styles.chipSelected]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.chipText, gender === g && styles.chipTextSelected]}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (!phone || !gender) && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!phone || !gender || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Text style={styles.buttonText}>
            {role === 'driver' || role === 'both' ? 'Next: Driver Details' : 'Start Pooling'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xl },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { color: COLORS.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: COLORS.primary },
  button: {
    marginTop: 'auto',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.3 },
  buttonText: { color: COLORS.background, fontSize: 16, fontWeight: '700' },
});
