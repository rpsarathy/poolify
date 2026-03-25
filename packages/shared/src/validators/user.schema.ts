import { z } from 'zod';

export const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const genderPreferenceSchema = z.enum(['any', 'female_only', 'male_only']);
export const genderSchema = z.enum(['male', 'female', 'other']);
export const userRoleSchema = z.enum(['driver', 'rider', 'both']);

export const driverProfileSchema = z.object({
  availableSeats: z.number().int().min(1).max(6),
  genderPreference: genderPreferenceSchema,
  officeLocation: z.object({
    address: z.string().min(1),
    coordinates: geoPointSchema,
  }),
});

export const updateProfileSchema = z.object({
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number').optional(),
  gender: genderSchema.optional(),
  role: userRoleSchema.optional(),
  name: z.string().min(1).max(100).optional(),
});

export const onboardingSchema = z.object({
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number'),
  gender: genderSchema,
  role: userRoleSchema,
});
