import type { IRide } from '../../models/Ride.model';
import type { IUser } from '../../models/User.model';

export interface MatchCandidate {
  ride: IRide;
  geoScore: number;    // 0–1, based on route intersection area
  timeScore: number;   // 0–1, proximity to requested departure time
  detourScore: number; // 0–1, lower detour ratio = higher score
  matchScore: number;  // weighted composite: 0.5*detour + 0.3*time + 0.2*geo (inverted)
}

export interface MatchQuery {
  rider: IUser;
  originCoords: [number, number];       // [lng, lat]
  destinationCoords: [number, number];  // [lng, lat]
  requestedAt: Date;                    // desired departure datetime
  timeWindowMins: number;
  seats: number;
  genderPref?: 'any' | 'female_only' | 'male_only';
}

export interface IMatchingService {
  /**
   * Phase 1+2: Find and time-filter candidate rides from the database.
   */
  findCandidates(query: MatchQuery): Promise<MatchCandidate[]>;

  /**
   * Phase 3: Rank candidates (by detour, time, geo score).
   * This is the AI abstraction seam — replace with AI provider by changing
   * the factory without touching any other code.
   */
  rankCandidates(
    candidates: MatchCandidate[],
    query: MatchQuery
  ): Promise<MatchCandidate[]>;
}
