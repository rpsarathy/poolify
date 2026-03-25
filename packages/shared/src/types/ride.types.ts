import type { GeoPoint, GenderPreference } from './user.types';

export type ScheduleType = 'recurring' | 'one_off';
export type RideStatus = 'active' | 'full' | 'cancelled' | 'completed';

export interface GeoLineString {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat][]
}

export interface GeoLocation {
  address: string;
  coordinates: GeoPoint;
}

export interface RecurringSchedule {
  daysOfWeek: number[]; // 0=Sun … 6=Sat
  departureTime: string; // "HH:MM" 24h
  validFrom: string;
  validUntil?: string;
}

export interface OneOffSchedule {
  departureDateTime: string; // ISO date string
}

export interface Ride {
  _id: string;
  driverId: string;
  route: GeoLineString;
  origin: GeoLocation;
  destination: GeoLocation;
  scheduleType: ScheduleType;
  recurringSchedule?: RecurringSchedule;
  oneOffSchedule?: OneOffSchedule;
  totalSeats: number;
  availableSeats: number;
  genderPreference: GenderPreference;
  status: RideStatus;
  passengers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RideSearchResult extends Ride {
  matchScore: number;
  detourScore: number;
  timeScore: number;
  geoScore: number;
}
