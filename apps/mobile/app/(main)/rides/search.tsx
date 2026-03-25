import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, FlatList, Image,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { useNotificationsStore } from '../../../src/store/notifications.store';
import { ridesService } from '../../../src/services/rides.service';
import { searchAddresses, getCurrentLocationAsGeoResult, GeoResult } from '../../../src/services/geocode.service';
import type { RideSearchResult } from '@poolify/shared';
import { COLORS, SPACING, RADIUS } from '../../../src/constants/theme';

// ─── Address Input ───
function AddressInput({
  iconName, iconColor, label, placeholder, onSelect, selected,
}: {
  iconName: string; iconColor: string; label: string; placeholder: string;
  onSelect: (r: GeoResult) => void; selected: GeoResult | null;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSyncRef = useRef(false);

  useEffect(() => {
    if (selected && !didSyncRef.current) {
      didSyncRef.current = true;
      setQuery(selected.address.split(',').slice(0, 3).join(', ').trim());
    }
  }, [selected]);

  const onChange = useCallback((text: string) => {
    setQuery(text); setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (text.length >= 3) { setSearching(true); setSuggestions(await searchAddresses(text)); setSearching(false); }
      else setSuggestions([]);
    }, 500);
  }, []);

  function pick(r: GeoResult) {
    setQuery(r.address.split(',').slice(0, 3).join(', ').trim());
    setSuggestions([]); setOpen(false); onSelect(r);
  }

  return (
    <View style={s.addrGroup}>
      <Text style={s.addrLabel}>{label}</Text>
      <View style={s.addrRow}>
        <Ionicons name={iconName as any} size={18} color={iconColor} />
        <TextInput style={s.addrInput} value={query} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={COLORS.textMuted} onFocus={() => { if (suggestions.length) setOpen(true); }} />
        {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
        {selected && !searching && <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
      </View>
      {open && suggestions.length > 0 && (
        <View style={s.dropdown}>
          {suggestions.map((item, i) => (
            <TouchableOpacity key={`${item.lat}-${item.lng}-${i}`} style={s.dropItem} onPress={() => pick(item)} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
              <Text style={s.dropText} numberOfLines={2}>{item.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Result Card ───
function ResultCard({ result, onPress }: { result: RideSearchResult; onPress: () => void }) {
  const schedule = result.scheduleType === 'recurring'
    ? `${result.recurringSchedule?.departureTime} · ${result.recurringSchedule?.daysOfWeek.map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`
    : new Date(result.oneOffSchedule?.departureDateTime ?? '').toLocaleString();

  const score = Math.round(result.matchScore * 100);

  return (
    <TouchableOpacity style={s.resultCard} onPress={onPress} activeOpacity={0.8}>
      {/* Top image area */}
      <View style={s.resultImage}>
        <View style={s.resultTimeBadge}>
          <Text style={s.resultTimeText}>
            {result.scheduleType === 'recurring' ? result.recurringSchedule?.departureTime : new Date(result.oneOffSchedule?.departureDateTime ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={s.resultBody}>
        <View style={s.resultNameRow}>
          <Text style={s.resultName} numberOfLines={1}>
            {result.destination.address.split(',')[0]}
          </Text>
          <View style={[s.matchBadge, score >= 70 ? s.matchHigh : score >= 40 ? s.matchMed : s.matchLow]}>
            <Text style={s.matchText}>{score}% MATCH</Text>
          </View>
        </View>

        <View style={s.resultLocRow}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={s.resultLoc} numberOfLines={1}>{result.origin.address.split(',').slice(0, 2).join(',')}</Text>
        </View>

        <View style={s.resultMeta}>
          <View style={s.resultMetaItem}>
            <Ionicons name="car-outline" size={14} color={COLORS.textMuted} />
            <Text style={s.resultMetaText}>{result.availableSeats} seats</Text>
          </View>
          <View style={s.resultMetaItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
            <Text style={s.resultMetaText}>{result.genderPreference.replace('_', ' ')}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.detailsBtn} onPress={onPress}>
          <Text style={s.detailsBtnText}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───
export default function SearchScreen() {
  const router = useRouter();
  const user = useAuthStore((st) => st.user);
  const unread = useNotificationsStore((st) => st.unreadCount);

  const [origin, setOrigin] = useState<GeoResult | null>(null);
  const [destination, setDestination] = useState<GeoResult | null>(null);

  // Auto-fill pickup with current location
  useEffect(() => {
    if (!origin) {
      getCurrentLocationAsGeoResult().then((loc) => {
        if (loc) setOrigin(loc);
      });
    }
  }, []);

  // Date
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const shiftedFirst = (firstDay + 6) % 7;
  const calCells: (number | null)[] = Array(shiftedFirst).fill(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  // Time
  const [hours, setHours] = useState('08');
  const [minutes, setMinutes] = useState('30');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');

  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RideSearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  function incSeats() { if (seats < 6) setSeats(seats + 1); }
  function decSeats() { if (seats > 1) setSeats(seats - 1); }

  async function handleSearch() {
    if (!origin || !destination) return;
    let h = parseInt(hours) || 8;
    if (amPm === 'PM' && h < 12) h += 12;
    if (amPm === 'AM' && h === 12) h = 0;
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    const timeStr = `${String(h).padStart(2, '0')}:${String(parseInt(minutes) || 0).padStart(2, '0')}`;

    setLoading(true); setSearched(true);
    try {
      const data = await ridesService.search({
        originLng: origin.lng, originLat: origin.lat,
        destLng: destination.lng, destLat: destination.lat,
        date: dateStr, time: timeStr, seats,
      });
      setResults(data);
    } finally { setLoading(false); }
  }

  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {user?.photo ? <Image source={{ uri: user.photo }} style={s.avatar} /> : <View style={[s.avatar, s.avatarPh]}><Text style={s.avatarInit}>{user?.name?.[0]}</Text></View>}
            <Image source={require('../../../assets/logo.png')} style={s.headerLogo} resizeMode="contain" />
            <Text style={s.brand}>POOLIFY</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/notifications')}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            {unread > 0 && <View style={s.dot} />}
          </TouchableOpacity>
        </View>

        <Text style={s.heroTitle}>FIND A <Text style={s.heroAccent}>RIDE.</Text></Text>
        <Text style={s.heroSub}>Discover your perfect commute match.{'\n'}Browse rides that fit your schedule.</Text>

        {/* ── Route Selection ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="git-compare-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Route Selection</Text>
          </View>

          <AddressInput iconName="location" iconColor={COLORS.primary} label="PICKUP POINT" placeholder="Where are you starting?" onSelect={setOrigin} selected={origin} />
          {!origin && (
            <TouchableOpacity
              style={s.useLocationBtn}
              onPress={async () => {
                const loc = await getCurrentLocationAsGeoResult();
                if (loc) setOrigin(loc);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-circle" size={16} color={COLORS.primary} />
              <Text style={s.useLocationText}>Use current location</Text>
            </TouchableOpacity>
          )}

          <View style={s.swapRow}><View style={s.swapCircle}><Ionicons name="swap-vertical" size={20} color={COLORS.primary} /></View></View>

          <AddressInput iconName="flag" iconColor={COLORS.textSecondary} label="DESTINATION" placeholder="Where are you heading?" onSelect={setDestination} selected={destination} />
        </View>

        {/* ── Map Placeholder ── */}
        <View style={s.mapCard}>
          <Ionicons name="map" size={48} color={COLORS.textMuted} />
          <Text style={s.mapText}>Route preview</Text>
          <View style={s.mapBadge}><Text style={s.mapBadgeText}>LIVE MAP</Text></View>
        </View>

        {/* ── Departure Date ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Departure Date</Text>
          </View>
          <View style={s.calRow}>
            {dayLabels.map((l, i) => <View key={`lbl-${i}`} style={s.calCell}><Text style={s.calDayLabel}>{l}</Text></View>)}
          </View>
          <View style={s.calGrid}>
            {calCells.map((d, i) => {
              if (d === null) return <View key={`e-${i}`} style={s.calCell} />;
              const isPast = d < today.getDate();
              const isSel = d === selectedDate;
              return (
                <TouchableOpacity key={`d-${d}`} style={[s.calCell, isSel && s.calCellActive]} onPress={() => { if (!isPast) setSelectedDate(d); }} disabled={isPast}>
                  <Text style={[s.calDayNum, isPast && s.calPast, isSel && s.calDayActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Time ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Time</Text>
          </View>
          <View style={s.timeRow}>
            <View style={s.timeBox}><TextInput style={s.timeInput} value={hours} onChangeText={setHours} keyboardType="number-pad" maxLength={2} /></View>
            <Text style={s.timeColon}>:</Text>
            <View style={s.timeBox}><TextInput style={s.timeInput} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} /></View>
            <View style={s.amPmCol}>
              <TouchableOpacity style={[s.amPmBtn, amPm === 'AM' && s.amPmActive]} onPress={() => setAmPm('AM')}><Text style={[s.amPmText, amPm === 'AM' && s.amPmTextActive]}>AM</Text></TouchableOpacity>
              <TouchableOpacity style={[s.amPmBtn, amPm === 'PM' && s.amPmActive]} onPress={() => setAmPm('PM')}><Text style={[s.amPmText, amPm === 'PM' && s.amPmTextActive]}>PM</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Seats Needed ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Seats Needed</Text>
          </View>
          <Text style={s.logHint}>How many seats do you need?</Text>
          <View style={s.counterRow}>
            <TouchableOpacity style={s.counterBtn} onPress={decSeats}><Ionicons name="remove" size={20} color={COLORS.text} /></TouchableOpacity>
            <Text style={s.counterVal}>{seats}</Text>
            <TouchableOpacity style={[s.counterBtn, s.counterBtnAccent]} onPress={incSeats}><Ionicons name="add" size={20} color={COLORS.background} /></TouchableOpacity>
          </View>
        </View>

        {/* ── Search Button ── */}
        <TouchableOpacity
          style={[s.searchBtn, (!origin || !destination) && s.searchDisabled]}
          onPress={handleSearch}
          disabled={loading || !origin || !destination}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={COLORS.background} /> : (
            <View style={s.searchInner}>
              <Ionicons name="search" size={18} color={COLORS.background} />
              <Text style={s.searchText}>FIND RIDES</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Results ── */}
        {searched && !loading && (
          <View style={s.resultsSection}>
            <Text style={s.resultsHeader}>{results.length} ride{results.length !== 1 ? 's' : ''} found</Text>
            {results.length === 0 ? (
              <View style={s.noResults}>
                <Ionicons name="car-outline" size={40} color={COLORS.textMuted} />
                <Text style={s.noResultsText}>No rides match your route and time.{'\n'}Try adjusting your search.</Text>
              </View>
            ) : (
              results.map((r) => (
                <ResultCard key={r._id} result={r} onPress={() => router.push(`/(main)/rides/${r._id}`)} />
              ))
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 80 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: COLORS.primary },
  avatarPh: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  headerLogo: { width: 24, height: 24 },
  brand: { fontSize: 16, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  dot: { position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.danger },

  heroTitle: { fontSize: 30, fontWeight: '900', color: COLORS.text, lineHeight: 36 },
  heroAccent: { color: COLORS.primary, fontStyle: 'italic' },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, marginBottom: SPACING.lg, lineHeight: 20 },

  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // Address
  addrGroup: { marginBottom: SPACING.xs },
  addrLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2, marginBottom: 6 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.cardBorder },
  addrInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 10 },
  dropdown: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, marginTop: 4 },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropText: { fontSize: 13, color: COLORS.text, flex: 1 },

  useLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: 'rgba(0,229,204,0.12)', borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  useLocationText: { fontSize: 12, fontWeight: '600', color: '#00E5CC' },

  swapRow: { alignItems: 'center', marginVertical: 6 },
  swapCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Map
  mapCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.xl, height: 180, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.xs },
  mapBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,229,204,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  mapBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },

  // Calendar
  calRow: { flexDirection: 'row' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  calCellActive: { backgroundColor: COLORS.primary, borderRadius: 20 },
  calDayLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  calDayNum: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  calDayActive: { color: COLORS.background },
  calPast: { color: COLORS.textMuted, opacity: 0.4 },

  // Time
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  timeBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: 16, paddingVertical: 8 },
  timeInput: { fontSize: 28, fontWeight: '700', color: COLORS.text, textAlign: 'center', width: 44 },
  timeColon: { fontSize: 28, fontWeight: '700', color: COLORS.textMuted },
  amPmCol: { marginLeft: SPACING.sm, gap: 4 },
  amPmBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder },
  amPmActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  amPmText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  amPmTextActive: { color: COLORS.primary },

  // Seats
  logHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, alignSelf: 'flex-end' },
  counterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  counterBtnAccent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  counterVal: { fontSize: 20, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },

  // Search button
  searchBtn: { marginTop: SPACING.md, paddingVertical: 18, borderRadius: 50, alignItems: 'center', backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  searchDisabled: { opacity: 0.3 },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  searchText: { fontSize: 16, fontWeight: '800', color: COLORS.background, letterSpacing: 2 },

  // Results
  resultsSection: { marginTop: SPACING.xl },
  resultsHeader: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },

  noResults: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  noResultsText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  resultCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: SPACING.md },
  resultImage: { height: 120, backgroundColor: COLORS.surfaceLight, justifyContent: 'flex-end', padding: SPACING.sm },
  resultTimeBadge: { backgroundColor: 'rgba(0,0,0,0.6)', alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  resultTimeText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  resultBody: { padding: SPACING.md },
  resultNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  resultName: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1 },
  matchBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  matchHigh: { backgroundColor: COLORS.successBg },
  matchMed: { backgroundColor: COLORS.warningBg },
  matchLow: { backgroundColor: COLORS.dangerBg },
  matchText: { fontSize: 10, fontWeight: '700', color: COLORS.success, letterSpacing: 0.5 },
  resultLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  resultLoc: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  resultMeta: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  resultMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultMetaText: { fontSize: 12, color: COLORS.textMuted },
  detailsBtn: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  detailsBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});
