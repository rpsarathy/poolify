import mongoose from 'mongoose';
import { RideModel, IRide } from '../models/Ride.model';
import { getMatchingService } from './matching/MatchingService.factory';
import { UserModel } from '../models/User.model';
import type { MatchCandidate } from './matching/MatchingService.interface';

export async function createRide(
  driverId: string,
  data: Omit<IRide, '_id' | 'driverId' | 'availableSeats' | 'passengers' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<IRide> {
  const ride = await RideModel.create({
    ...data,
    driverId: new mongoose.Types.ObjectId(driverId),
    availableSeats: data.totalSeats,
    passengers: [],
    status: 'active',
  });
  return ride;
}

export async function getRide(rideId: string): Promise<IRide> {
  const ride = await RideModel.findById(rideId);
  if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
  return ride;
}

export async function getMyRides(driverId: string): Promise<IRide[]> {
  return RideModel.find({ driverId }).sort({ createdAt: -1 });
}

export async function updateRide(
  rideId: string,
  driverId: string,
  updates: Partial<Pick<IRide, 'totalSeats' | 'genderPreference' | 'status' | 'recurringSchedule' | 'oneOffSchedule'>>
): Promise<IRide> {
  const ride = await RideModel.findOneAndUpdate(
    { _id: rideId, driverId },
    updates,
    { new: true }
  );
  if (!ride) throw Object.assign(new Error('Ride not found or not authorized'), { statusCode: 404 });
  return ride;
}

export async function cancelRide(rideId: string, driverId: string): Promise<void> {
  const result = await RideModel.findOneAndUpdate(
    { _id: rideId, driverId },
    { status: 'cancelled' }
  );
  if (!result) throw Object.assign(new Error('Ride not found or not authorized'), { statusCode: 404 });
}

export async function searchRides(
  userId: string,
  params: {
    originLng: number;
    originLat: number;
    destLng: number;
    destLat: number;
    date: string;
    time: string;
    timeWindowMins: number;
    seats: number;
    genderPref?: 'any' | 'female_only' | 'male_only';
  }
): Promise<MatchCandidate[]> {
  const rider = await UserModel.findById(userId);
  if (!rider) throw new Error('Rider not found');

  const requestedAt = new Date(`${params.date}T${params.time}:00`);

  const matchingService = getMatchingService();

  const candidates = await matchingService.findCandidates({
    rider,
    originCoords: [params.originLng, params.originLat],
    destinationCoords: [params.destLng, params.destLat],
    requestedAt,
    timeWindowMins: params.timeWindowMins,
    seats: params.seats,
    genderPref: params.genderPref,
  });

  return matchingService.rankCandidates(candidates, {
    rider,
    originCoords: [params.originLng, params.originLat],
    destinationCoords: [params.destLng, params.destLat],
    requestedAt,
    timeWindowMins: params.timeWindowMins,
    seats: params.seats,
    genderPref: params.genderPref,
  });
}
