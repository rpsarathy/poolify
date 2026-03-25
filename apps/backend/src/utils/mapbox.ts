import axios from 'axios';

const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Get driving distance (meters) using OSRM (free, no API key).
 * Falls back to Haversine straight-line if OSRM is unavailable.
 */
export async function getDrivingDistance(
  waypoints: [number, number][]
): Promise<number> {
  try {
    const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const url = `${OSRM_BASE}/route/v1/driving/${coords}`;
    const { data } = await axios.get(url, {
      params: { overview: 'false' },
      timeout: 5000,
    });
    const route = data.routes?.[0];
    if (!route) throw new Error('No route found');
    return route.distance as number;
  } catch {
    // Fallback: Haversine straight-line distance × 1.3 (road factor)
    let totalDist = 0;
    for (let i = 1; i < waypoints.length; i++) {
      totalDist += haversine(waypoints[i - 1], waypoints[i]);
    }
    return totalDist * 1.3;
  }
}

/**
 * Haversine distance in meters between two [lng, lat] points.
 */
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Build a corridor polygon (1km buffer) around origin→destination line.
 * Returns a GeoJSON Polygon suitable for $geoIntersects queries.
 */
export function buildCorridorPolygon(
  origin: [number, number],
  destination: [number, number],
  bufferDeg = 0.009
): { type: 'Polygon'; coordinates: [number, number][][] } {
  const minLng = Math.min(origin[0], destination[0]) - bufferDeg;
  const maxLng = Math.max(origin[0], destination[0]) + bufferDeg;
  const minLat = Math.min(origin[1], destination[1]) - bufferDeg;
  const maxLat = Math.max(origin[1], destination[1]) + bufferDeg;

  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  };
}
