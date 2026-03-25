import { z } from 'zod';
import { geoPointSchema } from './user.schema';

const locationSchema = z.object({
  address: z.string().min(1),
  coordinates: geoPointSchema,
});

export const createRequestSchema = z.object({
  rideId: z.string().min(1),
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  requestedDates: z.array(z.string().datetime()).min(1),
  message: z.string().max(500).optional(),
});
