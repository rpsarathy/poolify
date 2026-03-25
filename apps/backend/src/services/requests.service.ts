import mongoose from 'mongoose';
import { RideRequestModel, IRideRequest } from '../models/RideRequest.model';
import { RideModel } from '../models/Ride.model';
import { UserModel } from '../models/User.model';
import { createAndPush } from './notification.service';

export async function createRequest(
  riderId: string,
  data: {
    rideId: string;
    pickupLocation: IRideRequest['pickupLocation'];
    dropoffLocation: IRideRequest['dropoffLocation'];
    requestedDates: Date[];
    message?: string;
  }
): Promise<IRideRequest> {
  const ride = await RideModel.findById(data.rideId);
  if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
  if (ride.status !== 'active') {
    throw Object.assign(new Error('Ride is not available'), { statusCode: 400 });
  }
  if (ride.driverId.toString() === riderId) {
    throw Object.assign(new Error('Cannot request your own ride'), { statusCode: 400 });
  }

  const existing = await RideRequestModel.findOne({
    rideId: data.rideId,
    riderId,
    status: { $in: ['pending', 'approved'] },
  });
  if (existing) throw Object.assign(new Error('Request already exists'), { statusCode: 409 });

  const request = await RideRequestModel.create({
    ...data,
    riderId: new mongoose.Types.ObjectId(riderId),
    driverId: ride.driverId,
    status: 'pending',
  });

  // Notify driver
  const rider = await UserModel.findById(riderId);
  await createAndPush({
    userId: ride.driverId.toString(),
    type: 'ride_request_received',
    title: 'New Ride Request',
    body: `${rider?.name ?? 'Someone'} wants to join your ride.`,
    data: { requestId: request._id.toString(), rideId: data.rideId },
  });

  return request;
}

export async function getIncomingRequests(driverId: string): Promise<IRideRequest[]> {
  return RideRequestModel.find({ driverId })
    .populate('riderId', 'name photo phone gender')
    .populate('rideId', 'origin destination scheduleType recurringSchedule oneOffSchedule')
    .sort({ createdAt: -1 });
}

export async function getOutgoingRequests(riderId: string): Promise<IRideRequest[]> {
  return RideRequestModel.find({ riderId })
    .populate('driverId', 'name photo phone gender driverProfile')
    .populate('rideId', 'origin destination scheduleType recurringSchedule oneOffSchedule')
    .sort({ createdAt: -1 });
}

export async function getRequest(requestId: string, userId: string): Promise<IRideRequest> {
  const request = await RideRequestModel.findOne({
    _id: requestId,
    $or: [{ riderId: userId }, { driverId: userId }],
  })
    .populate('riderId', 'name photo phone gender')
    .populate('driverId', 'name photo phone gender driverProfile');

  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  return request;
}

export async function approveRequest(
  requestId: string,
  driverId: string
): Promise<IRideRequest> {
  const request = await RideRequestModel.findOne({ _id: requestId, driverId, status: 'pending' });
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  const [driver, rider, ride] = await Promise.all([
    UserModel.findById(driverId),
    UserModel.findById(request.riderId),
    RideModel.findById(request.rideId),
  ]);

  if (!ride || ride.availableSeats < 1) {
    throw Object.assign(new Error('No seats available'), { statusCode: 400 });
  }

  // Update request with contact info and status
  request.status = 'approved';
  request.contactInfo = {
    driverPhone: driver?.phone ?? '',
    riderPhone: rider?.phone ?? '',
  };
  await request.save();

  // Update ride: decrement seats, add passenger
  const newAvailableSeats = ride.availableSeats - 1;
  await RideModel.findByIdAndUpdate(ride._id, {
    $inc: { availableSeats: -1 },
    $push: { passengers: request.riderId },
    ...(newAvailableSeats === 0 && { status: 'full' }),
  });

  // Notify rider
  await createAndPush({
    userId: request.riderId.toString(),
    type: 'request_approved',
    title: 'Ride Request Approved!',
    body: `${driver?.name ?? 'Your driver'} approved your request. Tap to see contact details.`,
    data: { requestId: request._id.toString(), rideId: request.rideId.toString() },
  });

  return request;
}

export async function rejectRequest(
  requestId: string,
  driverId: string
): Promise<IRideRequest> {
  const request = await RideRequestModel.findOneAndUpdate(
    { _id: requestId, driverId, status: 'pending' },
    { status: 'rejected' },
    { new: true }
  );
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  const driver = await UserModel.findById(driverId);
  await createAndPush({
    userId: request.riderId.toString(),
    type: 'request_rejected',
    title: 'Ride Request Declined',
    body: `${driver?.name ?? 'The driver'} could not take your request.`,
    data: { requestId: request._id.toString(), rideId: request.rideId.toString() },
  });

  return request;
}

export async function cancelRequest(
  requestId: string,
  riderId: string
): Promise<IRideRequest> {
  const request = await RideRequestModel.findOneAndUpdate(
    { _id: requestId, riderId, status: { $in: ['pending', 'approved'] } },
    { status: 'cancelled' },
    { new: true }
  );
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  // If was approved, restore seat
  if (request.status === 'approved') {
    await RideModel.findByIdAndUpdate(request.rideId, {
      $inc: { availableSeats: 1 },
      $pull: { passengers: request.riderId },
      status: 'active',
    });
  }

  return request;
}
