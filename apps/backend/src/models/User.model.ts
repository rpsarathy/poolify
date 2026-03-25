import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  photo: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  role: 'driver' | 'rider' | 'both';
  isOnboarded: boolean;
  driverProfile?: {
    availableSeats: number;
    genderPreference: 'any' | 'female_only' | 'male_only';
    officeLocation: {
      address: string;
      coordinates: {
        type: 'Point';
        coordinates: [number, number];
      };
    };
  };
  refreshTokenHash?: string;
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

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    photo: { type: String, default: '' },
    phone: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    role: { type: String, enum: ['driver', 'rider', 'both'] },
    isOnboarded: { type: Boolean, default: false },
    driverProfile: {
      availableSeats: { type: Number, min: 1, max: 6 },
      genderPreference: {
        type: String,
        enum: ['any', 'female_only', 'male_only'],
        default: 'any',
      },
      officeLocation: {
        address: String,
        coordinates: geoPointSchema,
      },
    },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ 'driverProfile.officeLocation.coordinates': '2dsphere' });

export const UserModel = mongoose.model<IUser>('User', userSchema);
