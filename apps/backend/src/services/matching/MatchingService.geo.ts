import mongoose from 'mongoose';
import { RideModel } from '../../models/Ride.model';
import { buildCorridorPolygon, getDrivingDistance } from '../../utils/mapbox';
import type {
  IMatchingService,
  MatchCandidate,
  MatchQuery,
} from './MatchingService.interface';

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export class GeoMatchingService implements IMatchingService {
  async findCandidates(query: MatchQuery): Promise<MatchCandidate[]> {
    const {
      originCoords,
      destinationCoords,
      requestedAt,
      timeWindowMins,
      seats,
      genderPref,
    } = query;

    const corridor = buildCorridorPolygon(originCoords, destinationCoords);

    const dayOfWeek = requestedAt.getDay();
    const requestMinutes = dateToMinutes(requestedAt);

    // Gender preference compatibility
    const genderFilter =
      genderPref && genderPref !== 'any'
        ? { genderPreference: { $in: ['any', genderPref] } }
        : {};

    // Phase 1: Spatial pre-filter
    const candidates = await RideModel.find({
      status: 'active',
      availableSeats: { $gte: seats },
      ...genderFilter,
      route: {
        $geoIntersects: {
          $geometry: corridor,
        },
      },
    }).limit(50);

    // Phase 2: Time window filter
    const timeFiltered = candidates.filter((ride) => {
      if (ride.scheduleType === 'recurring' && ride.recurringSchedule) {
        const { daysOfWeek, departureTime } = ride.recurringSchedule;
        if (!daysOfWeek.includes(dayOfWeek)) return false;
        const rideMins = timeToMinutes(departureTime);
        return Math.abs(rideMins - requestMinutes) <= timeWindowMins;
      }
      if (ride.scheduleType === 'one_off' && ride.oneOffSchedule) {
        const rideTime = new Date(ride.oneOffSchedule.departureDateTime);
        const diffMs = Math.abs(rideTime.getTime() - requestedAt.getTime());
        return diffMs <= timeWindowMins * 60 * 1000;
      }
      return false;
    });

    // Compute initial geo score (equal for all until detour is computed)
    return timeFiltered.map((ride) => {
      const rideMins =
        ride.scheduleType === 'recurring' && ride.recurringSchedule
          ? timeToMinutes(ride.recurringSchedule.departureTime)
          : dateToMinutes(new Date(ride.oneOffSchedule!.departureDateTime));

      const timeDiff = Math.abs(rideMins - requestMinutes);
      const timeScore = Math.max(0, 1 - timeDiff / timeWindowMins);

      return {
        ride,
        geoScore: 1,        // will remain 1 until AI provider refines it
        timeScore,
        detourScore: 0,     // computed in rankCandidates
        matchScore: 0,
      };
    });
  }

  async rankCandidates(
    candidates: MatchCandidate[],
    query: MatchQuery
  ): Promise<MatchCandidate[]> {
    if (candidates.length === 0) return [];

    // Top-10 candidates get detour scored via MapBox API
    const toScore = candidates.slice(0, 10);

    const scored = await Promise.all(
      toScore.map(async (c) => {
        try {
          // Original route distance
          const [originLng, originLat] = c.ride.origin.coordinates.coordinates;
          const [destLng, destLat] = c.ride.destination.coordinates.coordinates;
          const originalDist = await getDrivingDistance([
            [originLng, originLat],
            [destLng, destLat],
          ]);

          // Route with rider pickup + dropoff
          const riderPickupLng = query.originCoords[0];
          const riderPickupLat = query.originCoords[1];
          const riderDropoffLng = query.destinationCoords[0];
          const riderDropoffLat = query.destinationCoords[1];

          const detourDist = await getDrivingDistance([
            [originLng, originLat],
            [riderPickupLng, riderPickupLat],
            [riderDropoffLng, riderDropoffLat],
            [destLng, destLat],
          ]);

          const detourRatio = (detourDist - originalDist) / originalDist;
          const detourScore = Math.max(0, 1 - detourRatio); // closer to 1 = less detour

          const matchScore =
            0.5 * detourScore + 0.3 * c.timeScore + 0.2 * c.geoScore;

          return { ...c, detourScore, matchScore };
        } catch {
          // If MapBox fails for a candidate, fall back to time+geo only
          const matchScore = 0.3 * c.timeScore + 0.2 * c.geoScore;
          return { ...c, detourScore: 0, matchScore };
        }
      })
    );

    // Any remaining candidates beyond top-10 get score 0
    const rest = candidates.slice(10).map((c) => ({ ...c, matchScore: 0 }));

    return [...scored, ...rest].sort((a, b) => b.matchScore - a.matchScore);
  }
}
