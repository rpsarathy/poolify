import mongoose, { Document, Schema } from 'mongoose';

export interface IRide extends Document {
  driverId: mongoose.Types.ObjectId;
  route: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  origin: {
    address: string;
    coordinates: { type: 'Point'; coordinates: [number, number] };
  };
  destination: {
    address: string;
    coordinates: { type: 'Point'; coordinates: [number, number] };
  };
  scheduleType: 'recurring' | 'one_off';
  recurringSchedule?: {
    daysOfWeek: number[];
    departureTime: string;
    validFrom: Date;
    validUntil?: Date;
  };
  oneOffSchedule?: {
    departureDateTime: Date;
  };
  totalSeats: number;
  availableSeats: number;
  genderPreference: 'any' | 'female_only' | 'male_only';
  status: 'active' | 'full' | 'cancelled' | 'completed';
  passengers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const rideSchema = new Schema<IRide>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    route: {
      type: { type: String, enum: ['LineString'], required: true },
      coordinates: { type: [[Number]], required: true },
    },
    origin: {
      address: { type: String, required: true },
      coordinates: geoPointSchema,
    },
    destination: {
      address: { type: String, required: true },
      coordinates: geoPointSchema,
    },
    scheduleType: { type: String, enum: ['recurring', 'one_off'], required: true, index: true },
    recurringSchedule: {
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      departureTime: String,
      validFrom: Date,
      validUntil: Date,
    },
    oneOffSchedule: {
      departureDateTime: Date,
    },
    totalSeats: { type: Number, required: true, min: 1, max: 6 },
    availableSeats: { type: Number, required: true, min: 0, max: 6 },
    genderPreference: {
      type: String,
      enum: ['any', 'female_only', 'male_only'],
      default: 'any',
    },
    status: {
      type: String,
      enum: ['active', 'full', 'cancelled', 'completed'],
      default: 'active',
      index: true,
    },
    passengers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Geospatial indexes — critical for $geoIntersects matching
rideSchema.index({ route: '2dsphere' });
rideSchema.index({ 'origin.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

// Compound indexes for filtered scans
rideSchema.index({ scheduleType: 1, status: 1 });
rideSchema.index({ 'recurringSchedule.daysOfWeek': 1 });
rideSchema.index({ 'oneOffSchedule.departureDateTime': 1 });

export const RideModel = mongoose.model<IRide>('Ride', rideSchema);
