export type UserRole = 'driver' | 'rider' | 'both';
export type Gender = 'male' | 'female' | 'other';
export type GenderPreference = 'any' | 'female_only' | 'male_only';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface DriverProfile {
  availableSeats: number;
  genderPreference: GenderPreference;
  officeLocation: {
    address: string;
    coordinates: GeoPoint;
  };
}

export interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  photo: string;
  phone: string;
  gender: Gender;
  role: UserRole;
  isOnboarded: boolean;
  driverProfile?: DriverProfile;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  _id: string;
  name: string;
  photo: string;
  gender: Gender;
  role: UserRole;
  driverProfile?: Pick<DriverProfile, 'availableSeats' | 'genderPreference' | 'officeLocation'>;
}
