import { z } from 'zod';
import { geoPointSchema, genderPreferenceSchema } from './user.schema';

const geoLocationSchema = z.object({
  address: z.string().min(1),
  coordinates: geoPointSchema,
});

const geoLineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
});

const recurringScheduleSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format'),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
});

const oneOffScheduleSchema = z.object({
  departureDateTime: z.string().datetime(),
});

export const createRideSchema = z.discriminatedUnion('scheduleType', [
  z.object({
    scheduleType: z.literal('recurring'),
    route: geoLineStringSchema,
    origin: geoLocationSchema,
    destination: geoLocationSchema,
    totalSeats: z.number().int().min(1).max(6),
    genderPreference: genderPreferenceSchema,
    recurringSchedule: recurringScheduleSchema,
  }),
  z.object({
    scheduleType: z.literal('one_off'),
    route: geoLineStringSchema,
    origin: geoLocationSchema,
    destination: geoLocationSchema,
    totalSeats: z.number().int().min(1).max(6),
    genderPreference: genderPreferenceSchema,
    oneOffSchedule: oneOffScheduleSchema,
  }),
]);

export const updateRideSchema = z.object({
  totalSeats: z.number().int().min(1).max(6).optional(),
  genderPreference: genderPreferenceSchema.optional(),
  status: z.enum(['active', 'cancelled']).optional(),
  recurringSchedule: recurringScheduleSchema.optional(),
  oneOffSchedule: oneOffScheduleSchema.optional(),
});

export const rideSearchSchema = z.object({
  originLng: z.coerce.number(),
  originLat: z.coerce.number(),
  destLng: z.coerce.number(),
  destLat: z.coerce.number(),
  date: z.string(), // ISO date or YYYY-MM-DD
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format'),
  timeWindowMins: z.coerce.number().int().min(5).max(120).default(30),
  seats: z.coerce.number().int().min(1).max(6).default(1),
  genderPref: genderPreferenceSchema.optional(),
});
