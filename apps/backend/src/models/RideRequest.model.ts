import mongoose, { Document, Schema } from 'mongoose';

export interface IRideRequest extends Document {
  rideId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  pickupLocation: {
    address: string;
    coordinates: { type: 'Point'; coordinates: [number, number] };
  };
  dropoffLocation: {
    address: string;
    coordinates: { type: 'Point'; coordinates: [number, number] };
  };
  requestedDates: Date[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  contactInfo?: {
    driverPhone: string;
    riderPhone: string;
  };
  message?: string;
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

const rideRequestSchema = new Schema<IRideRequest>(
  {
    rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pickupLocation: {
      address: { type: String, required: true },
      coordinates: geoPointSchema,
    },
    dropoffLocation: {
      address: { type: String, required: true },
      coordinates: geoPointSchema,
    },
    requestedDates: [{ type: Date, required: true }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    contactInfo: {
      driverPhone: String,
      riderPhone: String,
    },
    message: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

rideRequestSchema.index({ rideId: 1, status: 1 });
rideRequestSchema.index({ riderId: 1, status: 1 });
rideRequestSchema.index({ driverId: 1, status: 1 });
rideRequestSchema.index({ 'pickupLocation.coordinates': '2dsphere' });

export const RideRequestModel = mongoose.model<IRideRequest>('RideRequest', rideRequestSchema);
