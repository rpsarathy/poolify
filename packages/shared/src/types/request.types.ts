import type { GeoPoint } from './user.types';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ContactInfo {
  driverPhone: string;
  riderPhone: string;
}

export interface RideRequest {
  _id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  pickupLocation: {
    address: string;
    coordinates: GeoPoint;
  };
  dropoffLocation: {
    address: string;
    coordinates: GeoPoint;
  };
  requestedDates: string[];
  status: RequestStatus;
  contactInfo?: ContactInfo;
  message?: string;
  createdAt: string;
  updatedAt: string;
}
