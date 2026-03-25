import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { usersService } from '../../src/services/users.service';
import { useAuthStore } from '../../src/store/auth.store';
import { searchAddresses, GeoResult } from '../../src/services/geocode.service';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

const preferences = [
  { value: 'any', label: 'Anyone' },
  { value: 'female_only', label: 'Women only' },
  { value: 'male_only', label: 'Men only' },
] as const;

function AddressInput({ onSelect }: { onSelect: (result: GeoResult) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.length >= 3) {
        setSuggestions(await searchAddresses(text));
      } else {
        setSuggestions([]);
      }
    }, 400);
  }, []);

  function handleSelect(result: GeoResult) {
    setQuery(result.address.split(',').slice(0, 3).join(','));
    setSuggestions([]);
    onSelect(result);
  }

  return (
    <View>
      <TextInput style={styles.input} value={query} onChangeText={handleChange} placeholder="Search your office address" />
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={`${s.lat}-${i}`} style={styles.suggestionItem} onPress={() => handleSelect(s)}>
              <Text style={styles.suggestionText} numberOfLines={2}>{s.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function DriverScreen() {
  const [seats, setSeats] = useState(3);
  const [genderPref, setGenderPref] = useState<string>('any');
  const [office, setOffice] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();

  async function handleFinish() {
    if (!office) {
      Alert.alert('Missing office', 'Please select your office address from the suggestions.');
      return;
    }

    setLoading(true);
    try {
      const user = await usersService.updateDriverProfile({
        availableSeats: seats,
        genderPreference: genderPref,
        officeLocation: {
          address: office.address,
          coordinates: {
            type: 'Point',
            coordinates: [office.lng, office.lat],
          },
        },
      });
      setUser(user);
      router.replace('/(main)/home');
    } catch {
      Alert.alert('Error', 'Failed to save driver details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Driver details</Text>

      <Text style={styles.label}>Available seats</Text>
      <View style={styles.seatsRow}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.seatChip, seats === n && styles.seatChipSelected]}
            onPress={() => setSeats(n)}
          >
            <Text style={[styles.seatText, seats === n && styles.seatTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Office address</Text>
      <AddressInput onSelect={setOffice} />
      {office && <Text style={styles.selected}>✓ {office.address.split(',').slice(0, 2).join(',')}</Text>}

      <Text style={styles.label}>Rider gender preference</Text>
      <View style={styles.chips}>
        {preferences.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.chip, genderPref === p.value && styles.chipSelected]}
            onPress={() => setGenderPref(p.value)}
          >
            <Text style={[styles.chipText, genderPref === p.value && styles.chipTextSelected]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, !office && styles.buttonDisabled]} onPress={handleFinish} disabled={loading || !office}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Pooling</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: SPACING.lg },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xl },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 16, color: COLORS.text },
  suggestionsBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginTop: 2, maxHeight: 180 },
  suggestionItem: { padding: SPACING.sm + 2, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggestionText: { fontSize: 13, color: COLORS.text },
  selected: { fontSize: 12, color: COLORS.secondary, fontWeight: '500', marginTop: 4 },
  seatsRow: { flexDirection: 'row', gap: SPACING.sm },
  seatChip: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  seatChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  seatText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  seatTextSelected: { color: COLORS.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { color: COLORS.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: COLORS.primary },
  button: { marginTop: 'auto', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 50, alignItems: 'center', marginTop: SPACING.xl },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
