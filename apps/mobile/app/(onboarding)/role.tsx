import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

const roles = [
  { value: 'rider', label: 'Rider', emoji: '🙋', desc: 'Find rides to the office' },
  { value: 'driver', label: 'Driver', emoji: '🚗', desc: 'Offer rides and earn' },
  { value: 'both', label: 'Both', emoji: '🔄', desc: 'Switch between roles' },
] as const;

export default function RoleScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: '/(onboarding)/profile', params: { role: selected } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How will you use Poolify?</Text>
      <Text style={styles.subtitle}>You can change this later in your profile.</Text>

      <View style={styles.options}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.option, selected === r.value && styles.optionSelected]}
            onPress={() => setSelected(r.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{r.label}</Text>
              <Text style={styles.optionDesc}>{r.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!selected}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  options: { gap: SPACING.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
    gap: SPACING.md,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  emoji: { fontSize: 28 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  optionDesc: { fontSize: 13, color: COLORS.textSecondary },
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
