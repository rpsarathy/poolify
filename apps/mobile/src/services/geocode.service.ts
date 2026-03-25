import axios from 'axios';
import { Platform } from 'react-native';

// Photon (Komoot) — better fuzzy matching, free, no key
const PHOTON_URL = 'https://photon.komoot.io/api';
// Nominatim — fallback
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface GeoResult {
  address: string;
  lat: number;
  lng: number;
}

// ── User location cache ──
let userLat: number | null = null;
let userLng: number | null = null;
let locationFetched = false;

async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (locationFetched) {
    return userLat !== null ? { lat: userLat, lng: userLng! } : null;
  }
  locationFetched = true;

  try {
    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
            resolve({ lat: userLat, lng: userLng! });
          },
          async () => resolve(await ipFallback()),
          { timeout: 5000, enableHighAccuracy: false }
        );
      });
    }
    return await ipFallback();
  } catch {
    return null;
  }
}

async function ipFallback(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { data } = await axios.get('https://ipapi.co/json/', { timeout: 3000 });
    if (data.latitude && data.longitude) {
      userLat = data.latitude;
      userLng = data.longitude;
      return { lat: userLat, lng: userLng! };
    }
  } catch {}
  return null;
}

/**
 * Build a readable address string from Photon properties.
 */
function formatPhotonAddress(props: Record<string, string>): string {
  const parts: string[] = [];
  if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`);
  } else if (props.street) {
    parts.push(props.street);
  } else if (props.name) {
    parts.push(props.name);
  }
  if (props.city || props.town || props.village) {
    parts.push(props.city || props.town || props.village);
  }
  if (props.state) parts.push(props.state);
  if (props.postcode) parts.push(props.postcode);
  if (props.country) parts.push(props.country);
  return parts.join(', ') || 'Unknown location';
}

/**
 * Search addresses using Photon (primary) with Nominatim fallback.
 * Biased toward user's current location.
 */
export async function searchAddresses(query: string): Promise<GeoResult[]> {
  if (query.length < 3) return [];

  const loc = await getUserLocation();

  // ── Try Photon first (better fuzzy matching) ──
  try {
    const params: Record<string, string | number> = {
      q: query,
      limit: 6,
    };
    // Location bias
    if (loc) {
      params.lat = loc.lat;
      params.lon = loc.lng;
    }

    const { data } = await axios.get(PHOTON_URL, {
      params,
      timeout: 4000,
      headers: { 'User-Agent': 'Poolify/1.0' },
    });

    const features = data.features ?? [];
    if (features.length > 0) {
      const results: GeoResult[] = features.map((f: any) => ({
        address: formatPhotonAddress(f.properties),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }));

      // Deduplicate by address string
      const seen = new Set<string>();
      const unique = results.filter((r) => {
        const key = r.address.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by distance from user
      if (loc) {
        unique.sort((a, b) =>
          haversine(loc.lat, loc.lng, a.lat, a.lng) -
          haversine(loc.lat, loc.lng, b.lat, b.lng)
        );
      }

      return unique.slice(0, 5);
    }
  } catch {
    // Photon failed, fall through to Nominatim
  }

  // ── Fallback: Nominatim ──
  try {
    const params: Record<string, string | number> = {
      q: query,
      format: 'json',
      limit: 5,
      addressdetails: 1,
    };
    if (loc) {
      params.viewbox = `${loc.lng - 0.5},${loc.lat + 0.5},${loc.lng + 0.5},${loc.lat - 0.5}`;
      params.bounded = 0;
    }

    const { data } = await axios.get(`${NOMINATIM_URL}/search`, {
      params,
      timeout: 4000,
      headers: { 'User-Agent': 'Poolify/1.0' },
    });

    return data.map((r: Record<string, string>) => ({
      address: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

/**
 * Geocode a single address to coordinates.
 */
export async function geocodeAddress(query: string): Promise<GeoResult | null> {
  const results = await searchAddresses(query);
  return results.length > 0 ? results[0] : null;
}

/**
 * Reverse geocode: convert lat/lng to a readable address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  // Try Photon reverse
  try {
    const { data } = await axios.get('https://photon.komoot.io/reverse', {
      params: { lat, lon: lng },
      timeout: 4000,
      headers: { 'User-Agent': 'Poolify/1.0' },
    });
    const f = data.features?.[0];
    if (f) {
      return {
        address: formatPhotonAddress(f.properties),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    }
  } catch {}

  // Fallback: Nominatim reverse
  try {
    const { data } = await axios.get(`${NOMINATIM_URL}/reverse`, {
      params: { lat, lon: lng, format: 'json', addressdetails: 1 },
      timeout: 4000,
      headers: { 'User-Agent': 'Poolify/1.0' },
    });
    if (data?.display_name) {
      return {
        address: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
      };
    }
  } catch {}

  return null;
}

/**
 * Get user's current location as a GeoResult with a reverse-geocoded address.
 * Returns null if location is unavailable.
 */
export async function getCurrentLocationAsGeoResult(): Promise<GeoResult | null> {
  const loc = await getUserLocation();
  if (!loc) return null;

  const result = await reverseGeocode(loc.lat, loc.lng);
  if (result) return result;

  // If reverse geocoding fails, return coordinates as address
  return {
    address: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
    lat: loc.lat,
    lng: loc.lng,
  };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
