import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as RidesService from '../services/rides.service';

export const createRide = asyncHandler(async (req: Request, res: Response) => {
  const ride = await RidesService.createRide(req.user!.sub, req.body);
  res.status(201).json(ride);
});

export const getRide = asyncHandler(async (req: Request, res: Response) => {
  const ride = await RidesService.getRide(req.params.id);
  res.json(ride);
});

export const getMyRides = asyncHandler(async (req: Request, res: Response) => {
  const rides = await RidesService.getMyRides(req.user!.sub);
  res.json(rides);
});

export const updateRide = asyncHandler(async (req: Request, res: Response) => {
  const ride = await RidesService.updateRide(req.params.id, req.user!.sub, req.body);
  res.json(ride);
});

export const deleteRide = asyncHandler(async (req: Request, res: Response) => {
  await RidesService.cancelRide(req.params.id, req.user!.sub);
  res.status(204).send();
});

export const searchRides = asyncHandler(async (req: Request, res: Response) => {
  const vq = (req as Request & { validatedQuery: unknown }).validatedQuery as Parameters<
    typeof RidesService.searchRides
  >[1];
  const results = await RidesService.searchRides(req.user!.sub, vq);
  res.json(results);
});
