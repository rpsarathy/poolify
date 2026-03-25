import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth.store';
import { useNotificationsStore } from '../../../src/store/notifications.store';
import { ridesService } from '../../../src/services/rides.service';
import { searchAddresses, getCurrentLocationAsGeoResult, GeoResult } from '../../../src/services/geocode.service';
import { COLORS, SPACING, RADIUS } from '../../../src/constants/theme';

// ─── Address Input with Dropdown ───
function AddressInput({
  iconName,
  iconColor,
  label,
  placeholder,
  onSelect,
  selected,
}: {
  iconName: string;
  iconColor: string;
  label: string;
  placeholder: string;
  onSelect: (result: GeoResult) => void;
  selected: GeoResult | null;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSyncRef = useRef(false);

  // Sync input text when selected value changes externally (e.g. auto-fill)
  useEffect(() => {
    if (selected && !didSyncRef.current) {
      didSyncRef.current = true;
      setQuery(selected.address.split(',').slice(0, 3).join(', ').trim());
    }
  }, [selected]);

  const onChange = useCallback((text: string) => {
    setQuery(text);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (text.length >= 3) {
        setSearching(true);
        setSuggestions(await searchAddresses(text));
        setSearching(false);
      } else { setSuggestions([]); }
    }, 500);
  }, []);

  function pick(r: GeoResult) {
    setQuery(r.address.split(',').slice(0, 3).join(', ').trim());
    setSuggestions([]);
    setOpen(false);
    onSelect(r);
  }

  return (
    <View style={s.addrGroup}>
      <Text style={s.addrLabel}>{label}</Text>
      <View style={s.addrRow}>
        <Ionicons name={iconName as any} size={18} color={iconColor} style={{ marginTop: 2 }} />
        <TextInput
          style={s.addrInput}
          value={query}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
        />
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

// ─── Main Screen ───
export default function PostRideScreen() {
  const router = useRouter();
  const user = useAuthStore((st) => st.user);
  const unread = useNotificationsStore((st) => st.unreadCount);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState<{
    id: string;
    originName: string; originDetail: string;
    destName: string; destDetail: string;
    scheduleDays: string; scheduleTime: string;
    totalSeats: number;
  } | null>(null);

  // Route
  const [origin, setOrigin] = useState<GeoResult | null>(null);
  const [originAutoFilled, setOriginAutoFilled] = useState(false);
  const [destination, setDestination] = useState<GeoResult | null>(null);

  // Auto-fill departure with current location
  useEffect(() => {
    if (!origin && !originAutoFilled) {
      setOriginAutoFilled(true);
      getCurrentLocationAsGeoResult().then((loc) => {
        if (loc) setOrigin(loc);
      });
    }
  }, []);

  // Schedule type
  const [scheduleType, setScheduleType] = useState<'weekly' | 'specific'>('weekly');

  // Weekly recurring
  const weekDays = [
    { key: 0, label: 'S' },
    { key: 1, label: 'M' },
    { key: 2, label: 'T' },
    { key: 3, label: 'W' },
    { key: 4, label: 'T' },
    { key: 5, label: 'F' },
    { key: 6, label: 'S' },
  ];
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

  function toggleDay(d: number) {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  // Specific date — calendar
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const year = today.getFullYear();
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(year, today.getMonth(), 1).getDay();
  const calDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const shiftedFirst = (firstDay + 6) % 7;
  const calCells: (number | null)[] = Array(shiftedFirst).fill(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  // Time
  const [hours, setHours] = useState('08');
  const [minutes, setMinutes] = useState('30');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');

  // Logistics
  const [seats, setSeats] = useState(3);
  const [petsAllowed, setPetsAllowed] = useState(true);
  const [pricePerSeat, setPricePerSeat] = useState('12.50');

  function incSeats() { if (seats < 6) setSeats(seats + 1); }
  function decSeats() { if (seats > 1) setSeats(seats - 1); }

  async function handlePublish() {
    if (!origin) { Alert.alert('Missing pickup', 'Search and select a departure point.'); return; }
    if (!destination) { Alert.alert('Missing destination', 'Search and select where you are heading.'); return; }
    if (scheduleType === 'weekly' && selectedDays.length === 0) { Alert.alert('No days selected', 'Pick at least one day for your weekly ride.'); return; }

    // Build departure datetime
    let h = parseInt(hours) || 8;
    if (amPm === 'PM' && h < 12) h += 12;
    if (amPm === 'AM' && h === 12) h = 0;
    const depDate = new Date(year, today.getMonth(), selectedDate, h, parseInt(minutes) || 0);
    const timeStr = `${String(h).padStart(2, '0')}:${String(parseInt(minutes) || 0).padStart(2, '0')}`;

    const originCoords: [number, number] = [origin.lng, origin.lat];
    const destCoords: [number, number] = [destination.lng, destination.lat];

    const payload: Record<string, unknown> = {
      scheduleType: scheduleType === 'weekly' ? 'recurring' : 'one_off',
      route: { type: 'LineString', coordinates: [originCoords, destCoords] },
      origin: { address: origin.address, coordinates: { type: 'Point', coordinates: originCoords } },
      destination: { address: destination.address, coordinates: { type: 'Point', coordinates: destCoords } },
      totalSeats: seats,
      genderPreference: 'any',
    };

    if (scheduleType === 'weekly') {
      payload.recurringSchedule = {
        daysOfWeek: selectedDays,
        departureTime: timeStr,
        validFrom: new Date().toISOString(),
      };
    } else {
      payload.oneOffSchedule = { departureDateTime: depDate.toISOString() };
    }

    setLoading(true);
    try {
      const ride = await ridesService.createRide(payload);
      const originParts = origin.address.split(',');
      const destParts = destination.address.split(',');
      const daysStr = scheduleType === 'weekly'
        ? selectedDays.sort().map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join('-')
        : depDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const h12 = (parseInt(hours) || 8) > 12 ? (parseInt(hours) || 8) - 12 : (parseInt(hours) || 8) === 0 ? 12 : (parseInt(hours) || 8);
      const displayTime = `${String(h12).padStart(2, '0')}:${String(parseInt(minutes) || 0).padStart(2, '0')} ${amPm}`;
      setPublished({
        id: ride._id,
        originName: originParts[0]?.trim() || 'Pickup',
        originDetail: originParts.slice(1, 3).join(',').trim() || '',
        destName: destParts[0]?.trim() || 'Destination',
        destDetail: destParts.slice(1, 3).join(',').trim() || '',
        scheduleDays: daysStr,
        scheduleTime: displayTime,
        totalSeats: seats,
      });
    } catch {
      Alert.alert('Error', 'Failed to post ride.');
    }
    finally { setLoading(false); }
  }

  // ── Published success screen (matches prototype) ──
  if (published) {
    return (
      <View style={s.page}>
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {user?.photo ? <Image source={{ uri: user.photo }} style={s.avatar} /> : <View style={[s.avatar, s.avatarPh]}><Text style={s.avatarInit}>{user?.name?.[0]}</Text></View>}
              <Text style={s.brand}>POOLIFY</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/notifications')}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={s.pubHeader}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
            <Text style={s.pubTitle}>Ride Published!</Text>
          </View>

          {/* LIVE ROUTE badge */}
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
                <Text style={s.routeName}>{published.originName}</Text>
                <Text style={s.routeDetail}>{published.originDetail}</Text>
              </View>
            </View>

            {/* Drop-off */}
            <View style={s.routePoint}>
              <View style={s.routeIconCol}>
                <View style={s.routeCircleRed} />
              </View>
              <View style={s.routeInfo}>
                <Text style={s.routeLabelDrop}>DROP-OFF</Text>
                <Text style={s.routeNameLarge}>{published.destName}</Text>
                <Text style={s.routeDetail}>{published.destDetail}</Text>
              </View>
            </View>
          </View>

          {/* ── Schedule & Availability row ── */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={s.statLabel}>SCHEDULE</Text>
              <Text style={s.statValue}>{published.scheduleDays}</Text>
              <Text style={s.statAccent}>{published.scheduleTime}</Text>
            </View>
            <View style={s.statCard}>
              <View style={s.seatIcons}>
                {Array.from({ length: published.totalSeats }).map((_, i) => (
                  <Ionicons key={i} name="person" size={18} color={COLORS.success} />
                ))}
              </View>
              <Text style={s.statLabel}>AVAILABILITY</Text>
              <Text style={s.statValue}>{published.totalSeats} of {published.totalSeats} seats</Text>
              <Text style={s.statAccentGreen}>Open</Text>
            </View>
          </View>

          {/* ── Driver Card ── */}
          <View style={s.driverCard}>
            <View style={s.driverLeft}>
              {user?.photo ? (
                <View style={s.driverAvatarWrap}>
                  <Image source={{ uri: user.photo }} style={s.driverAvatar} />
                  <View style={s.driverRating}>
                    <Text style={s.driverRatingText}>5.0</Text>
                    <Ionicons name="star" size={8} color="#FBBF24" />
                  </View>
                </View>
              ) : (
                <View style={[s.driverAvatar, s.avatarPh]}>
                  <Text style={s.avatarInit}>{user?.name?.[0]}</Text>
                </View>
              )}
              <View>
                <Text style={s.driverName}>{user?.name ?? 'Driver'}</Text>
                <Text style={s.driverBadge}>Verified Driver</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Ionicons name="chatbubble" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* ── Action Buttons ── */}
          <TouchableOpacity
            style={s.publishBtn}
            onPress={() => router.push(`/(main)/rides/${published.id}`)}
            activeOpacity={0.85}
          >
            <View style={s.publishInner}>
              <Ionicons name="eye" size={18} color={COLORS.background} />
              <Text style={s.publishText}>VIEW RIDE DETAILS</Text>
            </View>
          </TouchableOpacity>

          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(main)/rides')} activeOpacity={0.8}>
              <Ionicons name="list" size={18} color={COLORS.primary} />
              <Text style={s.actionBtnText}>My Rides</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => { setPublished(null); setOrigin(null); setDestination(null); setOriginAutoFilled(false); }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={s.actionBtnText}>New Ride</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPh]}><Text style={s.avatarInit}>{user?.name?.[0]}</Text></View>
            )}
            <Text style={s.brand}>POOLIFY</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/notifications')}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            {unread > 0 && <View style={s.dot} />}
          </TouchableOpacity>
        </View>

        <Text style={s.heroTitle}>OFFER A <Text style={s.heroAccent}>RIDE.</Text></Text>
        <Text style={s.heroSub}>Fuel the city's pulse. Share your journey and turn{'\n'}empty seats into connections.</Text>

        {/* ── Route Selection Card ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="git-compare-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Route Selection</Text>
          </View>

          <AddressInput iconName="location" iconColor={COLORS.primary} label="DEPARTURE POINT" placeholder="Where are you starting?" onSelect={setOrigin} selected={origin} />
          {!origin && (
            <TouchableOpacity
              style={s.useLocationBtn}
              onPress={async () => {
                const loc = await getCurrentLocationAsGeoResult();
                if (loc) setOrigin(loc);
                else Alert.alert('Location unavailable', 'Please allow location access or type your address manually.');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-circle" size={16} color={COLORS.primary} />
              <Text style={s.useLocationText}>Use current location</Text>
            </TouchableOpacity>
          )}

          <View style={s.swapRow}>
            <View style={s.swapCircle}>
              <Ionicons name="swap-vertical" size={20} color={COLORS.primary} />
            </View>
          </View>

          <AddressInput iconName="flag" iconColor={COLORS.textSecondary} label="DESTINATION" placeholder="Where are you heading?" onSelect={setDestination} selected={destination} />
        </View>

        {/* ── Map Placeholder ── */}
        <View style={s.mapCard}>
          <View style={s.mapInner}>
            <Ionicons name="map" size={48} color={COLORS.textMuted} />
            <Text style={s.mapText}>Route preview</Text>
          </View>
          <View style={s.mapBadge}><Text style={s.mapBadgeText}>LIVE MAP</Text></View>
        </View>

        {/* ── Schedule Card ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Schedule</Text>
          </View>

          {/* Toggle: Weekly / Specific Date */}
          <View style={s.schedToggle}>
            <TouchableOpacity
              style={[s.schedOption, scheduleType === 'weekly' && s.schedActive]}
              onPress={() => setScheduleType('weekly')}
            >
              <Ionicons name="repeat" size={16} color={scheduleType === 'weekly' ? COLORS.primary : COLORS.textMuted} />
              <Text style={[s.schedText, scheduleType === 'weekly' && s.schedTextActive]}>Weekly Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.schedOption, scheduleType === 'specific' && s.schedActive]}
              onPress={() => setScheduleType('specific')}
            >
              <Ionicons name="today" size={16} color={scheduleType === 'specific' ? COLORS.primary : COLORS.textMuted} />
              <Text style={[s.schedText, scheduleType === 'specific' && s.schedTextActive]}>Specific Date</Text>
            </TouchableOpacity>
          </View>

          {scheduleType === 'weekly' ? (
            <>
              {/* Weekly day selector */}
              <Text style={s.schedLabel}>SELECT COMMUTE DAYS</Text>
              <View style={s.weekRow}>
                {weekDays.map((d) => {
                  const active = selectedDays.includes(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[s.weekChip, active && s.weekChipActive]}
                      onPress={() => toggleDay(d.key)}
                    >
                      <Text style={[s.weekLabel, active && s.weekLabelActive]}>{d.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.weekHint}>
                {selectedDays.length === 0
                  ? 'Tap days you commute'
                  : `${selectedDays.sort().map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`}
              </Text>
            </>
          ) : (
            <>
              {/* Calendar for specific date */}
              <View style={s.calRow}>
                {calDayLabels.map((l, i) => (
                  <View key={`lbl-${i}`} style={s.calCell}>
                    <Text style={s.calDayLabel}>{l}</Text>
                  </View>
                ))}
              </View>
              <View style={s.calGrid}>
                {calCells.map((d, i) => {
                  if (d === null) return <View key={`empty-${i}`} style={s.calCell} />;
                  const isPast = d < today.getDate();
                  const isSelected = d === selectedDate;
                  return (
                    <TouchableOpacity
                      key={`day-${d}`}
                      style={[s.calCell, isSelected && s.calCellActive]}
                      onPress={() => { if (!isPast) setSelectedDate(d); }}
                      disabled={isPast}
                    >
                      <Text style={[s.calDayNum, isPast && s.calPast, isSelected && s.calDayActive]}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ── Time Card ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Time</Text>
          </View>

          <View style={s.timeRow}>
            <View style={s.timeBox}>
              <TextInput style={s.timeInput} value={hours} onChangeText={setHours} keyboardType="number-pad" maxLength={2} />
            </View>
            <Text style={s.timeColon}>:</Text>
            <View style={s.timeBox}>
              <TextInput style={s.timeInput} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} />
            </View>
            <View style={s.amPmCol}>
              <TouchableOpacity style={[s.amPmBtn, amPm === 'AM' && s.amPmActive]} onPress={() => setAmPm('AM')}>
                <Text style={[s.amPmText, amPm === 'AM' && s.amPmTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.amPmBtn, amPm === 'PM' && s.amPmActive]} onPress={() => setAmPm('PM')}>
                <Text style={[s.amPmText, amPm === 'PM' && s.amPmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.trafficBadge}>
            <Ionicons name="speedometer-outline" size={14} color={COLORS.primary} />
            <Text style={s.trafficText}>OPTIMAL TRAFFIC WINDOW</Text>
          </View>
        </View>

        {/* ── Ride Logistics Card ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            <Text style={s.cardTitle}>Ride Logistics</Text>
          </View>

          {/* Seats */}
          <Text style={s.logLabel}>Available Seats</Text>
          <Text style={s.logHint}>How many people can you take?</Text>
          <View style={s.counterRow}>
            <TouchableOpacity style={s.counterBtn} onPress={decSeats}><Ionicons name="remove" size={20} color={COLORS.text} /></TouchableOpacity>
            <Text style={s.counterVal}>{seats}</Text>
            <TouchableOpacity style={[s.counterBtn, s.counterBtnAccent]} onPress={incSeats}><Ionicons name="add" size={20} color={COLORS.background} /></TouchableOpacity>
          </View>

          {/* Pets */}
          <View style={s.toggleRow}>
            <View style={s.toggleLeft}>
              <Ionicons name="paw" size={18} color="#E879F9" />
              <Text style={s.toggleLabel}>Pets Allowed</Text>
            </View>
            <TouchableOpacity
              style={[s.toggleTrack, petsAllowed && s.toggleTrackOn]}
              onPress={() => setPetsAllowed(!petsAllowed)}
              activeOpacity={0.8}
            >
              <View style={[s.toggleThumb, petsAllowed && s.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {/* Price per Seat */}
          <Text style={[s.logLabel, { marginTop: SPACING.md }]}>Price per Seat</Text>
          <View style={s.priceRow}>
            <View style={s.priceBox}>
              <Text style={s.priceCurrency}>$</Text>
              <TextInput
                style={s.priceInput}
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={s.recommendBadge}>
              <Ionicons name="trending-up" size={14} color={COLORS.primary} />
              <Text style={s.recommendText}>RECOMMENDED</Text>
            </View>
          </View>
        </View>

        {/* ── Publish Button ── */}
        <TouchableOpacity
          style={[s.publishBtn, (!origin || !destination) && s.publishDisabled]}
          onPress={handlePublish}
          disabled={loading || !origin || !destination}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <View style={s.publishInner}>
              <Text style={s.publishText}>PUBLISH RIDE</Text>
              <Ionicons name="rocket" size={18} color={COLORS.background} />
            </View>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: 80 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: COLORS.primary },
  avatarPh: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  brand: { fontSize: 16, fontWeight: '800', color: COLORS.primary, letterSpacing: 2 },
  dot: { position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.danger },

  // Hero
  heroTitle: { fontSize: 30, fontWeight: '900', color: COLORS.text, lineHeight: 36 },
  heroAccent: { color: COLORS.primary, fontStyle: 'italic' },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, marginBottom: SPACING.lg, lineHeight: 20 },

  // Cards
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // Address input
  addrGroup: { marginBottom: SPACING.xs },
  addrLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2, marginBottom: 6 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.cardBorder },
  addrInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 10 },
  dropdown: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, marginTop: 4 },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  dropText: { fontSize: 13, color: COLORS.text, flex: 1 },

  // Published success screen
  pubHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  pubTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },

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
  seatIcons: { flexDirection: 'row', gap: 2 },

  // Driver card
  driverCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  driverLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  driverAvatarWrap: { position: 'relative' },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.primary },
  driverRating: { position: 'absolute', bottom: -4, left: -4, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  driverRatingText: { fontSize: 10, fontWeight: '700', color: COLORS.background },
  driverName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  driverBadge: { fontSize: 12, color: COLORS.textSecondary },

  // Action row
  actionRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Use current location button
  useLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  useLocationText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Swap icon
  swapRow: { alignItems: 'center', marginVertical: 6 },
  swapCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Map placeholder
  mapCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.xl, height: 180, marginBottom: SPACING.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  mapInner: { alignItems: 'center', gap: SPACING.sm },
  mapText: { fontSize: 13, color: COLORS.textMuted },
  mapBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,229,204,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  mapBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },

  // Schedule toggle
  schedToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: 4 },
  schedOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.sm },
  schedActive: { backgroundColor: COLORS.primaryLight },
  schedText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  schedTextActive: { color: COLORS.primary },
  schedLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2, marginBottom: SPACING.sm },

  // Weekly day selector
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  weekChip: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: COLORS.cardBorder, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  weekChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  weekLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  weekLabelActive: { color: COLORS.background },
  weekHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Calendar
  calRow: { flexDirection: 'row' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  calCellActive: { backgroundColor: COLORS.primary, borderRadius: 20 },
  calDayLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  calDayNum: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  calDayActive: { color: COLORS.background },
  calPast: { color: COLORS.textMuted, opacity: 0.4 },

  // Time picker
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  timeBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: 16, paddingVertical: 8 },
  timeInput: { fontSize: 28, fontWeight: '700', color: COLORS.text, textAlign: 'center', width: 44 },
  timeColon: { fontSize: 28, fontWeight: '700', color: COLORS.textMuted },
  amPmCol: { marginLeft: SPACING.sm, gap: 4 },
  amPmBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder },
  amPmActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  amPmText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  amPmTextActive: { color: COLORS.primary },
  trafficBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, backgroundColor: COLORS.primaryLight, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)' },
  trafficText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },

  // Logistics
  logLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  logHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, alignSelf: 'flex-end', marginBottom: SPACING.md },
  counterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center' },
  counterBtnAccent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  counterVal: { fontSize: 20, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },

  // Toggle (pets)
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.cardBorder, justifyContent: 'center', paddingHorizontal: 2 },
  toggleTrackOn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.textMuted },
  toggleThumbOn: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },

  // Price
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  priceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: 16, paddingVertical: 10, flex: 1 },
  priceCurrency: { fontSize: 24, fontWeight: '700', color: COLORS.textMuted, marginRight: 8 },
  priceInput: { fontSize: 24, fontWeight: '700', color: COLORS.text, flex: 1 },
  recommendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recommendText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },

  // Publish
  publishBtn: { marginTop: SPACING.md, paddingVertical: 18, borderRadius: 50, alignItems: 'center', backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  publishDisabled: { opacity: 0.3 },
  publishInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  publishText: { fontSize: 16, fontWeight: '800', color: COLORS.background, letterSpacing: 2 },
});
